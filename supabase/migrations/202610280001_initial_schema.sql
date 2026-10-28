-- AremataLive: Supabase foundation
-- Run in Supabase SQL Editor only after reviewing the project and environment.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  role text not null default 'buyer' check (role in ('buyer','seller','admin')),
  created_at timestamptz not null default now()
);

create table if not exists public.auctions (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.profiles(id),
  title text not null check (char_length(trim(title)) between 3 and 140),
  description text not null default '',
  category text not null default 'Outros',
  image_url text,
  starting_price numeric(12,2) not null check (starting_price >= 0),
  current_price numeric(12,2) not null check (current_price >= 0),
  minimum_increment numeric(12,2) not null default 1 check (minimum_increment > 0),
  status text not null default 'scheduled' check (status in ('scheduled','live','ended','cancelled')),
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create table if not exists public.bids (
  id uuid primary key default gen_random_uuid(),
  auction_id uuid not null references public.auctions(id) on delete cascade,
  bidder_id uuid not null references public.profiles(id),
  amount numeric(12,2) not null check (amount > 0),
  created_at timestamptz not null default now(),
  unique (auction_id, bidder_id, amount)
);

create index if not exists auctions_status_ends_idx on public.auctions(status, ends_at);
create index if not exists auctions_seller_idx on public.auctions(seller_id, created_at desc);
create index if not exists bids_auction_created_idx on public.bids(auction_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.auctions enable row level security;
alter table public.bids enable row level security;

drop policy if exists "Profiles are visible to authenticated users" on public.profiles;
create policy "Profiles are visible to authenticated users"
  on public.profiles for select to authenticated using (true);
drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
  on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

drop policy if exists "Anyone can view live and scheduled auctions" on public.auctions;
create policy "Anyone can view live and scheduled auctions"
  on public.auctions for select to anon, authenticated using (status in ('scheduled','live','ended'));
drop policy if exists "Sellers can create auctions" on public.auctions;
create policy "Sellers can create auctions"
  on public.auctions for insert to authenticated with check (
    seller_id = auth.uid()
    and exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'seller')
  );
drop policy if exists "Sellers can update their scheduled auctions" on public.auctions;
create policy "Sellers can update their scheduled auctions"
  on public.auctions for update to authenticated using (
    seller_id = auth.uid() and status = 'scheduled'
  ) with check (seller_id = auth.uid() and status in ('scheduled','cancelled'));

drop policy if exists "Authenticated users can view bid history" on public.bids;
create policy "Authenticated users can view bid history"
  on public.bids for select to authenticated using (true);
-- Direct bid inserts are intentionally not permitted. Use place_bid() below.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', ''),
    'buyer'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.place_bid(p_auction_id uuid, p_amount numeric)
returns public.bids
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_auction public.auctions;
  v_bid public.bids;
begin
  if v_user_id is null then
    raise exception 'É necessário entrar na conta para dar lances.';
  end if;
  if p_amount is null or p_amount <= 0 then
    raise exception 'Valor de lance inválido.';
  end if;

  select * into v_auction
  from public.auctions
  where id = p_auction_id
  for update;

  if not found then raise exception 'Leilão não encontrado.'; end if;
  if v_auction.status <> 'live' then raise exception 'Este leilão não está ao vivo.'; end if;
  if now() < v_auction.starts_at or now() >= v_auction.ends_at then
    raise exception 'O período de lances foi encerrado ou ainda não começou.';
  end if;
  if v_auction.seller_id = v_user_id then
    raise exception 'O vendedor não pode dar lance no próprio leilão.';
  end if;
  if p_amount < v_auction.current_price + v_auction.minimum_increment then
    raise exception 'O lance mínimo atual é %.', (v_auction.current_price + v_auction.minimum_increment);
  end if;

  insert into public.bids (auction_id, bidder_id, amount)
  values (p_auction_id, v_user_id, p_amount)
  returning * into v_bid;

  update public.auctions
  set current_price = p_amount, updated_at = now()
  where id = p_auction_id;

  return v_bid;
end;
$$;

revoke all on function public.place_bid(uuid, numeric) from public;
grant execute on function public.place_bid(uuid, numeric) to authenticated;
