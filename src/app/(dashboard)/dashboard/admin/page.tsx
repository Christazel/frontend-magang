"use client";

import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useEffect, useState } from "react";
import { Users, FileText, TrendingUp, Activity } from "lucide-react";

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

// === Konfigurasi keaktifan (sama dengan manajemen peserta) ===
const TOTAL_HARI = 90; // total hari magang (silakan sesuaikan)
const TOTAL_TUGAS = 10; // jumlah tugas target

type PesertaStats = {
  _id: string;
  name: string;
  email: string;
  hadir: number;
  tugas: number;
};

function hitungKeaktifan(hadir: number, tugas: number): number {
  const hadirScore = TOTAL_HARI > 0 ? hadir / TOTAL_HARI : 0; // 0..1
  const tugasScore = TOTAL_TUGAS > 0 ? tugas / TOTAL_TUGAS : 0; // 0..1
  const avgScore = (hadirScore + tugasScore) / 2; // rata-rata
  const persen = Math.round(avgScore * 100);
  return Math.min(100, Math.max(0, persen)); // jaga 0–100
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    totalInterns: 0,
    reportsSubmitted: 0,
    averageActivity: 0, // rata-rata keaktifan semua peserta
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStats = async () => {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;

      if (!token) {
        console.warn("Token tidak ditemukan di dashboard admin.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");

      try {
        const [pesertaRes, reportRes] = await Promise.all([
          // pakai endpoint yang sama dengan Manajemen Peserta
          fetch("/api/users/admin/peserta", {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch("/api/laporan/admin", {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        let pesertaData: PesertaStats[] = [];
        let reportData: any[] = [];

        if (pesertaRes.ok) {
          pesertaData = await pesertaRes.json();
        } else {
          const text = await pesertaRes.text();
          console.error(
            "Gagal mengambil data peserta (admin/peserta):",
            pesertaRes.status,
            text
          );
          setError("Gagal mengambil data peserta.");
        }

        if (reportRes.ok) {
          reportData = await reportRes.json();
        } else {
          const text = await reportRes.text();
          console.error(
            "Gagal mengambil data laporan (laporan/admin):",
            reportRes.status,
            text
          );
          if (!error) setError("Gagal mengambil data laporan.");
        }

        const totalInterns = Array.isArray(pesertaData)
          ? pesertaData.length
          : 0;
        const reportsSubmitted = Array.isArray(reportData)
          ? reportData.length
          : 0;

        // 🧮 hitung rata-rata keaktifan semua peserta
        let averageActivity = 0;
        if (totalInterns > 0 && Array.isArray(pesertaData)) {
          const totalPersen = pesertaData.reduce((sum, p) => {
            return sum + hitungKeaktifan(p.hadir ?? 0, p.tugas ?? 0);
          }, 0);
          averageActivity = Math.round(totalPersen / totalInterns);
          averageActivity = Math.min(100, Math.max(0, averageActivity));
        }

        setStats({
          totalInterns,
          reportsSubmitted,
          averageActivity,
        });
      } catch (err) {
        console.error("Gagal mengambil statistik:", err);
        setError("Terjadi kesalahan saat mengambil statistik dashboard.");
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  // Data chart
  const doughnutData = {
    labels: ["Peserta Magang", "Laporan Diterima"],
    datasets: [
      {
        data: [stats.totalInterns, stats.reportsSubmitted],
        backgroundColor: ["rgba(59, 130, 246, 0.8)", "rgba(139, 92, 246, 0.8)"],
        borderColor: ["rgba(59, 130, 246, 1)", "rgba(139, 92, 246, 1)"],
        borderWidth: 2,
        hoverBackgroundColor: [
          "rgba(37, 99, 235, 0.9)",
          "rgba(124, 58, 237, 0.9)",
        ],
      },
    ],
  };

  const barData = {
    labels: ["Peserta Magang", "Laporan Diterima"],
    datasets: [
      {
        label: "Jumlah",
        data: [stats.totalInterns, stats.reportsSubmitted],
        backgroundColor: ["rgba(59, 130, 246, 0.8)", "rgba(139, 92, 246, 0.8)"],
        borderColor: ["rgba(59, 130, 246, 1)", "rgba(139, 92, 246, 1)"],
        borderWidth: 2,
        borderRadius: 8,
        hoverBackgroundColor: [
          "rgba(37, 99, 235, 0.9)",
          "rgba(124, 58, 237, 0.9)",
        ],
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
                    Selamat Datang, {user?.name || "Admin"}!
                  </h1>
                </div>
                <p className="text-sm text-blue-100 ml-14">
                  Dashboard Monitoring Sistem Magang • Role:{" "}
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
                  <span className="text-gray-600 font-medium">
                    Memuat data dashboard...
                  </span>
                </div>
              </div>
            )}

            {/* Stat Cards + Chart Section */}
            {!loading && !error && (
              <>
                {/* Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  <StatCard
                    title="Total Peserta Magang"
                    value={stats.totalInterns}
                    icon={<Users className="w-8 h-8" />}
                    gradient="from-blue-500 to-blue-600"
                    lightColor="bg-blue-50"
                    textColor="text-blue-600"
                  />
                  <StatCard
                    title="Laporan Masuk"
                    value={stats.reportsSubmitted}
                    icon={<FileText className="w-8 h-8" />}
                    gradient="from-purple-500 to-purple-600"
                    lightColor="bg-purple-50"
                    textColor="text-purple-600"
                  />
                  <StatCard
                    title="Tingkat Keaktifan"
                    value={
                      stats.totalInterns > 0
                        ? `${stats.averageActivity}%`
                        : "0%"
                    }
                    icon={<TrendingUp className="w-8 h-8" />}
                    gradient="from-green-500 to-emerald-600"
                    lightColor="bg-green-50"
                    textColor="text-green-600"
                  />
                </div>

                {/* Chart Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
                    <h2 className="text-lg font-bold mb-4 text-gray-800">
                      Perbandingan Data
                    </h2>
                    <div className="h-64 flex items-center justify-center">
                      <Doughnut data={doughnutData} options={doughnutOptions} />
                    </div>
                  </div>
                  <div className="bg-white p-6 rounded-2xl shadow-lg border border-gray-100">
                    <h2 className="text-lg font-bold mb-4 text-gray-800">
                      Grafik Statistik
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
  isPercentage = false,
}: {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  gradient: string;
  lightColor: string;
  textColor: string;
  isPercentage?: boolean;
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
