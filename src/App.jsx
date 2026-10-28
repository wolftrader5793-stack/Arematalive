import { useEffect, useState } from 'react';
import { isSupabaseConfigured, supabase } from './lib/supabase';

const auctions = [
  { id: 1, category: 'Eletrônicos', title: 'Setup gamer completo', subtitle: 'PC gamer • monitor • periféricos', price: 2450, bids: 28, viewers: 186, time: '00:42', live: true, emoji: '🎮', color: 'purple' },
  { id: 2, category: 'Colecionáveis', title: 'Coleção de relógios', subtitle: 'Peças selecionadas para colecionador', price: 680, bids: 16, viewers: 94, time: '02:15', live: true, emoji: '⌚', color: 'gold' },
  { id: 3, category: 'Casa e decoração', title: 'Luminária de design', subtitle: 'Design moderno • peça exclusiva', price: 120, bids: 9, viewers: 61, time: '04:08', live: true, emoji: '💡', color: 'blue' },
  { id: 4, category: 'Moda', title: 'Tênis edição especial', subtitle: 'Novo na caixa • edição limitada', price: 390, bids: 21, viewers: 112, time: '01:36', live: true, emoji: '👟', color: 'pink' },
];

const money = (n) => n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 });

function App() {
  const [category, setCategory] = useState('Todos');
  const [search, setSearch] = useState('');
  const [notice, setNotice] = useState('');
  const [showLogin, setShowLogin] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [session, setSession] = useState(null);
  const [activeAuction, setActiveAuction] = useState(null);
  const [roomPrice, setRoomPrice] = useState(0);
  const [roomCountdown, setRoomCountdown] = useState(42);
  const [roomBidCount, setRoomBidCount] = useState(28);
  const [roomChat, setRoomChat] = useState([
    { id: 1, name: 'Marina S.', message: 'Que setup incrível! 🔥', color: 'lime' },
    { id: 2, name: 'Rafa Gamer', message: 'O monitor está incluso?', color: 'purple' },
    { id: 3, name: 'Lucas M.', message: 'Preparado para dar lance!', color: 'blue' },
  ]);
  const [chatDraft, setChatDraft] = useState('');
  const [roomBidders, setRoomBidders] = useState([
    { id: 1, name: 'Rafa Gamer', amount: 2450, time: 'há 8 s' },
    { id: 2, name: 'Marina S.', amount: 2400, time: 'há 19 s' },
    { id: 3, name: 'Lucas M.', amount: 2350, time: 'há 31 s' },
  ]);

  useEffect(() => {
    if (!supabase) return undefined;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));
    return () => listener.subscription.unsubscribe();
  }, []);
  useEffect(() => {
    if (!activeAuction || roomCountdown <= 0) return undefined;
    const timer = window.setInterval(() => setRoomCountdown((current) => Math.max(0, current - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [activeAuction, roomCountdown <= 0]);

  function openAuctionRoom(auction) {
    setActiveAuction(auction);
    setRoomPrice(auction.price);
    setRoomBidCount(auction.bids);
    setRoomCountdown(42);
    setRoomChat([
      { id: 1, name: 'Marina S.', message: 'Que achado incrível! 🔥', color: 'lime' },
      { id: 2, name: 'Rafa Gamer', message: 'Pode mostrar mais detalhes?', color: 'purple' },
      { id: 3, name: 'Lucas M.', message: 'Estou acompanhando!', color: 'blue' },
    ]);
    setRoomBidders([
      { id: 1, name: 'Rafa Gamer', amount: auction.price, time: 'há 8 s' },
      { id: 2, name: 'Marina S.', amount: Math.max(0, auction.price - 50), time: 'há 19 s' },
      { id: 3, name: 'Lucas M.', amount: Math.max(0, auction.price - 100), time: 'há 31 s' },
    ]);
  }

  function placePreviewBid() {
    if (!session) {
      setActiveAuction(null);
      requireAccount();
      return;
    }
    if (roomCountdown <= 0) {
      setNotice('Este cronômetro de demonstração terminou. Os lances reais ainda não estão ativos.');
      return;
    }
    const nextPrice = roomPrice + (activeAuction?.increment || 10);
    setRoomPrice(nextPrice);
    setRoomBidCount((count) => count + 1);
    setRoomBidders((current) => [
      { id: Date.now(), name: session.user?.email?.split('@')[0] || 'Você', amount: nextPrice, time: 'agora' },
      ...current,
    ].sort((a, b) => b.amount - a.amount).slice(0, 8));
    setRoomChat((current) => [
      ...current,
      { id: Date.now() + 1, name: 'Sistema', message: 'Novo lance de demonstração registrado na tela.', color: 'lime' },
    ].slice(-30));
  }

  function sendRoomMessage(event) {
    event.preventDefault();
    const message = chatDraft.trim();
    if (!message) return;
    if (!session) {
      setNotice('Entre na sua conta para enviar mensagens no chat.');
      setAuthMode('login');
      setShowLogin(true);
      return;
    }
    setRoomChat((current) => [
      ...current,
      { id: Date.now(), name: session.user?.email?.split('@')[0] || 'Você', message, color: 'blue' },
    ].slice(-30));
    setChatDraft('');
  }

  const categories = ['Todos', 'Eletrônicos', 'Colecionáveis', 'Casa e decoração', 'Moda'];
  const filtered = auctions.filter((a) => (category === 'Todos' || a.category === category) && (a.title + a.subtitle).toLowerCase().includes(search.toLowerCase()));

  function requireAccount() {
    if (session) {
      setNotice('Sua conta está conectada. Os lances reais ainda estão em desenvolvimento e não podem ser enviados nesta prévia.');
      return;
    }
    setNotice('');
    setAuthMode('login');
    setShowLogin(true);
  }

  async function handleAuthSubmit(event) {
    event.preventDefault();
    if (!supabase) {
      setNotice('A conexão com o Supabase não está configurada neste ambiente. Confira as variáveis de publicação.');
      return;
    }

    setAuthLoading(true);
    setNotice('');
    try {
      if (authMode === 'signup') {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { data: { display_name: displayName.trim() } },
        });
        if (error) throw error;
        setShowLogin(false);
        setPassword('');
        setNotice(data.session
          ? 'Conta criada com sucesso! Você já está conectado.'
          : 'Cadastro recebido! Confira seu e-mail para confirmar a conta antes de entrar.');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        setShowLogin(false);
        setPassword('');
        setNotice('Login realizado com sucesso.');
      }
    } catch (error) {
      setNotice(error?.message || 'Não foi possível concluir a autenticação. Tente novamente.');
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleSignOut() {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    setNotice(error ? (error.message || 'Não foi possível sair da conta.') : 'Você saiu da sua conta.');
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#" aria-label="AremataLive início">
          <span className="brand-mark">A<span>•</span></span>
          <span>Aremata<span className="brand-light">Live</span></span>
        </a>
        <div className="search-wrap">
          <span aria-hidden="true">⌕</span>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar produtos e leilões" aria-label="Buscar produtos e leilões" />
          <kbd>⌘ K</kbd>
        </div>
        <nav className="header-actions">
          <button className="text-button" onClick={() => setNotice('A área do vendedor será habilitada na próxima etapa.')}>Quero vender</button>
          {session ? <><span className="session-email">{session.user?.email}</span><button className="login-button" onClick={handleSignOut}>Sair</button></> : <><button className="login-button" onClick={requireAccount}>Entrar</button><button className="signup-button" onClick={() => { setAuthMode('signup'); setNotice(''); setShowLogin(true); }}>Criar conta <span>↗</span></button></>}
        </nav>
      </header>

      <main>
        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow"><span className="pulse-dot" /> O próximo lance pode ser seu</div>
            <h1>Ao vivo é melhor.<br /><span>Arrematar é aqui.</span></h1>
            <p>Descubra produtos incríveis, acompanhe quem está vendendo e dispute seus favoritos em leilões ao vivo.</p>
            <div className="hero-actions">
              <a className="primary-cta" href="#leiloes">Explorar leilões <span>↗</span></a>
              <button className="secondary-cta" onClick={() => setNotice('A área do vendedor será disponibilizada em uma próxima etapa.')}>Começar a vender</button>
            </div>
            <div className="hero-proof"><div className="avatar-stack"><i>👨🏽</i><i>👩🏻</i><i>👨🏻</i><i>👩🏽</i></div><span><b>Uma nova forma</b> de comprar e vender</span></div>
          </div>
          <div className="hero-art" aria-label="Ilustração de leilão ao vivo">
            <div className="art-glow" />
            <div className="floating-tag tag-live"><span className="pulse-dot" /> AO VIVO AGORA</div>
            <div className="product-orbit orbit-one" /><div className="product-orbit orbit-two" />
            <div className="hero-product"><div className="product-spark">✦</div><div className="product-emoji">🎧</div><div className="product-caption">ACHADO DA LIVE</div></div>
            <div className="floating-tag tag-bid"><span>🏆</span><div><small>Maior lance</small><b>R$ 489,00</b></div></div>
            <div className="floating-tag tag-viewers"><span className="viewer-icon">◉</span> 186 assistindo</div>
            <div className="art-bottom-label">BONS ACHADOS. DISPUTAS EMOCIONANTES.</div>
          </div>
        </section>

        <section className="stats-strip" aria-label="Sobre a plataforma">
          <div><span className="stat-icon">◉</span><span><b>Lives abertas</b><small>Assista sem cadastro</small></span></div>
          <div><span className="stat-icon">↗</span><span><b>Lances em tempo real</b><small>A emoção de disputar ao vivo</small></span></div>
          <div><span className="stat-icon">♧</span><span><b>Compra com transparência</b><small>Histórico de lances por leilão</small></span></div>
          <div className="fee-note"><b>5%</b><span>comissão da plataforma<br /><small>sobre vendas concluídas*</small></span></div>
        </section>

        <section className="auctions-section" id="leiloes">
          <div className="section-heading">
            <div><div className="section-kicker">NÃO PERCA O PRÓXIMO LANCE</div><h2>Leilões em destaque <span className="live-pill"><i /> AO VIVO</span></h2><p>Encontre seu próximo achado entre as lives acontecendo agora.</p></div>
            <button className="view-all" onClick={() => { setCategory('Todos'); setSearch(''); }}>Ver todos <span>→</span></button>
          </div>
          <div className="category-row">{categories.map((c) => <button key={c} className={'category-chip ' + (category === c ? 'selected' : '')} onClick={() => setCategory(c)}>{c}</button>)}</div>
          <div className="auction-grid">
            {filtered.map((a) => <article className="auction-card" key={a.id}>
              <div className={'auction-image ' + a.color}><div className="image-pattern" /><span className="live-label"><i /> AO VIVO</span><span className="viewers-label">◉ {a.viewers}</span><div className="auction-emoji">{a.emoji}</div><button className="play-button" aria-label={'Assistir ' + a.title} onClick={() => openAuctionRoom(a)}>▶</button><span className="timer-label">⏱ {a.time}</span></div>
              <div className="auction-content"><span className="auction-category">{a.category}</span><h3>{a.title}</h3><p>{a.subtitle}</p><div className="price-row"><div><small>Lance atual</small><strong>{money(a.price)}</strong></div><span className="bid-count">↗ {a.bids} lances</span></div><button className="bid-button" onClick={() => openAuctionRoom(a)}>Participar do leilão <span>→</span></button></div>
            </article>)}
          </div>
          {filtered.length === 0 && <div className="empty-state">Nenhum leilão encontrado. Tente outra busca ou categoria.</div>}
        </section>

        <section className="seller-banner"><div className="seller-symbol">↗</div><div><span className="section-kicker">VOCÊ TEM ALGO ESPECIAL?</span><h2>Transforme sua live em um leilão.</h2><p>Mostre seus produtos, reúna compradores e venda para quem der o maior lance.</p></div><button onClick={() => setNotice('O cadastro de vendedores será habilitado na próxima etapa.')}>Quero ser vendedor <span>→</span></button></section>
      </main>

      <footer><a className="brand footer-brand" href="#"><span className="brand-mark">A<span>•</span></span><span>Aremata<span className="brand-light">Live</span></span></a><span>Leilões ao vivo, do seu jeito.</span><span>© 2026 AremataLive</span></footer>

      {activeAuction && <div className="live-room-backdrop" role="dialog" aria-modal="true" aria-label={'Leilão ao vivo: ' + activeAuction.title}>
        <section className="live-room-shell">
          <header className="live-room-topbar">
            <a className="brand" href="#leiloes" onClick={(event) => { event.preventDefault(); setActiveAuction(null); }} aria-label="Voltar para AremataLive">
              <span className="brand-mark">A<span>•</span></span><span>Aremata<span className="brand-light">Live</span></span>
            </a>
            <div className="room-title"><span className="room-live-dot" /> LEILÃO AO VIVO <small>• {activeAuction.viewers} assistindo</small></div>
            <button className="room-close" onClick={() => setActiveAuction(null)} aria-label="Fechar leilão">✕ <span>Sair da live</span></button>
          </header>
          <div className="room-layout">
            <aside className="room-panel room-bids-panel">
              <div className="room-panel-heading"><div><span className="room-eyebrow">DISPUTA</span><h3>Lances</h3></div><span className="room-count">{roomBidCount}</span></div>
              <div className="room-current-bid"><small>LANCE ATUAL</small><strong>{money(roomPrice)}</strong><span>Incremento fixo: {money(activeAuction.increment || 10)}</span></div>
              <div className={'room-countdown ' + (roomCountdown <= 10 ? 'urgent' : '')}><small>ENCERRA EM</small><strong>{String(Math.floor(roomCountdown / 60)).padStart(2, '0')}:{String(roomCountdown % 60).padStart(2, '0')}</strong><span>Contagem demonstrativa</span></div>
              <button className="room-bid-button" onClick={placePreviewBid} disabled={roomCountdown <= 0}>DAR LANCE <b>+ {money(activeAuction.increment || 10)}</b></button>
              <p className="room-demo-hint">Botão de demonstração. Os lances ainda não são salvos no servidor.</p>
              <div className="room-panel-heading room-ranking-heading"><div><span className="room-eyebrow">AO VIVO</span><h3>Maiores lances</h3></div></div>
              <div className="room-bid-list">{roomBidders.slice().sort((a,b) => b.amount-a.amount).map((bid,index) => <div className="room-bid-row" key={bid.id}><span className={'room-rank rank-' + index}>{index + 1}</span><span className="room-bidder-name">{bid.name}</span><strong>{money(bid.amount)}</strong></div>)}</div>
            </aside>
            <main className="room-center">
              <div className={'room-video-stage ' + activeAuction.color}>
                <div className="room-video-grid" />
                <div className="room-video-top"><span className="room-video-live"><i /> AO VIVO</span><span className="room-viewers">◉ {activeAuction.viewers} assistindo</span></div>
                <div className="room-video-product"><span>{activeAuction.emoji}</span><small>PRÉVIA DO VÍDEO DO VENDEDOR</small><p>A transmissão será conectada na próxima etapa</p></div>
                <button className="room-video-play" aria-label="Vídeo em prévia">▶</button>
                <div className="room-video-bottom"><span>◖ Som</span><span>⛶ Tela cheia</span></div>
              </div>
              <section className="room-product-info">
                <div className="room-product-copy"><span className="room-eyebrow">{activeAuction.category}</span><h2>{activeAuction.title}</h2><p>{activeAuction.subtitle}</p><div className="room-product-tags"><span>✓ Produto em destaque</span><span>♧ Compra transparente</span></div></div>
                <div className="room-product-price"><small>Lance atual</small><strong>{money(roomPrice)}</strong><span>{roomBidCount} lances</span></div>
              </section>
              <section className="room-details-strip"><div><span>📦</span><div><b>Detalhes do produto</b><small>{activeAuction.subtitle}</small></div></div><div><span>🏆</span><div><b>Maior lance vence</b><small>Classificação atualizada na tela</small></div></div></section>
            </main>
            <aside className="room-panel room-chat-panel">
              <div className="room-panel-heading"><div><span className="room-eyebrow">COMUNIDADE</span><h3>Chat da live</h3></div><span className="chat-online"><i /> Online</span></div>
              <div className="room-chat-subtitle">Converse com quem está assistindo</div>
              <div className="room-chat-messages">{roomChat.map((item) => <div className="room-chat-message" key={item.id}><span className={'room-chat-avatar ' + item.color}>{item.name.slice(0,1).toUpperCase()}</span><div><b>{item.name}</b><p>{item.message}</p></div></div>)}</div>
              <form className="room-chat-form" onSubmit={sendRoomMessage}><input value={chatDraft} onChange={(event) => setChatDraft(event.target.value)} placeholder={session ? 'Escreva uma mensagem…' : 'Entre para conversar'} aria-label="Mensagem do chat" /><button type="submit" aria-label="Enviar mensagem">➤</button></form>
              <p className="room-demo-hint">Chat de demonstração: mensagens não são compartilhadas com outros usuários ainda.</p>
            </aside>
          </div>
          <div className="room-mobile-bidbar"><div><small>LANCE ATUAL</small><strong>{money(roomPrice)}</strong></div><button onClick={placePreviewBid} disabled={roomCountdown <= 0}>DAR LANCE +{money(activeAuction.increment || 10)}</button></div>
          <div className="room-prototype-note">MODO PRÉVIA • VÍDEO, CHAT E LANCES AINDA NÃO ESTÃO CONECTADOS EM TEMPO REAL</div>
        </section>
      </div>}
      {notice && <div className="toast" role="status"><span>ℹ</span><p>{notice}</p><button onClick={() => { setNotice(''); setShowLogin(false); }} aria-label="Fechar aviso">×</button></div>}
      {showLogin && <div className="modal-backdrop" onClick={() => setShowLogin(false)}><div className="login-modal" onClick={(e) => e.stopPropagation()}><button className="modal-close" onClick={() => setShowLogin(false)} aria-label="Fechar">×</button><div className="modal-logo">A<span>•</span></div><h2>{authMode === 'signup' ? 'Crie sua conta.' : 'Entre na disputa.'}</h2><p>{authMode === 'signup' ? 'Cadastre-se para acompanhar leilões e participar dos lances.' : 'Entre para acompanhar sua conta e participar dos leilões.'}</p><form className="auth-form" onSubmit={handleAuthSubmit}>{authMode === 'signup' && <input type="text" autoComplete="name" placeholder="Seu nome" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required minLength={2} />}<input type="email" autoComplete="email" placeholder="Seu e-mail" value={email} onChange={(e) => setEmail(e.target.value)} required /><input type="password" autoComplete={authMode === 'signup' ? 'new-password' : 'current-password'} placeholder="Senha (mínimo 6 caracteres)" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} /><button className="signup-button modal-main" type="submit" disabled={authLoading}>{authLoading ? 'Aguarde...' : authMode === 'signup' ? 'Criar conta' : 'Entrar com e-mail'} <span>→</span></button>{!isSupabaseConfigured && <small className="auth-warning">A conexão com o Supabase precisa ser configurada no ambiente de publicação.</small>}</form><button className="auth-switch" onClick={() => setAuthMode(authMode === 'signup' ? 'login' : 'signup')}>{authMode === 'signup' ? 'Já tem uma conta? Entrar' : 'Ainda não tem conta? Criar conta'}</button><small>Você pode assistir às lives públicas sem fazer login.</small></div></div>}
      <div className="prototype-note">PRÉVIA VISUAL • DADOS ILUSTRATIVOS • PAGAMENTOS E LANCES AINDA NÃO ESTÃO ATIVOS</div>
    </div>
  );
}

export default App;
