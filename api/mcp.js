// MCP server (Streamable HTTP, stateless, JSON responses) so teammates' Claude can manage tasks.
// Auth: personal token from the /connect page, as "Authorization: Bearer psd_..." or ?token=psd_...
// Runs with the service role key, so every tool below scopes writes to the token's user itself.
import { createClient } from "@supabase/supabase-js";
import { createHash } from "node:crypto";

const STATUSES = ["todo", "in_progress", "blocked", "review", "done"];
const PRIORITIES = ["low", "medium", "high"];
const TASK_COLS =
  "id, project_id, title, description, status, priority, archived, created_at, assignee:profiles!tasks_assigned_to_fkey(name, email), tags(name)";

const taskFields = {
  title: { type: "string" },
  description: { type: "string" },
  status: { type: "string", enum: STATUSES },
  priority: { type: "string", enum: PRIORITIES },
  assignee_email: { type: "string", description: "Team member email; see list_team" },
  tags: { type: "array", items: { type: "string" }, description: "Existing tag names; replaces current tags" },
};

const TOOLS = [
  { name: "list_projects", description: "List all projects.", inputSchema: { type: "object", properties: {} } },
  { name: "list_team", description: "List team members (for assigning tasks).", inputSchema: { type: "object", properties: {} } },
  { name: "list_tags", description: "List available task tags.", inputSchema: { type: "object", properties: {} } },
  {
    name: "list_tasks",
    description: "List active tasks, optionally filtered by project, status, or only those assigned to me. Archived tasks are hidden unless include_archived.",
    inputSchema: {
      type: "object",
      properties: {
        project_id: { type: "integer" },
        status: { type: "string", enum: STATUSES },
        mine: { type: "boolean", description: "Only tasks assigned to me" },
        include_archived: { type: "boolean", description: "Also return archived tasks" },
      },
    },
  },
  {
    name: "get_task",
    description: "Get one task with its comments.",
    inputSchema: { type: "object", properties: { task_id: { type: "integer" } }, required: ["task_id"] },
  },
  {
    name: "create_task",
    description: "Create a task in a project. Defaults: status todo, priority medium.",
    inputSchema: {
      type: "object",
      properties: { project_id: { type: "integer" }, ...taskFields },
      required: ["project_id", "title"],
    },
  },
  {
    name: "update_task",
    description: "Update fields of a task. Only provided fields change. assignee_email \"\" unassigns.",
    inputSchema: {
      type: "object",
      properties: {
        task_id: { type: "integer" },
        ...taskFields,
        archived: { type: "boolean", description: "true hides the task from the board; false restores it" },
      },
      required: ["task_id"],
    },
  },
  {
    name: "add_comment",
    description: "Comment on a task as me.",
    inputSchema: {
      type: "object",
      properties: { task_id: { type: "integer" }, content: { type: "string" } },
      required: ["task_id", "content"],
    },
  },
  {
    name: "create_project",
    description: "Create an internal project owned by me (status planning).",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string" },
        description: { type: "string" },
        priority: { type: "string", enum: PRIORITIES },
      },
      required: ["name"],
    },
  },
];

async function q(query) {
  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data;
}

async function userIdByEmail(db, email) {
  if (email === "") return null;
  const rows = await q(db.from("profiles").select("id").ilike("email", email));
  if (!rows.length) throw new Error(`No team member with email ${email}. Use list_team.`);
  return rows[0].id;
}

async function tagIdsByName(db, names) {
  const all = await q(db.from("tags").select("id, name"));
  return names.map((n) => {
    const tag = all.find((t) => t.name.toLowerCase() === n.toLowerCase());
    if (!tag) throw new Error(`Unknown tag "${n}". Available: ${all.map((t) => t.name).join(", ")}`);
    return tag.id;
  });
}

async function setTags(db, taskId, names) {
  const ids = await tagIdsByName(db, names);
  await q(db.from("task_tags").delete().eq("task_id", taskId));
  if (ids.length) await q(db.from("task_tags").insert(ids.map((tag_id) => ({ task_id: taskId, tag_id }))));
}

function check(args) {
  if (args.status !== undefined && !STATUSES.includes(args.status)) throw new Error(`status must be one of ${STATUSES}`);
  if (args.priority !== undefined && !PRIORITIES.includes(args.priority)) throw new Error(`priority must be one of ${PRIORITIES}`);
}

const taskById = (db, id) => q(db.from("tasks").select(TASK_COLS).eq("id", id).single());

const handlers = {
  list_projects: (db) =>
    q(db.from("projects").select("id, name, description, status, priority").order("id")),
  list_team: (db) => q(db.from("profiles").select("name, email, role").order("name")),
  list_tags: (db) => q(db.from("tags").select("name").order("name")),

  list_tasks: (db, a, userId) => {
    let query = db.from("tasks").select(TASK_COLS).order("id");
    if (a.project_id) query = query.eq("project_id", a.project_id);
    if (a.status) query = query.eq("status", a.status);
    if (a.mine) query = query.eq("assigned_to", userId);
    if (!a.include_archived) query = query.eq("archived", false);
    return q(query);
  },

  get_task: (db, a) =>
    q(
      db
        .from("tasks")
        .select(`${TASK_COLS}, comments(content, created_at, author:profiles(name))`)
        .eq("id", a.task_id)
        .single(),
    ),

  create_task: async (db, a, userId) => {
    check(a);
    const task = await q(
      db
        .from("tasks")
        .insert({
          project_id: a.project_id,
          title: a.title,
          description: a.description ?? null,
          status: a.status ?? "todo",
          priority: a.priority ?? "medium",
          assigned_to: a.assignee_email ? await userIdByEmail(db, a.assignee_email) : null,
          created_by: userId,
        })
        .select("id")
        .single(),
    );
    if (a.tags?.length) await setTags(db, task.id, a.tags);
    return taskById(db, task.id);
  },

  update_task: async (db, a) => {
    check(a);
    const patch = {};
    for (const k of ["title", "description", "status", "priority", "archived"]) if (a[k] !== undefined) patch[k] = a[k];
    if (a.assignee_email !== undefined) patch.assigned_to = await userIdByEmail(db, a.assignee_email);
    if (Object.keys(patch).length) {
      const rows = await q(db.from("tasks").update(patch).eq("id", a.task_id).select("id"));
      if (!rows.length) throw new Error(`Task ${a.task_id} not found`);
    }
    if (a.tags) await setTags(db, a.task_id, a.tags);
    return taskById(db, a.task_id);
  },

  add_comment: (db, a, userId) =>
    q(db.from("comments").insert({ task_id: a.task_id, content: a.content, user_id: userId }).select().single()),

  create_project: (db, a, userId) =>
    q(
      db
        .from("projects")
        .insert({
          name: a.name,
          description: a.description ?? null,
          priority: a.priority ?? "medium",
          status: "planning",
          type: "internal",
          owner_id: userId,
        })
        .select()
        .single(),
    ),
};

// One JSON-RPC message -> response object, or null for notifications.
export async function rpc(msg, db, userId) {
  const reply = (result) => ({ jsonrpc: "2.0", id: msg.id, result });
  if (msg.id === undefined || msg.id === null) return null;

  switch (msg.method) {
    case "initialize":
      return reply({
        protocolVersion: msg.params?.protocolVersion ?? "2025-06-18",
        capabilities: { tools: {} },
        serverInfo: { name: "psd-task-manager", version: "1.0.0" },
        instructions: "Task manager for the PSD team. Use list_projects/list_team first to find ids and emails.",
      });
    case "ping":
      return reply({});
    case "tools/list":
      return reply({ tools: TOOLS });
    case "tools/call": {
      const { name, arguments: args = {} } = msg.params ?? {};
      const fn = handlers[name];
      if (!fn) return { jsonrpc: "2.0", id: msg.id, error: { code: -32602, message: `Unknown tool ${name}` } };
      try {
        const data = await fn(db, args, userId);
        return reply({ content: [{ type: "text", text: JSON.stringify(data, null, 2) }] });
      } catch (e) {
        return reply({ content: [{ type: "text", text: e.message }], isError: true });
      }
    }
    default:
      return { jsonrpc: "2.0", id: msg.id, error: { code: -32601, message: `Method not found: ${msg.method}` } };
  }
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).setHeader("Allow", "POST").end();

  const token = (req.headers.authorization ?? "").replace(/^Bearer\s+/i, "") || req.query.token;
  if (!token) return res.status(401).json({ error: "Missing token. Get one at /connect." });

  const db = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
  const hash = createHash("sha256").update(token).digest("hex");
  const { data: row } = await db.from("api_tokens").select("user_id").eq("token_hash", hash).maybeSingle();
  if (!row) return res.status(401).json({ error: "Invalid token. Generate a new one at /connect." });

  const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  if (Array.isArray(body)) {
    const out = (await Promise.all(body.map((m) => rpc(m, db, row.user_id)))).filter(Boolean);
    return out.length ? res.status(200).json(out) : res.status(202).end();
  }
  const out = await rpc(body, db, row.user_id);
  return out ? res.status(200).json(out) : res.status(202).end();
}
