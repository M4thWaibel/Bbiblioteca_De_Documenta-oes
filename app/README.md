# Biblioteca de Documentações

Base de conhecimento pessoal com **projetos + subprojetos**, **biblioteca de documentos em Markdown** (busca, filtros, fixar, TOC) e **quadro de tarefas Kanban** com drag & drop. Reconstrução 100% funcional do design, com backend real em **Supabase** (Postgres + Auth + Row Level Security).

- **Frontend:** React 18 + TypeScript + Vite (estilos idênticos ao design — IBM Plex Mono, tema vermelho, Material Symbols; tema claro/escuro).
- **Backend / Banco:** Supabase — autenticação por e-mail/senha, Postgres com RLS por projeto, trigger que cria o perfil no cadastro.

---

## 1. Rodar localmente

```bash
cd app
npm install
npm run dev
```

Abra <http://localhost:5173>. As credenciais do Supabase já estão em `.env.local` (projeto `biblioteca-documentacoes`).

Scripts:

| comando | o que faz |
|---|---|
| `npm run dev` | servidor de desenvolvimento (Vite) |
| `npm run build` | typecheck + build de produção em `dist/` |
| `npm run preview` | serve o build de produção localmente |
| `npm run typecheck` | apenas checagem de tipos |

---

## 2. Configuração do Supabase

O banco **já está criado e configurado** (tabelas, RLS, trigger de perfil). Projeto: `svyegfkpzmderbsdaspm` · região `sa-east-1`.

### Confirmação de e-mail (importante)

Por padrão o Supabase exige **confirmação de e-mail** antes do primeiro login. Com isso ligado, ao se cadastrar o app mostra "confirme seu e-mail" e o usuário precisa clicar no link recebido antes de entrar.

Para permitir **login imediato após o cadastro** (como no design original), desligue a confirmação:

1. Painel do Supabase → **Authentication** → **Providers** → **Email**
2. Desative **"Confirm email"** e salve.

> O app funciona nas duas configurações — apenas o fluxo de cadastro muda.

### Recriar o banco do zero (opcional)

Se quiser recriar em outro projeto Supabase, rode `supabase/schema.sql` no **SQL Editor** e atualize `.env.local` com a URL e a chave `publishable` do novo projeto (Project Settings → API).

---

## 3. Modelo de dados

| tabela | descrição |
|---|---|
| `profiles` | perfil do usuário (id = `auth.users.id`, nome, e-mail, cor) — criado automaticamente no cadastro |
| `projects` | projetos e subprojetos (`parent_id` aponta para o projeto pai) |
| `project_members` | quem tem acesso a cada projeto |
| `documents` | documentos Markdown (categoria, tags, fixado, conteúdo) |
| `tasks` | tarefas do quadro (status, prioridade) |
| `task_assignees` | responsáveis por tarefa |
| `task_refs` | vínculos de tarefa a documento **ou** projeto |

**Segurança (RLS):** cada usuário só enxerga projetos dos quais é membro e os documentos/tarefas relacionados. As checagens de permissão usam funções `SECURITY DEFINER` num schema `private` (não exposto pela API), evitando recursão de políticas e acesso indevido. O advisor de segurança do Supabase passa sem alertas.

---

## 4. Deploy (produção)

O frontend é estático — publique em **Vercel**, **Netlify**, **Cloudflare Pages** etc.

**Vercel/Netlify:**
- **Root directory:** `app`
- **Build command:** `npm run build`
- **Output directory:** `dist`
- **Environment variables:**
  - `VITE_SUPABASE_URL` = `https://svyegfkpzmderbsdaspm.supabase.co`
  - `VITE_SUPABASE_ANON_KEY` = a chave publishable (mesma do `.env.local`)

Depois do deploy, no Supabase adicione a URL de produção em **Authentication → URL Configuration → Redirect URLs** e **Site URL**.

> A chave usada no frontend é a **publishable/anon** — segura para o navegador. Toda a proteção real dos dados é feita pelo RLS no banco. Nunca exponha a `service_role`.

---

## 5. Estrutura do projeto

```
app/
├── index.html
├── src/
│   ├── main.tsx                # bootstrap React + AuthProvider
│   ├── App.tsx                 # gate de auth, tema, roteamento de views, modais
│   ├── context/AuthContext.tsx # sessão Supabase (login/cadastro/logout)
│   ├── store/useStore.ts       # estado global + ações (CRUD via Supabase)
│   ├── lib/
│   │   ├── supabase.ts         # cliente Supabase
│   │   ├── api.ts              # queries e mutações (mapeamento banco ↔ domínio)
│   │   ├── types.ts            # tipos de domínio
│   │   ├── constants.ts        # categorias, prioridades, colunas, cores
│   │   ├── format.ts           # avatar, datas, iniciais, tempo de leitura
│   │   └── markdown.ts         # renderizador Markdown + TOC + realce de busca
│   ├── components/
│   │   ├── AuthScreen.tsx      # login / cadastro
│   │   ├── Header.tsx          # topo (breadcrumb, navegação, perfil, tema)
│   │   ├── ProjectsView.tsx    # grade de projetos
│   │   ├── LibraryView.tsx     # biblioteca (busca, filtros, leitor, TOC)
│   │   ├── BoardView.tsx       # quadro Kanban (drag & drop)
│   │   ├── MarkdownArticle.tsx # artigo renderizado
│   │   ├── modals/             # ProjectModal, UploadModal, MembersModal, TaskModal
│   │   └── ui/                 # Icon, Hoverable, estilos compartilhados
│   └── styles/global.css       # tokens de design + tema claro/escuro
└── supabase/schema.sql         # schema completo (tabelas + RLS + trigger)
```

---

## 6. Funcionalidades

- **Autenticação** por e-mail/senha (Supabase Auth) com sessão persistente.
- **Projetos e subprojetos** com cor, membros e contagens.
- **Membros por projeto** — adicionar/remover usuários registrados (com papel de dono).
- **Documentos Markdown** — upload de `.md` (arrastar ou selecionar), categoria, tags, fixar, copiar, baixar, excluir.
- **Leitor** com sumário "Nesta página" (TOC), rolagem suave e realce das ocorrências da busca.
- **Busca e filtros** por texto, categoria e tag, com contagem de ocorrências.
- **Quadro Kanban** independente das documentações: 4 colunas, prioridades, responsáveis, referências a documentos/projetos e **drag & drop** entre colunas.
- **Tema claro/escuro** (alternável no topo).
