"use client";

import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Users, FileText, TrendingUp, Activity, CheckCircle2, Clock, ShieldAlert, ArrowRight } from "lucide-react";
import useSWR from "swr";
import { fetcher, userService } from "@/lib/api";
import { Card, CardHeader, CardBody, StatCard } from "@/components/ui/Card";
import type { Peserta, Laporan } from "@/types";
import Link from "next/link";
import toast from "react-hot-toast";
import { useState } from "react";

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

const TOTAL_HARI = 90;
const TOTAL_TUGAS = 10;

function hitungKeaktifan(hadir: number, tugas: number): number {
  const hadirScore = TOTAL_HARI > 0 ? hadir / TOTAL_HARI : 0;
  const tugasScore = TOTAL_TUGAS > 0 ? tugas / TOTAL_TUGAS : 0;
  const avgScore = (hadirScore + tugasScore) / 2;
  const persen = Math.round(avgScore * 100);
  return Math.min(100, Math.max(0, persen));
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const { data: pesertaData, error: errorPeserta, isLoading: loadingPeserta, mutate: mutatePeserta } = useSWR<Peserta[]>("/users/admin/peserta", fetcher);
  const { data: laporanData, error: errorLaporan, isLoading: loadingLaporan } = useSWR<Laporan[]>("/laporan/admin", fetcher);

  const [approvingId, setApprovingId] = useState<string | null>(null);

  const loading = loadingPeserta || loadingLaporan;
  const error = errorPeserta || errorLaporan ? "Terjadi kesalahan saat mengambil statistik dashboard." : "";

  const totalInterns = Array.isArray(pesertaData) ? pesertaData.length : 0;
  const reportsSubmitted = Array.isArray(laporanData) ? laporanData.length : 0;

  // Breakdown status peserta
  const approvedUsers = Array.isArray(pesertaData) ? pesertaData.filter((p) => (p.status || "approved") === "approved").length : 0;
  const pendingUsers = Array.isArray(pesertaData) ? pesertaData.filter((p) => p.status === "pending") : [];
  const rejectedUsers = Array.isArray(pesertaData) ? pesertaData.filter((p) => p.status === "rejected").length : 0;

  // Breakdown status laporan
  const sesuaiLaporan = Array.isArray(laporanData) ? laporanData.filter((l) => l.status === "sesuai").length : 0;
  const revisiLaporan = Array.isArray(laporanData) ? laporanData.filter((l) => l.status === "revisi").length : 0;
  const pendingLaporan = Array.isArray(laporanData) ? laporanData.filter((l) => !l.status || l.status === "pending") : [];

  // Hitung rata-rata keaktifan
  let averageActivity = 0;
  if (totalInterns > 0 && Array.isArray(pesertaData)) {
    const totalPersen = pesertaData.reduce((sum, p) => {
      return sum + hitungKeaktifan(p.hadir ?? 0, p.tugas ?? 0);
    }, 0);
    averageActivity = Math.round(totalPersen / totalInterns);
    averageActivity = Math.min(100, Math.max(0, averageActivity));
  }

  // Quick Approve Akun Peserta
  const handleQuickApprove = async (p: Peserta) => {
    setApprovingId(p._id);
    try {
      await userService.updateStatusPeserta(p._id, "approved");
      toast.success(`Akun ${p.name} berhasil disetujui! ✅`);
      mutatePeserta();
    } catch {
      toast.error("Gagal menyetujui akun peserta.");
    } finally {
      setApprovingId(null);
    }
  };

  // 🍩 Doughnut 1: Status Laporan Tugas
  const laporanDoughnutData = {
    labels: ["Disetujui (Sesuai)", "Perlu Revisi", "Menunggu Review"],
    datasets: [
      {
        data: [sesuaiLaporan, revisiLaporan, pendingLaporan.length],
        backgroundColor: [
          "rgba(16, 185, 129, 0.85)", // Emerald
          "rgba(244, 63, 94, 0.85)",  // Rose
          "rgba(245, 158, 11, 0.85)", // Amber
        ],
        borderColor: [
          "rgba(16, 185, 129, 1)",
          "rgba(244, 63, 94, 1)",
          "rgba(245, 158, 11, 1)",
        ],
        borderWidth: 2,
      },
    ],
  };

  // 🍩 Doughnut 2: Status Akun Peserta
  const akunDoughnutData = {
    labels: ["Aktif (Approved)", "Menunggu Approval", "Ditolak"],
    datasets: [
      {
        data: [approvedUsers, pendingUsers.length, rejectedUsers],
        backgroundColor: [
          "rgba(37, 99, 235, 0.85)",  // Blue
          "rgba(245, 158, 11, 0.85)", // Amber
          "rgba(244, 63, 94, 0.85)",  // Rose
        ],
        borderColor: [
          "rgba(37, 99, 235, 1)",
          "rgba(245, 158, 11, 1)",
          "rgba(244, 63, 94, 1)",
        ],
        borderWidth: 2,
      },
    ],
  };

  // 📊 Bar Chart: Top Keaktifan Peserta (Aktivitas Individu)
  const topPeserta = Array.isArray(pesertaData)
    ? [...pesertaData].sort((a, b) => b.hadir - a.hadir).slice(0, 6)
    : [];

  const barData = {
    labels: topPeserta.map((p) => p.name.split(" ")[0]),
    datasets: [
      {
        label: "Jumlah Hadir",
        data: topPeserta.map((p) => p.hadir),
        backgroundColor: "rgba(37, 99, 235, 0.85)",
        borderColor: "rgba(37, 99, 235, 1)",
        borderWidth: 1.5,
        borderRadius: 6,
      },
      {
        label: "Jumlah Tugas",
        data: topPeserta.map((p) => p.tugas),
        backgroundColor: "rgba(245, 158, 11, 0.85)",
        borderColor: "rgba(245, 158, 11, 1)",
        borderWidth: 1.5,
        borderRadius: 6,
      },
    ],
  };

  const doughnutOptions: ChartOptions<"doughnut"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          padding: 16,
          font: { size: 12 },
          usePointStyle: true,
          pointStyle: "circle",
        },
      },
      tooltip: {
        backgroundColor: "rgba(15, 23, 42, 0.9)",
        padding: 12,
        titleFont: { size: 13, weight: "bold" },
        bodyFont: { size: 12 },
      },
    },
  };

  const barOptions: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: { font: { size: 12 }, usePointStyle: true },
      },
      tooltip: {
        backgroundColor: "rgba(15, 23, 42, 0.9)",
        padding: 12,
      },
    },
    scales: {
      y: { beginAtZero: true, grid: { color: "rgba(0, 0, 0, 0.05)" } },
      x: { grid: { display: false } },
    },
  };

  return (
    <div className="flex min-h-screen bg-gray-50/50">
      <Sidebar />
      <div className="flex-1 md:ml-64 flex flex-col min-w-0">
        <Navbar />
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-8 w-full max-w-7xl mx-auto">
          <div className="space-y-6">
            
            {/* Welcome Banner */}
            <div
              className="relative overflow-hidden rounded-2xl p-8 shadow-lg"
              style={{
                background: "linear-gradient(135deg, #0b2c65 0%, #1e3a8a 100%)",
              }}
            >
              <div
                className="absolute -right-10 -top-10 w-64 h-64 rounded-full blur-3xl opacity-20 pointer-events-none"
                style={{ background: "#60a5fa" }}
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
                    Pantau statistik kehadiran, verifikasi akun baru, dan evaluasi laporan tugas magang secara terpusat.
                  </p>
                </div>
                <div className="shrink-0 md:self-end">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 border border-white/20 text-white text-xs font-semibold tracking-wide uppercase backdrop-blur-md">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Role: {user?.role}
                  </span>
                </div>
              </div>
            </div>

            {/* Error State */}
            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 px-6 py-4 rounded-xl shadow-sm flex items-start gap-3">
                <span className="text-xl">⚠️</span>
                <span className="font-medium text-sm mt-0.5">{error}</span>
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <Card glass className="p-10 flex flex-col items-center justify-center gap-4 border-dashed border-2 border-blue-200 bg-blue-50/30">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-blue-700 font-semibold text-sm">
                  Memuat data analitik dashboard...
                </span>
              </Card>
            )}

            {/* Main Dashboard Content */}
            {!loading && !error && (
              <>
                {/* 4 Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  <StatCard
                    label="Total Peserta"
                    value={totalInterns}
                    icon={<Users className="w-6 h-6" />}
                    color="teal"
                  />
                  <StatCard
                    label="Akun Menunggu Approval"
                    value={pendingUsers.length}
                    icon={<Clock className="w-6 h-6" />}
                    color="amber"
                  />
                  <StatCard
                    label="Laporan Diterima"
                    value={reportsSubmitted}
                    icon={<FileText className="w-6 h-6" />}
                    color="blue"
                  />
                  <StatCard
                    label="Rata-rata Keaktifan"
                    value={`${averageActivity}%`}
                    icon={<TrendingUp className="w-6 h-6" />}
                    color="teal"
                  />
                </div>

                {/* Quick Actions / Pending Approval Widget */}
                {pendingUsers.length > 0 && (
                  <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 text-amber-900 font-bold text-sm sm:text-base">
                        <ShieldAlert className="w-5 h-5 text-amber-600" />
                        <span>Verifikasi Akun Baru ({pendingUsers.length} Menunggu)</span>
                      </div>
                      <Link
                        href="/dashboard/admin/manajemen-peserta"
                        className="text-xs font-bold text-amber-700 hover:text-amber-900 flex items-center gap-1 hover:underline"
                      >
                        Lihat Semua <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {pendingUsers.slice(0, 3).map((p) => (
                        <div key={p._id} className="bg-white p-3.5 rounded-xl border border-amber-100 flex items-center justify-between shadow-xs">
                          <div className="min-w-0 pr-2">
                            <p className="text-xs font-bold text-gray-900 truncate">{p.name}</p>
                            <p className="text-[11px] text-gray-500 truncate">{p.email}</p>
                          </div>
                          <button
                            onClick={() => handleQuickApprove(p)}
                            disabled={approvingId === p._id}
                            className="shrink-0 px-2.5 py-1 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors flex items-center gap-1 disabled:opacity-50"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Approve
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3 Analytics Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                  
                  {/* Chart 1: Status Laporan */}
                  <Card hoverable className="flex flex-col">
                    <CardHeader title="Status Laporan Tugas" subtitle="Rasio verifikasi laporan" />
                    <CardBody className="flex-1 flex items-center justify-center min-h-[260px] p-4">
                      <div className="w-full h-full max-h-[260px] relative">
                        <Doughnut data={laporanDoughnutData} options={doughnutOptions} />
                      </div>
                    </CardBody>
                  </Card>

                  {/* Chart 2: Status Akun Peserta */}
                  <Card hoverable className="flex flex-col">
                    <CardHeader title="Status Persetujuan Akun" subtitle="Status registrasi peserta" />
                    <CardBody className="flex-1 flex items-center justify-center min-h-[260px] p-4">
                      <div className="w-full h-full max-h-[260px] relative">
                        <Doughnut data={akunDoughnutData} options={doughnutOptions} />
                      </div>
                    </CardBody>
                  </Card>

                  {/* Chart 3: Top Keaktifan Peserta */}
                  <Card hoverable className="flex flex-col">
                    <CardHeader title="Keaktifan Peserta" subtitle="Jumlah hadir & tugas terbanyak" />
                    <CardBody className="flex-1 flex items-center justify-center min-h-[260px] p-4">
                      <div className="w-full h-full max-h-[260px] relative">
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
