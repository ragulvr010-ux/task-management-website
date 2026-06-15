// Shared Socket.IO instance
// Allows any module (controllers, etc.) to emit events
// without circular dependencies.

let io;
const jwt = require("jsonwebtoken");
const User = require("../models/User");

module.exports = {
  init: (server) => {
    const { Server } = require("socket.io");
    io = new Server(server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST", "PUT", "DELETE"],
      },
    });

    io.on("connection", async (socket) => {
      console.log(`Socket connected: ${socket.id}`);

      // Authenticate socket using JWT sent in handshake auth
      try {
        const token = socket.handshake.auth && socket.handshake.auth.token;
        if (!token) {
          console.log(`Socket ${socket.id} missing token — disconnecting`);
          socket.disconnect(true);
          return;
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select("_id");
        if (!user) {
          console.log(`Socket ${socket.id} invalid user — disconnecting`);
          socket.disconnect(true);
          return;
        }

        const room = `user_${user._id}`;
        socket.join(room);
        console.log(`Socket ${socket.id} joined room ${room}`);
      } catch (err) {
        console.log(`Socket auth error (${socket.id}):`, err.message);
        socket.disconnect(true);
        return;
      }

      socket.on("disconnect", () => {
        console.log(`Socket disconnected: ${socket.id}`);
      });
    });

    return io;
  },

  getIO: () => {
    if (!io) {
      throw new Error("Socket.IO not initialized — call init(server) first");
    }
    return io;
  },
};
