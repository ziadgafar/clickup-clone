import { useState } from "react";
import { supabase, q } from "../supabase";

function CopyBlock({ label, text }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="mb-5">
      <p className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">{label}</p>
      <div className="flex gap-2">
        <code className="flex-1 block bg-neutral-100 dark:bg-neutral-900 dark:text-neutral-200 text-sm p-3 rounded-lg break-all">
          {text}
        </code>
        <button
          onClick={() => {
            navigator.clipboard.writeText(text);
            setCopied(true);
          }}
          className="px-3 text-xs font-bold border border-neutral-200 dark:border-neutral-600 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-700 dark:text-white cursor-pointer"
        >
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
    </div>
  );
}

export default function ConnectClaude() {
  const [token, setToken] = useState(null);
  const url = `${window.location.origin}/api/mcp`;

  const generate = async () => {
    if (!window.confirm("This replaces any token you made before. Continue?")) return;
    try {
      setToken(await q(supabase.rpc("create_api_token")));
    } catch (err) {
      alert(err.message);
    }
  };

  const revoke = async () => {
    if (!window.confirm("Disconnect Claude? Your current token stops working.")) return;
    try {
      await q(supabase.rpc("revoke_api_token"));
      setToken(null);
      alert("Token revoked.");
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div>
      <h1 className="text-3xl font-black text-black dark:text-white">Connect Claude</h1>
      <p className="text-neutral-500 dark:text-neutral-400 mt-1 mb-8">
        Let your Claude list projects, create and update tasks, and comment, all as you.
        Treat the token like a password.
      </p>

      <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 shadow-sm">
        {!token ? (
          <div className="flex gap-3">
            <button
              onClick={generate}
              className="px-4 py-2 bg-black dark:bg-white text-white dark:text-black font-bold rounded-lg hover:bg-neutral-800 dark:hover:bg-neutral-400 cursor-pointer"
            >
              Generate token
            </button>
            <button
              onClick={revoke}
              className="px-4 py-2 text-sm font-bold border border-red-200 rounded-lg hover:bg-red-50 text-red-500 cursor-pointer"
            >
              Revoke token
            </button>
          </div>
        ) : (
          <>
            <p className="text-sm text-amber-600 mb-5">
              Copy this now. It won't be shown again.
            </p>
            <CopyBlock
              label="Claude Code (terminal)"
              text={`claude mcp add --transport http --scope user psd-tasks ${url} --header "Authorization: Bearer ${token}"`}
            />
            <CopyBlock
              label="Claude app / claude.ai: Settings → Connectors → Add custom connector → URL"
              text={`${url}?token=${token}`}
            />
          </>
        )}
      </div>

      <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-6">
        Then ask Claude things like “add a high-priority task to Website Redesign: fix login bug,
        assign it to me” or “what tasks are assigned to me?”
      </p>
    </div>
  );
}
