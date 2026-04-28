-- AprovaJá (Supabase) — Setup para CRUD + cargos (admin/user)
--
-- Rode este arquivo no SQL Editor do Supabase (uma vez).
-- Ele cria/ajusta:
-- - public.perfis: adiciona colunas cargo/email (se não existirem) e policies para admin/usuário
-- - public.concursos_acompanhados: tabela do CRUD + RLS/policies

-- 1) Ajustes na tabela de perfis (role e email)
alter table public.perfis
  add column if not exists cargo text not null default 'user';

alter table public.perfis
  add column if not exists email text;

-- Garante valores consistentes (opcional)
update public.perfis
set cargo = 'user'
where cargo is null or cargo = '';

-- (Re)habilitar RLS (se já estiver habilitado, não muda)
alter table public.perfis enable row level security;

-- Função auxiliar: verifica se o usuário logado é admin (via public.perfis)
create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.perfis p
    where p.user_id = auth.uid()
      and p.cargo = 'admin'
  );
$$;

-- Policies para perfis
drop policy if exists perfis_select_own on public.perfis;
drop policy if exists perfis_select_admin on public.perfis;
drop policy if exists perfis_insert_own on public.perfis;
drop policy if exists perfis_update_own on public.perfis;
drop policy if exists perfis_update_admin on public.perfis;
drop policy if exists perfis_delete_admin on public.perfis;

-- Usuário vê o próprio perfil; admin vê todos
create policy perfis_select_own
  on public.perfis for select
  using (auth.uid() = user_id);

create policy perfis_select_admin
  on public.perfis for select
  using (public.is_admin());

-- Usuário cria seu próprio perfil (normalmente via upsert do front)
create policy perfis_insert_own
  on public.perfis for insert
  with check (auth.uid() = user_id);

-- Usuário atualiza seu próprio perfil
create policy perfis_update_own
  on public.perfis for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Admin atualiza qualquer perfil (inclui trocar cargo)
create policy perfis_update_admin
  on public.perfis for update
  using (public.is_admin())
  with check (public.is_admin());

-- Admin pode deletar perfis (não é necessário para o trabalho; mas mantém consistência)
create policy perfis_delete_admin
  on public.perfis for delete
  using (public.is_admin());


-- 2) CRUD: concursos acompanhados
create table if not exists public.concursos_acompanhados (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  titulo text not null,
  orgao text,
  status text not null default 'ativo', -- ativo | encerrado | aprovado | reprovado (livre)
  observacoes text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

alter table public.concursos_acompanhados enable row level security;

-- Policies para CRUD com hierarquia:
-- - SELECT: usuário vê os próprios; admin vê todos
-- - INSERT: usuário cria só para si mesmo
-- - UPDATE: usuário edita só os próprios; admin edita todos
-- - DELETE: somente admin
drop policy if exists ca_select_own on public.concursos_acompanhados;
drop policy if exists ca_select_admin on public.concursos_acompanhados;
drop policy if exists ca_insert_own on public.concursos_acompanhados;
drop policy if exists ca_update_own on public.concursos_acompanhados;
drop policy if exists ca_update_admin on public.concursos_acompanhados;
drop policy if exists ca_delete_admin on public.concursos_acompanhados;

create policy ca_select_own
  on public.concursos_acompanhados for select
  using (auth.uid() = user_id);

create policy ca_select_admin
  on public.concursos_acompanhados for select
  using (public.is_admin());

create policy ca_insert_own
  on public.concursos_acompanhados for insert
  with check (auth.uid() = user_id);

create policy ca_update_own
  on public.concursos_acompanhados for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy ca_update_admin
  on public.concursos_acompanhados for update
  using (public.is_admin())
  with check (public.is_admin());

create policy ca_delete_admin
  on public.concursos_acompanhados for delete
  using (public.is_admin());

