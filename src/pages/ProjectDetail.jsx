import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase, q } from "../supabase";
import KanbanBoard from "../components/KanbanBoard";
import CreateTaskModal from "../components/CreateTaskModal";

export default function ProjectDetail() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

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
      setTasks(taskRows.map((t) => ({ ...t, assignee: t.assignee?.name })));
    } catch {
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <p className="text-neutral-500">Loading...</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-black dark:text-white">
            {project?.name}
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">
            {project?.description || "No description provided."}
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black font-bold rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-400 transition-all cursor-pointer"
        >
          + Create Task
        </button>
        {showModal && (
          <CreateTaskModal
            onClose={() => setShowModal(false)}
            onCreated={fetchData}
            projectId={id}
          />
        )}
      </div>

      <KanbanBoard
        tasks={tasks}
        onTasksChange={setTasks}
        onRefresh={fetchData}
      />
    </div>
  );
}
