const User = require("../models/User");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// In-memory user fallback database
const mockUsers = [];

const isConnected = () => mongoose.connection.readyState === 1;

// Helper to sign JWT in-memory
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || "fallback_secret", {
    expiresIn: process.env.JWT_EXPIRE || "7d",
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    if (!isConnected()) {
      console.warn("DB Offline: Using in-memory fallback for user register");
      const normalizedEmail = email.toLowerCase().trim();
      const existingUser = mockUsers.find((u) => u.email === normalizedEmail);
      if (existingUser) {
        return res
          .status(400)
          .json({ success: false, message: "Email already registered" });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      const newUser = {
        _id: new mongoose.Types.ObjectId().toString(),
        name,
        email: normalizedEmail,
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockUsers.push(newUser);

      const token = signToken(newUser._id);
      return res.status(201).json({
        success: true,
        data: {
          _id: newUser._id,
          name: newUser.name,
          email: newUser.email,
          token,
        },
      });
    }

    // Regular DB logic
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "Email already registered" });
    }

    const user = await User.create({ name, email, password });
    const token = user.generateToken();

    res.status(201).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ success: false, message: "Please provide email and password" });
    }

    if (!isConnected()) {
      console.warn("DB Offline: Using in-memory fallback for user login");
      const normalizedEmail = email.toLowerCase().trim();
      const user = mockUsers.find((u) => u.email === normalizedEmail);
      if (!user) {
        return res
          .status(401)
          .json({ success: false, message: "Invalid credentials" });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res
          .status(401)
          .json({ success: false, message: "Invalid credentials" });
      }

      const token = signToken(user._id);
      return res.status(200).json({
        success: true,
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          token,
        },
      });
    }

    // Regular DB logic
    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid credentials" });
    }

    const token = user.generateToken();

    res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current logged-in user profile
// @route   GET /api/auth/me
const getMe = async (req, res, next) => {
  try {
    if (!isConnected()) {
      const user = mockUsers.find((u) => u._id === req.user._id);
      if (!user) {
        return res
          .status(404)
          .json({ success: false, message: "User not found" });
      }
      const { password, ...userWithoutPassword } = user;
      return res.status(200).json({ success: true, data: userWithoutPassword });
    }

    const user = await User.findById(req.user._id);
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    next(error);
  }
};

module.exports = { register, login, getMe, mockUsers };
