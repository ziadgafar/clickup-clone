import { useEffect, useState } from "react";
import { supabase, q } from "../supabase";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    q(supabase.from("projects").select("*").order("id"))
      .then(setProjects)
      .catch(() => setProjects([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1 className="text-3xl font-black text-black dark:text-white mb-2">
        Welcome back, {user?.name} 👋
      </h1>
      <p className="text-neutral-500 dark:text-neutral-400 mb-8">
        Here's what's happening across your projects.
      </p>

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
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
