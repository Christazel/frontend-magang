"use client";

import { useAuth } from "@/context/AuthContext";
import { BellIcon } from "@heroicons/react/24/outline";

export default function Navbar() {
  const { user } = useAuth();

  return (
    <>
      {/* ─── Navbar ─── */}
      <header
        className="fixed top-0 left-0 right-0 md:left-64 z-30 h-14 flex items-center justify-between px-5 md:px-8"
        style={{
          background: "rgba(255,255,255,0.88)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(0,0,0,0.06)",
          boxShadow: "0 1px 20px rgba(0,0,0,0.04)",
        }}
      >
        {/* Left: Brand + greeting */}
        <div className="flex items-center gap-3">
          {/* Spacer for hamburger on mobile */}
          <div className="w-8 md:hidden" />
          <div className="flex items-center gap-2">
            {/* Brand dot accent */}
            <span
              className="hidden md:inline-flex w-2 h-2 rounded-full animate-pulse"
              style={{ background: "linear-gradient(135deg, #0b2c65, #0b2c65)" }}
            />
            <span className="hidden md:block text-sm font-semibold text-gray-700 tracking-tight">
              Dashboard SIPMA Melawi
            </span>
            {/* Mobile: just show brand */}
            <span className="md:hidden text-sm font-bold text-gray-800 tracking-tight">
              SIPMA
            </span>
          </div>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-3">
          {/* Bell notification icon */}
          <button
            className="relative w-9 h-9 rounded-xl flex items-center justify-center text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200"
            aria-label="Notifikasi"
          >
            <BellIcon className="w-5 h-5" />
            {/* Red dot */}
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
          </button>

          {/* User avatar chip */}
          {user && (
            <div className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl bg-gray-100 border border-gray-200">
              <div
                className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                style={{
                  background: "linear-gradient(135deg, #0b2c65, #1e3a8a)",
                }}
              >
                {user.name?.charAt(0).toUpperCase()}
              </div>
              <span className="text-xs font-semibold text-gray-700 hidden sm:block max-w-[100px] truncate">
                {user.name}
              </span>
            </div>
          )}
        </div>
      </header>

      {/* Spacer to push page content below navbar */}
      <div className="h-14" />
    </>
  );
}
