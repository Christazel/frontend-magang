"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, LogOut, LayoutDashboard, Users, ClipboardList, MessageSquare, FileText, CheckSquare } from "lucide-react";

export default function Sidebar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  if (!user) return null;

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const isActive = (path: string) => pathname === path;

  const adminMenuItems = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/dashboard/admin/rekap-presensi", icon: ClipboardList, label: "Rekap Presensi" },
    { href: "/dashboard/admin/manajemen-peserta", icon: Users, label: "Manajemen Peserta" },
    { href: "/dashboard/admin/laporan", icon: FileText, label: "Rekap Laporan Tugas" },
    { href: "/dashboard/admin/feedback", icon: MessageSquare, label: "Feedback & Evaluasi" },
  ];

  const pesertaMenuItems = [
    { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/dashboard/peserta/presensi", icon: CheckSquare, label: "Presensi" },
    { href: "/dashboard/peserta/laporan", icon: FileText, label: "Laporan Tugas Magang" },
    { href: "/dashboard/peserta/feedback", icon: MessageSquare, label: "Feedback" },
  ];

  const menuItems = user.role === "admin" ? adminMenuItems : pesertaMenuItems;

  return (
    <>
      {/* Button Hamburger untuk Mobile */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-4 left-4 z-50 bg-gradient-to-r from-blue-600 to-blue-700 text-white p-2.5 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 transition-transform duration-300 ease-in-out
          w-64 bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white h-full fixed top-0 left-0 z-40 shadow-2xl flex flex-col justify-between`}
      >
        <div className="flex flex-col h-full">
          {/* Header dengan User Info */}
          <div className="p-6 border-b border-gray-700/50">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                <span className="text-lg font-bold">{user.name?.charAt(0).toUpperCase()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold truncate">{user.name}</h3>
                <p className="text-xs text-gray-400 capitalize">{user.role}</p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <nav className="flex-1 px-4 py-6 overflow-y-auto">
            <ul className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                        active
                          ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg"
                          : "text-gray-300 hover:bg-gray-700/50 hover:text-white"
                      }`}
                    >
                      <Icon 
                        size={20} 
                        className={`${active ? "text-white" : "text-gray-400 group-hover:text-white"} transition-colors`}
                      />
                      <span className="text-sm font-medium">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* Logout Button */}
          <div className="p-4 border-t border-gray-700/50">
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-4 py-3 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <LogOut size={18} />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay untuk Mobile */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden transition-opacity duration-300"
        />
      )}
    </>
  );
}