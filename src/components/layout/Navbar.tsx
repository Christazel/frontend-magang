"use client";

import { useAuth } from "@/context/AuthContext";
import { laporanService, getErrorMessage } from "@/lib/api";
import type { NotifikasiRevisi } from "@/types";
import { BellIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { useEffect, useRef, useState } from "react";

export default function Navbar() {
  const { user } = useAuth();
  const [notifikasi, setNotifikasi] = useState<NotifikasiRevisi[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Hanya fetch notifikasi jika peserta
  useEffect(() => {
    if (user?.role !== "peserta") return;
    const fetchNotifikasi = async () => {
      try {
        const { data } = await laporanService.getNotifikasi();
        setNotifikasi(Array.isArray(data) ? data : []);
      } catch {
        // Silent fail — notifikasi bukan fitur kritis
      }
    };
    fetchNotifikasi();
    const interval = setInterval(fetchNotifikasi, 60000); // poll setiap 1 menit
    return () => clearInterval(interval);
  }, [user]);

  // Tutup dropdown saat klik di luar
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleTandaiDibaca = async (id: string) => {
    try {
      await laporanService.tandaiDibaca(id);
      setNotifikasi((prev) => prev.filter((n) => n._id !== id));
    } catch (err) {
      console.error("Gagal menandai dibaca:", getErrorMessage(err));
    }
  };

  const jumlahNotif = notifikasi.length;

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
        {/* Left: Brand */}
        <div className="flex items-center gap-3">
          <div className="w-8 md:hidden" />
          <div className="flex items-center gap-2">
            <span
              className="hidden md:inline-flex w-2 h-2 rounded-full animate-pulse"
              style={{ background: "linear-gradient(135deg, #0b2c65, #0b2c65)" }}
            />
            <span className="hidden md:block text-sm font-semibold text-gray-700 tracking-tight">
              Dashboard SIPMA Melawi
            </span>
            <span className="md:hidden text-sm font-bold text-gray-800 tracking-tight">
              SIPMA
            </span>
          </div>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-3">

          {/* ─── Bell Notification (Khusus Peserta) ─── */}
          {user?.role === "peserta" && (
            <div className="relative" ref={dropdownRef}>
              <button
                id="btn-notifikasi"
                onClick={() => setShowDropdown((v) => !v)}
                className="relative w-9 h-9 rounded-xl flex items-center justify-center text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200"
                aria-label="Notifikasi Revisi Laporan"
              >
                <BellIcon className="w-5 h-5" />
                {jumlahNotif > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white animate-bounce">
                    {jumlahNotif}
                  </span>
                )}
              </button>

              {/* Dropdown Notifikasi */}
              {showDropdown && (
                <div className="absolute right-0 top-11 w-80 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50">
                  {/* Header */}
                  <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-gray-900 text-sm">Notifikasi Laporan</p>
                      <p className="text-xs text-gray-500">
                        {jumlahNotif > 0
                          ? `${jumlahNotif} laporan perlu direvisi`
                          : "Semua laporan sudah dibaca"}
                      </p>
                    </div>
                    <button
                      onClick={() => setShowDropdown(false)}
                      className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <XMarkIcon className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Isi Notifikasi */}
                  <div className="max-h-72 overflow-y-auto">
                    {notifikasi.length === 0 ? (
                      <div className="px-4 py-8 text-center">
                        <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-3">
                          <span className="text-2xl">✅</span>
                        </div>
                        <p className="text-sm font-semibold text-gray-700">Tidak ada notifikasi</p>
                        <p className="text-xs text-gray-400 mt-1">Semua laporan sudah sesuai</p>
                      </div>
                    ) : (
                      notifikasi.map((n) => (
                        <div
                          key={n._id}
                          className="px-4 py-3 border-b border-gray-50 hover:bg-rose-50/40 transition-colors group"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 bg-rose-100 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                              <span className="text-sm">📋</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-900 truncate">
                                {n.judul}
                              </p>
                              <p className="text-xs text-rose-600 font-medium mt-0.5">
                                Perlu Revisi
                              </p>
                              {n.adminCatatan && (
                                <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                  &quot;{n.adminCatatan}&quot;
                                </p>
                              )}
                            </div>
                            <button
                              onClick={() => handleTandaiDibaca(n._id)}
                              className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-rose-100 text-gray-400 hover:text-rose-600 transition-all flex-shrink-0"
                              title="Tandai dibaca"
                            >
                              <XMarkIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Admin: Bell icon kosong (tanpa notifikasi) */}
          {user?.role === "admin" && (
            <button
              className="relative w-9 h-9 rounded-xl flex items-center justify-center text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-all duration-200"
              aria-label="Notifikasi"
            >
              <BellIcon className="w-5 h-5" />
            </button>
          )}

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

      {/* Spacer */}
      <div className="h-14" />
    </>
  );
}
