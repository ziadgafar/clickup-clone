import { useEffect, useState } from "react";
import { supabase, q } from "../supabase";
import { useAuth } from "../context/AuthContext";
import KanbanBoard from "../components/KanbanBoard";

export default function Dashboard() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [projects, setProjects] = useState([]);
  const [people, setPeople] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assignee, setAssignee] = useState(user?.name || "");
  const [project, setProject] = useState("");

  const fetchTasks = () =>
    q(
      supabase
        .from("tasks")
        .select(
          "*, assignee:profiles!tasks_assigned_to_fkey(name), tags(id, name), project:projects(name)",
        )
        .eq("archived", false)
        .order("id"),
    )
      .then((rows) =>
        setTasks(
          rows.map((t) => ({ ...t, assignee: t.assignee?.name, project: t.project?.name })),
        ),
      )
      .catch(() => setTasks([]))
      .finally(() => setLoading(false));

  useEffect(() => {
    fetchTasks();
    q(supabase.from("projects").select("id, name").order("name"))
      .then(setProjects)
      .catch(() => {});
    q(supabase.from("profiles").select("name").eq("approved", true).order("name"))
      .then((u) => setPeople(u.map((x) => x.name)))
      .catch(() => {});
  }, []);

  const visible = (t) =>
    (!assignee || (assignee === "-" ? !t.assignee : t.assignee === assignee)) &&
    (!project || String(t.project_id) === project);

  const field =
    "px-3 py-2 border border-neutral-200 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 dark:text-white text-sm flex-1 sm:flex-none";

  return (
    <div>
      <h1 className="text-3xl font-black text-black dark:text-white mb-6">
        {assignee === user?.name ? "My tasks" : "Tasks"}
      </h1>

      <div className="flex flex-wrap gap-3 mb-6">
        <select value={assignee} onChange={(e) => setAssignee(e.target.value)} className={field}>
          <option value="">All assignees</option>
          <option value="-">Unassigned</option>
          {people.map((a) => (
            <option key={a} value={a}>
              {a === user?.name ? `${a} (me)` : a}
            </option>
          ))}
        </select>
        <select value={project} onChange={(e) => setProject(e.target.value)} className={field}>
          <option value="">All projects</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-neutral-500">Loading...</p>
      ) : (
        <KanbanBoard
          tasks={tasks}
          onTasksChange={setTasks}
          onRefresh={fetchTasks}
          visible={visible}
        />
      )}
    </div>
  );
}
