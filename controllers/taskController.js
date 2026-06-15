const Task = require("../models/Task");
const mongoose = require("mongoose");
const { getIO } = require("../utils/socket");

// In-memory task database
const mockTasks = [];

const isConnected = () => mongoose.connection.readyState === 1;

// @desc    Get all tasks for logged-in user
// @route   GET /api/tasks
const getTasks = async (req, res, next) => {
  try {
    if (!isConnected()) {
      console.warn("DB Offline: Fetching tasks from in-memory fallback");
      const userTasks = mockTasks
        .filter((t) => t.user === String(req.user._id))
        .sort((a, b) => b.createdAt - a.createdAt);
      return res.status(200).json({ success: true, count: userTasks.length, data: userTasks });
    }

    const tasks = await Task.find({ user: req.user._id }).sort({
      createdAt: -1,
    });
    res.status(200).json({ success: true, count: tasks.length, data: tasks });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single task
// @route   GET /api/tasks/:id
const getTask = async (req, res, next) => {
  try {
    if (!isConnected()) {
      const task = mockTasks.find(
        (t) => t._id === req.params.id && t.user === String(req.user._id)
      );
      if (!task) {
        return res
          .status(404)
          .json({ success: false, message: "Task not found" });
      }
      return res.status(200).json({ success: true, data: task });
    }

    const task = await Task.findOne({
      _id: req.params.id,
      user: req.user._id,
    });
    if (!task) {
      return res
        .status(404)
        .json({ success: false, message: "Task not found" });
    }
    res.status(200).json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a task
// @route   POST /api/tasks
const createTask = async (req, res, next) => {
  try {
    const taskData = req.body;
    taskData.user = String(req.user._id);

    if (!isConnected()) {
      console.warn("DB Offline: Creating task in-memory");
      const newTask = {
        _id: new mongoose.Types.ObjectId().toString(),
        title: taskData.title,
        description: taskData.description || "",
        status: taskData.status || "pending",
        priority: taskData.priority || "medium",
        dueDate: taskData.dueDate,
        user: taskData.user,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockTasks.push(newTask);

      // Emit real-time event to the task owner's room
      try {
        const room = `user_${String(newTask.user)}`;
        getIO().to(room).emit("taskCreated", newTask);
      } catch (err) {
        console.error("Failed to emit taskCreated socket event:", err.message);
      }

      return res.status(201).json({ success: true, data: newTask });
    }

    req.body.user = req.user._id;
    const task = await Task.create(req.body);

    // Emit real-time event to the task owner's room
    try {
      const room = `user_${String(task.user)}`;
      getIO().to(room).emit("taskCreated", task);
    } catch (err) {
      console.error("Failed to emit taskCreated socket event:", err.message);
    }

    res.status(201).json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a task
// @route   PUT /api/tasks/:id
const updateTask = async (req, res, next) => {
  try {
    if (!isConnected()) {
      const taskIndex = mockTasks.findIndex(
        (t) => t._id === req.params.id && t.user === String(req.user._id)
      );
      if (taskIndex === -1) {
        return res
          .status(404)
          .json({ success: false, message: "Task not found" });
      }

      const updatedTask = {
        ...mockTasks[taskIndex],
        ...req.body,
        updatedAt: new Date(),
      };
      mockTasks[taskIndex] = updatedTask;

      // Emit real-time event to the task owner's room
      try {
        const room = `user_${String(updatedTask.user)}`;
        getIO().to(room).emit("taskUpdated", updatedTask);
      } catch (err) {
        console.error("Failed to emit taskUpdated socket event:", err.message);
      }

      return res.status(200).json({ success: true, data: updatedTask });
    }

    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!task) {
      return res
        .status(404)
        .json({ success: false, message: "Task not found" });
    }

    // Emit real-time event to the task owner's room
    try {
      const room = `user_${String(task.user)}`;
      getIO().to(room).emit("taskUpdated", task);
    } catch (err) {
      console.error("Failed to emit taskUpdated socket event:", err.message);
    }

    res.status(200).json({ success: true, data: task });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
const deleteTask = async (req, res, next) => {
  try {
    if (!isConnected()) {
      const taskIndex = mockTasks.findIndex(
        (t) => t._id === req.params.id && t.user === String(req.user._id)
      );
      if (taskIndex === -1) {
        return res
          .status(404)
          .json({ success: false, message: "Task not found" });
      }

      const deletedTask = mockTasks.splice(taskIndex, 1)[0];

      // Emit real-time event to the task owner's room
      try {
        const room = `user_${String(deletedTask.user)}`;
        getIO().to(room).emit("taskDeleted", { _id: deletedTask._id });
      } catch (err) {
        console.error("Failed to emit taskDeleted socket event:", err.message);
      }

      return res.status(200).json({ success: true, data: {} });
    }

    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });
    if (!task) {
      return res
        .status(404)
        .json({ success: false, message: "Task not found" });
    }

    // Emit real-time event to the task owner's room
    try {
      const room = `user_${String(task.user)}`;
      getIO().to(room).emit("taskDeleted", { _id: task._id });
    } catch (err) {
      console.error("Failed to emit taskDeleted socket event:", err.message);
    }

    res.status(200).json({ success: true, data: {} });
  } catch (error) {
    next(error);
  }
};

module.exports = { getTasks, getTask, createTask, updateTask, deleteTask };
