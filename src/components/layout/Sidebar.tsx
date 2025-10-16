"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Menu, X, LogOut } from "lucide-react";

export default function Sidebar() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  if (!user) return null;

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <>
      {/* Button Hamburger untuk Mobile */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="md:hidden fixed top-4 left-4 z-50 text-white bg-gray-800 p-2 rounded"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Sidebar */}
      <aside
        className={`${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 transition-transform duration-300 ease-in-out
          w-64 bg-gray-900 text-white h-full fixed top-0 left-0 z-40 shadow-lg flex flex-col justify-between`}
      >
        <div className="p-6 overflow-y-auto">
          <h2 className="text-xl font-semibold mb-6">Menu</h2>
          <ul className="space-y-4">
            <li>
              <Link
                href="/dashboard"
                className="block hover:bg-gray-700 rounded px-4 py-2 transition"
              >
                Dashboard
              </Link>
            </li>

            {user.role === "admin" && (
              <>
                <li>
                  <Link
                    href="/dashboard/admin/rekap-presensi"
                    className="block hover:bg-gray-700 rounded px-4 py-2 transition"
                  >
                    Rekap Presensi
                  </Link>
                </li>
                <li>
                  <Link
                    href="/dashboard/admin/manajemen-peserta"
                    className="block hover:bg-gray-700 rounded px-4 py-2 transition"
                  >
                    Manajemen Peserta
                  </Link>
                </li>
                <li>
                  <Link
                    href="/dashboard/admin/laporan"
                    className="block hover:bg-gray-700 rounded px-4 py-2 transition"
                  >
                    Rekap Laporan Tugas
                  </Link>
                </li>
                <li>
                  <Link
                    href="/dashboard/admin/feedback"
                    className="block hover:bg-gray-700 rounded px-4 py-2 transition"
                  >
                    Feedback & Evaluasi
                  </Link>
                </li>
              </>
            )}

            {user.role === "peserta" && (
              <>
                <li>
                  <Link
                    href="/dashboard/peserta/presensi"
                    className="block hover:bg-gray-700 rounded px-4 py-2 transition"
                  >
                    Presensi
                  </Link>
                </li>
                <li>
                  <Link
                    href="/dashboard/peserta/laporan"
                    className="block hover:bg-gray-700 rounded px-4 py-2 transition"
                  >
                    Laporan Tugas Magang
                  </Link>
                </li>
                <li>
                  <Link
                    href="/dashboard/peserta/feedback"
                    className="block hover:bg-gray-700 rounded px-4 py-2 transition"
                  >
                    Feedback
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>

        {/* Tombol Logout */}
        <div className="p-4 border-t border-gray-700">
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded transition"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* Overlay untuk Mobile */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden"
        />
      )}
    </>
  );
}
