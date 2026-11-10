import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
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
