import { lazy, Suspense, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { DragDropProvider, useDraggable, useDroppable } from "@dnd-kit/react";
import Avatar from "../components/Avatar";
// Lazy so the 58 KB WebGL background loads after the page paints.
const Topography = lazy(() => import("../components/Topography"));
import { useTheme } from "../context/ThemeContext";
import { COLUMNS, COLUMN_LABELS, COLUMN_COLORS, COLUMN_HEADER_COLORS } from "../components/columns";

const REPO = "https://github.com/ziadgafar/clickup-clone";

// [title, text, Heroicons outline path]
const features = [
  ["Kanban boards", "Drag tasks across To Do, In Progress, Blocked, Review and Done. Every project gets its own board, plus one view across all projects.",
    "M9 4.5v15m6-15v15m-10.875 0h15.75c.621 0 1.125-.504 1.125-1.125V5.625c0-.621-.504-1.125-1.125-1.125H4.125C3.504 4.5 3 5.004 3 5.625v12.75c0 .621.504 1.125 1.125 1.125Z"],
  ["Rich tasks", "Assignees with avatars, due dates, tags, multi-line descriptions and comment threads on every task.",
    "M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"],
  ["Filters", "Narrow any board by assignee, creation date or project in one click.",
    "M12 3c2.755 0 5.455.232 8.083.678.533.09.917.556.917 1.096v1.044a2.25 2.25 0 0 1-.659 1.591l-5.432 5.432a2.25 2.25 0 0 0-.659 1.591v2.927a2.25 2.25 0 0 1-1.244 2.013L9.75 21v-6.568a2.25 2.25 0 0 0-.659-1.591L3.659 7.409A2.25 2.25 0 0 1 3 5.818V4.774c0-.54.384-1.006.917-1.096A48.32 48.32 0 0 1 12 3Z"],
  ["Archive & restore", "Soft-delete keeps old work out of the way and brings it back when needed. Hard delete is there too.",
    "m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z"],
  ["Roles & approval", "New sign-ups wait for an admin to approve them. Postgres row-level security enforces access, not the UI.",
    "M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z"],
  ["Claude integration", "A built-in MCP server lets each person connect Claude with a personal token to list, create and update tasks by chat.",
    "M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z"],
];

const START = [
  { id: "t1", title: "Design onboarding flow", who: "Mona", tag: "Design", col: "todo" },
  { id: "t2", title: "Write API docs", who: "Omar", tag: "Docs", col: "todo" },
  { id: "t3", title: "Client dashboard", who: "Ziad", tag: "Frontend", col: "in_progress" },
  { id: "t4", title: "Invoice export", who: "Sara", tag: "Backend", col: "blocked" },
  { id: "t5", title: "Row-level security audit", who: "Omar", tag: "Security", col: "review" },
  { id: "t6", title: "Set up Supabase auth", who: "Sara", tag: "Backend", col: "done" },
];
// Auto-play skips Blocked so cards flow forward.
const FLOW = ["todo", "in_progress", "review", "done"];

// Motion borrowed from cuedesign.space: masked line rise, nav drop-in, button sheen, scroll reveals, marquee.
const css = `
@keyframes rise { from { opacity: 0; transform: translateY(16px) } to { opacity: 1; transform: none } }
@keyframes pop { 0% { opacity: 0; transform: scale(.9) } 60% { transform: scale(1.03) } 100% { opacity: 1; transform: none } }
@keyframes pulse-dot { 0%,100% { opacity: 1 } 50% { opacity: .3 } }
@keyframes line-rise { from { transform: translateY(110%) rotate(3deg); opacity: 0 } to { transform: none; opacity: 1 } }
@keyframes nav-in { from { opacity: 0; transform: translateY(-40px) } to { opacity: 1; transform: none } }
@keyframes sheen { from { transform: translateX(-140%) skewX(-14deg) } to { transform: translateX(320%) skewX(-14deg) } }
html { scroll-behavior: smooth }
.rise { animation: rise .6s ease-out both }
.pop { animation: pop .45s ease-out both }
.pulse-dot { animation: pulse-dot 1.6s ease-in-out infinite }
.nav-in { animation: nav-in .7s cubic-bezier(.2,.8,.2,1) both }
.line { display: block; overflow: hidden; padding-bottom: .08em }
.line > span { display: block; animation: line-rise .9s cubic-bezier(.2,.8,.2,1) both }
.sheen { position: relative; overflow: hidden }
.sheen::after { content: ""; position: absolute; inset: 0; width: 35%; background: linear-gradient(90deg, transparent, rgba(255,255,255,.35), transparent); animation: sheen 2.8s ease-in-out infinite }
.dark .sheen::after { background: linear-gradient(90deg, transparent, rgba(0,0,0,.15), transparent) }
.reveal { opacity: 0; transform: translateY(22px); transition: opacity .8s ease, transform .8s cubic-bezier(.2,.8,.2,1) }
.reveal.in { opacity: 1; transform: none }
/* Hero board sits tilted in 3D; flattens on hover or once the visitor drags (dnd-kit needs it flat to track the pointer). */
@media (min-width: 1280px) {
  .tilt { perspective: 1800px }
  .tilt > div { transform: rotateY(-12deg) rotateX(6deg); box-shadow: 30px 40px 80px -30px rgba(0,0,0,.35); transition: transform .8s cubic-bezier(.2,.8,.2,1), box-shadow .8s }
  .tilt:hover > div, .tilt.flat > div { transform: none; box-shadow: 0 20px 50px -25px rgba(0,0,0,.3) }
}
@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto }
  .rise, .pop, .pulse-dot, .nav-in, .line > span, .sheen::after { animation: none }
  .reveal { opacity: 1; transform: none; transition: none }
}
`;

const card = "bg-white dark:bg-neutral-800 rounded-2xl shadow-sm";
const muted = "text-neutral-500 dark:text-neutral-400";
const primaryBtn = "px-5 py-3 rounded-lg font-bold bg-black dark:bg-white text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-400 transition-all";
const pad = "px-4 sm:px-6 lg:px-24";

function Card({ task, delay }) {
  const { ref, isDragging } = useDraggable({ id: task.id });
  return (
    <div
      ref={ref}
      style={{ animationDelay: `${delay}ms`, opacity: isDragging ? 0.5 : undefined }}
      className="pop bg-white dark:bg-neutral-700 rounded-xl p-2.5 shadow-sm cursor-grab active:cursor-grabbing transition-transform hover:-translate-y-0.5 hover:shadow-md"
    >
      <p className="text-sm font-bold text-black dark:text-white mb-2">{task.title}</p>
      <div className="flex items-center gap-1">
        <span className="min-w-0 truncate text-[10px] px-1.5 py-0.5 bg-neutral-100 dark:bg-neutral-600 text-neutral-600 dark:text-neutral-300 rounded-full">{task.tag}</span>
        <span className="ml-auto shrink-0"><Avatar name={task.who} /></span>
      </div>
    </div>
  );
}

function Column({ id, tasks }) {
  const { ref, isDropTarget } = useDroppable({ id });
  return (
    <div
      ref={ref}
      className={`rounded-2xl border-2 ${COLUMN_COLORS[id]} p-2 min-h-40 min-w-0 transition-colors ${
        isDropTarget ? "bg-neutral-100 dark:bg-neutral-700/40" : "bg-neutral-50/50 dark:bg-neutral-900/20"
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className={`text-xs font-black uppercase tracking-widest ${COLUMN_HEADER_COLORS[id]}`}>{COLUMN_LABELS[id]}</h3>
        <span className="text-xs font-bold bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-500 px-2 py-0.5 rounded-full shadow-sm">
          {tasks.length}
        </span>
      </div>
      <div className="flex flex-col gap-2">
        {tasks.map((t, i) => <Card key={t.id} task={t} delay={i * 80} />)}
      </div>
    </div>
  );
}

function DemoBoard() {
  const [tasks, setTasks] = useState(START);
  const [auto, setAuto] = useState(true);

  // Until the visitor drags something, move one card forward every 2.5s to show the flow.
  useEffect(() => {
    if (!auto) return;
    const timer = setInterval(() => {
      setTasks((ts) => {
        const next = ts.find((t) => FLOW.includes(t.col) && t.col !== "done");
        if (!next) return START;
        const col = FLOW[FLOW.indexOf(next.col) + 1];
        return [...ts.filter((t) => t !== next), { ...next, col }];
      });
    }, 2500);
    return () => clearInterval(timer);
  }, [auto]);

  const onDragEnd = (e) => {
    const id = e.operation.source?.id;
    const col = e.operation.target?.id;
    if (e.canceled || !COLUMNS.includes(col)) return;
    setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, col } : t)));
  };

  return (
    <div className={`tilt ${auto ? "" : "flat"}`}>
    <div className={`${card} p-3 sm:p-5`}>
    <DragDropProvider onDragStart={() => setAuto(false)} onDragEnd={onDragEnd}>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {COLUMNS.map((id) => (
          <Column key={id} id={id} tasks={tasks.filter((t) => t.col === id)} />
        ))}
      </div>
      <p className={`mt-4 text-sm ${muted} flex items-center gap-2`}>
        <span className={`w-2 h-2 rounded-full bg-green-500 ${auto ? "pulse-dot" : ""}`} />
        {auto ? "Playing a demo. Drag any card to take over." : "Your board now. Nothing here is saved."}
        {!auto && (
          <button onClick={() => { setTasks(START); setAuto(true); }} className="font-bold text-black dark:text-white hover:underline">
            Replay
          </button>
        )}
      </p>
    </DragDropProvider>
    </div>
    </div>
  );
}

export default function Landing() {
  // Fade sections up as they scroll into view.
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && (e.target.classList.add("in"), io.unobserve(e.target))),
      { threshold: 0.15 },
    );
    document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const { theme } = useTheme();

  return (
    <div className="min-h-screen w-full bg-gray-100 dark:bg-neutral-900 text-black dark:text-white overflow-x-hidden">
      <style>{css}</style>

      <nav className={`nav-in flex items-center justify-between ${pad} py-4 border-b border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900`}>
        <img src="/logo.png" alt="Poseidon X" className="h-7 dark:brightness-0 dark:invert" />
        <div className="flex items-center gap-4 text-sm font-semibold">
          <a href={REPO} className={`${muted} hover:text-black dark:hover:text-white`}>GitHub</a>
          <Link to="/login" className="px-4 py-2 rounded-lg bg-black dark:bg-white text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-400 transition-all">
            Open app
          </Link>
        </div>
      </nav>

      <header className={`relative ${pad} pt-16 xl:pt-24 pb-16 grid xl:grid-cols-[5fr_7fr] gap-12 items-center`}>
        {/* Hero-only so it stops rendering once scrolled past. glow 0 skips the bloom passes; dpr 1 caps pixels.
            Canvas ignores pointer events; Topography listens on window for hover/click. */}
        <div className="absolute inset-0 pointer-events-none mask-[linear-gradient(to_bottom,#000_75%,transparent)]">
          <Suspense fallback={null}>
            <Topography
              color={theme === "dark" ? "#404040" : "#e0e0e0"}
              lightMode={theme !== "dark"}
              glow={0}
              dpr={1}
            />
          </Suspense>
        </div>
        <div className="relative">
        <p className={`rise inline-flex items-center gap-2 text-sm font-semibold ${card} px-3 py-1 rounded-full! mb-5`}>
          <span className="w-2 h-2 rounded-full bg-blue-500 pulse-dot" />
          Becoming multi-tenant: one platform, many teams
        </p>
        <h1 className="text-4xl sm:text-6xl xl:text-5xl 2xl:text-6xl font-black leading-tight mb-6">
          {["A project manager", "for small teams, with", "Claude built in."].map((line, i) => (
            <span key={i} className="line">
              <span style={{ animationDelay: `${150 + i * 120}ms` }}>{line}</span>
            </span>
          ))}
        </h1>
        <p className={`rise text-lg ${muted} mb-8 max-w-2xl`} style={{ animationDelay: "550ms" }}>
          Kanban boards, tasks, comments and team roles in one React app backed by Supabase,
          plus an MCP server so the team can manage work straight from Claude.
        </p>
        <div className="rise flex flex-wrap gap-3" style={{ animationDelay: "700ms" }}>
          <a href={REPO} className={`sheen ${primaryBtn}`}>View source</a>
          <Link to="/login" className={`px-5 py-3 rounded-lg font-bold ${card} hover:bg-neutral-100 dark:hover:bg-neutral-700 transition-all`}>Open app</Link>
        </div>
        </div>
        <div className="relative rise" style={{ animationDelay: "400ms" }}>
          <DemoBoard />
        </div>
      </header>

      <section className={`${pad} py-16`}>
        <h2 className="reveal text-3xl font-black mb-8">What it does</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map(([title, text, icon], i) => (
            <div key={title} style={{ transitionDelay: `${(i % 3) * 100}ms` }} className={`reveal group ${card} p-6 hover:shadow-lg`}>
              <span className="inline-flex items-center justify-center size-11 mb-4 rounded-xl bg-neutral-100 dark:bg-neutral-700 transition-colors group-hover:bg-black group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-black">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
                </svg>
              </span>
              <h3 className="font-bold mb-2">{title}</h3>
              <p className={`text-sm ${muted}`}>{text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className={`${pad} py-16`}>
        <div className={`reveal ${card} p-6 sm:p-10`}>
          <p className={`text-xs font-black uppercase tracking-widest ${muted} mb-2`}>Where it's going</p>
          <h2 className="text-3xl font-black mb-6">Multi-tenant by design</h2>
          <div className={`grid md:grid-cols-3 gap-6 ${muted}`}>
            <p><strong className="text-black dark:text-white block mb-1">Isolated workspaces</strong>Each company signs up for its own workspace with its own projects, tasks and clients.</p>
            <p><strong className="text-black dark:text-white block mb-1">Enforced in the database</strong>Row-level security scopes every row to its workspace, so one tenant can never read another's data.</p>
            <p><strong className="text-black dark:text-white block mb-1">Own admins & Claude access</strong>Every workspace approves its own members, manages roles and issues its own Claude tokens.</p>
          </div>
        </div>
      </section>


      <footer className={`${pad} py-8 border-t border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 text-sm ${muted}`}>
        Built by Ziad Yasser · <a href={REPO} className="font-bold text-black dark:text-white hover:underline">Source on GitHub</a>
      </footer>
    </div>
  );
}
