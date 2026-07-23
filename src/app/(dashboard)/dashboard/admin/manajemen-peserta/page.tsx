"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardBody } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { UsersIcon, ArrowPathIcon } from "@heroicons/react/24/outline";
import { userService, getErrorMessage } from "@/lib/api";
import type { Peserta } from "@/types";

// Konfigurasi perhitungan keaktifan
const TOTAL_HARI = 90; // total hari magang (silakan sesuaikan)
const TOTAL_TUGAS = 10; // jumlah tugas yang ditargetkan

function hitungKeaktifan(hadir: number, tugas: number): number {
  const hadirScore = TOTAL_HARI > 0 ? hadir / TOTAL_HARI : 0; // 0..1
  const tugasScore = TOTAL_TUGAS > 0 ? tugas / TOTAL_TUGAS : 0; // 0..1
  const avgScore = (hadirScore + tugasScore) / 2; // rata-rata
  const persen = Math.round(avgScore * 100);
  return Math.min(100, Math.max(0, persen)); // jaga tetap di 0–100
}

type SortBy = "hadir" | "tugas" | "name";
type SortOrder = "asc" | "desc";

export default function ManajemenPesertaPage() {
  const { user } = useAuth();
  const [peserta, setPeserta] = useState<Peserta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  // Debounce input pencarian (ringan di device low-end)
  const debounceRef = useRef<number | null>(null);
  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 250);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [search]);

  const fetchPeserta = async () => {
    try {
      setLoading(true);
      setError("");
      const { data } = await userService.getAdminPeserta();
      setPeserta(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError(getErrorMessage(err) || "Gagal mengambil data peserta.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPeserta();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 🔍 Filter & Sort (memoized)
  const filteredPeserta = useMemo(() => {
    const q = debouncedSearch.toLowerCase();

    let list = peserta.filter((p) => {
      if (!q) return true;
      return (
        p.name?.toLowerCase().includes(q) || p.email?.toLowerCase().includes(q)
      );
    });

    list.sort((a, b) => {
      let valA: string | number = a[sortBy];
      let valB: string | number = b[sortBy];

      if (typeof valA === "string") valA = valA.toLowerCase();
      if (typeof valB === "string") valB = valB.toLowerCase();

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return list;
  }, [peserta, debouncedSearch, sortBy, sortOrder]);

  return (
    <div className="flex min-h-screen w-full bg-gray-50/50 overflow-x-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Konten utama */}
      <div className="flex-1 md:ml-64 flex flex-col min-w-0">
        <Navbar />

        <main className="flex-1 mt-14 px-4 sm:px-6 lg:px-8 py-6 w-full max-w-7xl mx-auto">
          <div className="space-y-6">
            
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-teal-100 rounded-xl">
                  <UsersIcon className="w-6 h-6 text-teal-700" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                    Manajemen Peserta
                  </h1>
                  <p className="text-gray-500 text-sm">
                    Monitoring kehadiran dan aktivitas tugas peserta magang
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-100 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
                  Total: {filteredPeserta.length} Peserta
                </span>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div
                role="alert"
                className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl shadow-sm text-sm font-medium flex items-center gap-2"
              >
                <span>⚠️</span> {error}
              </div>
            )}

            {/* Main Content Area */}
            <Card>
              <CardBody className="p-5">
                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end mb-6">
                  <div className="md:col-span-6">
                    <Input
                      label="Pencarian"
                      placeholder="Cari nama atau email..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>

                  <div className="md:col-span-3">
                    <label className="text-sm font-semibold text-gray-700 block mb-1.5">Urutkan Berdasarkan</label>
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as SortBy)}
                      className="w-full text-sm p-2.5 rounded-xl bg-white border border-gray-200 text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors"
                    >
                      <option value="name">Nama</option>
                      <option value="hadir">Jumlah Hadir</option>
                      <option value="tugas">Jumlah Tugas</option>
                    </select>
                  </div>

                  <div className="md:col-span-3">
                    <label className="text-sm font-semibold text-gray-700 block mb-1.5">Arah Urutan</label>
                    <select
                      value={sortOrder}
                      onChange={(e) => setSortOrder(e.target.value as SortOrder)}
                      className="w-full text-sm p-2.5 rounded-xl bg-white border border-gray-200 text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors"
                    >
                      <option value="asc">Menaik (A-Z / Terkecil)</option>
                      <option value="desc">Menurun (Z-A / Terbesar)</option>
                    </select>
                  </div>
                </div>

                {/* Loading State */}
                {loading && (
                  <div className="flex flex-col items-center justify-center py-16 text-teal-600">
                    <ArrowPathIcon className="w-8 h-8 animate-spin mb-3" />
                    <p className="text-sm font-semibold">Memuat data peserta...</p>
                  </div>
                )}

                {/* Data Table / List */}
                {!loading && !error && (
                  <>
                    {/* Mobile list (kartu) */}
                    <div className="block md:hidden space-y-4">
                      {filteredPeserta.length === 0 ? (
                        <div className="text-center text-gray-500 py-10 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                          Tidak ada peserta ditemukan.
                        </div>
                      ) : (
                        filteredPeserta.map((p) => (
                          <div key={p._id} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
                            <p className="font-bold text-gray-900 truncate">{p.name}</p>
                            <p className="text-xs text-gray-500 truncate mb-3">{p.email}</p>
                            
                            <div className="flex flex-wrap gap-2">
                              <span className="px-2.5 py-1 text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100 rounded-lg">
                                Hadir: {p.hadir}
                              </span>
                              <span className="px-2.5 py-1 text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-100 rounded-lg">
                                Tugas: {p.tugas}
                              </span>
                              <span className="px-2.5 py-1 text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-100 rounded-lg">
                                Aktif: {hitungKeaktifan(p.hadir, p.tugas)}%
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Table (md ke atas) */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="min-w-full text-sm text-left text-gray-700 border-t border-gray-100">
                        <thead className="bg-gray-50/80 text-gray-800">
                          <tr>
                            <th scope="col" className="px-6 py-4 font-bold">Nama</th>
                            <th scope="col" className="px-6 py-4 font-bold">Email</th>
                            <th scope="col" className="px-6 py-4 text-center font-bold">Kehadiran</th>
                            <th scope="col" className="px-6 py-4 text-center font-bold">Tugas</th>
                            <th scope="col" className="px-6 py-4 text-center font-bold">Keaktifan</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                          {filteredPeserta.length === 0 ? (
                            <tr>
                              <td colSpan={5} className="px-6 py-12 text-center text-gray-500 bg-gray-50/30">
                                Tidak ada peserta ditemukan.
                              </td>
                            </tr>
                          ) : (
                            filteredPeserta.map((p) => (
                              <tr key={p._id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-6 py-4">
                                  <span className="block font-semibold text-gray-900 truncate max-w-[240px]">
                                    {p.name}
                                  </span>
                                </td>
                                <td className="px-6 py-4">
                                  <span className="block text-gray-500 truncate max-w-[240px]">
                                    {p.email}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                  <span className="inline-flex items-center justify-center min-w-[3rem] px-2 py-1 text-xs font-bold bg-blue-50 text-blue-700 border border-blue-100 rounded-lg">
                                    {p.hadir}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                  <span className="inline-flex items-center justify-center min-w-[3rem] px-2 py-1 text-xs font-bold bg-amber-50 text-amber-700 border border-amber-100 rounded-lg">
                                    {p.tugas}
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-center">
                                  <span className="inline-flex items-center justify-center min-w-[3.5rem] px-2 py-1 text-xs font-bold bg-teal-50 text-teal-700 border border-teal-100 rounded-lg">
                                    {hitungKeaktifan(p.hadir, p.tugas)}%
                                  </span>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </CardBody>
            </Card>

          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}
