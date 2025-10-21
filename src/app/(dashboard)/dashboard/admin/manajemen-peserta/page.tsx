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

type SortKey = "name" | "hadir" | "tugas";
type SortDir = "asc" | "desc";

const badge = (val: number, color: "blue" | "purple") =>
  `px-2 py-0.5 text-xs rounded-md bg-${color}-100 text-${color}-700`;

export default function ManajemenPesertaPage() {
  const { user } = useAuth();
  const [peserta, setPeserta] = useState<Peserta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // filter & ui
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("name");
  const [sortOrder, setSortOrder] = useState<SortDir>("asc");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards"); // mobile-first

  // pagination
  const [pageSize, setPageSize] = useState(12);
  const [page, setPage] = useState(1);

  // debounce search (250ms)
  const tRef = useRef<number | null>(null);
  useEffect(() => {
    if (tRef.current) window.clearTimeout(tRef.current);
    tRef.current = window.setTimeout(() => setDebouncedSearch(search), 250);
    return () => {
      if (tRef.current) window.clearTimeout(tRef.current);
    };
  }, [search]);

  // fetch
  useEffect(() => {
    const controller = new AbortController();
    const fetchPeserta = async () => {
      try {
        setLoading(true);
        setError("");
        const token =
          typeof window !== "undefined" ? localStorage.getItem("token") : null;
        if (!token) {
          setError("Token tidak ditemukan, silakan login ulang.");
          return;
        }
        const res = await fetch(`${API_BASE}/users/admin/peserta`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
          cache: "no-store",
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data?.msg || "Gagal mengambil data peserta");
          return;
        }
        setPeserta(Array.isArray(data) ? data : []);
      } catch (err) {
        if ((err as any)?.name !== "AbortError") {
          console.error("❌ fetchPeserta error:", err);
          setError("Terjadi kesalahan saat mengambil data peserta.");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchPeserta();
    return () => controller.abort();
  }, []);

  // filter + sort
  const filteredSorted = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    const filtered = peserta.filter(
      (p) =>
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.email.toLowerCase().includes(q)
    );
    const sorted = filtered.sort((a, b) => {
      if (sortBy === "name") {
        const cmp = a.name.localeCompare(b.name, "id", { sensitivity: "base" });
        return sortOrder === "asc" ? cmp : -cmp;
      }
      // numeric
      const va = sortBy === "hadir" ? a.hadir : a.tugas;
      const vb = sortBy === "hadir" ? b.hadir : b.tugas;
      return sortOrder === "asc" ? va - vb : vb - va;
    });
    return sorted;
  }, [peserta, debouncedSearch, sortBy, sortOrder]);

  // pagination
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, sortBy, sortOrder, pageSize]);
  const total = filteredSorted.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize;
  const visible = filteredSorted.slice(start, start + pageSize);

  const toggleSort = (k: SortKey) => {
    if (k === sortBy) setSortOrder((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortBy(k);
      setSortOrder("asc");
    }
  };

  const clearFilters = () => setSearch("");

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 md:ml-64 flex flex-col min-w-0">
        <Navbar />

        {/* Filter bar lengket & responsif */}
        <div className="sticky top-16 z-30 bg-white/90 backdrop-blur border-b">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 py-3">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex-1 flex gap-2">
                <label htmlFor="search" className="sr-only">
                  Cari peserta
                </label>
                <input
                  id="search"
                  type="text"
                  placeholder="Cari nama / email…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                <button
                  type="button"
                  onClick={clearFilters}
                  className="h-10 px-3 rounded-lg border bg-white text-sm hover:bg-gray-50"
                >
                  Bersihkan
                </button>
              </div>

              <div className="flex gap-2">
                <div className="inline-flex rounded-lg border bg-white p-1">
                  <button
                    type="button"
                    onClick={() => setViewMode("cards")}
                    className={`px-3 h-8 rounded-md text-sm ${
                      viewMode === "cards" ? "bg-gray-100 font-medium" : ""
                    }`}
                  >
                    Kartu
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("table")}
                    className={`px-3 h-8 rounded-md text-sm ${
                      viewMode === "table" ? "bg-gray-100 font-medium" : ""
                    }`}
                  >
                    Tabel
                  </button>
                </div>

                <div className="hidden sm:flex items-center gap-2">
                  <span className="text-sm text-gray-600">Baris/hal:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                    className="h-8 rounded-md border bg-white px-2 text-sm"
                  >
                    {[6, 12, 24, 48].map((n) => (
                      <option key={n} value={n}>
                        {n}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* bar kontrol 2: sort + pagination (ringkas) */}
            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Urutkan:</span>
                <div className="inline-flex rounded-lg border bg-white p-1">
                  <button
                    type="button"
                    onClick={() => toggleSort("name")}
                    className={`px-3 h-8 rounded-md text-sm ${
                      sortBy === "name" ? "bg-gray-100 font-medium" : ""
                    }`}
                    aria-pressed={sortBy === "name"}
                  >
                    Nama
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleSort("hadir")}
                    className={`px-3 h-8 rounded-md text-sm ${
                      sortBy === "hadir" ? "bg-gray-100 font-medium" : ""
                    }`}
                    aria-pressed={sortBy === "hadir"}
                  >
                    Hadir
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleSort("tugas")}
                    className={`px-3 h-8 rounded-md text-sm ${
                      sortBy === "tugas" ? "bg-gray-100 font-medium" : ""
                    }`}
                    aria-pressed={sortBy === "tugas"}
                  >
                    Tugas
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setSortOrder((d) => (d === "asc" ? "desc" : "asc"))
                  }
                  className="h-8 px-3 rounded-lg border bg-white text-sm hover:bg-gray-50"
                  aria-label={`Arah urut: ${sortOrder}`}
                  title={`Arah urut: ${sortOrder}`}
                >
                  {sortOrder === "asc" ? "⬆️" : "⬇️"}
                </button>
              </div>

              {/* pagination ringkas untuk mobile */}
              <div className="sm:hidden flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  {total === 0
                    ? "0/0"
                    : `${start + 1}–${Math.min(start + pageSize, total)} dari ${total}`}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="h-8 px-3 rounded-md border bg-white text-sm disabled:opacity-50"
                    disabled={page <= 1}
                  >
                    Prev
                  </button>
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="h-8 px-3 rounded-md border bg-white text-sm disabled:opacity-50"
                    disabled={page >= totalPages}
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* MAIN */}
        <main className="flex-1">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 py-6">
            {/* Welcome Box */}
            <div className="bg-white p-4 sm:p-6 md:p-8 rounded-lg shadow-md">
              <h1 className="text-xl font-bold text-gray-800">Manajemen Peserta</h1>
              <p className="text-gray-600 mt-1">Monitoring kehadiran & tugas peserta</p>
            </div>

            {/* Error / Loading */}
            {error && (
              <div className="mt-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}
            {loading && !error && (
              <div className="mt-6 space-y-3" role="status" aria-busy="true">
                <div className="h-10 w-full max-w-md animate-pulse rounded-lg bg-gray-200" />
                <div className="h-24 w-full animate-pulse rounded-lg bg-gray-200" />
                <div className="h-24 w-full animate-pulse rounded-lg bg-gray-200" />
              </div>
            )}

            {/* Konten */}
            {!loading && !error && (
              <>
                {total === 0 ? (
                  <div className="mt-6 rounded-lg border bg-white p-6 text-sm">
                    Tidak ada peserta ditemukan.
                  </div>
                ) : (
                  <>
                    {/* View: Cards (mobile-first) */}
                    <section
                      className={`${
                        viewMode === "cards" ? "block" : "hidden sm:hidden"
                      } md:block md:sr-only`}
                    >
                      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                        {visible.map((p) => (
                          <article
                            key={p._id}
                            className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <h3 className="font-semibold text-gray-900 break-words">
                                  {p.name}
                                </h3>
                                <p className="text-sm text-gray-600 break-words">
                                  {p.email}
                                </p>
                              </div>
                            </div>
                            <div className="mt-3 flex items-center gap-2">
                              <span className={badge(p.hadir, "blue")}>
                                Hadir: {p.hadir}
                              </span>
                              <span className={badge(p.tugas, "purple")}>
                                Tugas: {p.tugas}
                              </span>
                            </div>
                          </article>
                        ))}
                      </div>
                    </section>

                    {/* View: Table (≥sm atau jika dipilih) */}
                    <section className={`${viewMode === "table" ? "block" : "hidden"} sm:block`}>
                      <div className="mt-6 overflow-x-auto rounded-lg border bg-white">
                        <table className="min-w-full text-sm">
                          <thead className="bg-gray-100 text-gray-900">
                            <tr className="border-b">
                              <th className="p-3 text-left w-1/4">
                                <button
                                  onClick={() => toggleSort("name")}
                                  className={`inline-flex items-center gap-1 underline-offset-4 ${
                                    sortBy === "name" ? "underline" : "hover:underline"
                                  }`}
                                >
                                  Nama {sortBy === "name" ? (sortOrder === "asc" ? "↑" : "↓") : ""}
                                </button>
                              </th>
                              <th className="p-3 text-left w-1/3">Email</th>
                              <th className="p-3 text-center w-1/6">
                                <button
                                  onClick={() => toggleSort("hadir")}
                                  className={`inline-flex items-center gap-1 underline-offset-4 ${
                                    sortBy === "hadir" ? "underline" : "hover:underline"
                                  }`}
                                >
                                  Jumlah Hadir{" "}
                                  {sortBy === "hadir" ? (sortOrder === "asc" ? "↑" : "↓") : ""}
                                </button>
                              </th>
                              <th className="p-3 text-center w-1/6">
                                <button
                                  onClick={() => toggleSort("tugas")}
                                  className={`inline-flex items-center gap-1 underline-offset-4 ${
                                    sortBy === "tugas" ? "underline" : "hover:underline"
                                  }`}
                                >
                                  Jumlah Tugas{" "}
                                  {sortBy === "tugas" ? (sortOrder === "asc" ? "↑" : "↓") : ""}
                                </button>
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {visible.map((p) => (
                              <tr key={p._id} className="border-t hover:bg-gray-50">
                                <td className="p-3 align-top break-words font-medium">
                                  {p.name}
                                </td>
                                <td className="p-3 align-top break-words">{p.email}</td>
                                <td className="p-3 align-top text-center">
                                  <span className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded-md">
                                    {p.hadir}
                                  </span>
                                </td>
                                <td className="p-3 align-top text-center">
                                  <span className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded-md">
                                    {p.tugas}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Pagination footer */}
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-sm text-gray-600">
                          Menampilkan {start + 1}–{Math.min(start + pageSize, total)} dari {total}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            className="h-9 px-3 rounded-md border bg-white text-sm disabled:opacity-50"
                            disabled={page <= 1}
                          >
                            Prev
                          </button>
                          <span className="text-sm text-gray-700">
                            {page} / {totalPages}
                          </span>
                          <button
                            type="button"
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            className="h-9 px-3 rounded-md border bg-white text-sm disabled:opacity-50"
                            disabled={page >= totalPages}
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    </section>
                  </>
                )}
              </>
            )}
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
}
