"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { BellIcon } from "@heroicons/react/24/outline";
import { getMenuItems } from "@/constants/menu";

export default function Navbar() {
  const pathname = usePathname();
  const { user } = useAuth();

  // Derive current page title from menu items
  const menuItems = user ? getMenuItems(user.role) : [];
  const currentPage = menuItems.find((item) => item.href === pathname)?.label;
  const pageTitle = currentPage ?? "SIPMA Melawi";

  return (
    <>
      {/* ─── Navbar ─── */}
      <header
        className="fixed top-0 left-0 right-0 md:left-64 z-30 h-14 flex items-center justify-between px-5 md:px-8"
        style={{
          background: "rgba(255,255,255,0.85)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(0,0,0,0.06)",
          boxShadow: "0 1px 20px rgba(0,0,0,0.04)",
        }}
      >
        {/* Left: page title */}
        <div className="flex items-center gap-3">
          {/* Spacer for hamburger on mobile */}
          <div className="w-8 md:hidden" />
          <div>
            <h1 className="text-gray-900 font-bold text-base md:text-lg leading-tight">
              {pageTitle}
            </h1>
            <p className="hidden md:block text-[11px] text-gray-400 font-medium leading-none mt-0.5">
              Dinas Pendidikan Kabupaten Melawi
            </p>
          </div>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-3">
          {/* Bell notification icon */}
          <button
            className="relative w-9 h-9 rounded-xl flex items-center justify-center text-gray-500 hover:text-teal-600 hover:bg-teal-50 transition-all duration-200"
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
                  background: "linear-gradient(135deg, #0d9488, #0f766e)",
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
