/**
 * CRUD: Concursos acompanhados (public.concursos_acompanhados)
 * - Usuário: lista/cria/edita os próprios
 * - Admin: lista/edita/deleta todos + gerencia cargos em public.perfis
 */
(function (window) {
  const TABLE = 'concursos_acompanhados';

  function el(id) {
    return document.getElementById(id);
  }

  function showMsg(text, isErr) {
    const box = el('msg');
    if (!box) return;
    box.hidden = !text;
    box.textContent = text || '';
    box.className = 'msg' + (isErr ? ' error' : '');
  }

  function escapeHtml(s) {
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\"/g, '&quot;');
  }

  function tagStatus(status) {
    const st = (status || 'ativo').toLowerCase();
    const label =
      st === 'encerrado'
        ? 'Encerrado'
        : st === 'aprovado'
          ? 'Aprovado'
          : st === 'reprovado'
            ? 'Reprovado'
            : 'Ativo';
    return '<span class="tag ' + escapeHtml(st) + '">' + escapeHtml(label) + '</span>';
  }

  async function getSb() {
    if (!window.AprovaJaAuth || !window.AprovaJaAuth.getSupabase) return null;
    return await window.AprovaJaAuth.getSupabase();
  }

  async function getSession() {
    return window.AprovaJaAuth ? await window.AprovaJaAuth.getSession() : null;
  }

  async function getPerfil() {
    if (!window.AprovaJaPerfil || !window.AprovaJaPerfil.ensurePerfilRow) return null;
    return await window.AprovaJaPerfil.ensurePerfilRow();
  }

  function openModal(title, initial) {
    el('modal-title').textContent = title;
    el('f-titulo').value = (initial && initial.titulo) || '';
    el('f-orgao').value = (initial && initial.orgao) || '';
    el('f-status').value = (initial && initial.status) || 'ativo';
    el('f-obs').value = (initial && initial.observacoes) || '';
    el('modal').classList.add('open');
    el('modal').setAttribute('data-id', (initial && initial.id) || '');
    el('f-titulo').focus();
  }

  function closeModal() {
    el('modal').classList.remove('open');
    el('modal').setAttribute('data-id', '');
  }

  function itemHtml(row, canEdit, canDelete, isOwner) {
    const sub = [];
    if (row.orgao) sub.push(row.orgao);
    const subtitle = sub.length ? '<p class="item-sub">' + escapeHtml(sub.join(' • ')) + '</p>' : '';

    const obs = row.observacoes
      ? '<div class="muted">' + escapeHtml(row.observacoes).slice(0, 240) + '</div>'
      : '';

    let actions = '';
    if (canEdit || canDelete) {
      actions += '<div class="item-actions">';
      if (canEdit) actions += '<button type="button" class="btn-small" data-action="edit" data-id="' + escapeHtml(row.id) + '">Editar</button>';
      if (canDelete) actions += '<button type="button" class="btn-small btn-danger" data-action="delete" data-id="' + escapeHtml(row.id) + '">Excluir</button>';
      actions += '</div>';
    }

    return (
      '<div class="item" data-row-id="' +
      escapeHtml(row.id) +
      '">' +
      '<div class="item-top">' +
      '<div>' +
      '<p class="item-title">' +
      escapeHtml(row.titulo) +
      '</p>' +
      subtitle +
      '</div>' +
      tagStatus(row.status) +
      '</div>' +
      obs +
      actions +
      '</div>'
    );
  }

  async function loadRows(sb, isAdmin) {
    const { data, error } = await sb
      .from(TABLE)
      .select('id,user_id,titulo,orgao,status,observacoes,criado_em,atualizado_em')
      .order('criado_em', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  async function renderList(rows, uid, isAdmin) {
    const container = el('lista');
    if (!container) return;

    if (!rows.length) {
      container.innerHTML =
        '<div class="msg">Nenhum concurso acompanhado ainda. Clique em <strong>+ Novo concurso</strong>.</div>';
      return;
    }

    container.innerHTML = rows
      .map(function (r) {
        const isOwner = r.user_id === uid;
        const canEdit = isAdmin || isOwner;
        const canDelete = isAdmin; // requisito: usuário não pode deletar
        return itemHtml(r, canEdit, canDelete, isOwner);
      })
      .join('');
  }

  async function renderAdminUsers(sb) {
    const box = el('admin-users');
    if (!box) return;
    const { data, error } = await sb
      .from('perfis')
      .select('user_id,nome_exibicao,email,cargo,atualizado_em')
      .order('atualizado_em', { ascending: false })
      .limit(50);
    if (error) throw error;

    if (!data || !data.length) {
      box.innerHTML = '<div class="msg">Nenhum usuário encontrado em public.perfis ainda.</div>';
      return;
    }

    box.innerHTML = data
      .map(function (u) {
        return (
          '<div class="admin-row">' +
          '<div>' +
          '<div><strong>' +
          escapeHtml(u.nome_exibicao || '—') +
          '</strong></div>' +
          '<small>' +
          escapeHtml(u.email || u.user_id) +
          '</small>' +
          '</div>' +
          '<select data-action="role" data-user-id="' +
          escapeHtml(u.user_id) +
          '">' +
          '<option value="user"' +
          (u.cargo === 'user' ? ' selected' : '') +
          '>user</option>' +
          '<option value="admin"' +
          (u.cargo === 'admin' ? ' selected' : '') +
          '>admin</option>' +
          '</select>' +
          '</div>'
        );
      })
      .join('');
  }

  function bindListActions(sb, rowsById, uid, isAdmin) {
    const container = el('lista');
    if (!container) return;

    container.addEventListener('click', async function (ev) {
      const t = ev.target;
      if (!t || !t.getAttribute) return;
      const action = t.getAttribute('data-action');
      const id = t.getAttribute('data-id');
      if (!action || !id) return;

      const row = rowsById[id];
      if (!row) return;

      if (action === 'edit') {
        const isOwner = row.user_id === uid;
        if (!(isAdmin || isOwner)) {
          showMsg('Você não tem permissão para editar este registro.', true);
          return;
        }
        openModal('Editar concurso', row);
        return;
      }

      if (action === 'delete') {
        if (!isAdmin) {
          showMsg('Somente Admin pode excluir registros.', true);
          return;
        }
        const ok = confirm('Excluir este registro? Esta ação não pode ser desfeita.');
        if (!ok) return;
        showMsg('Excluindo…', false);
        const { error } = await sb.from(TABLE).delete().eq('id', row.id);
        if (error) {
          showMsg(error.message || 'Erro ao excluir.', true);
          return;
        }
        showMsg('Excluído.', false);
        setTimeout(function () {
          showMsg('', false);
        }, 1500);
        await refresh(sb, uid, isAdmin);
      }
    });
  }

  function bindAdminActions(sb) {
    const box = el('admin-users');
    if (!box) return;
    box.addEventListener('change', async function (ev) {
      const t = ev.target;
      if (!t || !t.getAttribute) return;
      const action = t.getAttribute('data-action');
      if (action !== 'role') return;
      const userId = t.getAttribute('data-user-id');
      const cargo = t.value;
      if (!userId) return;
      showMsg('Atualizando cargo…', false);
      const { error } = await sb.from('perfis').update({ cargo: cargo }).eq('user_id', userId);
      if (error) {
        showMsg(error.message || 'Erro ao atualizar cargo.', true);
        return;
      }
      showMsg('Cargo atualizado.', false);
      setTimeout(function () {
        showMsg('', false);
      }, 1500);
    });
  }

  async function refresh(sb, uid, isAdmin) {
    const rows = await loadRows(sb, isAdmin);
    const byId = {};
    rows.forEach(function (r) {
      byId[r.id] = r;
    });
    await renderList(rows, uid, isAdmin);
    return { rows: rows, byId: byId };
  }

  async function init() {
    showMsg('', false);

    const s = await getSession();
    if (!s || s.tipo !== 'supabase') {
      showMsg('Você precisa estar logado para acessar esta página.', true);
      return;
    }
    const uid = s.session.user.id;

    const sb = await getSb();
    if (!sb) {
      showMsg('Supabase indisponível. Verifique js/config.js.', true);
      return;
    }

    const perfil = await getPerfil();
    const cargo = (perfil && perfil.cargo) || 'user';
    const isAdmin = cargo === 'admin';

    const badge = el('role-badge');
    if (badge) {
      badge.textContent = isAdmin ? '👑 Cargo: Admin' : '👤 Cargo: Usuário';
      badge.className = 'role-badge ' + (isAdmin ? 'role-admin' : 'role-user');
    }

    const hint = el('user-hint');
    if (hint) {
      hint.textContent = isAdmin
        ? 'Você pode editar e excluir qualquer registro.'
        : 'Você pode editar apenas seus registros. Excluir é bloqueado.';
    }

    // Admin panel
    const adminBox = el('admin-box');
    if (adminBox) adminBox.hidden = !isAdmin;

    // Bind toolbar
    el('btn-recarregar').addEventListener('click', async function () {
      showMsg('Recarregando…', false);
      try {
        await refresh(sb, uid, isAdmin);
        showMsg('', false);
      } catch (e) {
        showMsg(e.message || 'Erro ao recarregar.', true);
      }
    });

    el('btn-novo').addEventListener('click', function () {
      openModal('Novo concurso', null);
    });

    el('btn-cancelar').addEventListener('click', closeModal);
    el('modal').addEventListener('click', function (ev) {
      if (ev.target && ev.target.id === 'modal') closeModal();
    });

    // Save modal (insert/update)
    el('btn-salvar').addEventListener('click', async function () {
      const id = el('modal').getAttribute('data-id');
      const titulo = el('f-titulo').value.trim();
      const orgao = el('f-orgao').value.trim();
      const status = el('f-status').value;
      const obs = el('f-obs').value.trim();
      if (!titulo) {
        showMsg('Título é obrigatório.', true);
        return;
      }

      showMsg('Salvando…', false);
      const payload = {
        titulo: titulo,
        orgao: orgao || null,
        status: status || 'ativo',
        observacoes: obs || null,
        atualizado_em: new Date().toISOString(),
      };

      let error = null;
      if (id) {
        // update
        const r = await sb.from(TABLE).update(payload).eq('id', id);
        error = r.error;
      } else {
        // insert
        const r = await sb.from(TABLE).insert({ ...payload, user_id: uid });
        error = r.error;
      }

      if (error) {
        showMsg(error.message || 'Erro ao salvar.', true);
        return;
      }

      closeModal();
      showMsg('Salvo.', false);
      setTimeout(function () {
        showMsg('', false);
      }, 1500);
      await refresh(sb, uid, isAdmin);
    });

    // Initial load
    try {
      const pack = await refresh(sb, uid, isAdmin);
      bindListActions(sb, pack.byId, uid, isAdmin);
      if (isAdmin) {
        await renderAdminUsers(sb);
        bindAdminActions(sb);
      }
      showMsg('', false);
    } catch (e) {
      showMsg(e.message || 'Erro ao carregar.', true);
    }
  }

  window.AprovaJaAcompanhados = { init: init };
})(window);

