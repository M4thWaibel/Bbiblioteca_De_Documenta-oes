-- ============================================================
-- Biblioteca de Documentações — Schema completo (estado final)
-- Rode este arquivo no SQL Editor do Supabase para recriar o banco do zero.
-- (Já aplicado no projeto svyegfkpzmderbsdaspm via migrations.)
-- ============================================================

-- ------------------------------------------------------------
-- TABELAS
-- ------------------------------------------------------------
create table if not exists public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  name       text not null default 'Usuário',
  email      text not null default '',
  color      text not null default '#E5484D',
  created_at timestamptz not null default now()
);

create table if not exists public.projects (
  id          uuid primary key default gen_random_uuid(),
  parent_id   uuid references public.projects(id) on delete cascade,
  name        text not null,
  description text not null default 'Sem descrição.',
  color       text not null default '#E5484D',
  owner_id    uuid not null references public.profiles(id) on delete cascade default auth.uid(),
  created_at  timestamptz not null default now()
);
create index if not exists projects_parent_idx on public.projects(parent_id);
create index if not exists projects_owner_idx  on public.projects(owner_id);

create table if not exists public.project_members (
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (project_id, user_id)
);
create index if not exists project_members_user_idx on public.project_members(user_id);

create table if not exists public.documents (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  title       text not null,
  description text not null default 'Sem descrição.',
  category    text not null default 'geral',
  tags        text[] not null default '{}',
  content     text not null default '',
  pinned      boolean not null default false,
  created_by  uuid references public.profiles(id) on delete set null default auth.uid(),
  updated_at  date not null default (now() at time zone 'utc')::date,
  created_at  timestamptz not null default now()
);
create index if not exists documents_project_idx on public.documents(project_id);

-- Atualiza documents.updated_at automaticamente no fuso America/Sao_Paulo.
-- No INSERT sempre define a data; no UPDATE só quando um campo de conteúdo muda
-- (fixar/desafixar não deve alterar "Atualizado em").
create or replace function public.set_document_updated_at()
returns trigger language plpgsql set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    new.updated_at := (now() at time zone 'America/Sao_Paulo')::date;
  elsif tg_op = 'UPDATE' and (
        new.title       is distinct from old.title
     or new.description is distinct from old.description
     or new.category    is distinct from old.category
     or new.tags        is distinct from old.tags
     or new.content     is distinct from old.content
  ) then
    new.updated_at := (now() at time zone 'America/Sao_Paulo')::date;
  end if;
  return new;
end;
$$;

drop trigger if exists documents_set_updated_at on public.documents;
create trigger documents_set_updated_at
  before insert or update on public.documents
  for each row execute function public.set_document_updated_at();

-- ------------------------------------------------------------
-- BUSCA FULL-TEXT (Fase 2 · #4/#10) — configuração 'portuguese'
-- ------------------------------------------------------------
-- Coluna tsvector mantida por trigger. (Coluna GERADA foi rejeitada: a
-- resolução do regconfig em to_tsvector não é considerada "immutable".)
alter table public.documents add column if not exists content_tsv tsvector;

create or replace function public.documents_tsv_refresh()
returns trigger language plpgsql set search_path = public as $$
begin
  new.content_tsv := to_tsvector(
    'portuguese',
    coalesce(new.title, '') || ' ' ||
    coalesce(new.description, '') || ' ' ||
    coalesce(array_to_string(new.tags, ' '), '') || ' ' ||
    coalesce(new.content, '')
  );
  return new;
end;
$$;

drop trigger if exists documents_tsv_refresh on public.documents;
create trigger documents_tsv_refresh
  before insert or update on public.documents
  for each row execute function public.documents_tsv_refresh();

-- Backfill dos documentos existentes (no-op num banco recém-criado).
update public.documents set content_tsv = to_tsvector(
  'portuguese',
  coalesce(title, '') || ' ' ||
  coalesce(description, '') || ' ' ||
  coalesce(array_to_string(tags, ' '), '') || ' ' ||
  coalesce(content, '')
);

create index if not exists documents_content_tsv_idx
  on public.documents using gin (content_tsv);

-- RPC de busca: SECURITY INVOKER (RLS do usuário se aplica), devolve trecho
-- destacado (marcadores « » convertidos em <mark> com escape no cliente) e rank.
create or replace function public.search_documents(q text)
returns table (
  id uuid,
  project_id uuid,
  title text,
  description text,
  category text,
  tags text[],
  pinned boolean,
  updated_at date,
  headline text,
  rank real
)
language sql stable security invoker set search_path = public as $$
  select
    d.id, d.project_id, d.title, d.description, d.category, d.tags, d.pinned, d.updated_at,
    ts_headline(
      'portuguese', coalesce(d.content, ''),
      websearch_to_tsquery('portuguese', q),
      'StartSel=«,StopSel=»,MaxFragments=2,MinWords=6,MaxWords=22,ShortWord=2'
    ) as headline,
    ts_rank(d.content_tsv, websearch_to_tsquery('portuguese', q)) as rank
  from public.documents d
  where length(btrim(coalesce(q, ''))) > 0
    and d.content_tsv @@ websearch_to_tsquery('portuguese', q)
  order by rank desc, d.updated_at desc
  limit 50;
$$;
grant execute on function public.search_documents(text) to authenticated;

create table if not exists public.tasks (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid references public.projects(id) on delete set null,
  title       text not null,
  description text not null default '',
  status      text not null default 'todo', -- id de task_statuses (customizável, Update 2.0 #3)
  priority    text not null default 'med'  check (priority in ('low','med','high')),
  created_by  uuid references public.profiles(id) on delete set null default auth.uid(),
  created_at  timestamptz not null default now(),
  position    double precision,
  due_date    date
);
create index if not exists tasks_project_idx on public.tasks(project_id);
create index if not exists tasks_creator_idx on public.tasks(created_by);
create index if not exists tasks_position_idx on public.tasks(status, position);

create table if not exists public.task_assignees (
  task_id uuid not null references public.tasks(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  primary key (task_id, user_id)
);

create table if not exists public.task_refs (
  id             uuid primary key default gen_random_uuid(),
  task_id        uuid not null references public.tasks(id) on delete cascade,
  doc_id         uuid references public.documents(id) on delete cascade,
  ref_project_id uuid references public.projects(id) on delete cascade,
  constraint task_ref_one_target check (
    (doc_id is not null)::int + (ref_project_id is not null)::int = 1
  )
);
create unique index if not exists task_refs_doc_uniq  on public.task_refs(task_id, doc_id)         where doc_id is not null;
create unique index if not exists task_refs_proj_uniq on public.task_refs(task_id, ref_project_id) where ref_project_id is not null;
create index if not exists task_refs_task_idx on public.task_refs(task_id);

-- ------------------------------------------------------------
-- FUNÇÕES AUXILIARES (schema privado, não exposto pela API PostgREST)
-- ------------------------------------------------------------
create schema if not exists private;
grant usage on schema private to authenticated, service_role;

create or replace function private.is_project_member(pid uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.project_members m
    where m.project_id = pid and m.user_id = auth.uid()
  );
$$;

create or replace function private.is_project_owner(pid uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (
    select 1 from public.projects p
    where p.id = pid and p.owner_id = auth.uid()
  );
$$;

create or replace function private.can_access_task(_task_id uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select
    exists (select 1 from public.tasks t where t.id = _task_id and t.created_by = auth.uid())
    or exists (
      select 1 from public.tasks t
      where t.id = _task_id and t.project_id is not null and private.is_project_member(t.project_id)
    )
    or exists (
      select 1 from public.task_refs r
      left join public.documents d on d.id = r.doc_id
      where r.task_id = _task_id
        and (private.is_project_member(r.ref_project_id) or private.is_project_member(d.project_id))
    );
$$;

revoke all on function private.is_project_member(uuid) from public;
revoke all on function private.is_project_owner(uuid) from public;
revoke all on function private.can_access_task(uuid) from public;
grant execute on function private.is_project_member(uuid) to authenticated;
grant execute on function private.is_project_owner(uuid) to authenticated;
grant execute on function private.can_access_task(uuid) to authenticated;

-- ------------------------------------------------------------
-- TRIGGER: cria o perfil automaticamente no signup
-- ------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, name, color)
  values (
    new.id,
    new.email,
    coalesce(
      nullif(new.raw_user_meta_data->>'name', ''),
      initcap(replace(replace(split_part(new.email, '@', 1), '.', ' '), '_', ' '))
    ),
    coalesce(nullif(new.raw_user_meta_data->>'color', ''), '#E5484D')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
revoke all on function public.handle_new_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ------------------------------------------------------------
-- RLS
-- ------------------------------------------------------------
alter table public.profiles        enable row level security;
alter table public.projects        enable row level security;
alter table public.project_members enable row level security;
alter table public.documents       enable row level security;
alter table public.tasks           enable row level security;
alter table public.task_assignees  enable row level security;
alter table public.task_refs       enable row level security;

-- PROFILES
create policy "profiles_select_all" on public.profiles for select to authenticated using (true);
create policy "profiles_insert_self" on public.profiles for insert to authenticated with check (id = auth.uid());
create policy "profiles_update_self" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- PROJECTS
create policy "projects_select_member" on public.projects for select to authenticated
  using (private.is_project_member(id) or owner_id = auth.uid());
create policy "projects_insert_own" on public.projects for insert to authenticated
  with check (owner_id = auth.uid() and (parent_id is null or private.is_project_member(parent_id)));
create policy "projects_update_member" on public.projects for update to authenticated
  using (private.is_project_member(id)) with check (private.is_project_member(id));
create policy "projects_delete_owner" on public.projects for delete to authenticated
  using (owner_id = auth.uid());

-- PROJECT MEMBERS
create policy "members_select" on public.project_members for select to authenticated
  using (private.is_project_member(project_id) or private.is_project_owner(project_id));
create policy "members_insert" on public.project_members for insert to authenticated
  with check (private.is_project_owner(project_id) or private.is_project_member(project_id));
create policy "members_delete" on public.project_members for delete to authenticated
  using (private.is_project_owner(project_id) or user_id = auth.uid());

-- DOCUMENTS
create policy "documents_select" on public.documents for select to authenticated using (private.is_project_member(project_id));
create policy "documents_insert" on public.documents for insert to authenticated with check (private.is_project_member(project_id));
create policy "documents_update" on public.documents for update to authenticated
  using (private.is_project_member(project_id)) with check (private.is_project_member(project_id));
create policy "documents_delete" on public.documents for delete to authenticated using (private.is_project_member(project_id));

-- TASKS  (o predicado direto created_by = auth.uid() é necessário para o INSERT ... RETURNING)
create policy "tasks_select" on public.tasks for select to authenticated
  using (created_by = auth.uid() or private.can_access_task(id));
create policy "tasks_insert_own" on public.tasks for insert to authenticated with check (created_by = auth.uid());
create policy "tasks_update" on public.tasks for update to authenticated
  using (private.can_access_task(id)) with check (private.can_access_task(id));
create policy "tasks_delete" on public.tasks for delete to authenticated using (private.can_access_task(id));

-- TASK ASSIGNEES
create policy "assignees_select" on public.task_assignees for select to authenticated using (private.can_access_task(task_id));
create policy "assignees_insert" on public.task_assignees for insert to authenticated with check (private.can_access_task(task_id));
create policy "assignees_delete" on public.task_assignees for delete to authenticated using (private.can_access_task(task_id));

-- TASK REFS
create policy "refs_select" on public.task_refs for select to authenticated using (private.can_access_task(task_id));
create policy "refs_insert" on public.task_refs for insert to authenticated with check (private.can_access_task(task_id));
create policy "refs_delete" on public.task_refs for delete to authenticated using (private.can_access_task(task_id));

-- ------------------------------------------------------------
-- TASK ITEMS (Update 2.0 · #5) — checklist interno das tarefas
-- ------------------------------------------------------------
create table if not exists public.task_items (
  id         uuid primary key default gen_random_uuid(),
  task_id    uuid not null references public.tasks(id) on delete cascade,
  text       text not null,
  done       boolean not null default false,
  position   double precision not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists task_items_task_idx on public.task_items(task_id);

alter table public.task_items enable row level security;
create policy "task_items_select" on public.task_items for select to authenticated using (private.can_access_task(task_id));
create policy "task_items_insert" on public.task_items for insert to authenticated with check (private.can_access_task(task_id));
create policy "task_items_update" on public.task_items for update to authenticated using (private.can_access_task(task_id)) with check (private.can_access_task(task_id));
create policy "task_items_delete" on public.task_items for delete to authenticated using (private.can_access_task(task_id));

-- ------------------------------------------------------------
-- CATEGORIES (Update 2.0 · #1/#6b) — categorias globais customizáveis
-- documents.category guarda o id (slug); categorias desconhecidas caem em 'geral' na UI.
-- ------------------------------------------------------------
create table if not exists public.categories (
  id         text primary key,
  label      text not null,
  icon       text not null default 'description',
  color      text not null default '#e5484d',
  position   double precision not null default 0,
  created_at timestamptz not null default now()
);

alter table public.categories enable row level security;
create policy "categories_select" on public.categories for select to authenticated using (true);
create policy "categories_insert" on public.categories for insert to authenticated with check (true);
create policy "categories_update" on public.categories for update to authenticated using (true) with check (true);
create policy "categories_delete" on public.categories for delete to authenticated using (true);

insert into public.categories (id, label, icon, color, position) values
  ('dados','Dados','dataset','#64B5F6',1000),
  ('rmr','Reuniões (RMR)','event_note','#FF7A7E',2000),
  ('selo','Selo EAP','verified','#81C784',3000),
  ('powerbi','Power BI','insert_chart','#A78BFA',4000),
  ('pesquisas','Pesquisas','poll','#4DD0E1',5000),
  ('indicadores','Indicadores','trending_up','#81C784',6000),
  ('organograma','Organograma','account_tree','#64B5F6',7000),
  ('geral','Geral','description','#FF7A7E',8000)
on conflict (id) do nothing;

-- ------------------------------------------------------------
-- TASK STATUSES (Update 2.0 · #3) — colunas do quadro customizáveis
-- tasks.status guarda o id (slug). 'todo' e 'done' são âncoras (não excluir).
-- ------------------------------------------------------------
create table if not exists public.task_statuses (
  id         text primary key,
  label      text not null,
  color      text not null default '#a0a0a0',
  position   double precision not null default 0,
  created_at timestamptz not null default now()
);

alter table public.task_statuses enable row level security;
create policy "task_statuses_select" on public.task_statuses for select to authenticated using (true);
create policy "task_statuses_insert" on public.task_statuses for insert to authenticated with check (true);
create policy "task_statuses_update" on public.task_statuses for update to authenticated using (true) with check (true);
create policy "task_statuses_delete" on public.task_statuses for delete to authenticated using (true);

insert into public.task_statuses (id, label, color, position) values
  ('todo','A fazer','#A0A0A0',1000),
  ('doing','Em andamento','#E5484D',2000),
  ('review','Em revisão','#E6A800',3000),
  ('done','Concluído','#1F8A5B',4000)
on conflict (id) do nothing;

-- ------------------------------------------------------------
-- REALTIME (Fase 3 · #5) — publica mudanças das tabelas do app.
-- O Realtime aplica o RLS por usuário nos eventos entregues.
-- ------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array['documents','tasks','projects','project_members','task_assignees','task_refs','task_items','categories','task_statuses']
  loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;
