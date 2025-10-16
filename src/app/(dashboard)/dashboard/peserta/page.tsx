"use client";

import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useEffect, useState } from "react";

// Gunakan env bila ada: NEXT_PUBLIC_API_URL=/api
const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || "/api";

type Presensi = {
  _id: string;
  tanggal: string; // YYYY-MM-DD
  jamMasuk?: string; // HH:mm:ss
  jamKeluar?: string; // HH:mm:ss
  lokasiMasuk?: string;
  lokasiKeluar?: string;

  // Untuk data lama yang masih ada keterangan
  keterangan?: "hadir" | "izin" | "sakit";
};

export default function PesertaDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ hadir: 0, sakit: 0, izin: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const TOTAL_HARI = 90; // periode default 90 hari

  const fetchPresensi = async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await fetch(`${API_BASE}/presensi/riwayat`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.status === 401) {
        localStorage.removeItem("token");
        window.location.href = "/login";
        return;
      }

      const data: Presensi[] = await res.json();
      if (!res.ok) {
        setError((data as any)?.msg || "Gagal mengambil data presensi");
        return;
      }

      const count = { hadir: 0, sakit: 0, izin: 0 };

      data.forEach((item) => {
        if (item.jamMasuk) {
          count.hadir++;
        } else if (item.keterangan === "izin") {
          count.izin++;
        } else if (item.keterangan === "sakit") {
          count.sakit++;
        }
      });

      setStats(count);
    } catch (err) {
      console.error("❌ Gagal mengambil data presensi:", err);
      setError("Terjadi kesalahan saat mengambil data presensi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPresensi();
  }, []);

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      <div className="flex-1 md:ml-64 flex flex-col">
        <Navbar />
        <main className="flex-1 mt-14 px-4 sm:px-6 lg:px-10 py-8">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Welcome Box */}
            <div className="bg-white p-4 sm:p-6 md:p-8 rounded-lg shadow-md">
              <h1 className="text-xl font-bold text-gray-800">
                Selamat Datang, {user?.name || "Peserta"}!
              </h1>
              <p className="text-gray-600 mt-1">
                Anda login sebagai <span className="font-medium">{user?.role}</span>
              </p>
            </div>

            {/* Error / Loading */}
            {error && (
              <div className="bg-red-100 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}
            {loading && (
              <div className="bg-white p-6 rounded-lg shadow text-gray-600">
                Memuat data presensi...
              </div>
            )}

            {/* Statistik Presensi */}
            {!loading && !error && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard
                  title="Jumlah Hadir"
                  value={stats.hadir}
                  total={TOTAL_HARI}
                  color="blue"
                />
              </div>
            )}
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  total,
  color,
}: {
  title: string;
  value: number;
  total: number;
  color: "blue" | "yellow" | "red";
}) {
  const persen = Math.round((value / total) * 100);
  const colorClass =
    color === "blue"
      ? "bg-blue-600"
      : color === "yellow"
      ? "bg-yellow-500"
      : "bg-red-500";

  return (
    <div className="bg-white p-5 rounded-lg shadow-md">
      <h2 className="text-sm font-medium text-gray-600">{title}</h2>
      <p className={`text-3xl font-bold mt-1 ${colorClass} bg-clip-text text-transparent`}>
        {value}
      </p>
      <div className="w-full bg-gray-200 rounded-full h-3 mt-3">
        <div
          className={`${colorClass} h-3 rounded-full`}
          style={{ width: `${persen}%` }}
        />
      </div>
      <p className="text-xs text-gray-500 mt-2">
        {persen}% dari {total} hari
      </p>
    </div>
  );
}
