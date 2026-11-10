# PSD Task Manager

Small-team project manager (Kanban boards, tasks, comments, tags, clients). A single React app on Vercel that talks to Supabase directly: Postgres for data, Supabase Auth for logins, and row-level security for access control. There is no separate backend.

## Stack

React 19 · Vite · Tailwind 4 · React Router · @dnd-kit · Supabase (`@supabase/supabase-js`) · Vercel

## Setup

### 1. Supabase

1. Create a project, open the **SQL Editor**, and run [`supabase/schema.sql`](supabase/schema.sql), then [`supabase/002_claude_access.sql`](supabase/002_claude_access.sql), then [`supabase/003_archive_no_dates.sql`](supabase/003_archive_no_dates.sql).
2. Under **Authentication → Providers → Email**, you may want to turn off "Confirm email" for a 4-person team.
3. Have everyone sign up through the app, then **disable new signups** (Authentication → Settings) so nobody else can register.
4. Make yourself admin:
   ```sql
   update profiles set role = 'admin' where email = 'you@example.com';
   ```

### 2. Local dev

```bash
cp .env.example .env   # fill in Project URL + anon/publishable key (Project Settings → API)
npm install
npm run dev
```

### 3. Vercel

Import the repo. Framework preset: **Vite**. Add these env vars, then deploy:

- `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`: used by the web app
- `SUPABASE_SERVICE_ROLE_KEY`: server-only, used by `/api/mcp` (Project Settings → API Keys → secret / service_role). Never prefix it with `VITE_`.

`vercel.json` sends every path except `/api/*` to the SPA. Locally, `npm run dev` serves only the UI; use `npx vercel dev` to also run `/api/mcp`.

## Roles

| Role | Can |
|---|---|
| member | everything with projects, tasks, clients, and comments; edit own profile, email, and password; delete own comments |
| manager | same as member (sign-up can pick manager or member) |
| admin | also change roles, edit anyone's name, delete users, and delete any comment |

Admin can only be granted via SQL.

## Claude access (MCP)

Each person opens **Connect Claude** in the app, generates a personal token, and pastes the command shown into Claude Code, or the URL into claude.ai / the Claude app as a custom connector. Their Claude can then list projects, team members and tags; list, create and update tasks; comment; and create projects. It acts as that user. It cannot delete anything.

The server is [`api/mcp.js`](api/mcp.js): stateless MCP over HTTP with JSON-RPC, token checked against a SHA-256 hash in `api_tokens`. Offline check: `node scripts/mcp.check.js`.

## Visible pages

Only Projects, tasks (inside a project) and Connect Claude are visible. Team is admin-only. Home, Dashboard and Clients are hidden but kept in `src/pages`; re-add their routes in `src/App.jsx` to bring them back.
