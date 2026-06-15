const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../models/User");
const { mockUsers } = require("../controllers/authController");

const isConnected = () => mongoose.connection.readyState === 1;

// Protect routes — require valid JWT
const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return res
      .status(401)
      .json({ success: false, message: "Not authorized, no token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "fallback_secret");

    if (!isConnected()) {
      const user = mockUsers.find((u) => u._id === decoded.id);
      if (!user) {
        return res
          .status(401)
          .json({ success: false, message: "User no longer exists" });
      }
      req.user = user;
    } else {
      req.user = await User.findById(decoded.id);
      if (!req.user) {
        return res
          .status(401)
          .json({ success: false, message: "User no longer exists" });
      }
    }

    next();
  } catch (error) {
    return res
      .status(401)
      .json({ success: false, message: "Not authorized, token invalid" });
  }
};

module.exports = { protect };
