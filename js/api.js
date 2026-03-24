/**
 * Integração com JSONPlaceholder (JSONPlaceholder.typicode.com)
 * Posts e usuários são mapeados para o domínio "concursos" do AprovaJá.
 */
(function (window) {
  const API_BASE = 'https://jsonplaceholder.typicode.com';
  const USER_ID_DEMO = 1;

  const AREAS = [
    'Tecnologia da Informação',
    'Administração',
    'Jurídico',
    'Saúde',
    'Educação',
  ];

  const ESCOLARIDADES = [
    'Superior Completo',
    'Ensino Médio Completo',
    'Superior em andamento',
  ];

  const ALERTA_CLASSES = ['info', 'warning', 'success'];
  const ALERTA_ICONS = ['🔔', '⚠️', '✅'];

  async function initNavUserName() {
    const el = document.getElementById('nav-user-name');
    if (!el) return;
    try {
      const u = await fetchJson('/users/' + USER_ID_DEMO);
      el.textContent = 'Olá, ' + u.name.split(' ')[0];
    } catch (e) {
      el.textContent = 'Olá, visitante';
    }
  }

  async function fetchJson(path) {
    const res = await fetch(`${API_BASE}${path}`);
    if (!res.ok) {
      throw new Error('Não foi possível carregar os dados. Tente novamente.');
    }
    return res.json();
  }

  function truncar(texto, max) {
    const t = (texto || '').replace(/\s+/g, ' ').trim();
    if (t.length <= max) return t;
    return t.slice(0, max).trim() + '…';
  }

  function formatMoneyBR(n) {
    return n.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  function formatDateBR(d) {
    return d.toLocaleDateString('pt-BR');
  }

  function addDays(base, days) {
    const x = new Date(base);
    x.setDate(x.getDate() + days);
    return x;
  }

  function mapPostToConcurso(post, user) {
    const orgao = user?.company?.name || 'Órgão público';
    const cargo = truncar(post.title, 80);
    const desc = truncar(post.body, 220);
    const area = AREAS[post.id % AREAS.length];
    const escolaridade = ESCOLARIDADES[post.id % ESCOLARIDADES.length];
    const salario = 5000 + (post.id * 347) % 20000;
    const vagas = 10 + (post.id * 7) % 200;
    const diasInsc = 15 + (post.id % 50);
    const diasProva = diasInsc + 20 + (post.id % 40);
    const inscricaoAte = addDays(new Date(), diasInsc);
    const provaEm = addDays(new Date(), diasProva);
    const encerrado = post.id % 5 === 0;

    return {
      id: post.id,
      titulo: cargo,
      descricao: desc,
      orgao,
      orgaoCompleto: user
        ? `📍 ${user.company.name} – ${user.name}`
        : `📍 ${orgao}`,
      area,
      escolaridade,
      salario,
      salarioFmt: formatMoneyBR(salario),
      vagas,
      inscricaoAte,
      provaEm,
      inscricaoFmt: formatDateBR(inscricaoAte),
      provaFmt: formatDateBR(provaEm),
      status: encerrado ? 'encerrado' : 'aberto',
      badgeClass: encerrado ? 'gray' : 'green',
      badgeLabel: encerrado ? 'Encerrado' : 'Inscrições Abertas',
    };
  }

  function cardConcursoPagina(c) {
    return (
      '<div class="concurso-card" data-area="' +
      escapeAttr(c.area) +
      '" data-status="' +
      c.status +
      '" data-id="' +
      c.id +
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
      '<div class="info-item"><p class="info-label">💲 Salário</p><p class="info-value green">' +
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
      '<button type="button" class="btn-inscricao">Fazer inscrição</button>' +
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
      '<div class="info-item"><p class="info-label">Salário</p><p class="info-value green">' +
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

  function itemAlerta(post, user, index) {
    const cls = ALERTA_CLASSES[index % ALERTA_CLASSES.length];
    const icon = ALERTA_ICONS[index % ALERTA_ICONS.length];
    const titulo = truncar(post.title, 90);
    const categoria = user?.company?.name || AREAS[post.id % AREAS.length];
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

  async function loadConcursosData() {
    const [posts, users] = await Promise.all([
      fetchJson('/posts'),
      fetchJson('/users'),
    ]);
    const userById = {};
    users.forEach(function (u) {
      userById[u.id] = u;
    });
    return posts.map(function (p) {
      return mapPostToConcurso(p, userById[p.userId]);
    });
  }

  async function initConcursosPage() {
    initNavUserName();

    const lista = document.getElementById('concursos-lista');
    const busca = document.getElementById('filtro-busca');
    const selArea = document.getElementById('filtro-area');
    const selStatus = document.getElementById('filtro-status');
    if (!lista) return;

    lista.innerHTML =
      '<p class="api-status api-loading" role="status">Carregando concursos…</p>';

    let todos = [];

    try {
      todos = await loadConcursosData();
    } catch (e) {
      lista.innerHTML =
        '<p class="api-status api-error" role="alert">' +
        escapeHtml(e.message || 'Erro ao carregar.') +
        '</p>';
      return;
    }

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
        if (!q) return true;
        const blob = (c.titulo + ' ' + c.orgao + ' ' + c.descricao).toLowerCase();
        return blob.indexOf(q) !== -1;
      });

      if (filtrados.length === 0) {
        lista.innerHTML =
          '<p class="api-status">Nenhum concurso encontrado com os filtros atuais.</p>';
        return;
      }

      lista.innerHTML = filtrados.map(cardConcursoPagina).join('');
    }

    preencherAreas();
    renderFiltrado();

    if (busca) busca.addEventListener('input', renderFiltrado);
    if (selArea) selArea.addEventListener('change', renderFiltrado);
    if (selStatus) selStatus.addEventListener('change', renderFiltrado);
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

    try {
      const [posts, users, todos] = await Promise.all([
        fetchJson('/posts'),
        fetchJson('/users'),
        fetchJson('/users/' + USER_ID_DEMO + '/todos'),
      ]);

      const userById = {};
      users.forEach(function (u) {
        userById[u.id] = u;
      });

      const demoUser = userById[USER_ID_DEMO];
      if (navUser && demoUser) {
        navUser.textContent = 'Olá, ' + demoUser.name.split(' ')[0];
      }
      if (apresentacao && demoUser) {
        apresentacao.textContent = 'Bem-vindo, ' + demoUser.name.split(' ')[0] + '!';
      }

      const concursos = posts.map(function (p) {
        return mapPostToConcurso(p, userById[p.userId]);
      });
      const abertos = concursos.filter(function (c) {
        return c.status === 'aberto';
      }).length;
      const realizados = todos.filter(function (t) {
        return t.completed;
      }).length;

      if (elAreas) elAreas.textContent = '2';
      if (elInsc) elInsc.textContent = String(abertos);
      if (elReal) elReal.textContent = String(realizados);
      if (elAlertas) elAlertas.textContent = '3';

      const postsAlerta = posts.slice(0, 3);
      if (alertasBox) {
        alertasBox.innerHTML = postsAlerta
          .map(function (post, i) {
            return itemAlerta(post, userById[post.userId], i);
          })
          .join('');
      }

      const preview = concursos
        .filter(function (c) {
          return c.status === 'aberto';
        })
        .slice(0, 2);
      if (concursosBox) {
        concursosBox.innerHTML = preview.map(cardConcursoDashboard).join('');
      }
    } catch (e) {
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
    if (!nomeEl && !emailEl && !navEl) return;

    try {
      const user = await fetchJson('/users/' + USER_ID_DEMO);
      if (nomeEl) nomeEl.textContent = user.name;
      if (emailEl) emailEl.textContent = user.email;
      if (navEl) navEl.textContent = 'Olá, ' + user.name.split(' ')[0];
    } catch (e) {
      if (nomeEl) nomeEl.textContent = '—';
      if (emailEl) emailEl.textContent = '—';
      if (navEl) navEl.textContent = 'Olá, visitante';
    }
  }

  window.AprovaJaApi = {
    initConcursosPage: initConcursosPage,
    initDashboard: initDashboard,
    initPerfil: initPerfil,
    initNavUserName: initNavUserName,
  };
})(window);
