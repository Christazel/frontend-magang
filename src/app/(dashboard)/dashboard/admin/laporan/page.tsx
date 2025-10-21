"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

type LaporanType = {
  file: string;
  _id: string;
  judul: string;
  deskripsi: string;
  createdAt: string;
  user: {
    name: string;
    email: string;
  };
};

// 🔧 Proxy default (Vercel)
const API_BASE = "/api";

/* ------------------------------ Utils kecil ------------------------------ */
const fmtTanggal = (iso: string) =>
  new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

const csvEscape = (v: unknown) => {
  const s = (v ?? "").toString();
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
};

const downloadBlob = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

type SortKey = "nama" | "judul" | "tanggal";
type SortDir = "asc" | "desc";

export default function LaporanAdminPage() {
  /* --------------------------------- State -------------------------------- */
  const [laporanList, setLaporanList] = useState<LaporanType[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // filter
  const [search, setSearch] = useState("");
  const [filterTanggal, setFilterTanggal] = useState("");

  // UI/UX
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards"); // mobile-first
  const [sortKey, setSortKey] = useState<SortKey>("nama");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  // pagination
  const [pageSize, setPageSize] = useState(12);
  const [page, setPage] = useState(1);

  // debounce
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const debounceRef = useRef<number | null>(null);

  /* ---------------------------- Fetch data awal --------------------------- */
  useEffect(() => {
    const controller = new AbortController();

    const getLaporanList = async () => {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;
      try {
        setLoading(true);
        setErrorMsg(null);
        const res = await fetch(`${API_BASE}/laporan/admin`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          signal: controller.signal,
          cache: "no-store",
        });
        if (!res.ok) throw new Error("Gagal mengambil data laporan");
        const data: LaporanType[] = await res.json();
        setLaporanList(Array.isArray(data) ? data : []);
      } catch (err: any) {
        if (err.name !== "AbortError") {
          setErrorMsg("Tidak dapat memuat data. Coba muat ulang.");
          console.error(err);
        }
      } finally {
        setLoading(false);
      }
    };

    getLaporanList();
    return () => controller.abort();
  }, []);

  /* ------------------------------- Debounce ------------------------------- */
  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    // 250ms terasa “cepat” tapi tetap hemat render
    debounceRef.current = window.setTimeout(() => {
      setDebouncedSearch(search);
    }, 250);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [search]);

  /* ----------------------- Filter + Sort + Pagination ---------------------- */
  const filteredSorted = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();

    const filtered = laporanList.filter((lap) => {
      const keyword =
        !q ||
        lap.user.name.toLowerCase().includes(q) ||
        lap.judul.toLowerCase().includes(q) ||
        lap.user.email.toLowerCase().includes(q);

      const tanggalOk = filterTanggal
        ? new Date(lap.createdAt).toLocaleDateString("sv-SE") === filterTanggal
        : true;

      return keyword && tanggalOk;
    });

    const sorted = filtered.sort((a, b) => {
      let valA = "";
      let valB = "";
      if (sortKey === "nama") {
        valA = a.user.name || "";
        valB = b.user.name || "";
      } else if (sortKey === "judul") {
        valA = a.judul || "";
        valB = b.judul || "";
      } else if (sortKey === "tanggal") {
        // sort by createdAt ISO
        return sortDir === "asc"
          ? +new Date(a.createdAt) - +new Date(b.createdAt)
          : +new Date(b.createdAt) - +new Date(a.createdAt);
      }
      const cmp = valA.localeCompare(valB, "id", { sensitivity: "base" });
      return sortDir === "asc" ? cmp : -cmp;
    });

    return sorted;
  }, [laporanList, debouncedSearch, filterTanggal, sortKey, sortDir]);

  // reset page jika filter/sort berubah
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filterTanggal, sortKey, sortDir, pageSize]);

  const total = filteredSorted.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pageStart = (page - 1) * pageSize;
  const visible = filteredSorted.slice(pageStart, pageStart + pageSize);

  /* ------------------------------- Grouping ------------------------------- */
  // untuk tampilan kartu per user
  const groupByUser = useMemo(() => {
    const map = new Map<string, { email: string; name: string; items: LaporanType[] }>();
    for (const lap of visible) {
      const key = lap.user.email;
      if (!map.has(key)) {
        map.set(key, { email: lap.user.email, name: lap.user.name, items: [] });
      }
      map.get(key)!.items.push(lap);
    }
    // urutkan grup berdasarkan nama pengguna
    return Array.from(map.values()).sort((a, b) =>
      a.name.localeCompare(b.name, "id")
    );
  }, [visible]);

  /* -------------------------------- Actions ------------------------------- */
  const clearFilters = () => {
    setSearch("");
    setFilterTanggal("");
  };

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const exportCSV = () => {
    const rows = [
      ["Nama", "Email", "Judul", "Deskripsi", "Tanggal Upload", "File"],
      ...filteredSorted.map((x) => [
        x.user.name,
        x.user.email,
        x.judul,
        x.deskripsi || "-",
        fmtTanggal(x.createdAt),
        x.file,
      ]),
    ];
    const csv = rows.map((r) => r.map(csvEscape).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    downloadBlob(blob, "laporan.csv");
  };

  /* --------------------------------- Render -------------------------------- */
  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-800">
      <Sidebar />

      <div className="flex-1 md:ml-64 flex flex-col min-w-0">
        <Navbar />

        {/* Filter bar */}
        <div
          className="sticky top-16 z-30 bg-white/90 backdrop-blur border-b"
          role="region"
          aria-label="Filter laporan"
        >
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 py-3">
            <div className="flex flex-col gap-3 md:flex-row md:items-center">
              <div className="flex-1 flex gap-2">
                <label htmlFor="search" className="sr-only">
                  Cari
                </label>
                <input
                  id="search"
                  type="text"
                  placeholder="Cari nama / email / judul…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />

                <label htmlFor="date" className="sr-only">
                  Tanggal
                </label>
                <input
                  id="date"
                  type="date"
                  value={filterTanggal}
                  onChange={(e) => setFilterTanggal(e.target.value)}
                  className="w-40 h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={clearFilters}
                  className="h-10 px-3 rounded-lg border bg-white text-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  type="button"
                >
                  Bersihkan
                </button>

                <button
                  onClick={exportCSV}
                  className="h-10 px-3 rounded-lg border bg-white text-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-600"
                  type="button"
                >
                  Ekspor CSV
                </button>

                <div className="hidden sm:flex items-center gap-1">
                  <span className="text-sm text-gray-600">Tampilan:</span>
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
                </div>
              </div>
            </div>

            {/* bar kedua: sort + pagination */}
            <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Urutkan:</span>
                <div className="inline-flex rounded-lg border bg-white p-1">
                  <button
                    type="button"
                    onClick={() => toggleSort("nama")}
                    className={`px-3 h-8 rounded-md text-sm ${
                      sortKey === "nama" ? "bg-gray-100 font-medium" : ""
                    }`}
                    aria-pressed={sortKey === "nama"}
                  >
                    Nama
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleSort("judul")}
                    className={`px-3 h-8 rounded-md text-sm ${
                      sortKey === "judul" ? "bg-gray-100 font-medium" : ""
                    }`}
                    aria-pressed={sortKey === "judul"}
                  >
                    Judul
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleSort("tanggal")}
                    className={`px-3 h-8 rounded-md text-sm ${
                      sortKey === "tanggal" ? "bg-gray-100 font-medium" : ""
                    }`}
                    aria-pressed={sortKey === "tanggal"}
                  >
                    Tanggal
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setSortDir((d) => (d === "asc" ? "desc" : "asc"))
                  }
                  className="h-8 px-3 rounded-lg border bg-white text-sm hover:bg-gray-50"
                  aria-label={`Arah urut: ${sortDir}`}
                  title={`Arah urut: ${sortDir}`}
                >
                  {sortDir === "asc" ? "⬆️" : "⬇️"}
                </button>
              </div>

              <div className="flex items-center gap-2">
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
                <div className="hidden sm:flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="h-8 px-3 rounded-md border bg-white text-sm disabled:opacity-50"
                    disabled={page <= 1}
                  >
                    Prev
                  </button>
                  <span className="text-sm text-gray-700">
                    {page} / {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setPage((p) => Math.min(totalPages, p + 1))
                    }
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
            <h1 className="text-2xl font-bold tracking-tight mb-4">
              Daftar Laporan Mahasiswa
            </h1>

            {/* Status */}
            {loading && (
              <div
                className="space-y-3"
                aria-live="polite"
                aria-busy="true"
                role="status"
              >
                <div className="h-10 w-full max-w-md animate-pulse rounded-lg bg-gray-200" />
                <div className="h-40 w-full animate-pulse rounded-lg bg-gray-200" />
                <div className="h-40 w-full animate-pulse rounded-lg bg-gray-200" />
              </div>
            )}

            {!loading && errorMsg && (
              <div
                className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                role="alert"
              >
                {errorMsg}{" "}
                <button
                  onClick={() => location.reload()}
                  className="ml-2 underline"
                >
                  Muat ulang
                </button>
              </div>
            )}

            {!loading && !errorMsg && total === 0 && (
              <div className="rounded-lg border bg-white p-6 text-sm">
                Tidak ada laporan yang cocok dengan filter.
              </div>
            )}

            {/* Konten */}
            {!loading && !errorMsg && total > 0 && (
              <>
                {/* MOBILE pagination (bawah filter) */}
                <div className="sm:hidden mb-3 flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    {pageStart + 1}–{Math.min(pageStart + pageSize, total)} dari {total}
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
                      onClick={() =>
                        setPage((p) => Math.min(totalPages, p + 1))
                      }
                      className="h-8 px-3 rounded-md border bg-white text-sm disabled:opacity-50"
                      disabled={page >= totalPages}
                    >
                      Next
                    </button>
                  </div>
                </div>

                {/* View: Cards (default mobile) */}
                <section
                  className={`${
                    viewMode === "cards" ? "block" : "hidden sm:hidden"
                  } md:block md:sr-only`}
                >
                  {/* Per user → kartu rapih */}
                  <div className="space-y-8">
                    {groupByUser.map((group) => (
                      <div key={group.email}>
                        <h2 className="text-lg font-semibold text-blue-700 mb-3 break-words">
                          {group.name}{" "}
                          <span className="font-normal text-gray-600">
                            ({group.email})
                          </span>
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                          {group.items.map((lap) => (
                            <article
                              key={lap._id}
                              className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
                            >
                              <div className="text-sm">
                                <p className="font-semibold break-words">
                                  {lap.judul}
                                </p>
                                <p className="mt-1 break-words text-gray-700">
                                  {lap.deskripsi || "-"}
                                </p>
                                <p className="mt-1 text-gray-600">
                                  {fmtTanggal(lap.createdAt)}
                                </p>
                              </div>
                              <a
                                href={`${API_BASE}/laporan/download/${encodeURIComponent(
                                  lap.file
                                )}`}
                                className="mt-3 inline-flex text-sm font-medium underline underline-offset-4 hover:no-underline focus:outline-none focus:ring-2 focus:ring-blue-600"
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                Download
                              </a>
                            </article>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>

                {/* View: Table (≥md atau jika dipilih) */}
                <section className={`${viewMode === "table" ? "block" : "hidden"} sm:block`}>
                  <div className="overflow-x-auto rounded-lg border bg-white">
                    <table className="min-w-full text-sm">
                      <thead className="bg-gray-100 text-gray-900">
                        <tr className="border-b">
                          <th className="p-3 text-left w-1/5">
                            <button
                              className={`inline-flex items-center gap-1 underline-offset-4 ${
                                sortKey === "nama" ? "underline" : "hover:underline"
                              }`}
                              onClick={() => toggleSort("nama")}
                            >
                              Nama
                              {sortKey === "nama" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                            </button>
                          </th>
                          <th className="p-3 text-left w-1/5">Email</th>
                          <th className="p-3 text-left w-1/5">
                            <button
                              className={`inline-flex items-center gap-1 underline-offset-4 ${
                                sortKey === "judul" ? "underline" : "hover:underline"
                              }`}
                              onClick={() => toggleSort("judul")}
                            >
                              Judul
                              {sortKey === "judul" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                            </button>
                          </th>
                          <th className="p-3 text-left w-1/5">Deskripsi</th>
                          <th className="p-3 text-left w-1/5 whitespace-nowrap">
                            <button
                              className={`inline-flex items-center gap-1 underline-offset-4 ${
                                sortKey === "tanggal" ? "underline" : "hover:underline"
                              }`}
                              onClick={() => toggleSort("tanggal")}
                            >
                              Tanggal Upload
                              {sortKey === "tanggal" ? (sortDir === "asc" ? "↑" : "↓") : ""}
                            </button>
                          </th>
                          <th className="p-3 text-left w-20">Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visible.map((lap) => (
                          <tr key={lap._id} className="border-t hover:bg-gray-50">
                            <td className="p-3 align-top break-words">
                              {lap.user.name}
                            </td>
                            <td className="p-3 align-top break-words">
                              {lap.user.email}
                            </td>
                            <td className="p-3 align-top break-words">{lap.judul}</td>
                            <td className="p-3 align-top break-words">
                              {lap.deskripsi || "-"}
                            </td>
                            <td className="p-3 align-top whitespace-nowrap">
                              {fmtTanggal(lap.createdAt)}
                            </td>
                            <td className="p-3 align-top">
                              <a
                                href={`${API_BASE}/laporan/download/${encodeURIComponent(
                                  lap.file
                                )}`}
                                className="font-medium text-blue-700 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-600"
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                Download
                              </a>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Footer pagination */}
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      Menampilkan {pageStart + 1}–{Math.min(pageStart + pageSize, total)} dari {total}
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
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
}
