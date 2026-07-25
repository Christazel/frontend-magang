"use client";

import Link from "next/link";
// import Image from "next/image"; // Removed to fix lint
import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, LogOut, ChevronRight } from "lucide-react";
import { getMenuItems } from "@/constants/menu";

export default function Sidebar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  if (!user) return null;

  /**
   * Handle user logout and redirect to login page
   */
  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  /**
   * Check if current path is active
   */
  const isActive = (path: string) => pathname === path;

  const menuItems = getMenuItems(user.role);

  const initials = user.name
    ?.split(" ")
    .map((n: string) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <>
      {/* ─── Hamburger Button (Mobile) ─── */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle Sidebar"
        className="md:hidden fixed top-3.5 left-4 z-50 w-9 h-9 flex items-center justify-center rounded-xl text-white transition-all duration-200 shadow-lg"
        style={{
          background: "linear-gradient(135deg, #0b2c65, #1e3a8a)",
          boxShadow: "0 4px 14px rgba(11,44,101,0.4)",
        }}
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* ─── Sidebar Panel ─── */}
      <aside
        className={`${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 transition-transform duration-300 ease-in-out
          w-64 fixed top-0 left-0 z-40 h-full flex flex-col`}
        style={{
          background:
            "linear-gradient(180deg, #061c47 0%, #0b2c65 55%, #1e3a8a 100%)",
        }}
      >
        {/* Grid overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.5) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        {/* ── User Info Header ── */}
        <div className="relative z-10 p-5 border-b border-white/10">
          <div className="flex items-center gap-3">
            {/* Avatar with initials */}
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 shadow-lg"
              style={{
                background: "rgba(255,255,255,0.15)",
                border: "1.5px solid rgba(255,255,255,0.25)",
                color: "#fff",
              }}
            >
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-white font-semibold text-sm truncate leading-tight">
                {user.name}
              </p>
              <span
                className="inline-block text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full mt-0.5"
                style={{
                  background: "rgba(255,255,255,0.15)",
                  color: "#93c5fd",
                }}
              >
                {user.role}
              </span>
            </div>
          </div>
        </div>

        {/* ── Navigation Menu ── */}
        <nav className="relative z-10 flex-1 px-3 py-4 overflow-y-auto">
          <p className="text-[10px] font-bold tracking-widest uppercase text-white/40 px-3 mb-3">
            Menu Utama
          </p>
          <ul className="space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                      active
                        ? "text-white"
                        : "text-white/60 hover:text-white hover:bg-white/10"
                    }`}
                    style={
                      active
                        ? {
                            background: "rgba(255,255,255,0.15)",
                            border: "1px solid rgba(255,255,255,0.2)",
                            backdropFilter: "blur(8px)",
                          }
                        : {}
                    }
                  >
                    <Icon
                      size={18}
                      className={`flex-shrink-0 transition-colors ${
                        active ? "text-blue-300" : "text-white/50 group-hover:text-blue-300"
                      }`}
                    />
                    <span className="text-sm font-medium flex-1">{item.label}</span>
                    {active && (
                      <ChevronRight size={14} className="text-blue-300 flex-shrink-0" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* ── Logout Button ── */}
        <div className="relative z-10 p-3 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 group"
            style={{
              background: "rgba(239,68,68,0.15)",
              border: "1px solid rgba(239,68,68,0.25)",
              color: "#fca5a5",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "rgba(239,68,68,0.3)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "rgba(239,68,68,0.15)";
            }}
          >
            <LogOut size={16} />
            <span>Keluar</span>
          </button>
        </div>
      </aside>

      {/* ─── Mobile Overlay ─── */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30 md:hidden"
        />
      )}
    </>
  );
}
