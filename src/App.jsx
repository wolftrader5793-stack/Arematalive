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

  useEffect(() => {
    if (!supabase) return undefined;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));
    return () => listener.subscription.unsubscribe();
  }, []);
  const categories = ['Todos', 'Eletrônicos', 'Colecionáveis', 'Casa e decoração', 'Moda'];
  const filtered = auctions.filter((a) => (category === 'Todos' || a.category === category) && (a.title + a.subtitle).toLowerCase().includes(search.toLowerCase()));

  function requireAccount() {
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
              <div className={'auction-image ' + a.color}><div className="image-pattern" /><span className="live-label"><i /> AO VIVO</span><span className="viewers-label">◉ {a.viewers}</span><div className="auction-emoji">{a.emoji}</div><button className="play-button" aria-label={'Assistir ' + a.title} onClick={() => setNotice('A transmissão ao vivo será conectada na etapa de integração de vídeo.')}>▶</button><span className="timer-label">⏱ {a.time}</span></div>
              <div className="auction-content"><span className="auction-category">{a.category}</span><h3>{a.title}</h3><p>{a.subtitle}</p><div className="price-row"><div><small>Lance atual</small><strong>{money(a.price)}</strong></div><span className="bid-count">↗ {a.bids} lances</span></div><button className="bid-button" onClick={requireAccount}>Participar do leilão <span>→</span></button></div>
            </article>)}
          </div>
          {filtered.length === 0 && <div className="empty-state">Nenhum leilão encontrado. Tente outra busca ou categoria.</div>}
        </section>

        <section className="seller-banner"><div className="seller-symbol">↗</div><div><span className="section-kicker">VOCÊ TEM ALGO ESPECIAL?</span><h2>Transforme sua live em um leilão.</h2><p>Mostre seus produtos, reúna compradores e venda para quem der o maior lance.</p></div><button onClick={() => setNotice('O cadastro de vendedores será habilitado na próxima etapa.')}>Quero ser vendedor <span>→</span></button></section>
      </main>

      <footer><a className="brand footer-brand" href="#"><span className="brand-mark">A<span>•</span></span><span>Aremata<span className="brand-light">Live</span></span></a><span>Leilões ao vivo, do seu jeito.</span><span>© 2026 AremataLive</span></footer>

      {notice && <div className="toast" role="status"><span>ℹ</span><p>{notice}</p><button onClick={() => { setNotice(''); setShowLogin(false); }} aria-label="Fechar aviso">×</button></div>}
      {showLogin && <div className="modal-backdrop" onClick={() => setShowLogin(false)}><div className="login-modal" onClick={(e) => e.stopPropagation()}><button className="modal-close" onClick={() => setShowLogin(false)} aria-label="Fechar">×</button><div className="modal-logo">A<span>•</span></div><h2>{authMode === 'signup' ? 'Crie sua conta.' : 'Entre na disputa.'}</h2><p>{authMode === 'signup' ? 'Cadastre-se para acompanhar leilões e participar dos lances.' : 'Entre para acompanhar sua conta e participar dos leilões.'}</p><form className="auth-form" onSubmit={handleAuthSubmit}>{authMode === 'signup' && <input type="text" autoComplete="name" placeholder="Seu nome" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required minLength={2} />}<input type="email" autoComplete="email" placeholder="Seu e-mail" value={email} onChange={(e) => setEmail(e.target.value)} required /><input type="password" autoComplete={authMode === 'signup' ? 'new-password' : 'current-password'} placeholder="Senha (mínimo 6 caracteres)" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} /><button className="signup-button modal-main" type="submit" disabled={authLoading}>{authLoading ? 'Aguarde...' : authMode === 'signup' ? 'Criar conta' : 'Entrar com e-mail'} <span>→</span></button>{!isSupabaseConfigured && <small className="auth-warning">A conexão com o Supabase precisa ser configurada no ambiente de publicação.</small>}</form><button className="auth-switch" onClick={() => setAuthMode(authMode === 'signup' ? 'login' : 'signup')}>{authMode === 'signup' ? 'Já tem uma conta? Entrar' : 'Ainda não tem conta? Criar conta'}</button><small>Você pode assistir às lives públicas sem fazer login.</small></div></div>}
      <div className="prototype-note">PRÉVIA VISUAL • DADOS ILUSTRATIVOS • PAGAMENTOS E LANCES AINDA NÃO ESTÃO ATIVOS</div>
    </div>
  );
}

export default App;
