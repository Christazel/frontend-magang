"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

// 🔧 Selalu gunakan proxy Vercel
const API_BASE = "/api";

interface Peserta {
  _id: string;
  name: string;
  email: string;
  hadir: number;
  tugas: number;
}

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

      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) {
        setError("Token tidak ditemukan, silakan login ulang.");
        setLoading(false);
        return;
      }

      const res = await fetch(`${API_BASE}/users/admin/peserta`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data?.msg || "Gagal mengambil data peserta.");
        setLoading(false);
        return;
      }

      setPeserta(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("❌ fetchPeserta error:", err);
      setError("Terjadi kesalahan saat mengambil data peserta.");
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
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar />

      {/* Konten utama */}
      <div className="flex-1 md:ml-64 flex flex-col">
        <Navbar />

        <main className="flex-1 mt-14 px-3 sm:px-4 lg:px-8 py-6">
          <div className="mx-auto w-full max-w-7xl space-y-6">
            {/* Welcome Box */}
            <div className="bg-white p-4 sm:p-6 md:p-8 rounded-xl shadow">
              <h1 className="text-lg sm:text-xl font-semibold text-gray-900">
                Manajemen Peserta
              </h1>
              <p className="text-gray-600 mt-1 text-sm sm:text-base">
                Monitoring kehadiran & tugas peserta
              </p>
            </div>

            {/* Error / Loading */}
            {error && (
              <div
                role="alert"
                className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg"
              >
                {error}
              </div>
            )}

            {loading && (
              <div className="bg-white p-6 rounded-xl shadow text-gray-600">
                <div className="animate-pulse space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-1/3" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                  <div className="h-4 bg-gray-200 rounded w-2/3" />
                </div>
              </div>
            )}

            {/* Filter & Sort */}
            {!loading && !error && (
              <div className="bg-white p-4 sm:p-6 rounded-xl shadow">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 items-start md:items-center">
                  {/* Input cari – hanya perkuat warna, layout TIDAK diubah */}
                  <input
                    type="text"
                    placeholder="Cari nama atau email…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="
                      w-full p-2.5 rounded-lg shadow-sm
                      bg-white text-gray-800 placeholder:text-gray-500
                      border border-gray-300
                      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                      hover:border-gray-400
                      dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700 dark:placeholder:text-gray-500
                    "
                    aria-label="Cari peserta"
                  />

                  {/* Selects – hanya perkuat warna, layout TIDAK diubah */}
                  <div className="grid grid-cols-2 gap-3">
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as SortBy)}
                      className="
                        p-2.5 rounded-lg shadow-sm font-medium
                        bg-white text-gray-800
                        border border-gray-300
                        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                        hover:border-gray-400
                        dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700
                      "
                      aria-label="Urutkan berdasarkan"
                    >
                      <option value="name">Nama</option>
                      <option value="hadir">Jumlah Hadir</option>
                      <option value="tugas">Jumlah Tugas</option>
                    </select>

                    <select
                      value={sortOrder}
                      onChange={(e) =>
                        setSortOrder(e.target.value as SortOrder)
                      }
                      className="
                        p-2.5 rounded-lg shadow-sm font-medium
                        bg-white text-gray-800
                        border border-gray-300
                        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                        hover:border-gray-400
                        dark:bg-gray-900 dark:text-gray-100 dark:border-gray-700
                      "
                      aria-label="Arah pengurutan"
                    >
                      <option value="asc">Naik (Asc)</option>
                      <option value="desc">Turun (Desc)</option>
                    </select>
                  </div>

                  {/* Ringkasan jumlah (sembunyikan di layar kecil) */}
                  <div className="hidden md:flex justify-end">
                    <span className="text-sm text-gray-500">
                      Total: <b>{filteredPeserta.length}</b> peserta
                    </span>
                  </div>
                </div>

                {/* Mobile list (kartu) */}
                <div className="mt-4 grid sm:hidden gap-3">
                  {filteredPeserta.length === 0 && (
                    <p className="text-center text-gray-500 py-4">
                      Tidak ada peserta ditemukan.
                    </p>
                  )}

                  {filteredPeserta.map((p) => (
                    <div
                      key={p._id}
                      className="rounded-lg border bg-white p-4 shadow-sm"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p
                            className="font-semibold text-gray-900 truncate"
                            title={p.name}
                          >
                            {p.name}
                          </p>
                          <p
                            className="text-sm text-gray-600 truncate"
                            title={p.email}
                          >
                            {p.email}
                          </p>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-md">
                            Hadir: {p.hadir}
                          </span>
                          <span className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded-md">
                            Tugas: {p.tugas}
                          </span>
                          <span className="px-2 py-1 text-xs bg-emerald-100 text-emerald-700 rounded-md">
                            Aktif: {hitungKeaktifan(p.hadir, p.tugas)}%
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Table (md ke atas) */}
                <div className="mt-4 overflow-x-auto hidden md:block">
                  <table className="min-w-full text-sm text-left text-gray-700">
                    <thead className="bg-gray-50 text-gray-900">
                      <tr>
                        <th scope="col" className="px-4 py-3 font-medium">
                          Nama
                        </th>
                        <th scope="col" className="px-4 py-3 font-medium">
                          Email
                        </th>
                        <th
                          scope="col"
                          className="px-4 py-3 text-center font-medium"
                        >
                          Jumlah Hadir
                        </th>
                        <th
                          scope="col"
                          className="px-4 py-3 text-center font-medium"
                        >
                          Jumlah Tugas
                        </th>
                        <th
                          scope="col"
                          className="px-4 py-3 text-center font-medium"
                        >
                          Keaktifan
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      {filteredPeserta.map((p) => (
                        <tr key={p._id} className="border-t hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium">
                            <span
                              className="block max-w-[280px] lg:max-w-none truncate"
                              title={p.name}
                            >
                              {p.name}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className="block max-w-[360px] xl:max-w-none truncate"
                              title={p.email}
                            >
                              {p.email}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="inline-block px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-md">
                              {p.hadir}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="inline-block px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded-md">
                              {p.tugas}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="inline-block px-2 py-1 text-xs bg-emerald-100 text-emerald-700 rounded-md">
                              {hitungKeaktifan(p.hadir, p.tugas)}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {filteredPeserta.length === 0 && (
                    <p className="text-center text-gray-500 mt-4">
                      Tidak ada peserta ditemukan.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
}
