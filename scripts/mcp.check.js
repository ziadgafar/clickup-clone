// node scripts/mcp.check.js — offline check of the MCP JSON-RPC layer with a fake Supabase client.
import assert from "node:assert/strict";
import { rpc } from "../api/mcp.js";

// Fake query builder: every chained call returns itself; awaiting pops the next canned result for that table.
function fakeDb(results) {
  const calls = [];
  const from = (table) => {
    const b = new Proxy({}, {
      get: (_, m) => m === "then"
        ? (ok, bad) => Promise.resolve(results[table].shift()).then(ok, bad)
        : (...args) => (calls.push([table, m, ...args]), b),
    });
    return b;
  };
  return { from, calls };
}

const call = (name, args, db, id = 1) =>
  rpc({ jsonrpc: "2.0", id, method: "tools/call", params: { name, arguments: args } }, db, "user-1");

const init = await rpc({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-06-18" } });
assert.equal(init.result.protocolVersion, "2025-06-18");
assert.equal(await rpc({ jsonrpc: "2.0", method: "notifications/initialized" }), null);
assert.equal((await rpc({ jsonrpc: "2.0", id: 2, method: "nope" })).error.code, -32601);
const names = (await rpc({ jsonrpc: "2.0", id: 3, method: "tools/list" })).result.tools.map((t) => t.name);
assert.ok(names.includes("create_task") && names.includes("update_task"));

// create_task: resolves assignee + tags, sets created_by to token user
const db = fakeDb({
  profiles: [{ data: [{ id: "user-2" }] }],
  tasks: [{ data: { id: 7 } }, { data: { id: 7, title: "Fix login" } }],
  tags: [{ data: [{ id: 1, name: "bug" }, { id: 2, name: "urgent" }] }],
  task_tags: [{ data: null }, { data: null }],
});
const r = await call("create_task", { project_id: 3, title: "Fix login", assignee_email: "a@b.c", tags: ["BUG"] }, db);
assert.equal(r.result.isError, undefined, r.result.content[0].text);
const insert = db.calls.find(([t, m]) => t === "tasks" && m === "insert")[2];
assert.deepEqual(
  { a: insert.assigned_to, c: insert.created_by, s: insert.status, p: insert.priority },
  { a: "user-2", c: "user-1", s: "todo", p: "medium" },
);
assert.deepEqual(db.calls.find(([t, m]) => t === "task_tags" && m === "insert")[2], [{ task_id: 7, tag_id: 1 }]);

// validation and unknown tag surface as tool errors, not crashes
assert.equal((await call("create_task", { project_id: 1, title: "x", status: "bogus" }, fakeDb({}))).result.isError, true);
const badTag = await call("update_task", { task_id: 1, tags: ["nope"] }, fakeDb({ tags: [{ data: [{ id: 1, name: "bug" }] }] }));
assert.match(badTag.result.content[0].text, /Unknown tag "nope". Available: bug/);

// update_task on missing task
const missing = await call("update_task", { task_id: 99, title: "y" }, fakeDb({ tasks: [{ data: [] }] }));
assert.match(missing.result.content[0].text, /Task 99 not found/);

console.log("mcp check ok");
