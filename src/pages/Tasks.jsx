import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { supabase, q } from "../supabase";
import { useAuth } from "../context/AuthContext";
import KanbanBoard from "../components/KanbanBoard";
import AssigneePicker from "../components/AssigneePicker";
import CreateTaskModal from "../components/CreateTaskModal";
import CreateProjectModal from "../components/CreateProjectModal";
import EditProjectModal from "../components/EditProjectModal";

// One page for everything: /projects shows tasks across all projects,
// /projects/:id narrows to one project.
export default function Tasks() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [people, setPeople] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [archived, setArchived] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null); // "task" | "project" | "edit"
  const [showArchived, setShowArchived] = useState(false);

  // filters live in the URL so they survive switching projects and can be linked to
  const [params, setParams] = useSearchParams();
  const assignee = params.get("assignee") ?? user.name; // default: my tasks
  const created = params.get("created") || "";
  const setParam = (key) => (e) => {
    const next = new URLSearchParams(params);
    next.set(key, e.target?.value ?? e);
    setParams(next, { replace: true });
  };

  const project = projects.find((p) => String(p.id) === id);
  const canManage = user.role === "admin" || user.role === "manager";

  const fetchProjects = () =>
    q(supabase.from("projects").select("*").order("name"))
      .then(setProjects)
      .catch(() => setProjects([]));

  const fetchTasks = async () => {
    try {
      let query = supabase
        .from("tasks")
        .select(
          "*, assignee:profiles!tasks_assigned_to_fkey(name), tags(id, name), project:projects(name)",
        )
        .order("id");
      if (id) query = query.eq("project_id", id);
      const rows = (await q(query)).map((t) => ({
        ...t,
        assignee: t.assignee?.name,
        project: id ? null : t.project?.name, // label cards only when mixing projects
      }));
      setTasks(rows.filter((t) => !t.archived));
      setArchived(rows.filter((t) => t.archived));
    } catch {
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
    q(supabase.from("profiles").select("name").eq("approved", true).order("name"))
      .then((u) => setPeople(u.map((x) => x.name)))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [id]);

  const deleteProject = async () => {
    if (!window.confirm(`Delete "${project.name}" and all its tasks?`)) return;
    try {
      await q(supabase.from("projects").delete().eq("id", project.id));
      await fetchProjects();
      navigate(`/projects?${params}`);
    } catch {
      alert("Failed to delete project.");
    }
  };

  const since = !created
    ? 0
    : created === "today"
      ? new Date().setHours(0, 0, 0, 0)
      : Date.now() - created * 864e5;
  const visible = (t) =>
    (!assignee || (assignee === "-" ? !t.assignee : t.assignee === assignee)) &&
    new Date(t.created_at) >= since;

  const field =
    "px-3 py-2 border border-neutral-200 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 dark:text-white text-sm flex-1 sm:flex-none";
  const ghost =
    "px-4 py-2 border border-neutral-200 dark:border-neutral-600 text-neutral-600 dark:text-neutral-300 font-bold rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-all cursor-pointer";
  const small =
    "text-xs font-bold text-neutral-500 hover:text-black dark:hover:text-white cursor-pointer";

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="min-w-0">
          <div className="flex items-center gap-4">
            <select
              value={id || ""}
              onChange={(e) =>
                navigate(`/projects${e.target.value ? `/${e.target.value}` : ""}?${params}`)
              }
              aria-label="Project"
              style={{ fieldSizing: "content" }}
              className="text-3xl font-black text-black dark:text-white bg-transparent cursor-pointer max-w-full"
            >
              <option value="" className="text-base text-black">All projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id} className="text-base text-black">
                  {p.name}
                </option>
              ))}
            </select>
            {project && canManage && (
              <>
                <button onClick={() => setModal("edit")} className={small}>Edit</button>
                <button onClick={deleteProject} className={`${small} hover:text-red-500!`}>
                  Delete
                </button>
              </>
            )}
          </div>
          {project?.description && (
            <p className="text-neutral-500 dark:text-neutral-400 mt-1">{project.description}</p>
          )}
        </div>
        <div className="flex gap-3">
          <button onClick={() => setModal("project")} className={ghost}>
            + New Project
          </button>
          <button
            onClick={() => setModal("task")}
            className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black font-bold rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-400 transition-all cursor-pointer"
          >
            + Create Task
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <AssigneePicker
          value={assignee}
          onChange={setParam("assignee")}
          people={people}
          me={user.name}
          className="flex-1 sm:flex-none sm:w-52"
        />
        <label className="relative flex flex-1 sm:flex-none sm:w-52">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 pointer-events-none"
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"
          >
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path d="M16 2v4M8 2v4M3 10h18" />
          </svg>
        <select value={created} onChange={setParam("created")} aria-label="Created" className={`${field} h-10 pl-9 w-full`}>
          <option value="">Created any time</option>
          <option value="today">Created today</option>
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
        </select>
        </label>
        <button onClick={() => setShowArchived((v) => !v)} className={small}>
          {showArchived ? "Hide archived" : `Archived (${archived.length})`}
        </button>
        {(assignee !== user.name || created) && (
          <button onClick={() => setParams({}, { replace: true })} className={small}>
            Reset
          </button>
        )}
      </div>

      {loading ? (
        <p className="text-neutral-500">Loading...</p>
      ) : (
        <KanbanBoard
          tasks={tasks}
          visible={visible}
          onTasksChange={setTasks}
          onRefresh={fetchTasks}
        />
      )}

      {showArchived && (
        <div className="mt-8 bg-white dark:bg-neutral-800 rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-black uppercase tracking-wider text-neutral-500 mb-4">
            Archived tasks
          </h3>
          {archived.length === 0 && <p className="text-sm text-neutral-400">Nothing archived.</p>}
          {archived.map((t) => (
            <div
              key={t.id}
              className="flex items-center justify-between py-2 border-b last:border-0 border-neutral-100 dark:border-neutral-700"
            >
              <span className="text-sm dark:text-white">
                {t.project && <span className="text-neutral-400">{t.project} · </span>}
                {t.title}
              </span>
              <button
                onClick={async () => {
                  await q(supabase.from("tasks").update({ archived: false }).eq("id", t.id));
                  fetchTasks();
                }}
                className={small}
              >
                Restore
              </button>
              <button
                onClick={async () => {
                  if (!window.confirm(`Delete "${t.title}"? This can't be undone.`)) return;
                  await q(supabase.from("tasks").delete().eq("id", t.id));
                  fetchTasks();
                }}
                className={`${small} ml-4 hover:text-red-500!`}
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}

      {modal === "task" && (
        <CreateTaskModal
          onClose={() => setModal(null)}
          onCreated={fetchTasks}
          projectId={id}
          projects={projects}
        />
      )}
      {modal === "project" && (
        <CreateProjectModal
          onClose={() => setModal(null)}
          onCreated={async (p) => {
            await fetchProjects();
            navigate(`/projects/${p.id}?${params}`);
          }}
        />
      )}
      {modal === "edit" && project && (
        <EditProjectModal
          project={project}
          onClose={() => setModal(null)}
          onUpdated={fetchProjects}
        />
      )}
    </div>
  );
}
