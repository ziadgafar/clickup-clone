import { useEffect, useState } from "react";
import { supabase, q } from "../supabase";
import { useAuth } from "../context/AuthContext";

export default function Users() {
  const { user, refresh } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingUser, setEditingUser] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setUsers(
        await q(supabase.from("profiles").select("*").order("approved").order("name")),
      );
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const canEdit = (targetUser) =>
    user.role === "admin" || user.id === targetUser.id;

  const canDelete = () => user.role === "admin";

  const handleApprove = async (id) => {
    try {
      await q(supabase.from("profiles").update({ approved: true }).eq("id", id));
      fetchUsers();
    } catch (err) {
      alert(err.message || "Failed to approve user.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      await q(supabase.rpc("delete_user", { uid: id }));
      fetchUsers();
    } catch {
      alert("Failed to delete user.");
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-black text-black dark:text-white">Team</h1>
        <p className="text-neutral-500 dark:text-neutral-400 mt-1">
          {users.filter((u) => u.approved).length} members
          {users.some((u) => !u.approved) &&
            ` · ${users.filter((u) => !u.approved).length} pending`}
        </p>
      </div>

      {loading ? (
        <p className="text-neutral-500">Loading...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {users.map((u) => (
            <div
              key={u.id}
              className="bg-white dark:bg-neutral-800 rounded-2xl p-4 shadow-sm"
            >
              <div className="flex items-center gap-3 mb-3">
                <img
                  src={
                    u.profile_picture ||
                    `https://ui-avatars.com/api/?name=${u.name}&background=0D8ABC&color=fff`
                  }
                  className="w-10 h-10 rounded-full"
                />
                <div>
                  <p className="font-bold text-black dark:text-white text-sm">
                    {u.name}
                  </p>
                  <p className="text-xs text-neutral-400">
                    {u.role}
                    {!u.approved && (
                      <span className="ml-2 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 font-bold">
                        Pending
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <p className="text-sm text-neutral-500 dark:text-neutral-400 mb-3">
                {u.email}
              </p>
              <div className="flex gap-2">
                {!u.approved && canDelete() && (
                  <button
                    onClick={() => handleApprove(u.id)}
                    className="flex-1 py-1.5 text-xs font-bold bg-black dark:bg-white text-white dark:text-black rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-400 transition-all cursor-pointer"
                  >
                    Approve
                  </button>
                )}
                {canEdit(u) && (
                  <button
                    onClick={() => setEditingUser(u)}
                    className="flex-1 py-1.5 text-xs font-bold border border-neutral-200 dark:border-neutral-600 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 transition-all cursor-pointer"
                  >
                    Edit
                  </button>
                )}
                {canDelete() && (
                  <button
                    onClick={() => handleDelete(u.id)}
                    className="flex-1 py-1.5 text-xs font-bold border border-red-200 rounded-lg hover:bg-red-50 text-red-500 transition-all cursor-pointer"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {editingUser && (
        <EditUserModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onUpdated={() => {
            fetchUsers();
            refresh();
          }}
          isAdmin={user.role === "admin"}
          isSelf={user.id === editingUser.id}
        />
      )}
    </div>
  );
}

function EditUserModal({ user, onClose, onUpdated, isAdmin, isSelf }) {
  const [form, setForm] = useState({
    name: user.name,
    email: user.email,
    password: "",
    role: user.role,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Email/password live in Supabase Auth: users can only change their own.
      if (isSelf && (form.password || form.email !== user.email)) {
        const { error } = await supabase.auth.updateUser({
          ...(form.email !== user.email && { email: form.email }),
          ...(form.password && { password: form.password }),
        });
        if (error) throw error;
        if (form.email !== user.email)
          alert("Check your new email inbox to confirm the change.");
      }
      await q(
        supabase
          .from("profiles")
          .update({ name: form.name, ...(isAdmin && { role: form.role }) })
          .eq("id", user.id),
      );
      onUpdated();
      onClose();
    } catch (err) {
      alert(err.message || "Failed to update user.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-neutral-800 rounded-2xl p-8 w-full max-w-lg shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black text-black dark:text-white">
            Edit User
          </h2>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-black dark:hover:text-white text-2xl cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-y-3">
          <div className="flex flex-col">
            <p className="text-neutral-400 text-xs pb-0.5">Full Name</p>
            <input
              name="name"
              value={form.name}
              onChange={handleChange}
              required
              className="px-4 py-3 rounded-lg border border-neutral-200 dark:border-neutral-600 bg-transparent dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
            />
          </div>

          <div className="flex flex-col">
            <p className="text-neutral-400 text-xs pb-0.5">Email</p>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              required
              className="px-4 py-3 rounded-lg border border-neutral-200 dark:border-neutral-600 bg-transparent dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
            />
          </div>

          <div className="flex flex-col">
            <p className="text-neutral-400 text-xs pb-0.5">
              New Password (leave blank to keep current)
            </p>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="px-4 py-3 rounded-lg border border-neutral-200 dark:border-neutral-600 bg-transparent dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
            />
          </div>

          {isAdmin && (
            <div className="flex flex-col">
              <p className="text-neutral-400 text-xs pb-0.5">Role</p>
              <select
                name="role"
                value={form.role}
                onChange={handleChange}
                className="px-4 py-3 rounded-lg border border-neutral-200 dark:border-neutral-600 bg-white dark:bg-neutral-800 dark:text-white focus:outline-none"
              >
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="member">Member</option>
              </select>
            </div>
          )}

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
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
