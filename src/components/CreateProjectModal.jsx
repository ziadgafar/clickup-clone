import { useState, useEffect } from "react";
import { supabase, q } from "../supabase";

export default function CreateProjectModal({ onClose, onCreated }) {
  const [clients, setClients] = useState([]);
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState({
    name: "",
    description: "",
    status: "planning",
    priority: "medium",
    type: "internal",
    client_id: "",
    owner_id: "",
    start_date: "",
    end_date: "",
  });

  useEffect(() => {
    q(supabase.from("clients").select("*").order("name"))
      .then(setClients)
      .catch(() => setClients([]));
    q(supabase.from("profiles").select("*").order("name"))
      .then(setUsers)
      .catch(() => setUsers([]));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "client_id" && { type: value ? "external" : "internal" }),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        client_id: form.client_id || null,
        end_date: form.end_date || null,
      };
      await q(supabase.from("projects").insert(payload));
      onCreated();
      onClose();
    } catch (err) {
      alert(err.message || "Failed to create project.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-neutral-800 rounded-2xl p-8 w-full max-w-lg shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black text-black dark:text-white">
            Create a New Project
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
            <p className="text-neutral-400 text-xs pb-0.5">Project Name</p>
            <input
              name="name"
              placeholder="Ex: Project A"
              value={form.name}
              onChange={handleChange}
              required
              className="px-4 py-3 rounded-lg border border-neutral-200 dark:border-neutral-600 bg-transparent dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
            />
          </div>

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

          <div className="grid grid-cols-2 gap-x-3">
            <div className="flex flex-col">
              <p className="text-neutral-400 text-xs pb-0.5">Status</p>
              <select
                name="status"
                value={form.status}
                onChange={handleChange}
                className="px-3 py-3 rounded-lg border border-neutral-200 dark:border-neutral-600 bg-white dark:bg-neutral-800 dark:text-white focus:outline-none"
              >
                <option value="planning">Planning</option>
                <option value="active">Active</option>
                <option value="on_hold">On Hold</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
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
          </div>
          <div className="flex flex-col">
            <p className="text-neutral-400 text-xs pb-0.5">Client</p>
            <select
              name="client_id"
              value={form.client_id}
              onChange={handleChange}
              className="px-4 p-3 rounded-lg border border-neutral-200 dark:border-neutral-600 bg-white dark:bg-neutral-800 dark:text-white focus:outline-none"
            >
              <option value="">Internal</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col">
            <p className="text-neutral-400 text-xs pb-0.5">Project Manager</p>
            <select
              name="owner_id"
              value={form.owner_id}
              onChange={handleChange}
              required
              className="px-4 py-3 rounded-lg border border-neutral-200 dark:border-neutral-600 bg-white dark:bg-neutral-800 dark:text-white focus:outline-none"
            >
              <option value="">Select owner</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-x-3">
            <div className="flex flex-col">
              <p className="text-neutral-400 text-xs pb-0.5">Start Date</p>
              <input
                name="start_date"
                type="date"
                value={form.start_date}
                onChange={handleChange}
                className="px-4 py-3 rounded-lg border border-neutral-200 dark:border-neutral-600 bg-transparent dark:text-white focus:outline-none"
              />
            </div>
            <div className="flex flex-col">
              <p className="text-neutral-400 text-xs pb-0.5">End Date</p>
              <input
                name="end_date"
                type="date"
                value={form.end_date}
                onChange={handleChange}
                className="px-4 py-3 rounded-lg border border-neutral-200 dark:border-neutral-600 bg-transparent dark:text-white focus:outline-none"
              />
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
              Create Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
