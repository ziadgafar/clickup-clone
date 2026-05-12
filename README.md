# MyPM — Project Management App

A full-stack project management web application inspired by ClickUp. Built with a RESTful Node.js/Express backend, normalized PostgreSQL database, and a React frontend featuring Kanban boards and drag-and-drop task management.

---

## Features

- **Kanban Board** — Drag-and-drop tasks across status columns per project
- **Task Management** — Create, assign, prioritize, and track tasks with due dates
- **Comments** — Per-task comment threads for team collaboration
- **Tags** — Label and filter tasks with custom tags
- **File Attachments** — Upload and manage files directly on tasks
- **Project Members** — Role-based membership per project
- **Client Management** — Associate projects with clients including contact info
- **User Authentication** — Register, login, and role-based access

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite, Tailwind CSS, React Router |
| Drag & Drop | @dnd-kit/react |
| HTTP Client | Axios |
| Backend | Node.js, Express 5 |
| Database | PostgreSQL |
| Dev Tools | Nodemon, ESLint |

---

## Project Structure

```
clickup-clone/
├── backend/
│   ├── routes/
│   │   ├── users.js
│   │   ├── projects.js
│   │   ├── tasks.js
│   │   ├── clients.js
│   │   ├── members.js
│   │   ├── tags.js
│   │   ├── comments.js
│   │   └── attachments.js
│   ├── db.js
│   └── server.js
├── frontend/
│   └── src/
│       ├── pages/
│       │   ├── Dashboard.jsx
│       │   ├── Projects.jsx
│       │   ├── ProjectDetail.jsx
│       │   ├── Clients.jsx
│       │   ├── Users.jsx
│       │   ├── Login.jsx
│       │   └── Register.jsx
│       └── components/
│           ├── KanbanBoard.jsx
│           ├── TaskDetailModal.jsx
│           ├── CreateTaskModal.jsx
│           ├── CreateProjectModal.jsx
│           └── ...
└── database/
    └── schema.sql
```

---

## Database Schema

9 relational tables with cascading foreign key constraints:

`users` → `projects` → `tasks` → `comments`  
`projects` → `project_members`  
`tasks` → `task_tags` → `tags`  
`tasks` → `attachments`  
`projects` → `clients`

---

## Getting Started

### Prerequisites

- Node.js v18+
- PostgreSQL

### 1. Database Setup

```bash
psql -U postgres -c "CREATE DATABASE mypm;"
psql -U postgres -d mypm -f database/schema.sql
```

### 2. Backend

```bash
cd backend
npm install
```

Create a `.env` file:

```env
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/mypm
PORT=5000
```

```bash
npm run dev
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

App runs at `http://localhost:5173`  
API runs at `http://localhost:5000`

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/users/register` | Register a new user |
| POST | `/api/users/login` | Login |
| GET | `/api/projects` | Get all projects |
| POST | `/api/projects` | Create a project |
| GET | `/api/projects/:id/tasks` | Get tasks for a project |
| POST | `/api/projects/:id/tasks` | Create a task |
| GET | `/api/tasks/:id/comments` | Get comments on a task |
| POST | `/api/tasks/:id/comments` | Add a comment |
| POST | `/api/tasks/:id/attachments` | Upload an attachment |
| GET | `/api/clients` | Get all clients |
| GET | `/api/tags` | Get all tags |

---

## License

MIT
