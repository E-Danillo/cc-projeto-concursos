/**
 * Dados: concursos curados (data/concursos-curados.json) + API pública (concursos-api.deno.dev).
 */
(function (window) {
  const DENO_API = 'https://concursos-api.deno.dev';

  const ESCOLARIDADES = [
    'Superior Completo',
    'Ensino Médio Completo',
    'Superior em andamento',
  ];

  const ALERTA_CLASSES = ['info', 'warning', 'success'];
  const ALERTA_ICONS = ['🔔', '⚠️', '✅'];

  function cfg() {
    return window.AprovaJaConfig || { ufPadrao: 'sp' };
  }

  function baseDataPrefix() {
    return window.location.pathname.indexOf('/html/') !== -1 ? '../' : '';
  }

  async function fetchJsonUrl(url) {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error('Não foi possível carregar os dados. Tente novamente.');
    }
    return res.json();
  }

  async function fetchCurados() {
    const url = baseDataPrefix() + 'data/concursos-curados.json';
    try {
      const data = await fetchJsonUrl(url);
      return Array.isArray(data.itens) ? data.itens : [];
    } catch (e) {
      return [];
    }
  }

  async function fetchDenoConcursos(uf) {
    const u = String(uf || 'sp')
      .toLowerCase()
      .replace(/[^a-z]/g, '');
    const safe = u.length === 2 ? u : 'sp';
    const url = DENO_API + '/' + safe;
    const data = await fetchJsonUrl(url);
    return { data: data, uf: safe };
  }

  function truncar(texto, max) {
    const t = (texto || '').replace(/\s+/g, ' ').trim();
    if (t.length <= max) return t;
    return t.slice(0, max).trim() + '…';
  }

  function formatMoneyBR(n) {
    const x = Number(n);
    if (Number.isNaN(x)) return '—';
    return x.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  function formatDateBR(d) {
    if (!(d instanceof Date) || Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('pt-BR');
  }

  function addDays(base, days) {
    const x = new Date(base);
    x.setDate(x.getDate() + days);
    return x;
  }

  function firstString(obj, keys) {
    if (!obj || typeof obj !== 'object') return '';
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      if (obj[k] != null && String(obj[k]).trim()) return String(obj[k]).trim();
    }
    const lower = {};
    Object.keys(obj).forEach(function (k) {
      lower[k.toLowerCase()] = obj[k];
    });
    for (let j = 0; j < keys.length; j++) {
      const kk = keys[j].toLowerCase();
      if (lower[kk] != null && String(lower[kk]).trim()) return String(lower[kk]).trim();
    }
    return '';
  }

  function textoResumoDeno(obj) {
    const skip = { Órgão: 1, Orgao: 1, orgao: 1, Situação: 1, Situacao: 1, Link: 1, link: 1 };
    const partes = [];
    Object.keys(obj).forEach(function (k) {
      if (skip[k]) return;
      const v = obj[k];
      if (v == null) return;
      const s = String(v).trim();
      if (s && s.length < 400) partes.push(k + ': ' + s);
    });
    return truncar(partes.join(' · '), 220);
  }

  function inferirAreaDeTexto(blob) {
    const b = (blob || '').toLowerCase();
    if (/ti\b|informática|tecnologia|computação|dados/.test(b)) return 'Tecnologia da Informação';
    if (/tribunal|judiciário|direito|advogado/.test(b)) return 'Jurídico';
    if (/saúde|enferm|médic|hospital|sus/.test(b)) return 'Saúde';
    if (/educa|magistério|professor|ensino/.test(b)) return 'Educação';
    if (/prefeitura|município|câmara/.test(b)) return 'Administração';
    return 'Geral';
  }

  function mapCuradoJson(item, idx) {
    const id = String(item.id || 'curado-' + idx);
    const titulo = truncar(item.titulo || item.cargo || 'Concurso', 100);
    const orgao = item.orgao || 'Órgão público';
    const desc = truncar(item.descricao || '', 220);
    const area = item.area || inferirAreaDeTexto(titulo + ' ' + orgao);
    const esc = item.escolaridade || ESCOLARIDADES[idx % ESCOLARIDADES.length];
    const vagas = Number(item.vagas) > 0 ? Number(item.vagas) : 10 + (idx % 50);
    const salario = Number(item.salario) > 0 ? Number(item.salario) : 4000 + (idx % 8000);
    let insc = item.inscricao_ate ? new Date(item.inscricao_ate) : addDays(new Date(), 20);
    let prova = item.prova_em ? new Date(item.prova_em) : addDays(new Date(), 50);
    if (Number.isNaN(insc.getTime())) insc = addDays(new Date(), 20);
    if (Number.isNaN(prova.getTime())) prova = addDays(new Date(), 50);
    const st = (item.status || 'aberto').toLowerCase();
    const status = st === 'encerrado' ? 'encerrado' : st === 'previsto' ? 'previsto' : 'aberto';
    const encerrado = status === 'encerrado';
    const previsto = status === 'previsto';
    let badgeClass = 'green';
    let badgeLabel = 'Inscrições Abertas';
    if (encerrado) {
      badgeClass = 'gray';
      badgeLabel = 'Encerrado';
    } else if (previsto) {
      badgeClass = 'warning';
      badgeLabel = 'Previsto';
    }
    const linkUrl = item.link || item.url || '';
    return {
      id: id,
      titulo: titulo,
      descricao: desc || 'Informação revisada pela equipe do AprovaJá.',
      orgao: orgao,
      orgaoCompleto: '📍 ' + orgao + ' · Curado',
      area: area,
      escolaridade: esc,
      salario: salario,
      salarioFmt: formatMoneyBR(salario),
      vagas: vagas,
      inscricaoAte: insc,
      provaEm: prova,
      inscricaoFmt: formatDateBR(insc),
      provaFmt: formatDateBR(prova),
      status: status,
      badgeClass: badgeClass,
      badgeLabel: badgeLabel,
      linkUrl: linkUrl,
      fonte: 'curado',
    };
  }

  function mapDenoItem(raw, uf, tipoLista, idx) {
    const orgao = firstString(raw, ['Órgão', 'Orgão', 'órgão', 'Orgao']) || 'Órgão público';
    const cargo =
      firstString(raw, ['Cargo', 'cargo', 'Vaga', 'Nome', 'Edital']) ||
      orgao ||
      'Concurso público';
    const titulo = truncar(cargo, 100);
    const situacao = firstString(raw, ['Situação', 'Situacao', 'situação']) || '';
    const linkUrl = firstString(raw, ['Link', 'URL', 'Site', 'link', 'href']);
    const desc = textoResumoDeno(raw) || truncar(orgao + ' — ' + situacao, 220);
    const area = inferirAreaDeTexto(titulo + ' ' + orgao + ' ' + desc);
    const esc = ESCOLARIDADES[idx % ESCOLARIDADES.length];
    const salario = 4500 + (idx * 137) % 12000;
    const vagas = 5 + (idx * 3) % 80;
    const insc = addDays(new Date(), 10 + (idx % 40));
    const prova = addDays(new Date(), 35 + (idx % 50));
    let status = 'aberto';
    let badgeClass = 'green';
    let badgeLabel = 'Inscrições Abertas';
    const sit = situacao.toLowerCase();
    if (tipoLista === 'previsto') {
      status = 'previsto';
      badgeClass = 'warning';
      badgeLabel = 'Previsto';
    } else if (/encerr|fech|homolog/.test(sit)) {
      status = 'encerrado';
      badgeClass = 'gray';
      badgeLabel = 'Encerrado';
    }
    const id = 'deno-' + uf + '-' + tipoLista + '-' + idx;
    return {
      id: id,
      titulo: titulo,
      descricao: desc,
      orgao: orgao,
      orgaoCompleto: '📍 ' + orgao + ' · ' + String(uf).toUpperCase(),
      area: area,
      escolaridade: esc,
      salario: salario,
      salarioFmt: formatMoneyBR(salario),
      vagas: vagas,
      inscricaoAte: insc,
      provaEm: prova,
      inscricaoFmt: formatDateBR(insc),
      provaFmt: formatDateBR(prova),
      status: status,
      badgeClass: badgeClass,
      badgeLabel: badgeLabel,
      linkUrl: linkUrl,
      fonte: 'deno',
    };
  }

  function flattenDenoPayload(data, uf) {
    const out = [];
    const ab = data.concursos_abertos;
    const pr = data.concursos_previstos;
    if (Array.isArray(ab)) {
      ab.forEach(function (item, i) {
        out.push(mapDenoItem(item, uf, 'aberto', i));
      });
    }
    if (Array.isArray(pr)) {
      pr.forEach(function (item, i) {
        out.push(mapDenoItem(item, uf, 'previsto', i));
      });
    }
    return out;
  }

  async function loadConcursosData(uf) {
    const curadosRaw = await fetchCurados();
    const curados = curadosRaw.map(mapCuradoJson);

    let denoList = [];
    let avisoApi = '';
    try {
      const { data, uf: ufUsado } = await fetchDenoConcursos(uf || cfg().ufPadrao || 'sp');
      if (data && data.message && typeof data.message === 'string') {
        avisoApi = data.message;
      }
      denoList = flattenDenoPayload(data, ufUsado);
    } catch (e) {
      avisoApi = 'Não foi possível carregar a lista externa no momento.';
    }

    const seen = {};
    const merged = [];
    curados.forEach(function (c) {
      merged.push(c);
      seen[String(c.id)] = true;
    });
    denoList.forEach(function (c) {
      merged.push(c);
    });

    return { concursos: merged, avisoApi: avisoApi };
  }

  function btnInscricaoHtml(c) {
    if (c.linkUrl) {
      return (
        '<a class="btn-inscricao" href="' +
        escapeAttr(c.linkUrl) +
        '" target="_blank" rel="noopener noreferrer">Abrir inscrição / site</a>'
      );
    }
    return '<button type="button" class="btn-inscricao" disabled title="Link não informado">Inscrição</button>';
  }

  function cardConcursoPagina(c) {
    return (
      '<div class="concurso-card" data-area="' +
      escapeAttr(c.area) +
      '" data-status="' +
      c.status +
      '" data-id="' +
      escapeAttr(String(c.id)) +
      '">' +
      '<div class="concurso-topo">' +
      '<div>' +
      '<div class="concurso-titulo-row">' +
      '<h2 class="concurso-titulo">' +
      escapeHtml(c.titulo) +
      '</h2>' +
      '<span class="badge ' +
      c.badgeClass +
      '">' +
      escapeHtml(c.badgeLabel) +
      '</span>' +
      '</div>' +
      '<p class="concurso-orgao">' +
      escapeHtml(c.orgaoCompleto) +
      '</p>' +
      '</div>' +
      '</div>' +
      '<p class="concurso-desc">' +
      escapeHtml(c.descricao) +
      '</p>' +
      '<div class="concurso-info">' +
      '<div class="info-item"><p class="info-label">💲 Salário (referência)</p><p class="info-value green">' +
      escapeHtml(c.salarioFmt) +
      '</p></div>' +
      '<div class="info-item"><p class="info-label">🏢 Vagas</p><p class="info-value">' +
      c.vagas +
      '</p></div>' +
      '<div class="info-item"><p class="info-label">🎓 Escolaridade</p><p class="info-value">' +
      escapeHtml(c.escolaridade) +
      '</p></div>' +
      '<div class="info-item"><p class="info-label">📅 Área</p><p class="info-value">' +
      escapeHtml(c.area) +
      '</p></div>' +
      '</div>' +
      '<div class="concurso-datas"><p><strong>Inscrições até:</strong> ' +
      escapeHtml(c.inscricaoFmt) +
      ' &bull; <strong>Prova em:</strong> ' +
      escapeHtml(c.provaFmt) +
      '</p></div>' +
      '<div class="concurso-acoes">' +
      '<button type="button" class="btn-detalhes">Ver detalhes</button>' +
      btnInscricaoHtml(c) +
      '</div>' +
      '</div>'
    );
  }

  function cardConcursoDashboard(c) {
    return (
      '<div class="concurso-card">' +
      '<div class="concurso-header">' +
      '<p class="concurso-titulo">' +
      escapeHtml(c.titulo) +
      '</p>' +
      '<span class="badge ' +
      c.badgeClass +
      '">' +
      escapeHtml(c.badgeLabel) +
      '</span>' +
      '</div>' +
      '<p class="concurso-orgao">' +
      escapeHtml(c.orgao) +
      '</p>' +
      '<p class="concurso-desc">' +
      escapeHtml(truncar(c.descricao, 120)) +
      '</p>' +
      '<div class="concurso-info">' +
      '<div class="info-item"><p class="info-label">Salário (ref.)</p><p class="info-value green">' +
      escapeHtml(c.salarioFmt) +
      '</p></div>' +
      '<div class="info-item"><p class="info-label">Vagas</p><p class="info-value">' +
      c.vagas +
      '</p></div>' +
      '<div class="info-item"><p class="info-label">Inscrição até</p><p class="info-value">' +
      escapeHtml(c.inscricaoFmt) +
      '</p></div>' +
      '<div class="info-item"><p class="info-label">Prova</p><p class="info-value">' +
      escapeHtml(c.provaFmt) +
      '</p></div>' +
      '</div>' +
      '</div>'
    );
  }

  function itemAlertaConcurso(c, index) {
    const cls = ALERTA_CLASSES[index % ALERTA_CLASSES.length];
    const icon = ALERTA_ICONS[index % ALERTA_ICONS.length];
    const titulo = truncar(c.titulo, 90);
    const categoria = c.area || 'Geral';
    return (
      '<div class="alerta-item ' +
      cls +
      '">' +
      '<span class="alerta-icon">' +
      icon +
      '</span>' +
      '<div>' +
      '<p class="alerta-titulo">' +
      escapeHtml(titulo) +
      '</p>' +
      '<p class="alerta-categoria">' +
      escapeHtml(categoria) +
      '</p>' +
      '</div>' +
      '</div>'
    );
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

  function getUfSelecionada() {
    const sel = document.getElementById('filtro-uf');
    if (sel && sel.value) return sel.value;
    try {
      const stored = localStorage.getItem('aprovaJaUF');
      if (stored) return stored;
    } catch (e) {}
    return cfg().ufPadrao || 'sp';
  }

  async function initNavUserName() {
    const el = document.getElementById('nav-user-name');
    if (!el) return;
    if (window.AprovaJaAuth && typeof window.AprovaJaAuth.getDisplayNameForNav === 'function') {
      try {
        const name = await window.AprovaJaAuth.getDisplayNameForNav();
        if (name) {
          el.textContent = 'Olá, ' + name;
          return;
        }
      } catch (e) {}
    }
    el.textContent = 'Olá, visitante';
  }

  async function initConcursosPage() {
    await initNavUserName();

    const lista = document.getElementById('concursos-lista');
    const busca = document.getElementById('filtro-busca');
    const selArea = document.getElementById('filtro-area');
    const selStatus = document.getElementById('filtro-status');
    const selUf = document.getElementById('filtro-uf');
    if (!lista) return;

    lista.innerHTML =
      '<p class="api-status api-loading" role="status">Carregando concursos…</p>';

    let todos = [];
    let avisoApi = '';

    async function recarregar() {
      const uf = getUfSelecionada();
      try {
        localStorage.setItem('aprovaJaUF', uf);
      } catch (e) {}
      lista.innerHTML =
        '<p class="api-status api-loading" role="status">Carregando concursos…</p>';
      try {
        const pack = await loadConcursosData(uf);
        todos = pack.concursos;
        avisoApi = pack.avisoApi || '';
      } catch (e) {
        lista.innerHTML =
          '<p class="api-status api-error" role="alert">' +
          escapeHtml(e.message || 'Erro ao carregar.') +
          '</p>';
        return;
      }
      renderCompleto();
    }

    function renderCompleto() {
      let topo = '';
      if (avisoApi) {
        topo +=
          '<p class="api-status api-loading" role="status">' + escapeHtml(avisoApi) + '</p>';
      }
      lista.innerHTML = topo + '<div id="concursos-lista-inner"></div>';
      const inner = document.getElementById('concursos-lista-inner');
      if (!inner) return;

      function preencherAreas() {
        if (!selArea) return;
        const set = {};
        todos.forEach(function (c) {
          set[c.area] = true;
        });
        const keys = Object.keys(set).sort();
        selArea.innerHTML =
          '<option value="">Todas as áreas</option>' +
          keys
            .map(function (a) {
              return '<option value="' + escapeAttr(a) + '">' + escapeHtml(a) + '</option>';
            })
            .join('');
      }

      function renderFiltrado() {
        const q = (busca && busca.value ? busca.value : '').toLowerCase();
        const area = selArea ? selArea.value : '';
        const status = selStatus ? selStatus.value : '';

        const filtrados = todos.filter(function (c) {
          if (area && c.area !== area) return false;
          if (status === 'aberto' && c.status !== 'aberto') return false;
          if (status === 'encerrado' && c.status !== 'encerrado') return false;
          if (status === 'previsto' && c.status !== 'previsto') return false;
          if (!q) return true;
          const blob = (c.titulo + ' ' + c.orgao + ' ' + c.descricao).toLowerCase();
          return blob.indexOf(q) !== -1;
        });

        if (filtrados.length === 0) {
          inner.innerHTML =
            '<p class="api-status">Nenhum concurso encontrado com os filtros atuais.</p>';
          return;
        }

        inner.innerHTML = filtrados.map(cardConcursoPagina).join('');
      }

      preencherAreas();
      renderFiltrado();

      if (busca) {
        busca.removeEventListener('input', renderFiltrado);
        busca.addEventListener('input', renderFiltrado);
      }
      if (selArea) {
        selArea.removeEventListener('change', renderFiltrado);
        selArea.addEventListener('change', renderFiltrado);
      }
      if (selStatus) {
        selStatus.removeEventListener('change', renderFiltrado);
        selStatus.addEventListener('change', renderFiltrado);
      }
    }

    if (selUf) {
      const ufAtual = getUfSelecionada();
      selUf.value = ufAtual;
      selUf.addEventListener('change', function () {
        recarregar();
      });
    }

    await recarregar();
  }

  async function countAreasInteresse() {
    if (window.AprovaJaPerfil && window.AprovaJaPerfil.getAreasCount) {
      try {
        const n = await window.AprovaJaPerfil.getAreasCount();
        if (n != null && n > 0) return n;
      } catch (e) {}
    }
    try {
      const raw = localStorage.getItem('aprovaJaAreasInteresse');
      if (raw) {
        const a = JSON.parse(raw);
        if (Array.isArray(a) && a.length > 0) return a.length;
      }
    } catch (e) {}
    return 0;
  }

  async function countRealizados() {
    if (window.AprovaJaPerfil && window.AprovaJaPerfil.getRealizadosCount) {
      try {
        return await window.AprovaJaPerfil.getRealizadosCount();
      } catch (e) {}
    }
    try {
      const raw = localStorage.getItem('aprovaJaConcursosRealizados');
      if (raw) {
        const a = JSON.parse(raw);
        if (Array.isArray(a)) return a.length;
      }
    } catch (e) {}
    return 0;
  }

  async function initDashboard() {
    const elAreas = document.getElementById('stat-areas');
    const elInsc = document.getElementById('stat-inscricoes');
    const elReal = document.getElementById('stat-realizados');
    const elAlertas = document.getElementById('stat-alertas');
    const alertasBox = document.getElementById('alertas-recentes');
    const concursosBox = document.getElementById('dashboard-concursos');
    const navUser = document.getElementById('nav-user-name');
    const apresentacao = document.getElementById('dashboard-saudacao');

    const primeiroNome = async function () {
      if (window.AprovaJaAuth && window.AprovaJaAuth.getDisplayNameForNav) {
        const n = await window.AprovaJaAuth.getDisplayNameForNav();
        if (n) return n;
      }
      return 'visitante';
    };

    try {
      const nome = await primeiroNome();
      if (navUser) navUser.textContent = 'Olá, ' + nome;
      if (apresentacao) apresentacao.textContent = 'Bem-vindo, ' + nome + '!';

      const uf = cfg().ufPadrao || 'sp';
      const pack = await loadConcursosData(uf);
      const concursos = pack.concursos;
      const abertos = concursos.filter(function (c) {
        return c.status === 'aberto';
      });
      const abertosN = abertos.length;

      if (elAreas) elAreas.textContent = String(await countAreasInteresse());
      if (elInsc) elInsc.textContent = String(abertosN);
      if (elReal) elReal.textContent = String(await countRealizados());
      if (elAlertas) elAlertas.textContent = String(Math.min(5, abertosN));

      const postsAlerta = abertos.slice(0, 3);
      if (alertasBox) {
        if (postsAlerta.length === 0) {
          alertasBox.innerHTML =
            '<p class="api-status">Nenhum alerta novo com inscrições abertas na lista atual.</p>';
        } else {
          alertasBox.innerHTML = postsAlerta
            .map(function (c, i) {
              return itemAlertaConcurso(c, i);
            })
            .join('');
        }
      }

      const preview = abertos.slice(0, 2);
      if (concursosBox) {
        if (preview.length === 0) {
          concursosBox.innerHTML =
            '<p class="api-status">Nenhuma inscrição aberta listada. Confira a página Concursos ou os dados curados.</p>';
        } else {
          concursosBox.innerHTML = preview.map(cardConcursoDashboard).join('');
        }
      }
    } catch (e) {
      if (elAreas) elAreas.textContent = '0';
      if (elInsc) elInsc.textContent = '0';
      if (elReal) elReal.textContent = '0';
      if (elAlertas) elAlertas.textContent = '0';
      if (alertasBox) {
        alertasBox.innerHTML =
          '<p class="api-status api-error" role="alert">' + escapeHtml(e.message) + '</p>';
      }
      if (concursosBox) {
        concursosBox.innerHTML =
          '<p class="api-status api-error" role="alert">' + escapeHtml(e.message) + '</p>';
      }
    }
  }

  async function initPerfil() {
    const nomeEl = document.getElementById('perfil-nome');
    const emailEl = document.getElementById('perfil-email');
    const navEl = document.getElementById('nav-user-name');
    const areasGrid = document.getElementById('perfil-areas-grid');
    const nomeInput = document.getElementById('perfil-nome-input');
    const nomeEditWrap = document.getElementById('perfil-nome-edit-wrap');
    const btnEditar = document.getElementById('perfil-btn-editar-nome');
    const btnSalvarNome = document.getElementById('perfil-nome-btn-salvar');
    const msgEl = document.getElementById('perfil-msg');

    function showPerfilMsg(text, isErr) {
      if (!msgEl) return;
      msgEl.textContent = text || '';
      msgEl.hidden = !text;
      msgEl.className = 'perfil-msg' + (isErr ? ' perfil-msg-error' : '');
    }

    async function preencher() {
      if (!window.AprovaJaAuth || !window.AprovaJaAuth.getSession) return;

      const s = await window.AprovaJaAuth.getSession();
      if (s && s.tipo === 'supabase' && s.session && s.session.user) {
        const u = s.session.user;
        let row = null;
        if (window.AprovaJaPerfil && window.AprovaJaPerfil.ensurePerfilRow) {
          try {
            row = await window.AprovaJaPerfil.ensurePerfilRow();
          } catch (e) {}
        }
        const meta = u.user_metadata || {};
        const nome =
          (row && row.nome_exibicao) ||
          meta.nome ||
          meta.name ||
          (u.email ? u.email.split('@')[0] : '—');
        if (nomeEl) nomeEl.textContent = nome;
        if (nomeInput) nomeInput.value = nome;
        if (emailEl) emailEl.textContent = u.email || '—';
        if (navEl) navEl.textContent = 'Olá, ' + String(nome).split(' ')[0];

        const selected =
          row && Array.isArray(row.areas_interesse) ? row.areas_interesse.slice() : [];
        if (window.AprovaJaPerfil && areasGrid && window.AprovaJaPerfil.renderAreasChips) {
          window.AprovaJaPerfil.renderAreasChips(areasGrid, selected, async function (arr) {
            showPerfilMsg('Salvando áreas…', false);
            try {
              await window.AprovaJaPerfil.saveAreasInteresse(arr);
              showPerfilMsg('Preferências salvas.', false);
              setTimeout(function () {
                showPerfilMsg('', false);
              }, 2000);
            } catch (e) {
              showPerfilMsg(e.message || 'Erro ao salvar.', true);
            }
          });
        }
        return;
      }

      if (s && s.tipo === 'demo' && s.user) {
        const p =
          window.AprovaJaPerfil && window.AprovaJaPerfil.readDemoPerfil
            ? window.AprovaJaPerfil.readDemoPerfil()
            : { nome_exibicao: '', areas_interesse: [] };
        const nome = p.nome_exibicao || s.user.nome || s.user.name || s.user.email || '—';
        if (nomeEl) nomeEl.textContent = nome;
        if (nomeInput) nomeInput.value = nome;
        if (emailEl) emailEl.textContent = s.user.email || '—';
        if (navEl) navEl.textContent = 'Olá, ' + String(nome).split(' ')[0];
        const selected = Array.isArray(p.areas_interesse) ? p.areas_interesse.slice() : [];
        if (window.AprovaJaPerfil && areasGrid && window.AprovaJaPerfil.renderAreasChips) {
          window.AprovaJaPerfil.renderAreasChips(areasGrid, selected, async function (arr) {
            await window.AprovaJaPerfil.saveAreasInteresse(arr);
            showPerfilMsg('Preferências salvas neste navegador.', false);
            setTimeout(function () {
              showPerfilMsg('', false);
            }, 2000);
          });
        }
        return;
      }

      if (nomeEl) nomeEl.textContent = '—';
      if (emailEl) emailEl.textContent = '—';
      if (navEl) navEl.textContent = 'Olá, visitante';
    }

    await preencher();

    if (btnEditar && nomeEditWrap && nomeInput) {
      btnEditar.addEventListener('click', function () {
        nomeEditWrap.classList.toggle('hidden');
        if (!nomeEditWrap.classList.contains('hidden')) nomeInput.focus();
      });
    }

    if (btnSalvarNome && nomeInput) {
      btnSalvarNome.addEventListener('click', async function () {
        showPerfilMsg('', false);
        try {
          if (window.AprovaJaPerfil && window.AprovaJaPerfil.updateNomeExibicao) {
            await window.AprovaJaPerfil.updateNomeExibicao(nomeInput.value);
          }
          if (nomeEl) nomeEl.textContent = nomeInput.value.trim();
          const nav = document.getElementById('nav-user-name');
          if (nav) nav.textContent = 'Olá, ' + nomeInput.value.trim().split(' ')[0];
          if (nomeEditWrap) nomeEditWrap.classList.add('hidden');
          showPerfilMsg('Nome atualizado.', false);
          setTimeout(function () {
            showPerfilMsg('', false);
          }, 2000);
        } catch (e) {
          showPerfilMsg(e.message || 'Erro ao salvar.', true);
        }
      });
    }
  }

  window.AprovaJaApi = {
    initConcursosPage: initConcursosPage,
    initDashboard: initDashboard,
    initPerfil: initPerfil,
    initNavUserName: initNavUserName,
    loadConcursosData: loadConcursosData,
  };
})(window);
