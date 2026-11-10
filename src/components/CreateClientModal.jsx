import { useState } from "react";
import { supabase, q } from "../supabase";

export default function CreateClientModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    name: "",
    contact_name: "",
    contact_email: "",
    contact_phone: "",
    industry: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await q(supabase.from("clients").insert(form));
      onCreated();
      onClose();
    } catch (err) {
      alert(err.message || "Failed to create client.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 sm:p-8 w-full max-w-lg shadow-xl max-h-full overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black text-black dark:text-white">
            New Client
          </h2>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-black dark:hover:text-white text-2xl cursor-pointer"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-y-3">
          {[
            {
              label: "Company Name",
              name: "name",
              placeholder: "Ex: TechCorp",
            },
            {
              label: "Contact Name",
              name: "contact_name",
              placeholder: "Ex: John Doe",
            },
            {
              label: "Contact Email",
              name: "contact_email",
              placeholder: "Ex: john@techcorp.com",
            },
            {
              label: "Contact Phone",
              name: "contact_phone",
              placeholder: "Ex: 01012345678",
            },
            {
              label: "Industry",
              name: "industry",
              placeholder: "Ex: Technology",
            },
          ].map((field) => (
            <div key={field.name} className="flex flex-col">
              <p className="text-neutral-400 text-xs pb-0.5">{field.label}</p>
              <input
                name={field.name}
                placeholder={field.placeholder}
                value={form[field.name]}
                onChange={handleChange}
                required={field.name === "name"}
                className="px-4 py-3 rounded-lg border border-neutral-200 dark:border-neutral-600 bg-transparent dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
              />
            </div>
          ))}

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
              Create Client
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
