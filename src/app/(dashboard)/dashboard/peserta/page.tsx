"use client";

import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useEffect, useState } from "react";
import { Calendar, TrendingUp, Activity, CheckCircle } from "lucide-react";

// Chart.js
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  ChartOptions,
} from "chart.js";
import { Doughnut, Bar } from "react-chartjs-2";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

// 🔧 Selalu gunakan proxy Vercel
const API_BASE = "/api";

type Presensi = {
  _id: string;
  tanggal: string; // YYYY-MM-DD
  jamMasuk?: string; // HH:mm:ss
  jamKeluar?: string; // HH:mm:ss
  lokasiMasuk?: string;
  lokasiKeluar?: string;
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
        headers: { Authorization: `Bearer ${token}` },
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
        if (item.jamMasuk) count.hadir++;
        else if (item.keterangan === "izin") count.izin++;
        else if (item.keterangan === "sakit") count.sakit++;
      });

      setStats(count);
    } catch (_err) {
      console.error("❌ Gagal mengambil data presensi:", _err);
      setError("Terjadi kesalahan saat mengambil data presensi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPresensi();
  }, []);

  // Data chart
  const doughnutData = {
    labels: ["Hadir", "Belum Hadir"],
    datasets: [
      {
        data: [stats.hadir, TOTAL_HARI - stats.hadir],
        backgroundColor: ["rgba(34, 197, 94, 0.8)", "rgba(229, 231, 235, 0.8)"],
        borderColor: ["rgba(34, 197, 94, 1)", "rgba(209, 213, 219, 1)"],
        borderWidth: 2,
        hoverBackgroundColor: ["rgba(22, 163, 74, 0.9)", "rgba(209, 213, 219, 0.9)"],
      },
    ],
  };

  const barData = {
    labels: ["Hadir", "Belum Hadir"],
    datasets: [
      {
        label: "Jumlah Hari",
        data: [stats.hadir, TOTAL_HARI - stats.hadir],
        backgroundColor: ["rgba(34, 197, 94, 0.8)", "rgba(229, 231, 235, 0.8)"],
        borderColor: ["rgba(34, 197, 94, 1)", "rgba(209, 213, 219, 1)"],
        borderWidth: 2,
        borderRadius: 8,
        hoverBackgroundColor: ["rgba(22, 163, 74, 0.9)", "rgba(209, 213, 219, 0.9)"],
      },
    ],
  };

  const barOptions: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        padding: 12,
        titleFont: { size: 14, weight: "bold" },
        bodyFont: { size: 13 },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: "rgba(0, 0, 0, 0.05)" },
      },
      x: {
        grid: { display: false },
      },
    },
  };

  const doughnutOptions: ChartOptions<"doughnut"> = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          padding: 20,
          font: { size: 13 },
          usePointStyle: true,
          pointStyle: "circle",
        },
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        padding: 12,
        titleFont: { size: 14, weight: "bold" },
        bodyFont: { size: 13 },
      },
    },
  };

  const persenKehadiran = Math.round((stats.hadir / TOTAL_HARI) * 100);

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Sidebar />
      <div className="flex-1 md:ml-64 flex flex-col">
        <Navbar />
        <main className="flex-1 mt-14 px-4 sm:px-6 lg:px-10 py-8">
          <div className="max-w-7xl mx-auto space-y-8">
            {/* Welcome Section */}
            <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 to-purple-600 p-8 rounded-2xl shadow-xl">
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-white bg-opacity-20 rounded-lg backdrop-blur-sm">
                    <Activity className="w-6 h-6 text-white" />
                  </div>
                  <h1 className="text-2xl md:text-3xl font-bold text-white">
                    Selamat Datang, {user?.name || "Peserta"}!
                  </h1>
                </div>
                <p className="text-sm text-blue-100 ml-14">
                  Dashboard Presensi Magang • Role:{" "}
                  <span className="font-semibold text-white bg-white bg-opacity-20 px-3 py-1 rounded-full">
                    {user?.role}
                  </span>
                </p>
              </div>
            </div>

            {/* Error / Loading */}
            {error && (
              <div className="bg-red-50 border-l-4 border-red-500 text-red-700 px-6 py-4 rounded-lg shadow-sm">
                <div className="flex items-center gap-2">
                  <span className="text-xl">⚠️</span>
                  <span className="font-medium">{error}</span>
                </div>
              </div>
            )}
            {loading && (
              <div className="bg-white p-8 rounded-2xl shadow-lg">
                <div className="flex items-center justify-center gap-3">
                  <div className="w-5 h-5 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-gray-600 font-medium">Memuat data presensi...</span>
                </div>
              </div>
            )}

            {/* Stat Cards */}
            {!loading && !error && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  <StatCard
                    title="Total Kehadiran"
                    value={stats.hadir}
                    icon={<CheckCircle className="w-8 h-8" />}
                    gradient="from-green-500 to-emerald-600"
                    lightColor="bg-green-50"
                    textColor="text-green-600"
                  />
                  <StatCard
                    title="Total Periode"
                    value={TOTAL_HARI}
                    icon={<Calendar className="w-8 h-8" />}
                    gradient="from-blue-500 to-blue-600"
                    lightColor="bg-blue-50"
                    textColor="text-blue-600"
                  />
                  <StatCard
                    title="Tingkat Kehadiran"
                    value={`${persenKehadiran}%`}
                    icon={<TrendingUp className="w-8 h-8" />}
                    gradient="from-purple-500 to-purple-600"
                    lightColor="bg-purple-50"
                    textColor="text-purple-600"
                  />
                </div>

                {/* Chart Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
                    <h2 className="text-lg font-bold mb-4 text-gray-800">
                      Perbandingan Kehadiran
                    </h2>
                    <div className="h-64 flex items-center justify-center">
                      <Doughnut data={doughnutData} options={doughnutOptions} />
                    </div>
                  </div>
                  <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
                    <h2 className="text-lg font-bold mb-4 text-gray-800">
                      Grafik Kehadiran
                    </h2>
                    <div className="h-64">
                      <Bar data={barData} options={barOptions} />
                    </div>
                  </div>
                </div>
              </>
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
  icon,
  gradient,
  lightColor,
  textColor,
}: {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  gradient: string;
  lightColor: string;
  textColor: string;
}) {
  return (
    <div className="group bg-white p-6 rounded-2xl shadow-lg border border-gray-100 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
      <div className="flex items-start justify-between mb-4">
        <div
          className={`p-3 ${lightColor} rounded-xl group-hover:scale-110 transition-transform`}
        >
          <div className={textColor}>{icon}</div>
        </div>
      </div>
      <h2 className="text-sm font-medium text-gray-600 mb-2">{title}</h2>
      <p
        className={`text-4xl font-bold bg-gradient-to-r ${gradient} bg-clip-text text-transparent`}
      >
        {value}
      </p>
    </div>
  );
}