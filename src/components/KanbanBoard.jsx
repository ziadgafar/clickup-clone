import { useState } from "react";
import { supabase, q } from "../supabase";
import { DragDropProvider } from "@dnd-kit/react";
import { useDraggable } from "@dnd-kit/react";
import { useDroppable } from "@dnd-kit/react";
import TaskDetailModal from "./TaskDetailModal";

const COLUMNS = ["todo", "in_progress", "blocked", "review", "done"];

const COLUMN_LABELS = {
  todo: "To Do",
  in_progress: "In Progress",
  blocked: "Blocked",
  review: "Review",
  done: "Done",
};

const COLUMN_COLORS = {
  todo: "border-neutral-500",
  in_progress: "border-blue-300",
  blocked: "border-red-300",
  review: "border-yellow-300",
  done: "border-green-300",
};

const COLUMN_HEADER_COLORS = {
  todo: "text-neutral-500",
  in_progress: "text-blue-500",
  blocked: "text-red-500",
  review: "text-yellow-500",
  done: "text-green-500",
};

function TaskCard({ task, onClick }) {
  const { ref, isDragging } = useDraggable({ id: task.id });

  return (
    <div
      ref={ref}
      onClick={onClick}
      className="bg-white dark:bg-neutral-700 rounded-xl p-3 shadow-sm cursor-grab active:cursor-grabbing"
      style={{ opacity: isDragging ? 0.5 : 1 }}
    >
      {task.project && (
        <p className="text-xs font-bold uppercase tracking-wider text-neutral-400 mb-1">
          {task.project}
        </p>
      )}
      <p className="text-sm font-bold text-black dark:text-white mb-2">
        {task.title}
      </p>

      {task.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
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

      {task.assignee && (
        <div className="flex items-center gap-2 mt-1">
          <img
            src={`https://ui-avatars.com/api/?name=${encodeURIComponent(task.assignee)}&background=0D8ABC&color=fff`}
            alt=""
            className="w-6 h-6 rounded-full"
          />
          <span className="text-xs text-neutral-600 dark:text-neutral-300 truncate">
            {task.assignee}
          </span>
        </div>
      )}
    </div>
  );
}

function KanbanColumn({ column, tasks, onTaskClick }) {
  const { ref } = useDroppable({ id: column });

  return (
    <div
      ref={ref}
      className={`rounded-2xl border-2 ${COLUMN_COLORS[column]} p-4 md:min-h-125 bg-neutral-50/50 dark:bg-neutral-900/20 transition-colors`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3
          className={`text-xs font-black uppercase tracking-widest ${COLUMN_HEADER_COLORS[column]}`}
        >
          {COLUMN_LABELS[column]}
        </h3>
        <span className="text-xs font-bold bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-neutral-500 px-2 py-0.5 rounded-full shadow-sm">
          {tasks.length}
        </span>
      </div>

      <div className="flex flex-col gap-3">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onClick={() => onTaskClick(task)}
          />
        ))}
        {tasks.length === 0 && (
          <div className="h-24 border-2 border-dashed border-neutral-200 dark:border-neutral-800 rounded-xl flex items-center justify-center text-neutral-400 text-xs">
            Drop tasks here
          </div>
        )}
      </div>
    </div>
  );
}

export default function KanbanBoard({ tasks, onTasksChange, onRefresh, visible = () => true }) {
  const [selectedTask, setSelectedTask] = useState(null);

  const handleDragEnd = async (event) => {
    if (event.canceled) return;

    const activeId = event.operation.source?.id;
    const newStatus = event.operation.target?.id;

    if (!activeId || !newStatus || !COLUMNS.includes(newStatus)) return;

    const draggedTask = tasks.find((t) => t.id === activeId);
    if (!draggedTask || draggedTask.status === newStatus) return;

    const originalTasks = [...tasks];

    onTasksChange(
      tasks.map((t) => (t.id === activeId ? { ...t, status: newStatus } : t)),
    );

    try {
      await q(
        supabase.from("tasks").update({ status: newStatus }).eq("id", activeId),
      );
    } catch {
      onTasksChange(originalTasks);
    }
  };

  return (
    <DragDropProvider onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {COLUMNS.map((col) => (
          <KanbanColumn
            key={col}
            column={col}
            tasks={tasks.filter((t) => t.status === col && visible(t))}
            onTaskClick={setSelectedTask}
          />
        ))}
      </div>
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdated={() => {
            onRefresh();
            setSelectedTask(null);
          }}
        />
      )}
    </DragDropProvider>
  );
}
