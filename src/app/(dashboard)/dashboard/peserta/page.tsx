"use client";

import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useEffect, useState } from "react";
import { Calendar, TrendingUp, Activity, CheckCircle, FileText, AlertTriangle, ArrowRight, AlertCircle } from "lucide-react";
import { Card, CardHeader, CardBody, StatCard } from "@/components/ui/Card";
import Link from "next/link";

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

import { presensiService, laporanService, getErrorMessage } from "@/lib/api";
import type { Presensi, Laporan } from "@/types";

export default function PesertaDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ hadir: 0, sakit: 0, izin: 0 });
  const [laporanStats, setLaporanStats] = useState({ total: 0, sesuai: 0, revisi: 0, pending: 0 });
  const [revisiLaporanList, setRevisiLaporanList] = useState<Laporan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const TOTAL_HARI = 90;

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      // 1. Fetch Presensi
      const { data: presensiRes } = await presensiService.getRiwayat();
      const presensiData: Presensi[] = Array.isArray(presensiRes) ? presensiRes : [];

      const count = { hadir: 0, sakit: 0, izin: 0 };
      presensiData.forEach((item) => {
        if (item.jamMasuk) count.hadir++;
        else if (item.keterangan === "izin") count.izin++;
        else if (item.keterangan === "sakit") count.sakit++;
      });
      setStats(count);

      // 2. Fetch Laporan Tugas
      const { data: laporanRes } = await laporanService.getAll();
      const laporanData: Laporan[] = Array.isArray(laporanRes) ? laporanRes : [];

      const lCount = { total: laporanData.length, sesuai: 0, revisi: 0, pending: 0 };
      const revisiArr: Laporan[] = [];

      laporanData.forEach((l) => {
        if (l.status === "sesuai") lCount.sesuai++;
        else if (l.status === "revisi") {
          lCount.revisi++;
          revisiArr.push(l);
        } else lCount.pending++;
      });

      setLaporanStats(lCount);
      setRevisiLaporanList(revisiArr);
    } catch (_err) {
      console.error("Gagal mengambil data dashboard:", _err);
      setError(getErrorMessage(_err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const sisaHari = Math.max(0, TOTAL_HARI - stats.hadir - stats.izin - stats.sakit);

  // Doughnut 1: Presensi & Izin Breakdown
  const doughnutData = {
    labels: ["Hadir", "Izin", "Sakit", "Sisa Hari"],
    datasets: [
      {
        data: [stats.hadir, stats.izin, stats.sakit, sisaHari],
        backgroundColor: [
          "rgba(16, 185, 129, 0.85)", // Emerald
          "rgba(59, 130, 246, 0.85)",  // Blue
          "rgba(245, 158, 11, 0.85)", // Amber
          "rgba(229, 231, 235, 0.8)", // Gray
        ],
        borderColor: [
          "rgba(16, 185, 129, 1)",
          "rgba(59, 130, 246, 1)",
          "rgba(245, 158, 11, 1)",
          "rgba(209, 213, 219, 1)",
        ],
        borderWidth: 1.5,
      },
    ],
  };

  // Bar 2: Status Laporan Tugas Saya
  const barData = {
    labels: ["Disetujui", "Perlu Revisi", "Menunggu Review"],
    datasets: [
      {
        label: "Jumlah Laporan",
        data: [laporanStats.sesuai, laporanStats.revisi, laporanStats.pending],
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
        borderWidth: 1,
        borderRadius: 5,
      },
    ],
  };

  const barOptions: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
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

  const persenKehadiran = Math.round((stats.hadir / TOTAL_HARI) * 100);

  return (
    <div className="flex min-h-screen bg-gray-50/50">
      <Sidebar />
      <div className="flex-1 md:ml-64 flex flex-col min-w-0">
        <Navbar />
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 w-full max-w-7xl mx-auto">
          <div className="space-y-5">
            
            {/* Sleek Modern Welcome Banner */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-7 shadow-md border border-slate-800">
              <div className="absolute -right-8 -top-8 w-48 h-48 rounded-full bg-teal-500/10 blur-2xl pointer-events-none" />
              
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm border border-white/10">
                      <Activity className="w-5 h-5 text-teal-200" />
                    </div>
                    <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight">
                      Selamat Datang, {user?.name || "Peserta"}
                    </h1>
                  </div>
                  <p className="text-slate-300 text-xs sm:text-sm leading-relaxed max-w-xl md:ml-9">
                    Pantau tingkat kehadiran, pengajuan izin, dan riwayat laporan magang Anda.
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
                  Memuat data presensi...
                </span>
              </Card>
            )}

            {/* Alert Banner jika ada Laporan Revisi */}
            {!loading && !error && revisiLaporanList.length > 0 && (
              <div className="bg-rose-50/90 border border-rose-200 rounded-xl p-4 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <div className="p-1.5 bg-rose-100 text-rose-700 rounded-lg shrink-0 mt-0.5">
                      <AlertTriangle className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-xs sm:text-sm font-bold text-rose-900">
                        {revisiLaporanList.length} Laporan Perlu Direvisi
                      </h2>
                      <p className="text-xs text-rose-700 mt-0.5">
                        {revisiLaporanList[0]?.judul} — Catatan Admin: &quot;{revisiLaporanList[0]?.adminCatatan || "Perbaiki dokumen"}&quot;
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/dashboard/peserta/laporan"
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-medium rounded-lg transition-colors shrink-0 self-start sm:self-auto"
                  >
                    Upload Ulang <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )}

            {/* Stat Cards & Charts */}
            {!loading && !error && (
              <>
                {/* 4 Metrics Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <StatCard
                    label="Total Kehadiran"
                    value={`${stats.hadir} Hari`}
                    icon={<CheckCircle className="w-5 h-5 text-emerald-600" />}
                    color="teal"
                  />
                  <StatCard
                    label="Tingkat Kehadiran"
                    value={`${persenKehadiran}%`}
                    icon={<TrendingUp className="w-5 h-5 text-amber-600" />}
                    color="amber"
                  />
                  <StatCard
                    label="Total Izin & Sakit"
                    value={`${stats.izin + stats.sakit} Hari`}
                    icon={<Calendar className="w-5 h-5 text-blue-600" />}
                    color="blue"
                  />
                  <StatCard
                    label="Laporan Disetujui"
                    value={`${laporanStats.sesuai} Dokumen`}
                    icon={<FileText className="w-5 h-5 text-emerald-600" />}
                    color="teal"
                  />
                </div>

                {/* 2 Interactive Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <Card hoverable className="flex flex-col border border-gray-100">
                    <CardHeader title="Komposisi Presensi" subtitle="Breakdown hadir, izin, sakit & sisa hari" />
                    <CardBody className="flex-1 flex items-center justify-center min-h-[250px] p-3">
                      <div className="w-full h-full max-h-[250px] relative">
                        <Doughnut data={doughnutData} options={doughnutOptions} />
                      </div>
                    </CardBody>
                  </Card>
                  <Card hoverable className="flex flex-col border border-gray-100">
                    <CardHeader title="Status Laporan Tugas" subtitle="Perbandingan status review dokumen" />
                    <CardBody className="flex-1 flex items-center justify-center min-h-[250px] p-3">
                      <div className="w-full h-full max-h-[250px] relative">
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
