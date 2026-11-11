import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { supabase, q, setTaskTags } from "../supabase";

export default function CreateTaskModal({ onClose, onCreated, projectId, projects = [] }) {
  const loggedInUser = useAuth().user;
  const [tags, setTags] = useState([]);
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({
    title: "",
    project_id: projectId || "",
    description: "",
    status: "todo",
    priority: "medium",
    assigned_to: "",
    tags: [],
  });

  useEffect(() => {
    q(supabase.from("profiles").select("*").order("name"))
      .then(setUsers)
      .catch(() => setUsers([]));
  }, []);

  useEffect(() => {
    q(supabase.from("tags").select("*").order("name"))
      .then(setTags)
      .catch(() => setTags([]));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { tags, ...fields } = form;
      const task = await q(
        supabase
          .from("tasks")
          .insert({
            ...fields,
            assigned_to: form.assigned_to || null,
            created_by: loggedInUser.id,
          })
          .select()
          .single(),
      );
      await setTaskTags(task.id, tags);
      onCreated(task);
      onClose();
    } catch (err) {
      alert(err.message || "Failed to create task.");
    }
  };
  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 sm:p-8 w-full max-w-lg shadow-xl max-h-full overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black text-black dark:text-white">
            Create a New Task
          </h2>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-black dark:hover:text-white text-2xl cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-x-4 gap-y-3">
          <div className="flex flex-col">
            <p className="text-neutral-400 text-xs pb-0.5">Task Name</p>
            <input
              name="title"
              placeholder="Ex: Create new feature"
              value={form.title}
              onChange={handleChange}
              required
              className="px-4 py-3 rounded-lg border border-neutral-200 dark:border-neutral-600 bg-transparent dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
            />
          </div>

          {!projectId && (
            <div className="flex flex-col">
              <p className="text-neutral-400 text-xs pb-0.5">Project</p>
              <select
                name="project_id"
                value={form.project_id}
                onChange={handleChange}
                required
                className="px-4 py-3 rounded-lg border border-neutral-200 dark:border-neutral-600 bg-white dark:bg-neutral-800 dark:text-white focus:outline-none"
              >
                <option value="">Select project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex flex-col">
            <p className="text-neutral-400 text-xs pb-0.5">Description</p>
            <textarea
              name="description"
              placeholder="(optional)"
              value={form.description}
              onChange={handleChange}
              rows={3}
              className="px-4 py-3 rounded-lg border border-neutral-200 dark:border-neutral-600 bg-transparent dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white resize-none"
            />
          </div>

          <div className="flex flex-col">
            <p className="text-neutral-400 text-xs pb-0.5">Priority</p>
            <select
              name="priority"
              value={form.priority}
              onChange={handleChange}
              className="px-3 py-3 rounded-lg border border-neutral-200 dark:border-neutral-600 bg-white dark:bg-neutral-800 dark:text-white focus:outline-none"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>

          <div className="flex flex-col">
            <p className="text-neutral-400 text-xs pb-0.5">Project Manager</p>
            <select
              name="assigned_to"
              value={form.assigned_to}
              onChange={handleChange}
              required
              className="px-4 py-3 rounded-lg border border-neutral-200 dark:border-neutral-600 bg-white dark:bg-neutral-800 dark:text-white focus:outline-none"
            >
              <option value="">Select assignee</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col">
            <p className="text-neutral-400 text-xs pb-0.5">Tags</p>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <label
                  key={tag.id}
                  className="flex items-center gap-1.5 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={form.tags.includes(tag.id)}
                    onChange={(e) => {
                      setForm((prev) => ({
                        ...prev,
                        tags: e.target.checked
                          ? [...prev.tags, tag.id]
                          : prev.tags.filter((id) => id !== tag.id),
                      }));
                    }}
                    className="rounded"
                  />
                  <span className="text-sm text-neutral-600 dark:text-neutral-300">
                    {tag.name}
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3 mt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 border border-neutral-200 dark:border-neutral-600 text-neutral-600 dark:text-neutral-300 font-bold rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 bg-black dark:bg-white text-white dark:text-black font-bold rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-400 transition-all cursor-pointer"
            >
              Create Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
