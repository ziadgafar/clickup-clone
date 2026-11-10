# PSD Task Manager

Small-team project manager (Kanban boards, tasks, comments, tags, clients). A single React app on Vercel that talks to Supabase directly: Postgres for data, Supabase Auth for logins, and row-level security for access control. There is no separate backend.

## Stack

React 19 · Vite · Tailwind 4 · React Router · @dnd-kit · Supabase (`@supabase/supabase-js`) · Vercel

## Setup

### 1. Supabase

1. Create a project, open the **SQL Editor**, and run [`supabase/schema.sql`](supabase/schema.sql).
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

Import the repo. Framework preset: **Vite**. Add the `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` env vars, then deploy. `vercel.json` handles SPA routing.

## Roles

| Role | Can |
|---|---|
| member | everything with projects, tasks, clients, and comments; edit own profile, email, and password; delete own comments |
| manager | same as member (sign-up can pick manager or member) |
| admin | also change roles, edit anyone's name, delete users, and delete any comment |

Admin can only be granted via SQL.
