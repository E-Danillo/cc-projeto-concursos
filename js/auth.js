/**
 * Autenticação e sessão do AprovaJá.
 *
 * - Com Supabase (URL + anon key em config.js): login/cadastro reais, sessão no SDK.
 * - Sem Supabase: modo demonstração grava o “usuário” em localStorage (DEMO_KEY).
 * - Expõe window.AprovaJaAuth para login.html, api.js e perfil-db.js.
 */
(function (window) {
  /** Chave do localStorage para modo demo (sem Supabase configurado). */
  const DEMO_KEY = 'aprovaJaDemoUser';
  /** Cliente Supabase carregado por CDN (UMD); só usado se config tiver URL + chave. */
  const SUPABASE_CDN =
    'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.49.1/dist/umd/supabase.min.js';

  let supabaseClient = null;
  let supabaseReady = false;

  function cfg() {
    return window.AprovaJaConfig || {};
  }

  /** Retorna true se dá para inicializar o cliente Supabase (evita erros com config vazia). */
  function hasSupabaseConfig() {
    const c = cfg();
    return !!(c.supabaseUrl && c.supabaseAnonKey && String(c.supabaseUrl).indexOf('http') === 0);
  }

  /** Carrega um script dinamicamente (usado para o bundle UMD do Supabase). */
  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      const s = document.createElement('script');
      s.src = src;
      s.async = true;
      s.onload = function () {
        resolve();
      };
      s.onerror = function () {
        reject(new Error('Falha ao carregar script'));
      };
      document.head.appendChild(s);
    });
  }

  /** Cria supabaseClient na primeira chamada; chamadas seguintes reutilizam a instância. */
  async function initSupabase() {
    if (!hasSupabaseConfig()) return null;
    if (supabaseClient) return supabaseClient;
    await loadScript(SUPABASE_CDN);
    const lib = window.supabase;
    const createClient = lib && (lib.createClient || (lib.default && lib.default.createClient));
    if (!createClient) {
      console.warn('AprovaJá: Supabase UMD não expôs createClient.');
      return null;
    }
    const c = cfg();
    supabaseClient = createClient(c.supabaseUrl, c.supabaseAnonKey);
    supabaseReady = true;
    return supabaseClient;
  }

  function getDemoUser() {
    try {
      const raw = localStorage.getItem(DEMO_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  }

  function setDemoUser(user) {
    localStorage.setItem(DEMO_KEY, JSON.stringify(user));
  }

  function clearDemoUser() {
    localStorage.removeItem(DEMO_KEY);
  }

  /**
   * Sessão atual: prioriza Supabase; se não houver, tenta usuário demo no localStorage.
   * Retorno: { tipo: 'supabase', session } | { tipo: 'demo', user } | null
   */
  async function getSession() {
    await initSupabase();
    if (supabaseClient) {
      const { data } = await supabaseClient.auth.getSession();
      if (data && data.session) return { tipo: 'supabase', session: data.session };
    }
    const demo = getDemoUser();
    if (demo && demo.email) return { tipo: 'demo', user: demo };
    return null;
  }

  /** Primeiro nome para o menu (prioriza perfil no Postgres se AprovaJaPerfil existir). */
  async function getDisplayNameForNav() {
    const s = await getSession();
    if (!s) return null;
    if (s.tipo === 'demo' && s.user) {
      if (window.AprovaJaPerfil && window.AprovaJaPerfil.readDemoPerfil) {
        const p = window.AprovaJaPerfil.readDemoPerfil();
        if (p && p.nome_exibicao) {
          return String(p.nome_exibicao).split(' ')[0] || 'visitante';
        }
      }
      const n = s.user.nome || s.user.name || s.user.email || '';
      return String(n).split('@')[0].split(' ')[0] || 'visitante';
    }
    if (s.tipo === 'supabase' && s.session && s.session.user) {
      if (window.AprovaJaPerfil && window.AprovaJaPerfil.fetchPerfilRow) {
        try {
          const row = await window.AprovaJaPerfil.fetchPerfilRow();
          if (row && row.nome_exibicao) {
            return String(row.nome_exibicao).split(' ')[0] || 'visitante';
          }
        } catch (e) {}
      }
      const meta = s.session.user.user_metadata || {};
      const n = meta.nome || meta.name || s.session.user.email || '';
      return String(n).split('@')[0].split(' ')[0] || 'visitante';
    }
    return null;
  }

  /** Login: Supabase signInWithPassword ou gravação do usuário demo. */
  async function signInWithPassword(email, password) {
    await initSupabase();
    if (supabaseClient) {
      const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });
      if (error) throw error;
      clearDemoUser();
      return { tipo: 'supabase', data };
    }
    setDemoUser({ email: email, nome: email.split('@')[0] });
    return { tipo: 'demo' };
  }

  /** Cadastro: Supabase signUp (metadata.nome) ou demo local. */
  async function signUpWithPassword(email, password, nome) {
    await initSupabase();
    if (supabaseClient) {
      const { data, error } = await supabaseClient.auth.signUp({
        email: email,
        password: password,
        options: { data: { nome: nome || '' } },
      });
      if (error) throw error;
      clearDemoUser();
      return { tipo: 'supabase', data };
    }
    setDemoUser({ email: email, nome: nome || email.split('@')[0] });
    return { tipo: 'demo' };
  }

  /** Encerra sessão Supabase e limpa o usuário demo. */
  async function signOut() {
    await initSupabase();
    clearDemoUser();
    if (supabaseClient) {
      await supabaseClient.auth.signOut();
    }
  }

  /** Caminho relativo para login.html (raiz do site vs pasta html/). */
  function loginPagePath() {
    const base = window.location.pathname.indexOf('/html/') !== -1 ? '' : 'html/';
    return base + 'login.html';
  }

  function isLoginPage() {
    return /login\.html/i.test(window.location.pathname);
  }

  /** Páginas que podem ficar públicas se permitirConcursosSemLogin for true. */
  function isPublicListingPage() {
    const p = (window.location.pathname || '').toLowerCase();
    return p.indexOf('concursos.html') !== -1 || p.indexOf('convocacoes.html') !== -1;
  }

  /**
   * Se protegerPaginasPrivadas e Supabase estiverem ativos, redireciona anônimos ao login.
   * Respeita listagens públicas (concursos/convocações) conforme config.
   */
  async function guardPrivatePage() {
    const c = cfg();
    if (!c.protegerPaginasPrivadas || isLoginPage()) return;
    if (c.permitirConcursosSemLogin !== false && isPublicListingPage()) return;
    if (!hasSupabaseConfig()) return;
    await initSupabase();
    const s = await getSession();
    if (s) return;
    const next = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.href = loginPagePath() + '?next=' + next;
  }

  /** Liga todos os botões com classe .logout ao signOut + redirect. */
  function bindLogoutButtons() {
    document.querySelectorAll('.logout').forEach(function (btn) {
      btn.addEventListener('click', async function () {
        await signOut();
        window.location.href = loginPagePath();
      });
    });
  }

  /** Cliente Supabase para perfil-db.js (após init). */
  async function getSupabase() {
    await initSupabase();
    return supabaseClient;
  }

  /**
   * Executar em cada página protegida: init, guarda de rota, sync da linha em public.perfis, logout.
   */
  async function boot() {
    await initSupabase();
    await guardPrivatePage();
    if (window.AprovaJaPerfil && typeof window.AprovaJaPerfil.syncAfterAuth === 'function') {
      await window.AprovaJaPerfil.syncAfterAuth();
    }
    bindLogoutButtons();
  }

  /** API pública consumida pelas páginas HTML. */
  window.AprovaJaAuth = {
    init: initSupabase,
    boot: boot,
    getSupabase: getSupabase,
    getSession: getSession,
    getDisplayNameForNav: getDisplayNameForNav,
    signInWithPassword: signInWithPassword,
    signUpWithPassword: signUpWithPassword,
    signOut: signOut,
    hasSupabaseConfig: hasSupabaseConfig,
    getDemoUser: getDemoUser,
    loginPagePath: loginPagePath,
  };
})(window);
