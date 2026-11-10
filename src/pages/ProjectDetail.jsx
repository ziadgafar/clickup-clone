import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { supabase, q } from "../supabase";
import KanbanBoard from "../components/KanbanBoard";
import CreateTaskModal from "../components/CreateTaskModal";

export default function ProjectDetail() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [archived, setArchived] = useState([]);
  const [showArchived, setShowArchived] = useState(false);
  const [projects, setProjects] = useState([]);
  const [people, setPeople] = useState([]);
  const navigate = useNavigate();
  // filters live in the URL so they survive switching projects and can be linked to
  const [params, setParams] = useSearchParams();
  const assignee = params.get("assignee") || "";
  const from = params.get("from") || "";
  const to = params.get("to") || "";
  const setParam = (key) => (e) => {
    const next = new URLSearchParams(params);
    if (e.target.value) next.set(key, e.target.value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  useEffect(() => {
    Promise.all([
      q(supabase.from("projects").select("id, name").order("name")),
      q(supabase.from("profiles").select("name").eq("approved", true).order("name")),
    ])
      .then(([p, u]) => {
        setProjects(p);
        setPeople(u.map((x) => x.name));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [projectRow, taskRows] = await Promise.all([
        q(supabase.from("projects").select("*").eq("id", id).single()),
        q(
          supabase
            .from("tasks")
            .select(
              "*, assignee:profiles!tasks_assigned_to_fkey(name), tags(id, name)",
            )
            .eq("project_id", id)
            .order("id"),
        ),
      ]);
      setProject(projectRow);
      const rows = taskRows.map((t) => ({ ...t, assignee: t.assignee?.name }));
      setTasks(rows.filter((t) => !t.archived));
      setArchived(rows.filter((t) => t.archived));
    } catch {
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const visible = (t) => {
    const created = new Date(t.created_at).toLocaleDateString("en-CA"); // local YYYY-MM-DD
    return (
      (!assignee || (assignee === "-" ? !t.assignee : t.assignee === assignee)) &&
      (!from || created >= from) &&
      (!to || created <= to)
    );
  };
  const field =
    "px-3 py-2 border border-neutral-200 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 dark:text-white text-sm";

  if (loading) return <p className="text-neutral-500">Loading...</p>;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <select
            value={id}
            onChange={(e) => navigate(`/projects/${e.target.value}?${params}`)}
            aria-label="Switch project"
            className="text-3xl font-black text-black dark:text-white bg-transparent cursor-pointer max-w-full"
          >
            {!projects.some((p) => String(p.id) === id) && (
              <option value={id}>{project?.name}</option>
            )}
            {projects.map((p) => (
              <option key={p.id} value={p.id} className="text-base text-black">
                {p.name}
              </option>
            ))}
          </select>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">
            {project?.description || "No description provided."}
          </p>
        </div>
        <div className="flex gap-3">
        <button
          onClick={() => setShowArchived((v) => !v)}
          className="px-4 py-2 border border-neutral-200 dark:border-neutral-600 text-neutral-600 dark:text-neutral-300 font-bold rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-all cursor-pointer"
        >
          {showArchived ? "Hide archived" : `Archived (${archived.length})`}
        </button>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black font-bold rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-400 transition-all cursor-pointer"
        >
          + Create Task
        </button>
        </div>
        {showModal && (
          <CreateTaskModal
            onClose={() => setShowModal(false)}
            onCreated={fetchData}
            projectId={id}
          />
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-6">
        <select value={assignee} onChange={setParam("assignee")} className={field}>
          <option value="">All assignees</option>
          <option value="-">Unassigned</option>
          {people.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm text-neutral-500">
          Created from
          <input type="date" value={from} onChange={setParam("from")} className={field} />
        </label>
        <label className="flex items-center gap-2 text-sm text-neutral-500">
          to
          <input type="date" value={to} onChange={setParam("to")} className={field} />
        </label>
        {(assignee || from || to) && (
          <button
            onClick={() => setParams({}, { replace: true })}
            className="text-sm font-bold text-neutral-500 hover:text-black dark:hover:text-white cursor-pointer"
          >
            Clear
          </button>
        )}
      </div>

      <KanbanBoard
        tasks={tasks}
        visible={visible}
        onTasksChange={setTasks}
        onRefresh={fetchData}
      />

      {showArchived && (
        <div className="mt-8 bg-white dark:bg-neutral-800 rounded-2xl p-6 shadow-sm">
          <h3 className="text-sm font-black uppercase tracking-wider text-neutral-500 mb-4">
            Archived tasks
          </h3>
          {archived.length === 0 && (
            <p className="text-sm text-neutral-400">Nothing archived.</p>
          )}
          {archived.map((t) => (
            <div
              key={t.id}
              className="flex items-center justify-between py-2 border-b last:border-0 border-neutral-100 dark:border-neutral-700"
            >
              <span className="text-sm dark:text-white">{t.title}</span>
              <button
                onClick={async () => {
                  await q(supabase.from("tasks").update({ archived: false }).eq("id", t.id));
                  fetchData();
                }}
                className="text-xs font-bold text-neutral-500 hover:text-black dark:hover:text-white cursor-pointer"
              >
                Restore
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
