import { useEffect, useState, useMemo } from "react";
import API from "../api/axios";
import socket from "../api/socket";
import TaskCard from "../components/TaskCard";
import { useAuth } from "../context/AuthContext";

const STAGGER_CLASSES = [
  "stagger-1", "stagger-2", "stagger-3", "stagger-4", "stagger-5",
  "stagger-6", "stagger-7", "stagger-8", "stagger-9",
];

export default function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState("");
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "medium",
    dueDate: "",
  });
  const [filter, setFilter] = useState("all");
  const { user } = useAuth();

  // Fetch tasks
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const { data } = await API.get("/tasks");
        setTasks(data.data);
      } catch {
        setError("Failed to load tasks");
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, []);

  // Socket.IO real-time updates
  useEffect(() => {
    const handleCreated = (task) => {
      if (!user || !task.user) return;
      const taskUserId =
        typeof task.user === "string" ? task.user : String(task.user);
      if (taskUserId === user._id)
        setTasks((prev) => [task, ...prev]);
    };

    const handleUpdated = (updated) => {
      if (!user || !updated.user) return;
      const taskUserId =
        typeof updated.user === "string" ? updated.user : String(updated.user);
      if (taskUserId === user._id) {
        setTasks((prev) =>
          prev.map((t) => (t._id === updated._id ? updated : t))
        );
      }
    };

    const handleDeleted = ({ _id }) => {
      setTasks((prev) => prev.filter((t) => t._id !== _id));
    };

    socket.on("taskCreated", handleCreated);
    socket.on("taskUpdated", handleUpdated);
    socket.on("taskDeleted", handleDeleted);

    return () => {
      socket.off("taskCreated", handleCreated);
      socket.off("taskUpdated", handleUpdated);
      socket.off("taskDeleted", handleDeleted);
    };
  }, [user]);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await API.post("/tasks", {
        ...newTask,
        dueDate: newTask.dueDate || undefined,
      });
      setNewTask({ title: "", description: "", priority: "medium", dueDate: "" });
      setShowForm(false);
      setError("");
    } catch {
      setError("Failed to create task");
    }
  };

  const handleUpdate = async (id, updates) => {
    try {
      await API.put(`/tasks/${id}`, updates);
      setError("");
    } catch {
      setError("Failed to update task");
    }
  };

  const handleDelete = async (id) => {
    try {
      await API.delete(`/tasks/${id}`);
      setError("");
    } catch {
      setError("Failed to delete task");
    }
  };

  // Counts
  const counts = useMemo(
    () => ({
      all: tasks.length,
      pending: tasks.filter((t) => t.status === "pending").length,
      "in-progress": tasks.filter((t) => t.status === "in-progress").length,
      completed: tasks.filter((t) => t.status === "completed").length,
    }),
    [tasks]
  );

  // Filtered + searched tasks
  const filtered = useMemo(() => {
    let result = filter === "all" ? tasks : tasks.filter((t) => t.status === filter);
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.description && t.description.toLowerCase().includes(q))
      );
    }
    return result;
  }, [tasks, filter, search]);

  // Completion percentage
  const completionPct =
    tasks.length > 0 ? Math.round((counts.completed / tasks.length) * 100) : 0;

  // ---- Loading ----
  if (loading)
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-10 h-10 border-[3px] border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
        <div className="text-sm text-gray-500 font-medium tracking-wide animate-pulse">
          Loading your workspace…
        </div>
      </div>
    );

  // ---- Stats config ----
  const stats = [
    {
      label: "Total Tasks",
      value: counts.all,
      icon: "📋",
      iconBg: "bg-indigo-500/10",
      barColor: "bg-indigo-500",
      pct: 100,
    },
    {
      label: "Pending",
      value: counts.pending,
      icon: "⏳",
      iconBg: "bg-amber-500/10",
      barColor: "bg-amber-400",
      pct: counts.all > 0 ? (counts.pending / counts.all) * 100 : 0,
    },
    {
      label: "In Progress",
      value: counts["in-progress"],
      icon: "🔄",
      iconBg: "bg-indigo-500/10",
      barColor: "bg-indigo-400",
      pct: counts.all > 0 ? (counts["in-progress"] / counts.all) * 100 : 0,
    },
    {
      label: "Completed",
      value: counts.completed,
      icon: "✅",
      iconBg: "bg-emerald-500/10",
      barColor: "bg-emerald-400",
      pct: counts.all > 0 ? (counts.completed / counts.all) * 100 : 0,
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* ── Header ── */}
      <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 animate-fade-in-up">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight gradient-text">
            My Workspace
          </h1>
          <p className="text-sm text-gray-500 mt-1.5">
            {counts.all === 0
              ? "No tasks yet — add your first one!"
              : `${completionPct}% complete · ${counts.all} total task${counts.all !== 1 ? "s" : ""}`}
          </p>
        </div>
        <button
          id="add-task-btn"
          className={`inline-flex items-center justify-center gap-2 text-white font-semibold px-5 py-2.5 rounded-xl text-sm self-start sm:self-auto transition-all duration-200 shadow-lg ${
            showForm
              ? "bg-white/[0.06] border border-white/[0.08] text-gray-300 shadow-none hover:bg-white/[0.08]"
              : "gradient-accent hover:opacity-90 shadow-indigo-600/15 hover:shadow-indigo-600/25 hover:-translate-y-0.5 active:translate-y-0"
          }`}
          onClick={() => setShowForm(!showForm)}
        >
          {showForm ? "✕ Cancel" : "＋ New Task"}
        </button>
      </header>

      {/* ── Error ── */}
      {error && (
        <div className="bg-rose-500/[0.08] border border-rose-500/15 text-rose-400 text-sm px-4 py-3 rounded-xl animate-shake">
          {error}
        </div>
      )}

      {/* ── Stats Bar ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
        {stats.map((s, i) => (
          <div
            key={s.label}
            className="stat-card"
            style={{ animationDelay: `${i * 0.08}s` }}
          >
            <div className="flex items-center justify-between mb-2">
              <div
                className={`stat-icon ${s.iconBg}`}
                role="img"
                aria-label={s.label}
              >
                {s.icon}
              </div>
              <div className="text-right">
                <div className="stat-value text-white animate-count-up" style={{ animationDelay: `${0.3 + i * 0.1}s` }}>
                  {s.value}
                </div>
              </div>
            </div>
            <div className="stat-label">{s.label}</div>
            <div className="stat-bar">
              <div
                className={`stat-bar-fill ${s.barColor}`}
                style={{ width: `${s.pct}%`, animationDelay: `${0.5 + i * 0.1}s` }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* ── New Task Form ── */}
      {showForm && (
        <form
          className="glass-card p-6 space-y-4 animate-slide-down"
          onSubmit={handleCreate}
          id="new-task-form"
        >
          <h3 className="text-base font-bold text-white">Create New Task</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                  Title
                </label>
                <input
                  className="w-full px-4 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all text-sm"
                  placeholder="What needs to be done?"
                  value={newTask.title}
                  onChange={(e) =>
                    setNewTask({ ...newTask, title: e.target.value })
                  }
                  required
                  autoFocus
                  id="task-title-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                    Priority
                  </label>
                  <select
                    className="w-full px-3 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl text-white focus:outline-none focus:border-indigo-500/50 transition-all text-sm cursor-pointer"
                    value={newTask.priority}
                    onChange={(e) =>
                      setNewTask({ ...newTask, priority: e.target.value })
                    }
                    id="task-priority-select"
                  >
                    <option value="low">🟢 Low</option>
                    <option value="medium">🟡 Medium</option>
                    <option value="high">🔴 High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                    Due Date
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl text-white focus:outline-none focus:border-indigo-500/50 transition-all text-sm cursor-pointer"
                    value={newTask.dueDate}
                    onChange={(e) =>
                      setNewTask({ ...newTask, dueDate: e.target.value })
                    }
                    id="task-duedate-input"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                Description
              </label>
              <textarea
                className="w-full h-[120px] px-4 py-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all text-sm resize-none"
                placeholder="Add details about this task…"
                value={newTask.description}
                onChange={(e) =>
                  setNewTask({ ...newTask, description: e.target.value })
                }
                id="task-description-input"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="submit"
              id="submit-task-btn"
              className="gradient-accent hover:opacity-90 text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-sm"
            >
              Add Task
            </button>
          </div>
        </form>
      )}

      {/* ── Search + Filter Bar ── */}
      <div className="space-y-4 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
        {/* Search */}
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 text-sm pointer-events-none">
            🔍
          </span>
          <input
            className="w-full pl-10 pr-4 py-2.5 bg-white/[0.02] border border-white/[0.05] rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500/40 focus:bg-white/[0.03] transition-all text-sm"
            placeholder="Search tasks by title or description…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            id="task-search-input"
          />
          {search && (
            <button
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 text-xs transition-colors"
              onClick={() => setSearch("")}
              aria-label="Clear search"
            >
              ✕
            </button>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none pb-px">
          {["all", "pending", "in-progress", "completed"].map((f) => {
            const isActiveFilter = filter === f;
            const labels = {
              all: "All Tasks",
              pending: "Pending",
              "in-progress": "In Progress",
              completed: "Completed",
            };
            return (
              <button
                key={f}
                id={`filter-${f}`}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold tracking-wide whitespace-nowrap transition-all duration-200 ${
                  isActiveFilter
                    ? "bg-white/[0.06] text-white shadow-sm"
                    : "text-gray-500 hover:text-gray-300 hover:bg-white/[0.02]"
                }`}
                onClick={() => setFilter(f)}
              >
                {labels[f]}
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    isActiveFilter
                      ? "bg-indigo-500/15 text-indigo-400"
                      : "bg-white/[0.04] text-gray-600"
                  }`}
                >
                  {counts[f]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Task Grid ── */}
      {filtered.length === 0 ? (
        <div className="glass-card flex flex-col items-center justify-center py-16 px-4 text-center border-dashed animate-fade-in-up">
          <span className="text-5xl mb-4">
            {search ? "🔎" : "📋"}
          </span>
          <h3 className="text-base font-bold text-white mt-1">
            {search ? "No matches found" : "All quiet here"}
          </h3>
          <p className="text-sm text-gray-500 mt-2 max-w-xs">
            {search
              ? `No tasks match "${search}". Try a different search or clear filters.`
              : "No tasks matched your criteria. Add a task or switch your filters."}
          </p>
          {search && (
            <button
              className="mt-4 px-4 py-2 text-xs font-semibold text-indigo-400 border border-indigo-500/20 rounded-xl hover:bg-indigo-500/10 transition-all"
              onClick={() => {
                setSearch("");
                setFilter("all");
              }}
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((task, i) => (
            <div
              key={task._id}
              className={`animate-fade-in-up ${STAGGER_CLASSES[i % STAGGER_CLASSES.length]}`}
            >
              <TaskCard
                task={task}
                onUpdate={handleUpdate}
                onDelete={handleDelete}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
