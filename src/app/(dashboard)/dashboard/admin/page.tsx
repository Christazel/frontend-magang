"use client";

import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Users, FileText, TrendingUp, Activity } from "lucide-react";
import useSWR from "swr";
import { fetcher } from "@/lib/api";
import { Card, CardHeader, CardBody, StatCard } from "@/components/ui/Card";
import type { Peserta } from "@/types";

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

function hitungKeaktifan(hadir: number, tugas: number): number {
  const hadirScore = TOTAL_HARI > 0 ? hadir / TOTAL_HARI : 0; // 0..1
  const tugasScore = TOTAL_TUGAS > 0 ? tugas / TOTAL_TUGAS : 0; // 0..1
  const avgScore = (hadirScore + tugasScore) / 2; // rata-rata
  const persen = Math.round(avgScore * 100);
  return Math.min(100, Math.max(0, persen)); // jaga 0–100
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const { data: pesertaData, error: errorPeserta, isLoading: loadingPeserta } = useSWR<Peserta[]>("/users/admin/peserta", fetcher);
  const { data: laporanData, error: errorLaporan, isLoading: loadingLaporan } = useSWR<any[]>("/laporan/admin", fetcher);

  const loading = loadingPeserta || loadingLaporan;
  const error = errorPeserta || errorLaporan ? "Terjadi kesalahan saat mengambil statistik dashboard." : "";

  const totalInterns = Array.isArray(pesertaData) ? pesertaData.length : 0;
  const reportsSubmitted = Array.isArray(laporanData) ? laporanData.length : 0;

  // hitung rata-rata keaktifan semua peserta
  let averageActivity = 0;
  if (totalInterns > 0 && Array.isArray(pesertaData)) {
    const totalPersen = pesertaData.reduce((sum, p) => {
      return sum + hitungKeaktifan(p.hadir ?? 0, p.tugas ?? 0);
    }, 0);
    averageActivity = Math.round(totalPersen / totalInterns);
    averageActivity = Math.min(100, Math.max(0, averageActivity));
  }

  const stats = {
    totalInterns,
    reportsSubmitted,
    averageActivity,
  };

  // Data chart
  const doughnutData = {
    labels: ["Peserta Magang", "Laporan Diterima"],
    datasets: [
      {
        data: [stats.totalInterns, stats.reportsSubmitted],
        backgroundColor: ["rgba(11, 44, 101, 0.85)", "rgba(37, 99, 235, 0.85)"],
        borderColor: ["rgba(11, 44, 101, 1)", "rgba(37, 99, 235, 1)"],
        borderWidth: 2,
        hoverBackgroundColor: [
          "rgba(6, 28, 71, 0.95)",
          "rgba(29, 78, 216, 0.95)",
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
        backgroundColor: ["rgba(11, 44, 101, 0.85)", "rgba(37, 99, 235, 0.85)"],
        borderColor: ["rgba(11, 44, 101, 1)", "rgba(37, 99, 235, 1)"],
        borderWidth: 2,
        borderRadius: 8,
        hoverBackgroundColor: [
          "rgba(6, 28, 71, 0.95)",
          "rgba(29, 78, 216, 0.95)",
        ],
      },
    ],
  };

  const barOptions: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
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
    maintainAspectRatio: false,
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
    <div className="flex min-h-screen bg-gray-50/50">
      <Sidebar />
      <div className="flex-1 md:ml-64 flex flex-col">
        <Navbar />
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8 w-full max-w-7xl mx-auto">
          <div className="space-y-6">
            {/* Welcome Section */}
            <div
              className="relative overflow-hidden rounded-2xl p-8 shadow-lg"
              style={{
                background: "linear-gradient(135deg, #0b2c65 0%, #1e3a8a 100%)",
              }}
            >
              {/* Background Decoration */}
              <div
                className="absolute -right-10 -top-10 w-64 h-64 rounded-full blur-3xl opacity-20 pointer-events-none"
                style={{ background: "#60a5fa" }}
              />
              <div
                className="absolute -bottom-10 right-20 w-48 h-48 rounded-full blur-2xl opacity-20 pointer-events-none"
                style={{ background: "#93c5fd" }}
              />

              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-md border border-white/20">
                      <Activity className="w-6 h-6 text-blue-100" />
                    </div>
                    <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                      Selamat Datang, {user?.name || "Admin"}!
                    </h1>
                  </div>
                  <p className="text-blue-100/90 md:ml-[3.25rem] text-sm leading-relaxed max-w-xl">
                    Pantau aktivitas dan perkembangan seluruh peserta magang Anda
                    melalui dashboard analitik terpusat ini.
                  </p>
                </div>
                <div className="shrink-0 md:self-end">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 border border-white/20 text-white text-xs font-semibold tracking-wide uppercase backdrop-blur-md">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-300 animate-pulse" />
                    Role: {user?.role}
                  </span>
                </div>
              </div>
            </div>

            {/* Error / Loading */}
            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 px-6 py-4 rounded-xl shadow-sm flex items-start gap-3">
                <span className="text-xl">⚠️</span>
                <span className="font-medium text-sm mt-0.5">{error}</span>
              </div>
            )}
            {loading && (
              <Card glass className="p-10 flex flex-col items-center justify-center gap-4 border-dashed border-2 border-blue-200 bg-blue-50/30">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-blue-700 font-semibold text-sm">
                  Menyiapkan data dashboard...
                </span>
              </Card>
            )}

            {/* Stat Cards & Charts */}
            {!loading && !error && (
              <>
                {/* Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <StatCard
                    label="Total Peserta"
                    value={stats.totalInterns}
                    icon={<Users className="w-6 h-6" />}
                    color="teal"
                  />
                  <StatCard
                    label="Laporan Diterima"
                    value={stats.reportsSubmitted}
                    icon={<FileText className="w-6 h-6" />}
                    color="blue"
                  />
                  <StatCard
                    label="Rata-rata Keaktifan"
                    value={`${stats.totalInterns > 0 ? stats.averageActivity : 0}%`}
                    icon={<TrendingUp className="w-6 h-6" />}
                    color="amber"
                  />
                </div>

                {/* Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <Card hoverable className="flex flex-col">
                    <CardHeader title="Komposisi Data" subtitle="Perbandingan peserta dan laporan" />
                    <CardBody className="flex-1 flex items-center justify-center min-h-[300px]">
                      <div className="w-full h-full max-h-[300px] relative">
                        <Doughnut data={doughnutData} options={doughnutOptions} />
                      </div>
                    </CardBody>
                  </Card>
                  <Card hoverable className="flex flex-col">
                    <CardHeader title="Grafik Statistik" subtitle="Volume data dalam angka" />
                    <CardBody className="flex-1 flex items-center justify-center min-h-[300px]">
                      <div className="w-full h-full max-h-[300px] relative">
                        <Bar data={barData} options={barOptions} />
                      </div>
                    </CardBody>
                  </Card>
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
