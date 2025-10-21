"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

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

const badge = (tone: "blue" | "violet") =>
  `inline-flex items-center justify-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${
    tone === "blue"
      ? "bg-blue-50 text-blue-700 ring-blue-200"
      : "bg-violet-50 text-violet-700 ring-violet-200"
  }`;

export default function ManajemenPesertaPage() {
  const { user } = useAuth();
  const [peserta, setPeserta] = useState<Peserta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // UI state
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [view, setView] = useState<"table" | "cards">("table"); // default tabel di desktop

  const [pageSize, setPageSize] = useState(12);
  const [page, setPage] = useState(1);

  // debounce search
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
    const run = async () => {
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
      } catch (e: any) {
        if (e?.name !== "AbortError") {
          console.error(e);
          setError("Terjadi kesalahan saat mengambil data peserta.");
        }
      } finally {
        setLoading(false);
      }
    };
    run();
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
        return sortDir === "asc" ? cmp : -cmp;
      }
      const va = sortBy === "hadir" ? a.hadir : a.tugas;
      const vb = sortBy === "hadir" ? b.hadir : b.tugas;
      return sortDir === "asc" ? va - vb : vb - va;
    });
    return sorted;
  }, [peserta, debouncedSearch, sortBy, sortDir]);

  // pagination
  useEffect(() => setPage(1), [debouncedSearch, sortBy, sortDir, pageSize]);
  const total = filteredSorted.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = (page - 1) * pageSize;
  const visible = filteredSorted.slice(start, start + pageSize);

  const toggleSort = (key: SortKey) => {
    if (key === sortBy) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortBy(key);
      setSortDir("asc");
    }
  };

  const ClearButton = (
    <button
      type="button"
      onClick={() => setSearch("")}
      className="h-10 px-3 rounded-lg border border-gray-300 bg-white text-sm hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
    >
      Bersihkan
    </button>
  );

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <Sidebar />

      <div className="flex-1 md:ml-64 flex flex-col min-w-0">
        <Navbar />

        {/* Toolbar sticky */}
        <div className="sticky top-16 z-30 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/70 border-b">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 py-3">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex-1 flex gap-2">
                <label htmlFor="search" className="sr-only">
                  Cari nama atau email
                </label>
                <input
                  id="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  type="text"
                  placeholder="Cari nama / email…"
                  className="w-full h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm placeholder-slate-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                />
                {ClearButton}
              </div>

              <div className="flex items-center gap-2">
                <div className="inline-flex rounded-lg border border-slate-300 bg-white p-1">
                  <button
                    type="button"
                    onClick={() => setView("table")}
                    className={`px-3 h-8 rounded-md text-sm ${
                      view === "table" ? "bg-slate-100 font-medium" : ""
                    }`}
                    title="Tabel"
                  >
                    Tabel
                  </button>
                  <button
                    type="button"
                    onClick={() => setView("cards")}
                    className={`px-3 h-8 rounded-md text-sm ${
                      view === "cards" ? "bg-slate-100 font-medium" : ""
                    }`}
                    title="Kartu"
                  >
                    Kartu
                  </button>
                </div>

                <div className="hidden sm:flex items-center gap-2">
                  <span className="text-sm text-slate-600">Baris/hal:</span>
                  <select
                    value={pageSize}
                    onChange={(e) => setPageSize(Number(e.target.value))}
                    className="h-8 rounded-md border border-slate-300 bg-white px-2 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
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

            {/* Bar 2: Sort + pagination kecil (mobile) */}
            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-600">Urutkan:</span>
                <div className="inline-flex rounded-lg border border-slate-300 bg-white p-1">
                  <button
                    type="button"
                    onClick={() => toggleSort("name")}
                    className={`px-3 h-8 rounded-md text-sm ${
                      sortBy === "name" ? "bg-slate-100 font-medium" : ""
                    }`}
                  >
                    Nama
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleSort("hadir")}
                    className={`px-3 h-8 rounded-md text-sm ${
                      sortBy === "hadir" ? "bg-slate-100 font-medium" : ""
                    }`}
                  >
                    Hadir
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleSort("tugas")}
                    className={`px-3 h-8 rounded-md text-sm ${
                      sortBy === "tugas" ? "bg-slate-100 font-medium" : ""
                    }`}
                  >
                    Tugas
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
                  className="h-8 px-3 rounded-lg border border-slate-300 bg-white text-sm hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                  title={`Arah: ${sortDir}`}
                >
                  {sortDir === "asc" ? "↑" : "↓"}
                </button>
              </div>

              <div className="sm:hidden flex items-center justify-between">
                <span className="text-sm text-slate-600">
                  {total === 0
                    ? "0/0"
                    : `${start + 1}–${Math.min(start + pageSize, total)} dari ${total}`}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="h-8 px-3 rounded-md border border-slate-300 bg-white text-sm disabled:opacity-50"
                    disabled={page <= 1}
                  >
                    Prev
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    className="h-8 px-3 rounded-md border border-slate-300 bg-white text-sm disabled:opacity-50"
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
            {/* Headline card */}
            <div className="rounded-xl bg-white p-5 sm:p-6 shadow-sm ring-1 ring-slate-200">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Manajemen Peserta
              </h1>
              <p className="mt-1 text-slate-600">
                Monitoring kehadiran & tugas peserta
              </p>
            </div>

            {/* State */}
            {error && (
              <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}
            {loading && !error && (
              <div className="mt-6 space-y-3">
                <div className="h-10 w-full max-w-md animate-pulse rounded-lg bg-slate-200" />
                <div className="h-24 w-full animate-pulse rounded-lg bg-slate-200" />
                <div className="h-24 w-full animate-pulse rounded-lg bg-slate-200" />
              </div>
            )}

            {/* CONTENT */}
            {!loading && !error && (
              <>
                {total === 0 ? (
                  <div className="mt-6 rounded-xl bg-white p-6 text-sm shadow-sm ring-1 ring-slate-200">
                    Tidak ada peserta ditemukan.
                  </div>
                ) : (
                  <>
                    {/* TABLE view */}
                    <section className={`${view === "table" ? "block" : "hidden"} sm:block`}>
                      <div className="mt-6 overflow-x-auto rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
                        <table className="min-w-full text-sm">
                          <thead className="sticky top-[calc(4rem+48px)] sm:top-[4rem] bg-slate-100/95 backdrop-blur text-slate-900">
                            <tr className="border-b border-slate-200">
                              <th className="p-3 text-left w-1/4 font-semibold">
                                <button
                                  onClick={() => toggleSort("name")}
                                  className={`inline-flex items-center gap-1 underline-offset-4 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                                    sortBy === "name" ? "underline" : ""
                                  }`}
                                >
                                  Nama {sortBy === "name" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                                </button>
                              </th>
                              <th className="p-3 text-left w-1/3 font-semibold">
                                Email
                              </th>
                              <th className="p-3 text-center w-1/6 font-semibold">
                                <button
                                  onClick={() => toggleSort("hadir")}
                                  className={`inline-flex items-center gap-1 underline-offset-4 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                                    sortBy === "hadir" ? "underline" : ""
                                  }`}
                                >
                                  Jumlah Hadir {sortBy === "hadir" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                                </button>
                              </th>
                              <th className="p-3 text-center w-1/6 font-semibold">
                                <button
                                  onClick={() => toggleSort("tugas")}
                                  className={`inline-flex items-center gap-1 underline-offset-4 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                                    sortBy === "tugas" ? "underline" : ""
                                  }`}
                                >
                                  Jumlah Tugas {sortBy === "tugas" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                                </button>
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200 text-slate-900">
                            {visible.map((p, i) => (
                              <tr
                                key={p._id}
                                className={i % 2 ? "bg-slate-50/60" : "bg-white"}
                              >
                                <td className="p-3 font-medium break-words">
                                  {p.name}
                                </td>
                                <td className="p-3 break-words text-slate-700">
                                  {p.email}
                                </td>
                                <td className="p-3 text-center">
                                  <span className={badge("blue")}>{p.hadir}</span>
                                </td>
                                <td className="p-3 text-center">
                                  <span className={badge("violet")}>{p.tugas}</span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Pagination */}
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-sm text-slate-600">
                          Menampilkan {start + 1}–{Math.min(start + pageSize, total)} dari {total}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setPage((p) => Math.max(1, p - 1))}
                            className="h-9 px-3 rounded-md border border-slate-300 bg-white text-sm disabled:opacity-50 hover:bg-slate-50"
                            disabled={page <= 1}
                          >
                            Prev
                          </button>
                          <span className="text-sm text-slate-700">
                            {page} / {totalPages}
                          </span>
                          <button
                            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                            className="h-9 px-3 rounded-md border border-slate-300 bg-white text-sm disabled:opacity-50 hover:bg-slate-50"
                            disabled={page >= totalPages}
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    </section>

                    {/* CARDS view (mobile/grid) */}
                    <section className={`${view === "cards" ? "block" : "hidden"} sm:hidden`}>
                      <div className="mt-6 grid grid-cols-1 gap-4">
                        {visible.map((p) => (
                          <article
                            key={p._id}
                            className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-slate-200"
                          >
                            <h3 className="font-semibold text-slate-900 break-words">
                              {p.name}
                            </h3>
                            <p className="text-sm text-slate-700 break-words">{p.email}</p>
                            <div className="mt-3 flex items-center gap-2">
                              <span className={badge("blue")}>Hadir: {p.hadir}</span>
                              <span className={badge("violet")}>Tugas: {p.tugas}</span>
                            </div>
                          </article>
                        ))}
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
