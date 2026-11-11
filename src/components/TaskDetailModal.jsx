import { useState, useEffect } from "react";
import { supabase, q, setTaskTags } from "../supabase";
import { useAuth } from "../context/AuthContext";

export default function TaskDetailModal({
  task,
  onClose,
  onUpdated,
}) {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [tags, setTags] = useState([]);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    title: task.title,
    description: task.description || "",
    status: task.status,
    priority: task.priority,
    assigned_to: task.assigned_to || "",
    tags: task.tags?.map((t) => t.id) || [],
  });

  useEffect(() => {
    q(supabase.from("profiles").select("*").order("name"))
      .then(setUsers)
      .catch(() => setUsers([]));
    q(supabase.from("tags").select("*").order("name"))
      .then(setTags)
      .catch(() => setTags([]));
    fetchComments();
  }, []);

  const fetchComments = async () => {
    try {
      const rows = await q(
        supabase
          .from("comments")
          .select("*, profiles(name)")
          .eq("task_id", task.id)
          .order("created_at"),
      );
      setComments(rows.map((c) => ({ ...c, user_name: c.profiles?.name })));
    } catch {
      setComments([]);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleTagToggle = (tagId) => {
    setForm((prev) => ({
      ...prev,
      tags: prev.tags.includes(tagId)
        ? prev.tags.filter((id) => id !== tagId)
        : [...prev.tags, tagId],
    }));
  };

  const handleSave = async () => {
    try {
      const { tags, ...fields } = form;
      await q(
        supabase
          .from("tasks")
          .update({
            ...fields,
            assigned_to: form.assigned_to || null,
          })
          .eq("id", task.id),
      );
      await setTaskTags(task.id, tags);
      onUpdated();
      setIsEditing(false);
    } catch (err) {
      alert(err.message || "Failed to update task.");
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    try {
      await q(
        supabase
          .from("comments")
          .insert({ task_id: task.id, content: newComment }),
      );
      setNewComment("");
      fetchComments();
    } catch {
      alert("Failed to add comment.");
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await q(supabase.from("comments").delete().eq("id", commentId));
      fetchComments();
    } catch {
      alert("Failed to delete comment.");
    }
  };

  const handleArchive = async () => {
    try {
      await q(supabase.from("tasks").update({ archived: true }).eq("id", task.id));
      onUpdated();
    } catch (err) {
      alert(err.message || "Failed to archive task.");
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${task.title}"? This can't be undone.`)) return;
    try {
      await q(supabase.from("tasks").delete().eq("id", task.id));
      onUpdated();
    } catch (err) {
      alert(err.message || "Failed to delete task.");
    }
  };

  const PRIORITY_COLORS = {
    low: "bg-green-100 text-green-700",
    medium: "bg-yellow-100 text-yellow-700",
    high: "bg-red-100 text-red-700",
  };

  const STATUS_COLORS = {
    todo: "bg-neutral-100 text-neutral-700",
    in_progress: "bg-blue-100 text-blue-700",
    blocked: "bg-red-100 text-red-700",
    review: "bg-yellow-100 text-yellow-700",
    done: "bg-green-100 text-green-700",
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white dark:bg-neutral-800 rounded-2xl w-full max-w-2xl shadow-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-6 sm:p-8 pb-4">
          <div className="flex items-center gap-2">
            <span
              className={`text-xs font-bold px-2 py-1 rounded-full ${STATUS_COLORS[task.status]}`}
            >
              {task.status.replace("_", " ")}
            </span>
            <span
              className={`text-xs font-bold px-2 py-1 rounded-full ${PRIORITY_COLORS[task.priority]}`}
            >
              Priority: {task.priority}
            </span>
          </div>
          <div className="flex items-center gap-5">
            {!isEditing && (
              <button
                onClick={handleArchive}
                className="px-2 py-1 text-xs font-bold border border-neutral-200 dark:border-neutral-600 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 transition-all cursor-pointer"
              >
                Archive
              </button>
            )}
            {!isEditing && (
              <button
                onClick={handleDelete}
                className="px-2 py-1 text-xs font-bold border border-red-200 dark:border-red-900 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 text-red-500 transition-all cursor-pointer"
              >
                Delete
              </button>
            )}
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="flex-1 px-2 py-1 text-xs font-bold border border-neutral-200 dark:border-neutral-600 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 transition-all cursor-pointer"
              >
                Edit
              </button>
            )}
            <button
              onClick={onClose}
              className="text-neutral-400 hover:text-black dark:hover:text-white text-2xl cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="px-6 sm:px-8 pb-6 sm:pb-8 flex flex-col gap-6">
          {/* View or Edit mode */}
          {!isEditing ? (
            <div>
              <h2 className="text-2xl font-black text-black dark:text-white mb-2">
                {task.title}
              </h2>
              <p className="text-neutral-500 dark:text-neutral-400 text-sm">
                {task.description || "No description provided."}
              </p>
              <div className="flex gap-4 mt-4 text-sm text-neutral-500">
                {task.assignee && (
                  <span>
                    <b>Assignee:</b> {task.assignee}
                  </span>
                )}
              </div>
              {task.tags?.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {task.tags.map((tag) => (
                    <span
                      key={tag.id}
                      className="text-xs px-2 py-0.5 bg-neutral-100 dark:bg-neutral-600 text-neutral-600 dark:text-neutral-300 rounded-full"
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-y-3">
              <div className="flex flex-col">
                <p className="text-neutral-400 text-xs pb-0.5">Title</p>
                <input
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  className="px-4 py-3 rounded-lg border border-neutral-200 dark:border-neutral-600 bg-transparent dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                />
              </div>

              <div className="flex flex-col">
                <p className="text-neutral-400 text-xs pb-0.5">Description</p>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={3}
                  className="px-4 py-3 rounded-lg border border-neutral-200 dark:border-neutral-600 bg-transparent dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col">
                  <p className="text-neutral-400 text-xs pb-0.5">Status</p>
                  <select
                    name="status"
                    value={form.status}
                    onChange={handleChange}
                    className="px-3 py-3 rounded-lg border border-neutral-200 dark:border-neutral-600 bg-white dark:bg-neutral-800 dark:text-white focus:outline-none"
                  >
                    <option value="todo">To Do</option>
                    <option value="in_progress">In Progress</option>
                    <option value="blocked">Blocked</option>
                    <option value="review">Review</option>
                    <option value="done">Done</option>
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

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col">
                  <p className="text-neutral-400 text-xs pb-0.5">Assignee</p>
                  <select
                    name="assigned_to"
                    value={form.assigned_to}
                    onChange={handleChange}
                    className="px-3 py-3 rounded-lg border border-neutral-200 dark:border-neutral-600 bg-white dark:bg-neutral-800 dark:text-white focus:outline-none"
                  >
                    <option value="">Unassigned</option>
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>
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
                        onChange={() => handleTagToggle(tag.id)}
                        className="rounded"
                      />
                      <span className="text-sm text-neutral-600 dark:text-neutral-300">
                        {tag.name}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setIsEditing(false)}
                  className="flex-1 py-3 border border-neutral-200 dark:border-neutral-600 text-neutral-600 dark:text-neutral-300 font-bold rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 py-3 bg-black dark:bg-white text-white dark:text-black font-bold rounded-lg hover:bg-neutral-800 transition-all cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </div>
          )}

          {/* Comments */}
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-4">
              Comments ({comments.length})
            </h3>

            <div className="flex flex-col gap-3 mb-4">
              {comments.length === 0 && (
                <p className="text-sm text-neutral-400">No comments yet.</p>
              )}
              {comments.map((comment) => (
                <div
                  key={comment.id}
                  className="bg-neutral-50 dark:bg-neutral-700 rounded-xl p-3"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-black dark:text-white">
                      {comment.user_name || "Unknown"}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-neutral-400">
                        {new Date(comment.created_at).toLocaleDateString()}
                      </span>
                      {(user.role === "admin" ||
                        user.id === comment.user_id) && (
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="text-xs text-red-400 hover:text-red-600 cursor-pointer"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-neutral-600 dark:text-neutral-300">
                    {comment.content}
                  </p>
                </div>
              ))}
            </div>

            {/* Add comment */}
            <div className="flex gap-2">
              <input
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
                placeholder="Add a comment..."
                className="flex-1 px-4 py-2 rounded-lg border border-neutral-200 dark:border-neutral-600 bg-transparent dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white text-sm"
              />
              <button
                onClick={handleAddComment}
                className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black font-bold rounded-lg hover:bg-neutral-800 transition-all cursor-pointer text-sm"
              >
                Post
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
