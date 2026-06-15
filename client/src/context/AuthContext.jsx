import { createContext, useContext, useState } from "react";
import socket from "../api/socket";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });

  const login = (userData) => {
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
    // Ensure socket uses the fresh token and connects in this tab
    try {
      socket.auth = { token: userData.token };
      if (!socket.connected) socket.connect();
    } catch (e) {
      // ignore if socket isn't initialized yet
    }
  };

  const logout = () => {
    localStorage.removeItem("user");
    setUser(null);
    try {
      socket.auth = {}; // clear token
      if (socket.connected) socket.disconnect();
    } catch (e) {}
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
