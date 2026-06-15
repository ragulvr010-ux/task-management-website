import { useState } from "react";

const statusLabels = {
  pending: "Pending",
  "in-progress": "In Progress",
  completed: "Completed",
};

const statusColors = {
  pending: {
    border: "border-l-amber-400",
    badge: "bg-amber-500/10 text-amber-400 border-amber-500/15",
    dot: "bg-amber-400",
  },
  "in-progress": {
    border: "border-l-indigo-400",
    badge: "bg-indigo-500/10 text-indigo-400 border-indigo-500/15",
    dot: "bg-indigo-400",
  },
  completed: {
    border: "border-l-emerald-400",
    badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/15",
    dot: "bg-emerald-400",
  },
};

const priorityConfig = {
  low: { dot: "bg-emerald-400", label: "Low" },
  medium: { dot: "bg-amber-400", label: "Medium" },
  high: { dot: "bg-rose-400", label: "High" },
};

const statusCycle = ["pending", "in-progress", "completed"];

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const seconds = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatDueDate(dateStr) {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function isOverdue(dateStr, status) {
  if (!dateStr || status === "completed") return false;
  return new Date(dateStr) < new Date();
}

export default function TaskCard({ task, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [form, setForm] = useState({
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate ? task.dueDate.split("T")[0] : "",
  });

  const handleSave = () => {
    onUpdate(task._id, {
      ...form,
      dueDate: form.dueDate || undefined,
    });
    setEditing(false);
  };

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleStatusCycle = () => {
    const currentIndex = statusCycle.indexOf(task.status);
    const nextStatus = statusCycle[(currentIndex + 1) % statusCycle.length];
    onUpdate(task._id, { status: nextStatus });
  };

  const handleConfirmDelete = () => {
    onDelete(task._id);
    setConfirmDelete(false);
  };

  const colors = statusColors[task.status] || statusColors.pending;
  const priority = priorityConfig[task.priority] || priorityConfig.medium;
  const overdue = isOverdue(task.dueDate, task.status);

  // ---- Edit Mode ----
  if (editing) {
    return (
      <div className="glass-card p-5 flex flex-col gap-4 animate-fade-in">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-white">Edit Task</h4>
          <button
            className="text-gray-500 hover:text-gray-300 text-lg leading-none transition-colors"
            onClick={() => setEditing(false)}
            aria-label="Cancel edit"
          >
            ✕
          </button>
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
            Title
          </label>
          <input
            className="w-full px-3.5 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all text-sm"
            name="title"
            value={form.title}
            onChange={handleChange}
            placeholder="Task title"
            required
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
            Description
          </label>
          <textarea
            className="w-full px-3.5 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all text-sm resize-none"
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder="Add details…"
            rows={3}
          />
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
              Status
            </label>
            <select
              className="w-full px-2.5 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl text-white focus:outline-none focus:border-indigo-500/50 transition-all text-xs cursor-pointer"
              name="status"
              value={form.status}
              onChange={handleChange}
            >
              <option value="pending">Pending</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
              Priority
            </label>
            <select
              className="w-full px-2.5 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl text-white focus:outline-none focus:border-indigo-500/50 transition-all text-xs cursor-pointer"
              name="priority"
              value={form.priority}
              onChange={handleChange}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
              Due Date
            </label>
            <input
              type="date"
              className="w-full px-2.5 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl text-white focus:outline-none focus:border-indigo-500/50 transition-all text-xs cursor-pointer"
              name="dueDate"
              value={form.dueDate}
              onChange={handleChange}
            />
          </div>
        </div>

        <div className="flex gap-2 justify-end pt-1">
          <button
            className="px-4 py-2 gradient-accent hover:opacity-90 text-white text-xs font-semibold rounded-xl transition-all shadow-sm"
            onClick={handleSave}
          >
            Save Changes
          </button>
          <button
            className="px-4 py-2 border border-white/[0.06] text-gray-400 hover:text-white hover:bg-white/[0.04] text-xs font-semibold rounded-xl transition-all"
            onClick={() => setEditing(false)}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // ---- View Mode ----
  return (
    <>
      <div
        className={`glass-card border-l-[3px] ${colors.border} rounded-l-md rounded-r-2xl p-5 flex flex-col justify-between group ${
          overdue ? "ring-1 ring-rose-500/20" : ""
        }`}
      >
        {/* Header */}
        <div>
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-bold text-white text-[0.95rem] leading-snug group-hover:text-indigo-300 transition-colors duration-200 line-clamp-2">
              {task.title}
            </h3>
            <span className="flex items-center gap-1.5 text-[10px] font-semibold text-gray-400 bg-white/[0.03] border border-white/[0.04] px-2.5 py-1 rounded-lg shrink-0 select-none">
              <span className={`w-1.5 h-1.5 rounded-full ${priority.dot}`} />
              {priority.label}
            </span>
          </div>

          {task.description && (
            <p className="text-sm text-gray-500 mt-2 line-clamp-2 leading-relaxed">
              {task.description}
            </p>
          )}
        </div>

        {/* Meta row */}
        <div className="mt-4 flex items-center gap-2 flex-wrap text-[10px] text-gray-600">
          {task.dueDate && (
            <span
              className={`flex items-center gap-1 px-2 py-0.5 rounded-md border ${
                overdue
                  ? "bg-rose-500/10 text-rose-400 border-rose-500/15"
                  : "bg-white/[0.02] text-gray-500 border-white/[0.04]"
              }`}
            >
              {overdue ? "⚠" : "📅"} {formatDueDate(task.dueDate)}
            </span>
          )}
          <span className="text-gray-600">{timeAgo(task.createdAt)}</span>
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-white/[0.04] flex items-center justify-between">
          {/* Status badge — clickable to cycle */}
          <button
            className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${colors.badge} cursor-pointer hover:opacity-80 transition-opacity`}
            onClick={handleStatusCycle}
            title="Click to change status"
          >
            {statusLabels[task.status]}
          </button>

          <div className="flex gap-1.5">
            <button
              id={`edit-task-${task._id}`}
              className="text-[11px] px-3 py-1.5 border border-white/[0.06] hover:bg-white/[0.04] rounded-lg text-gray-400 hover:text-white font-medium transition-all"
              onClick={() => setEditing(true)}
            >
              Edit
            </button>
            {task.status === "pending" && (
              <button
                id={`start-task-${task._id}`}
                className="text-[11px] px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-medium transition-all"
                onClick={() => onUpdate(task._id, { status: "in-progress" })}
                title="Mark as in-progress"
              >
                Start
              </button>
            )}

            {task.status !== "completed" && (
              <button
                id={`complete-task-${task._id}`}
                className="text-[11px] px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-all"
                onClick={() => onUpdate(task._id, { status: "completed" })}
                title="Mark as completed"
              >
                Complete
              </button>
            )}

            {task.status !== "pending" && (
              <button
                id={`reopen-task-${task._id}`}
                className="text-[11px] px-3 py-1.5 bg-yellow-500 hover:bg-yellow-400 text-white rounded-lg font-medium transition-all"
                onClick={() => onUpdate(task._id, { status: "pending" })}
                title="Set back to pending"
              >
                Reopen
              </button>
            )}
            <button
              id={`delete-task-${task._id}`}
              className="text-[11px] px-3 py-1.5 bg-rose-500/[0.06] border border-rose-500/10 hover:bg-rose-500/15 rounded-lg text-rose-400 hover:text-rose-300 font-medium transition-all"
              onClick={() => setConfirmDelete(true)}
            >
              Delete
            </button>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(false)}>
          <div
            className="modal-card text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-4xl mb-3">🗑️</div>
            <h3 className="text-lg font-bold text-white mb-1">Delete Task?</h3>
            <p className="text-sm text-gray-400 mb-5">
              This will permanently delete{" "}
              <span className="text-white font-medium">"{task.title}"</span>.
              This action cannot be undone.
            </p>
            <div className="flex gap-2 justify-center">
              <button
                className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl transition-all"
                onClick={handleConfirmDelete}
              >
                Yes, Delete
              </button>
              <button
                className="px-5 py-2.5 border border-white/[0.06] text-gray-300 hover:text-white hover:bg-white/[0.04] text-xs font-bold rounded-xl transition-all"
                onClick={() => setConfirmDelete(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
