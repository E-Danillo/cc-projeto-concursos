/**
 * Tabela public.perfis no Supabase (nome, áreas, etc.) + fallback local em modo demo.
 */
(function (window) {
  const TABLE = 'perfis';
  const DEMO_PERFIL_KEY = 'aprovaJaPerfilLocal';

  var AREAS_OPCOES = [
    { emoji: '💻', nome: 'Tecnologia da Informação' },
    { emoji: '📋', nome: 'Administração' },
    { emoji: '⚖️', nome: 'Jurídico / Direito' },
    { emoji: '💰', nome: 'Fiscal / Tributário' },
    { emoji: '🏥', nome: 'Saúde' },
    { emoji: '🎓', nome: 'Educação / Magistério' },
    { emoji: '🔬', nome: 'Engenharia' },
    { emoji: '🏦', nome: 'Financeiro / Bancário' },
    { emoji: '🛡️', nome: 'Segurança Pública' },
    { emoji: '🌿', nome: 'Meio Ambiente' },
  ];

  async function getSb() {
    if (!window.AprovaJaAuth || !window.AprovaJaAuth.getSupabase) return null;
    return await window.AprovaJaAuth.getSupabase();
  }

  function readDemoPerfil() {
    try {
      const raw = localStorage.getItem(DEMO_PERFIL_KEY);
      if (!raw) return { nome_exibicao: '', areas_interesse: [], concursos_realizados_ids: [] };
      const o = JSON.parse(raw);
      return {
        nome_exibicao: o.nome_exibicao || '',
        areas_interesse: Array.isArray(o.areas_interesse) ? o.areas_interesse : [],
        concursos_realizados_ids: Array.isArray(o.concursos_realizados_ids)
          ? o.concursos_realizados_ids
          : [],
      };
    } catch (e) {
      return { nome_exibicao: '', areas_interesse: [], concursos_realizados_ids: [] };
    }
  }

  function writeDemoPerfil(p) {
    localStorage.setItem(DEMO_PERFIL_KEY, JSON.stringify(p));
  }

  async function syncAfterAuth() {
    if (!window.AprovaJaAuth) return;
    const s = await window.AprovaJaAuth.getSession();
    if (!s || s.tipo !== 'supabase' || !s.session || !s.session.user) return;
    const sb = await getSb();
    if (!sb) return;
    const user = s.session.user;
    const meta = user.user_metadata || {};
    let nome = (meta.nome || meta.name || '').trim();
    if (!nome && user.email) nome = user.email.split('@')[0];
    if (!nome) nome = 'Usuário';
    const row = {
      user_id: user.id,
      nome_exibicao: nome,
      atualizado_em: new Date().toISOString(),
    };
    const { error } = await sb.from(TABLE).upsert(row, { onConflict: 'user_id' });
    if (error) console.warn('AprovaJá perfis sync:', error.message);
  }

  async function fetchPerfilRow() {
    if (!window.AprovaJaAuth) return null;
    const s = await window.AprovaJaAuth.getSession();
    if (!s || s.tipo !== 'supabase' || !s.session) return null;
    const sb = await getSb();
    if (!sb) return null;
    const uid = s.session.user.id;
    const { data, error } = await sb.from(TABLE).select('*').eq('user_id', uid).maybeSingle();
    if (error) {
      console.warn('AprovaJá perfis fetch:', error.message);
      return null;
    }
    return data;
  }

  async function ensurePerfilRow() {
    let row = await fetchPerfilRow();
    if (!row) {
      await syncAfterAuth();
      row = await fetchPerfilRow();
    }
    return row;
  }

  async function updateNomeExibicao(nome) {
    const s = await window.AprovaJaAuth.getSession();
    const n = (nome || '').trim();
    if (!n) throw new Error('Informe um nome.');

    if (s && s.tipo === 'demo' && s.user) {
      const p = readDemoPerfil();
      p.nome_exibicao = n;
      s.user.nome = n;
      writeDemoPerfil(p);
      localStorage.setItem(
        'aprovaJaDemoUser',
        JSON.stringify({ email: s.user.email, nome: n })
      );
      return;
    }

    if (!s || s.tipo !== 'supabase') throw new Error('Sessão inválida.');
    const sb = await getSb();
    if (!sb) throw new Error('Supabase indisponível.');
    const uid = s.session.user.id;
    const { error: e1 } = await sb
      .from(TABLE)
      .update({
        nome_exibicao: n,
        atualizado_em: new Date().toISOString(),
      })
      .eq('user_id', uid);
    if (e1) throw new Error(e1.message);
    const { error: e2 } = await sb.auth.updateUser({ data: { nome: n } });
    if (e2) console.warn('AprovaJá updateUser metadata:', e2.message);
  }

  async function saveAreasInteresse(areas) {
    const list = Array.isArray(areas) ? areas : [];
    const s = await window.AprovaJaAuth.getSession();

    if (s && s.tipo === 'demo') {
      const p = readDemoPerfil();
      p.areas_interesse = list;
      writeDemoPerfil(p);
      return;
    }

    if (!s || s.tipo !== 'supabase') return;
    const sb = await getSb();
    if (!sb) return;
    const uid = s.session.user.id;
    const { error } = await sb
      .from(TABLE)
      .update({
        areas_interesse: list,
        atualizado_em: new Date().toISOString(),
      })
      .eq('user_id', uid);
    if (error) console.warn('AprovaJá areas:', error.message);
  }

  async function getAreasCount() {
    const s = await window.AprovaJaAuth.getSession();
    if (s && s.tipo === 'demo') {
      const p = readDemoPerfil();
      return p.areas_interesse.length > 0 ? p.areas_interesse.length : null;
    }
    const row = await fetchPerfilRow();
    if (row && Array.isArray(row.areas_interesse) && row.areas_interesse.length > 0) {
      return row.areas_interesse.length;
    }
    return null;
  }

  async function getRealizadosCount() {
    const s = await window.AprovaJaAuth.getSession();
    if (s && s.tipo === 'demo') {
      return readDemoPerfil().concursos_realizados_ids.length;
    }
    const row = await fetchPerfilRow();
    if (row && Array.isArray(row.concursos_realizados_ids)) {
      return row.concursos_realizados_ids.length;
    }
    return 0;
  }

  function renderAreasChips(container, selected, onToggle) {
    if (!container) return;
    container.innerHTML = AREAS_OPCOES.map(function (opt) {
      const isOn = selected.indexOf(opt.nome) !== -1;
      return (
        '<button type="button" class="area-chip' +
        (isOn ? ' active' : '') +
        '" data-area="' +
        escapeAttr(opt.nome) +
        '" aria-pressed="' +
        (isOn ? 'true' : 'false') +
        '">' +
        opt.emoji +
        ' ' +
        escapeHtml(opt.nome) +
        '</button>'
      );
    }).join('');

    container.querySelectorAll('.area-chip').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const nome = btn.getAttribute('data-area');
        if (!nome) return;
        const idx = selected.indexOf(nome);
        const estavaFora = idx === -1;
        if (estavaFora) selected.push(nome);
        else selected.splice(idx, 1);
        btn.classList.toggle('active', estavaFora);
        btn.setAttribute('aria-pressed', estavaFora ? 'true' : 'false');
        onToggle(selected.slice());
      });
    });
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function escapeAttr(s) {
    return escapeHtml(s).replace(/'/g, '&#39;');
  }

  window.AprovaJaPerfil = {
    syncAfterAuth: syncAfterAuth,
    fetchPerfilRow: fetchPerfilRow,
    ensurePerfilRow: ensurePerfilRow,
    updateNomeExibicao: updateNomeExibicao,
    saveAreasInteresse: saveAreasInteresse,
    getAreasCount: getAreasCount,
    getRealizadosCount: getRealizadosCount,
    readDemoPerfil: readDemoPerfil,
    AREAS_OPCOES: AREAS_OPCOES,
    renderAreasChips: renderAreasChips,
  };
})(window);
