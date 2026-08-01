"use client";

import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Users, FileText, TrendingUp, Activity, CheckCircle2, Clock, ShieldAlert, ArrowRight, AlertCircle } from "lucide-react";
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
  const error = errorPeserta || errorLaporan ? "Gagal memuat data analitik dashboard." : "";

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
      toast.success(`Akun ${p.name} berhasil disetujui.`);
      mutatePeserta();
    } catch {
      toast.error("Gagal menyetujui akun peserta.");
    } finally {
      setApprovingId(null);
    }
  };

  // Doughnut 1: Status Laporan Tugas
  const laporanDoughnutData = {
    labels: ["Disetujui", "Perlu Revisi", "Menunggu Review"],
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
        borderWidth: 1.5,
      },
    ],
  };

  // Doughnut 2: Status Akun Peserta
  const akunDoughnutData = {
    labels: ["Aktif", "Menunggu Approval", "Ditolak"],
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
        borderWidth: 1.5,
      },
    ],
  };

  // Bar Chart: Top Keaktifan Peserta
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
        borderWidth: 1,
        borderRadius: 5,
      },
      {
        label: "Jumlah Tugas",
        data: topPeserta.map((p) => p.tugas),
        backgroundColor: "rgba(245, 158, 11, 0.85)",
        borderColor: "rgba(245, 158, 11, 1)",
        borderWidth: 1,
        borderRadius: 5,
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
          padding: 14,
          font: { size: 11 },
          usePointStyle: true,
          pointStyle: "circle",
        },
      },
      tooltip: {
        backgroundColor: "rgba(15, 23, 42, 0.9)",
        padding: 10,
        titleFont: { size: 12, weight: "bold" },
        bodyFont: { size: 11 },
      },
    },
  };

  const barOptions: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top",
        labels: { font: { size: 11 }, usePointStyle: true },
      },
      tooltip: {
        backgroundColor: "rgba(15, 23, 42, 0.9)",
        padding: 10,
        titleFont: { size: 12, weight: "bold" },
        bodyFont: { size: 11 },
      },
    },
    scales: {
      y: { beginAtZero: true, grid: { color: "rgba(0, 0, 0, 0.04)" }, ticks: { font: { size: 11 } } },
      x: { grid: { display: false }, ticks: { font: { size: 11 } } },
    },
  };

  return (
    <div className="flex min-h-screen bg-gray-50/50">
      <Sidebar />
      <div className="flex-1 md:ml-64 flex flex-col min-w-0">
        <Navbar />
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 w-full max-w-7xl mx-auto">
          <div className="space-y-5">
            
            {/* Sleek Modern Welcome Banner */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-7 shadow-md border border-slate-800">
              <div className="absolute -right-8 -top-8 w-48 h-48 rounded-full bg-blue-500/10 blur-2xl pointer-events-none" />
              
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm border border-white/10">
                      <Activity className="w-5 h-5 text-blue-200" />
                    </div>
                    <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                      Selamat Datang, {user?.name || "Admin"}
                    </h1>
                  </div>
                  <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-xl md:ml-9">
                    Ringkasan statistik kehadiran, verifikasi peserta, dan evaluasi laporan tugas magang.
                  </p>
                </div>
                
                <div className="shrink-0 md:self-end">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-white/10 border border-white/15 text-slate-200 text-xs font-medium tracking-wide backdrop-blur-sm">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Role: {user?.role}
                  </span>
                </div>
              </div>
            </div>

            {/* Error State */}
            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl shadow-xs flex items-center gap-2 text-xs font-medium">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <Card glass className="p-8 flex flex-col items-center justify-center gap-3 border-dashed border-2 border-blue-200 bg-blue-50/20">
                <div className="w-6 h-6 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <span className="text-blue-700 font-medium text-xs">
                  Memuat statistik analitik...
                </span>
              </Card>
            )}

            {/* Main Content */}
            {!loading && !error && (
              <>
                {/* 4 Metrics Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard
                    label="Total Peserta Magang"
                    value={totalInterns}
                    icon={<Users className="w-5 h-5 text-teal-600" />}
                    color="teal"
                  />
                  <StatCard
                    label="Menunggu Approval"
                    value={pendingUsers.length}
                    icon={<Clock className="w-5 h-5 text-amber-600" />}
                    color="amber"
                  />
                  <StatCard
                    label="Laporan Diterima"
                    value={reportsSubmitted}
                    icon={<FileText className="w-5 h-5 text-blue-600" />}
                    color="blue"
                  />
                  <StatCard
                    label="Rata-rata Keaktifan"
                    value={`${averageActivity}%`}
                    icon={<TrendingUp className="w-5 h-5 text-emerald-600" />}
                    color="teal"
                  />
                </div>

                {/* Action Widget: Pending Approval */}
                {pendingUsers.length > 0 && (
                  <div className="bg-amber-50/70 border border-amber-200/80 rounded-xl p-4 shadow-xs space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-amber-900 font-semibold text-xs sm:text-sm">
                        <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>Verifikasi Akun Baru ({pendingUsers.length} Menunggu Persetujuan)</span>
                      </div>
                      <Link
                        href="/dashboard/admin/manajemen-peserta"
                        className="text-xs font-semibold text-amber-700 hover:text-amber-900 flex items-center gap-1 hover:underline"
                      >
                        Lihat Semua <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                      {pendingUsers.slice(0, 3).map((p) => (
                        <div key={p._id} className="bg-white p-3 rounded-lg border border-amber-100 flex items-center justify-between shadow-xs">
                          <div className="min-w-0 pr-2">
                            <p className="text-xs font-semibold text-slate-900 truncate">{p.name}</p>
                            <p className="text-[11px] text-slate-500 truncate">{p.email}</p>
                          </div>
                          <button
                            onClick={() => handleQuickApprove(p)}
                            disabled={approvingId === p._id}
                            className="shrink-0 px-2.5 py-1 text-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition-colors flex items-center gap-1 disabled:opacity-50"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Setujui
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3 Interactive Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  
                  {/* Chart 1: Status Laporan */}
                  <Card hoverable className="flex flex-col border border-gray-100">
                    <CardHeader title="Status Laporan Tugas" subtitle="Distribusi review dokumen" />
                    <CardBody className="flex-1 flex items-center justify-center min-h-[240px] p-3">
                      <div className="w-full h-full max-h-[240px] relative">
                        <Doughnut data={laporanDoughnutData} options={doughnutOptions} />
                      </div>
                    </CardBody>
                  </Card>

                  {/* Chart 2: Status Akun Peserta */}
                  <Card hoverable className="flex flex-col border border-gray-100">
                    <CardHeader title="Status Persetujuan Akun" subtitle="Distribusi pendaftaran peserta" />
                    <CardBody className="flex-1 flex items-center justify-center min-h-[240px] p-3">
                      <div className="w-full h-full max-h-[240px] relative">
                        <Doughnut data={akunDoughnutData} options={doughnutOptions} />
                      </div>
                    </CardBody>
                  </Card>

                  {/* Chart 3: Top Keaktifan */}
                  <Card hoverable className="flex flex-col border border-gray-100">
                    <CardHeader title="Ringkasan Keaktifan" subtitle="Perbandingan kehadiran & tugas" />
                    <CardBody className="flex-1 flex items-center justify-center min-h-[240px] p-3">
                      <div className="w-full h-full max-h-[240px] relative">
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
