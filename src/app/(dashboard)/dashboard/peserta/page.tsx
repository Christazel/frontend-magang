"use client";

import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useEffect, useState } from "react";
import { Calendar, TrendingUp, Activity, CheckCircle, FileText, AlertTriangle, ArrowRight } from "lucide-react";
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
      console.error("❌ Gagal mengambil data dashboard:", _err);
      setError(getErrorMessage(_err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const sisaHari = Math.max(0, TOTAL_HARI - stats.hadir - stats.izin - stats.sakit);

  // 🍩 Doughnut 1: Presensi & Izin Breakdown
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
        borderWidth: 2,
      },
    ],
  };

  // 📊 Bar 2: Status Laporan Tugas Saya
  const barData = {
    labels: ["Disetujui (Sesuai)", "Perlu Revisi", "Menunggu Review"],
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
        borderWidth: 1.5,
        borderRadius: 6,
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
        padding: 12,
      },
    },
    scales: {
      y: { beginAtZero: true, grid: { color: "rgba(0, 0, 0, 0.05)" } },
      x: { grid: { display: false } },
    },
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
      },
    },
  };

  const persenKehadiran = Math.round((stats.hadir / TOTAL_HARI) * 100);

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
                style={{ background: "#5eead4" }}
              />
              <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-md border border-white/20">
                      <Activity className="w-6 h-6 text-blue-100" />
                    </div>
                    <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                      Selamat Datang, {user?.name || "Peserta"}!
                    </h1>
                  </div>
                  <p className="text-blue-100/90 md:ml-[3.25rem] text-sm leading-relaxed max-w-xl">
                    Pantau grafik tingkat kehadiran dan riwayat laporan magang Anda secara realtime.
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

            {/* Alert Banner jika ada Laporan Revisi */}
            {!loading && !error && revisiLaporanList.length > 0 && (
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-rose-100 text-rose-700 rounded-xl mt-0.5">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-rose-900">
                        Perhatian: {revisiLaporanList.length} Laporan Dikembalikan untuk Direvisi!
                      </h2>
                      <p className="text-xs text-rose-700 mt-0.5">
                        {revisiLaporanList[0]?.judul} — Catatan Admin: &quot;{revisiLaporanList[0]?.adminCatatan || "Perbaiki dokumen"}&quot;
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/dashboard/peserta/laporan"
                    className="inline-flex items-center gap-1 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl transition-colors shrink-0 self-start sm:self-auto"
                  >
                    Upload Ulang <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )}

            {/* Stat Cards & Charts */}
            {!loading && !error && (
              <>
                {/* 4 Metrics */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  <StatCard
                    label="Total Kehadiran"
                    value={`${stats.hadir} Hari`}
                    icon={<CheckCircle className="w-6 h-6" />}
                    color="teal"
                  />
                  <StatCard
                    label="Tingkat Kehadiran"
                    value={`${persenKehadiran}%`}
                    icon={<TrendingUp className="w-6 h-6" />}
                    color="amber"
                  />
                  <StatCard
                    label="Izin & Sakit"
                    value={`${stats.izin + stats.sakit} Hari`}
                    icon={<Calendar className="w-6 h-6" />}
                    color="blue"
                  />
                  <StatCard
                    label="Laporan Disetujui"
                    value={`${laporanStats.sesuai} Laporan`}
                    icon={<FileText className="w-6 h-6" />}
                    color="teal"
                  />
                </div>

                {/* 2 Interactive Charts */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  <Card hoverable className="flex flex-col">
                    <CardHeader title="Komposisi Kehadiran" subtitle="Breakdown hadir, izin, sakit & sisa hari" />
                    <CardBody className="flex-1 flex items-center justify-center min-h-[280px] p-4">
                      <div className="w-full h-full max-h-[280px] relative">
                        <Doughnut data={doughnutData} options={doughnutOptions} />
                      </div>
                    </CardBody>
                  </Card>
                  <Card hoverable className="flex flex-col">
                    <CardHeader title="Status Laporan Tugas Saya" subtitle="Perbandingan status review tugas" />
                    <CardBody className="flex-1 flex items-center justify-center min-h-[280px] p-4">
                      <div className="w-full h-full max-h-[280px] relative">
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
