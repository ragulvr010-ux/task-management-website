import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import socket from "../api/socket";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [connected, setConnected] = useState(socket.connected);

  useEffect(() => {
    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);
    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, []);

  // Close drawer on route change
  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const isActive = (path) => location.pathname === path;

  const getInitials = (name) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      <nav className="sticky top-0 z-50 glass border-b border-white/[0.04]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link
              to="/"
              className="flex items-center gap-2.5 group"
              id="nav-logo"
            >
              <span className="relative w-8 h-8 flex items-center justify-center">
                <span className="absolute inset-0 rounded-lg gradient-accent opacity-20 group-hover:opacity-40 transition-opacity duration-300" />
                <span className="relative text-white text-lg font-black">
                  T
                </span>
              </span>
              <span className="text-xl font-extrabold tracking-tight gradient-text">
                TaskFlow
              </span>
              {user && (
                <span
                  className={`status-dot ml-1 ${connected ? "connected" : "disconnected"}`}
                  title={connected ? "Real-time connected" : "Reconnecting…"}
                />
              )}
            </Link>

            {/* Desktop nav links */}
            <div className="hidden sm:flex items-center gap-1">
              <Link
                to="/"
                id="nav-dashboard"
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all duration-200 ${
                  isActive("/")
                    ? "bg-white/[0.06] text-white shadow-sm"
                    : "text-gray-400 hover:text-white hover:bg-white/[0.03]"
                }`}
              >
                Dashboard
              </Link>
            </div>

            {/* Desktop right section */}
            <div className="hidden sm:flex items-center gap-3">
              {user ? (
                <>
                  <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.04]">
                    <div className="w-7 h-7 rounded-lg gradient-accent flex items-center justify-center text-white text-[10px] font-bold tracking-wide shadow-sm">
                      {getInitials(user.name)}
                    </div>
                    <span className="text-xs font-medium text-gray-300 max-w-[100px] truncate">
                      {user.name}
                    </span>
                  </div>
                  <button
                    id="nav-logout"
                    className="px-3.5 py-2 rounded-xl border border-white/[0.06] hover:border-white/[0.12] text-gray-400 hover:text-white bg-white/[0.02] hover:bg-white/[0.04] text-xs font-semibold tracking-wide transition-all duration-200"
                    onClick={handleLogout}
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    id="nav-login"
                    className="px-3.5 py-2 rounded-xl border border-white/[0.06] hover:border-white/[0.12] text-gray-400 hover:text-white text-xs font-semibold tracking-wide transition-all duration-200"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    id="nav-register"
                    className="gradient-accent hover:opacity-90 text-white px-4 py-2 rounded-xl text-xs font-semibold tracking-wide shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 transition-all duration-200"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>

            {/* Mobile hamburger */}
            <button
              className="sm:hidden flex flex-col items-center justify-center w-9 h-9 rounded-lg hover:bg-white/[0.05] transition-colors gap-[5px]"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open menu"
              id="nav-mobile-menu"
            >
              <span className="block w-4.5 h-[2px] bg-gray-300 rounded-full w-[18px]" />
              <span className="block w-3.5 h-[2px] bg-gray-400 rounded-full w-[14px]" />
              <span className="block w-4.5 h-[2px] bg-gray-300 rounded-full w-[18px]" />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer */}
      {drawerOpen && (
        <>
          <div
            className="mobile-drawer-overlay"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="mobile-drawer">
            {/* Drawer header */}
            <div className="flex items-center justify-between mb-8">
              <span className="text-lg font-extrabold gradient-text">
                TaskFlow
              </span>
              <button
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/[0.06] text-gray-400 hover:text-white transition-colors text-lg"
                onClick={() => setDrawerOpen(false)}
                aria-label="Close menu"
              >
                ✕
              </button>
            </div>

            {/* User info */}
            {user && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/[0.04] mb-6">
                <div className="w-9 h-9 rounded-lg gradient-accent flex items-center justify-center text-white text-xs font-bold shadow-sm">
                  {getInitials(user.name)}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-white truncate">
                    {user.name}
                  </div>
                  <div className="text-[10px] text-gray-500 truncate">
                    {user.email}
                  </div>
                </div>
              </div>
            )}

            {/* Drawer links */}
            <div className="flex flex-col gap-1 flex-1">
              <Link
                to="/"
                className={`px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  isActive("/")
                    ? "bg-white/[0.06] text-white"
                    : "text-gray-400 hover:text-white hover:bg-white/[0.03]"
                }`}
              >
                📊 Dashboard
              </Link>
            </div>

            {/* Drawer footer */}
            <div className="pt-4 border-t border-white/[0.04] mt-auto">
              {user ? (
                <button
                  className="w-full px-4 py-3 rounded-xl border border-white/[0.06] text-gray-400 hover:text-white hover:bg-white/[0.04] text-sm font-semibold transition-all text-left"
                  onClick={handleLogout}
                >
                  ← Logout
                </button>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link
                    to="/login"
                    className="px-4 py-3 rounded-xl border border-white/[0.06] text-gray-400 hover:text-white text-sm font-semibold text-center transition-all"
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="px-4 py-3 rounded-xl gradient-accent text-white text-sm font-semibold text-center shadow-lg transition-all"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
