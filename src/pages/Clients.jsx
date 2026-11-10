import { useEffect, useState } from "react";
import { supabase, q } from "../supabase";
import CreateClientModal from "../components/CreateClientModal";
import EditClientModal from "../components/EditClientModal";
import { useAuth } from "../context/AuthContext";

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const { user } = useAuth();
  const [editingClient, setEditingClient] = useState(null);

  const canManage = () => user.role === "admin" || user.role === "manager";

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      await q(supabase.from("clients").delete().eq("id", id));
      fetchClients();
    } catch {
      alert("Failed to delete client.");
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setClients(await q(supabase.from("clients").select("*").order("name")));
    } catch {
      setClients([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-black dark:text-white">
            Clients
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 mt-1">
            {clients.length} clients total
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black font-bold rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-400 transition-all cursor-pointer"
        >
          + New Client
        </button>
      </div>

      {loading ? (
        <p className="text-neutral-500">Loading...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {clients.map((client) => (
            <div
              key={client.id}
              className="bg-white dark:bg-neutral-800 rounded-2xl p-4 shadow-sm"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                  {client.industry}
                </span>
              </div>
              <h3 className="text-lg font-bold text-black dark:text-white mb-1">
                {client.name}
              </h3>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                <b>contact name:</b> {client.contact_name}
              </p>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                <b>contact email:</b> {client.contact_email}
              </p>
              <p className="text-sm text-neutral-500 dark:text-neutral-400">
                <b>contact phone:</b> {client.contact_phone}
              </p>
              {canManage() && (
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => setEditingClient(client)}
                    className="flex-1 py-1.5 text-xs font-bold border border-neutral-200 dark:border-neutral-600 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 transition-all cursor-pointer"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(client.id)}
                    className="flex-1 py-1.5 text-xs font-bold border border-red-200 rounded-lg hover:bg-red-50 text-red-500 transition-all cursor-pointer"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <CreateClientModal
          onClose={() => setShowModal(false)}
          onCreated={fetchClients}
        />
      )}
      {editingClient && (
        <EditClientModal
          client={editingClient}
          onClose={() => setEditingClient(null)}
          onUpdated={fetchClients}
        />
      )}
    </div>
  );
}
