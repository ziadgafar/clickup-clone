import { createClient } from "@supabase/supabase-js";

// ponytail: global loading state. A button clicked shortly before a Supabase request gets
// data-busy (spinner, disabled) until all requests settle. Switch to per-button state if it misfires.
let inflight = 0;
let clicked = null;
const busy = new Set();

// Capture records which button; bubble refreshes the time after the handler ran (window.confirm can block).
document.addEventListener("click", (e) => {
  const b = e.target.closest("button");
  clicked = b ? { b, t: Date.now() } : null;
}, true);
document.addEventListener("click", () => {
  if (clicked) clicked.t = Date.now();
});

function settle() {
  // Grace period so multi-step saves (update, then tags, then refetch) keep one continuous spinner.
  setTimeout(() => {
    if (inflight) return;
    for (const b of busy) {
      delete b.dataset.busy;
      b.disabled = false;
    }
    busy.clear();
  }, 150);
}

async function trackedFetch(...args) {
  inflight++;
  if (clicked && Date.now() - clicked.t < 500) {
    clicked.b.dataset.busy = "";
    clicked.b.disabled = true;
    busy.add(clicked.b);
    clicked = null;
  }
  try {
    return await fetch(...args);
  } finally {
    inflight--;
    settle();
  }
}

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  { global: { fetch: trackedFetch } },
);

// Throw on error so callers can use plain try/catch like before.
export async function q(query) {
  const { data, error } = await query;
  if (error) throw error;
  return data;
}

export async function setTaskTags(taskId, tagIds) {
  await q(supabase.from("task_tags").delete().eq("task_id", taskId));
  if (tagIds.length)
    await q(
      supabase
        .from("task_tags")
        .insert(tagIds.map((tag_id) => ({ task_id: taskId, tag_id }))),
    );
}
