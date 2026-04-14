/**
 * Autenticação: Supabase (cadastro/login reais) ou modo local (demonstração).
 */
(function (window) {
  const DEMO_KEY = 'aprovaJaDemoUser';
  const SUPABASE_CDN =
    'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.49.1/dist/umd/supabase.min.js';

  let supabaseClient = null;
  let supabaseReady = false;

  function cfg() {
    return window.AprovaJaConfig || {};
  }

  function hasSupabaseConfig() {
    const c = cfg();
    return !!(c.supabaseUrl && c.supabaseAnonKey && String(c.supabaseUrl).indexOf('http') === 0);
  }

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

  async function signOut() {
    await initSupabase();
    clearDemoUser();
    if (supabaseClient) {
      await supabaseClient.auth.signOut();
    }
  }

  function loginPagePath() {
    const base = window.location.pathname.indexOf('/html/') !== -1 ? '' : 'html/';
    return base + 'login.html';
  }

  function isLoginPage() {
    return /login\.html/i.test(window.location.pathname);
  }

  function isPublicListingPage() {
    const p = (window.location.pathname || '').toLowerCase();
    return p.indexOf('concursos.html') !== -1 || p.indexOf('convocacoes.html') !== -1;
  }

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

  function bindLogoutButtons() {
    document.querySelectorAll('.logout').forEach(function (btn) {
      btn.addEventListener('click', async function () {
        await signOut();
        window.location.href = loginPagePath();
      });
    });
  }

  async function getSupabase() {
    await initSupabase();
    return supabaseClient;
  }

  async function boot() {
    await initSupabase();
    await guardPrivatePage();
    if (window.AprovaJaPerfil && typeof window.AprovaJaPerfil.syncAfterAuth === 'function') {
      await window.AprovaJaPerfil.syncAfterAuth();
    }
    bindLogoutButtons();
  }

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
