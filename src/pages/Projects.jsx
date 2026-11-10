import { useEffect, useState } from "react";
import { supabase, q } from "../supabase";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import EditProjectModal from "../components/EditProjectModal";
import CreateProjectModal from "../components/CreateProjectModal";

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const { user } = useAuth();
  const [editingProject, setEditingProject] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setProjects(await q(supabase.from("projects").select("*").order("id")));
    } catch {
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  const canManage = () => user.role === "admin" || user.role === "manager";

  const handleDelete = async (e, id) => {
    e.stopPropagation(); // prevent navigating to project
    if (!window.confirm("Are you sure?")) return;
    try {
      await q(supabase.from("projects").delete().eq("id", id));
      fetchProjects();
    } catch {
      alert("Failed to delete project.");
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-black text-black dark:text-white">
            Projects
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">
            {projects.length} projects total
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black font-bold rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-400 transition-all cursor-pointer"
        >
          + Create Project
        </button>
      </div>
      {showModal && (
        <CreateProjectModal
          onClose={() => setShowModal(false)}
          onCreated={fetchProjects}
        />
      )}

      {loading ? (
        <p className="text-neutral-500">Loading...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {projects.map((project) => (
            <div
              key={project.id}
              onClick={() => navigate(`/projects/${project.id}`)}
              className="bg-white dark:bg-neutral-800 rounded-2xl p-4 shadow-sm cursor-pointer"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                  {project.type} Project
                </span>
                <span
                  className={`text-xs font-bold px-2 py-1 rounded-full ${
                    project.status === "active"
                      ? "bg-green-100 text-green-700"
                      : project.status === "completed"
                        ? "bg-blue-100 text-blue-700"
                        : project.status === "on_hold"
                          ? "bg-yellow-100 text-yellow-700"
                          : project.status === "planning"
                            ? "bg-neutral-100 text-neutral-700"
                            : "bg-red-100 text-red-700"
                  }`}
                >
                  {project.status}
                </span>
              </div>
              <h3 className="text-lg font-bold text-black dark:text-white mb-1">
                {project.name}
              </h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                {project.description || "No description provided."}
              </p>
              {canManage() && (
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingProject(project);
                    }}
                    className="flex-1 py-1.5 text-xs font-bold border border-neutral-200 dark:border-neutral-600 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 transition-all cursor-pointer"
                  >
                    Edit
                  </button>
                  <button
                    onClick={(e) => handleDelete(e, project.id)}
                    className="flex-1 py-1.5 text-xs font-bold border border-red-200 rounded-lg hover:bg-red-50 text-red-500 transition-all cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
          {editingProject && (
            <EditProjectModal
              project={editingProject}
              onClose={() => setEditingProject(null)}
              onUpdated={fetchProjects}
            />
          )}
        </div>
      )}
    </div>
  );
}
