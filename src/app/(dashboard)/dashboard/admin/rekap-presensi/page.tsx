"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const API_BASE = "/api";
const ROWS_PER_PAGE = 10;

interface Presensi {
  _id: string;
  tanggal: string;
  jamMasuk?: string;
  jamKeluar?: string;
  lokasiMasuk?: string;
  lokasiKeluar?: string;
  user?: { name: string; email: string };
}

type Grouped = {
  user?: { name: string; email: string };
  presensi: Presensi[];
};

// Group flat array by user email
function groupByUser(data: Presensi[]): Grouped[] {
  const acc: Record<string, Grouped> = {};
  for (const item of data) {
    const key = item.user?.email || "unknown";
    if (!acc[key]) acc[key] = { user: item.user, presensi: [] };
    acc[key].presensi.push(item);
  }
  return Object.values(acc);
}

// ---- Skeleton ----
function Skeleton() {
  return (
    <div className="mt-6 space-y-3 animate-pulse">
      <div className="h-8 w-48 bg-gray-200 rounded" />
      {[1, 2, 3].map((i) => (
        <div key={i} className="h-24 bg-gray-200 rounded" />
      ))}
    </div>
  );
}

// ---- Pagination ----
function Pagination({
  page,
  totalPages,
  totalCount,
  perPage,
  onPrev,
  onNext,
}: {
  page: number;
  totalPages: number;
  totalCount: number;
  perPage: number;
  onPrev: () => void;
  onNext: () => void;
}) {
  const from = totalCount === 0 ? 0 : (page - 1) * perPage + 1;
  const to = Math.min(page * perPage, totalCount);

  return (
    <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
      <p className="text-sm text-gray-500">
        Menampilkan <span className="font-medium text-gray-700">{from}–{to}</span> dari{" "}
        <span className="font-medium text-gray-700">{totalCount}</span> data
        {totalPages > 1 && (
          <> &nbsp;(Hal. {page} / {totalPages})</>
        )}
      </p>
      <div className="flex gap-2">
        <button
          onClick={onPrev}
          disabled={page <= 1}
          className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          ← Sebelumnya
        </button>
        <button
          onClick={onNext}
          disabled={page >= totalPages}
          className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          Selanjutnya →
        </button>
      </div>
    </div>
  );
}

export default function RekapPresensiPage() {
  const [data, setData] = useState<Presensi[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Server-side search & pagination
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);

  // Pagination metadata from headers
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const debounceRef = useRef<number | null>(null);

  // Debounce search input → reset ke page 1 tiap search baru
  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 400);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [search]);

  const fetchPresensiAdmin = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        window.location.href = "/login";
        return;
      }

      // ✅ Search & pagination dikirim ke server — bukan di-filter di browser
      const params = new URLSearchParams({
        page: String(page),
        limit: String(ROWS_PER_PAGE),
      });
      if (debouncedSearch) params.set("search", debouncedSearch);

      const res = await fetch(`${API_BASE}/presensi/admin?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });

      const txt = await res.text();
      let result: any = null;
      try {
        result = JSON.parse(txt);
      } catch {
        if (!res.ok) throw new Error(txt || "Gagal mengambil data presensi");
      }

      if (!res.ok) {
        throw new Error(result?.msg || "Gagal mengambil data presensi");
      }

      // ✅ Baca metadata paginasi dari HTTP Headers
      setTotalCount(Number(res.headers.get("X-Total-Count") ?? 0));
      setTotalPages(Number(res.headers.get("X-Total-Pages") ?? 1));
      setData(Array.isArray(result) ? result : []);
    } catch (e: any) {
      setError(e?.message || "Terjadi kesalahan saat mengambil data presensi.");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => {
    fetchPresensiAdmin();
  }, [fetchPresensiAdmin]);

  const grouped = groupByUser(data);

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />

      <div className="flex-1 md:ml-64 flex flex-col">
        <Navbar />

        <main className="flex-1 mt-14 px-3 sm:px-5 lg:px-10 py-6">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="bg-white rounded-xl shadow p-4 sm:p-6">

              {/* Header + Search */}
              <div className="sticky -top-2 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 z-10 pb-3">
                <h1 className="text-lg sm:text-xl font-bold text-gray-800">
                  Rekap Presensi Peserta
                </h1>

                <div className="mt-3 flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-gray-400">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
                      </svg>
                    </span>
                    <input
                      id="search"
                      type="text"
                      inputMode="search"
                      placeholder="Cari nama / email peserta…"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full rounded-md border border-gray-300 pl-9 pr-3 py-2 sm:py-2.5 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                  {search && (
                    <button
                      onClick={() => setSearch("")}
                      className="px-4 py-2 rounded-md border border-gray-300 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      Reset
                    </button>
                  )}
                </div>

                {/* Info total dari server */}
                {!loading && !error && (
                  <p className="mt-2 text-xs text-gray-400">
                    {debouncedSearch
                      ? `Ditemukan ${totalCount} record untuk "${debouncedSearch}"`
                      : `Total ${totalCount} record di database`}
                  </p>
                )}
              </div>

              {/* Error */}
              {error && (
                <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-red-700 text-sm">
                  {error}
                </div>
              )}

              {/* Content */}
              {loading ? (
                <Skeleton />
              ) : grouped.length === 0 ? (
                <div className="mt-8 text-center py-12">
                  <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
                  </svg>
                  <p className="mt-3 text-gray-500 text-sm">
                    {debouncedSearch
                      ? `Tidak ada presensi yang cocok dengan "${debouncedSearch}".`
                      : "Belum ada data presensi."}
                  </p>
                </div>
              ) : (
                <>
                  <div className="mt-4 space-y-6">
                    {grouped.map((group) => (
                      <section
                        key={group.user?.email || "unknown"}
                        className="rounded-lg border border-gray-200 bg-gray-50 p-4 sm:p-5"
                      >
                        {/* Header User */}
                        <div className="mb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5">
                          <div>
                            <h2 className="text-base sm:text-lg font-semibold text-blue-700">
                              {group.user?.name || "Tanpa Nama"}
                            </h2>
                            <p className="text-xs sm:text-sm text-gray-600">
                              {group.user?.email}
                            </p>
                          </div>
                          <span className="text-xs text-gray-400 self-start sm:self-auto">
                            {group.presensi.length} record pada halaman ini
                          </span>
                        </div>

                        {/* ====== Tampilan MOBILE (cards) ====== */}
                        <div className="md:hidden space-y-3">
                          {group.presensi.map((p) => (
                            <article
                              key={p._id}
                              className="rounded-lg bg-white shadow-sm border border-gray-200 p-3"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-900">
                                  {p.tanggal ? new Date(p.tanggal).toLocaleDateString("id-ID") : "-"}
                                </span>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                                  Presensi
                                </span>
                              </div>
                              <dl className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[13px]">
                                <div>
                                  <dt className="text-gray-500">Jam Masuk</dt>
                                  <dd className="font-medium text-gray-900">{p.jamMasuk || "-"}</dd>
                                </div>
                                <div>
                                  <dt className="text-gray-500">Jam Keluar</dt>
                                  <dd className="font-medium text-gray-900">{p.jamKeluar || "-"}</dd>
                                </div>
                                <div className="col-span-2 mt-1 text-xs space-y-1">
                                  {p.lokasiMasuk && (
                                    <p>
                                      <span className="font-semibold text-green-700">Masuk:</span>{" "}
                                      <a href={`https://www.google.com/maps?q=${p.lokasiMasuk}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                                        Lihat Lokasi
                                      </a>
                                    </p>
                                  )}
                                  {p.lokasiKeluar && (
                                    <p>
                                      <span className="font-semibold text-red-700">Keluar:</span>{" "}
                                      <a href={`https://www.google.com/maps?q=${p.lokasiKeluar}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                                        Lihat Lokasi
                                      </a>
                                    </p>
                                  )}
                                </div>
                              </dl>
                            </article>
                          ))}
                        </div>

                        {/* ====== Tampilan DESKTOP (table) ====== */}
                        <div className="hidden md:block overflow-x-auto">
                          <table className="w-full border-collapse text-sm text-gray-800 bg-white rounded-lg overflow-hidden">
                            <thead>
                              <tr className="bg-gray-200 text-gray-900">
                                <th className="p-3 text-left">Tanggal</th>
                                <th className="p-3 text-left">Jam Masuk</th>
                                <th className="p-3 text-left">Jam Keluar</th>
                                <th className="p-3 text-left">Lokasi</th>
                              </tr>
                            </thead>
                            <tbody>
                              {group.presensi.map((p) => (
                                <tr key={p._id} className="odd:bg-white even:bg-gray-50 hover:bg-gray-100 transition-colors">
                                  <td className="p-3">
                                    {p.tanggal ? new Date(p.tanggal).toLocaleDateString("id-ID") : "-"}
                                  </td>
                                  <td className="p-3">{p.jamMasuk || "-"}</td>
                                  <td className="p-3">{p.jamKeluar || "-"}</td>
                                  <td className="p-3 text-xs space-y-1">
                                    {p.lokasiMasuk && (
                                      <p>
                                        <span className="font-semibold text-green-700">Masuk:</span>{" "}
                                        <a href={`https://www.google.com/maps?q=${p.lokasiMasuk}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline" title={p.lokasiMasuk}>
                                          Lihat Lokasi
                                        </a>
                                      </p>
                                    )}
                                    {p.lokasiKeluar && (
                                      <p>
                                        <span className="font-semibold text-red-700">Keluar:</span>{" "}
                                        <a href={`https://www.google.com/maps?q=${p.lokasiKeluar}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline" title={p.lokasiKeluar}>
                                          Lihat Lokasi
                                        </a>
                                      </p>
                                    )}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </section>
                    ))}
                  </div>

                  {/* ✅ Pagination Navigation */}
                  <Pagination
                    page={page}
                    totalPages={totalPages}
                    totalCount={totalCount}
                    perPage={ROWS_PER_PAGE}
                    onPrev={() => setPage((p) => Math.max(1, p - 1))}
                    onNext={() => setPage((p) => Math.min(totalPages, p + 1))}
                  />
                </>
              )}
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
}
