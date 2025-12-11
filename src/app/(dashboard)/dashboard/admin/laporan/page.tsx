"use client";

import { useEffect, useMemo, useState } from "react";

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

const API_BASE = "/api";

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

type SortOption = "tanggal-desc" | "tanggal-asc" | "nama-asc" | "nama-desc";

export default function LaporanAdminPage() {
  const [laporanList, setLaporanList] = useState<LaporanType[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [filterTanggal, setFilterTanggal] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("tanggal-desc");

  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);

  /* ----------------------------- Ambil data awal ----------------------------- */
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
          console.error(err);
          setErrorMsg("Tidak dapat memuat data. Silakan coba muat ulang.");
        }
      } finally {
        setLoading(false);
      }
    };

    getLaporanList();
    return () => controller.abort();
  }, []);

  /* ------------------------ Filter + sort + pagination ----------------------- */
  const filteredSorted = useMemo(() => {
    const q = search.trim().toLowerCase();

    let result = laporanList.filter((lap) => {
      const cocokSearch =
        !q ||
        lap.user.name.toLowerCase().includes(q) ||
        lap.user.email.toLowerCase().includes(q) ||
        lap.judul.toLowerCase().includes(q);

      const cocokTanggal = filterTanggal
        ? new Date(lap.createdAt).toLocaleDateString("sv-SE") === filterTanggal
        : true;

      return cocokSearch && cocokTanggal;
    });

    result = result.sort((a, b) => {
      if (sortOption === "tanggal-desc" || sortOption === "tanggal-asc") {
        const tA = +new Date(a.createdAt);
        const tB = +new Date(b.createdAt);
        return sortOption === "tanggal-desc" ? tB - tA : tA - tB;
      }

      const namaA = a.user.name || "";
      const namaB = b.user.name || "";
      const cmp = namaA.localeCompare(namaB, "id", { sensitivity: "base" });
      return sortOption === "nama-asc" ? cmp : -cmp;
    });

    return result;
  }, [laporanList, search, filterTanggal, sortOption]);

  useEffect(() => {
    setPage(1);
  }, [search, filterTanggal, sortOption]);

  const total = filteredSorted.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const pageStart = (page - 1) * pageSize;
  const visible = filteredSorted.slice(pageStart, pageStart + pageSize);

  /* -------------------------------- Actions -------------------------------- */
  const clearFilters = () => {
    setSearch("");
    setFilterTanggal("");
    setSortOption("tanggal-desc");
  };

  const exportCSV = () => {
    if (filteredSorted.length === 0) return;

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
    downloadBlob(blob, "rekap-laporan-tugas.csv");
  };

  /* --------------------------------- Render --------------------------------- */
  return (
    <div className="flex min-h-screen bg-gray-50 text-gray-800 overflow-x-hidden">
      <Sidebar />

      <div className="flex-1 md:ml-64 flex flex-col min-w-0">
        <Navbar />

        <main className="flex-1">
          {/* HEADER BAR KHUSUS (di bawah navbar, konsisten di desktop) */}
          <div className="border-b bg-white">
            <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
                Rekap Laporan Tugas
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-gray-600 max-w-3xl leading-relaxed">
                Lihat dan unduh laporan tugas yang diunggah mahasiswa. Gunakan
                pencarian, tanggal, dan urutan untuk menemukan laporan yang
                dibutuhkan.
              </p>
            </div>
          </div>

          {/* KONTEN UTAMA */}
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
            {/* Filter bar */}
            <section
              className="mb-4 rounded-lg border bg-white px-4 py-3 shadow-sm"
              aria-label="Filter laporan tugas"
            >
              <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
                {/* kiri: search + tanggal */}
                <div className="flex-1 flex flex-col gap-3 md:flex-row">
                  <div className="w-full">
                    <label
                      htmlFor="search"
                      className="block text-xs font-medium text-gray-700 mb-1"
                    >
                      Cari laporan
                    </label>
                    <input
                      id="search"
                      type="text"
                      placeholder="Cari nama, email, atau judul tugas..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>

                  <div className="w-full md:w-48">
                    <label
                      htmlFor="tanggal"
                      className="block text-xs font-medium text-gray-700 mb-1"
                    >
                      Tanggal upload
                    </label>
                    <input
                      id="tanggal"
                      type="date"
                      value={filterTanggal}
                      onChange={(e) => setFilterTanggal(e.target.value)}
                      className="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                </div>

                {/* kanan: sort + tombol */}
                <div className="flex flex-col gap-2 md:flex-row md:items-end md:ml-4">
                  <div className="w-full md:w-52">
                    <label
                      htmlFor="sort"
                      className="block text-xs font-medium text-gray-700 mb-1"
                    >
                      Urutkan berdasarkan
                    </label>
                    <select
                      id="sort"
                      value={sortOption}
                      onChange={(e) =>
                        setSortOption(e.target.value as SortOption)
                      }
                      className="w-full h-10 rounded-lg border border-gray-300 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                    >
                      <option value="tanggal-desc">Tanggal terbaru</option>
                      <option value="tanggal-asc">Tanggal terlama</option>
                      <option value="nama-asc">Nama A–Z</option>
                      <option value="nama-desc">Nama Z–A</option>
                    </select>
                  </div>

                  <div className="flex gap-2 md:ml-2">
                    <button
                      type="button"
                      onClick={clearFilters}
                      className="h-10 px-3 rounded-lg border bg-white text-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-600"
                    >
                      Reset
                    </button>
                    <button
                      type="button"
                      onClick={exportCSV}
                      className="h-10 px-3 rounded-lg border border-blue-600 bg-blue-600 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:opacity-50"
                      disabled={filteredSorted.length === 0}
                    >
                      Ekspor CSV
                    </button>
                  </div>
                </div>
              </div>

              <p className="mt-2 text-xs text-gray-500">
                Total laporan: <span className="font-semibold">{total}</span>
              </p>
            </section>

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
              <div className="rounded-lg border bg-white p-6 text-sm text-gray-700">
                Belum ada laporan yang tersimpan atau tidak ada data yang cocok
                dengan filter.
              </div>
            )}

            {/* Konten utama */}
            {!loading && !errorMsg && total > 0 && (
              <>
                {/* MOBILE: kartu */}
                <div className="space-y-3 mb-4 md:hidden">
                  {visible.map((lap) => (
                    <article
                      key={lap._id}
                      className="rounded-lg border bg-white p-4 shadow-sm"
                    >
                      <div className="flex flex-col gap-1 text-sm">
                        <div className="font-semibold break-words">
                          {lap.judul}
                        </div>
                        <div className="text-gray-700 break-words">
                          {lap.deskripsi || "-"}
                        </div>
                        <div className="mt-1 text-xs text-gray-500">
                          <p>
                            <span className="font-medium">Nama:</span>{" "}
                            {lap.user.name}
                          </p>
                          <p>
                            <span className="font-medium">Email:</span>{" "}
                            {lap.user.email}
                          </p>
                          <p>
                            <span className="font-medium">Tanggal:</span>{" "}
                            {fmtTanggal(lap.createdAt)}
                          </p>
                        </div>
                      </div>
                      <a
                        href={`${API_BASE}/laporan/download/${encodeURIComponent(
                          lap.file
                        )}`}
                        className="mt-3 inline-flex text-sm font-medium text-blue-700 underline underline-offset-4 hover:no-underline focus:outline-none focus:ring-2 focus:ring-blue-600"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Download
                      </a>
                    </article>
                  ))}
                </div>

                {/* DESKTOP/TABLET: tabel */}
                <div className="hidden md:block">
                  <div className="overflow-x-auto rounded-lg border bg-white">
                    <table className="min-w-[900px] text-sm">
                      <thead className="bg-gray-100 text-gray-900">
                        <tr className="border-b">
                          <th className="p-3 text-left w-1/5">Nama</th>
                          <th className="p-3 text-left w-1/5">Email</th>
                          <th className="p-3 text-left w-1/5">Judul</th>
                          <th className="p-3 text-left w-1/5">Deskripsi</th>
                          <th className="p-3 text-left w-1/5 whitespace-nowrap">
                            Tanggal Upload
                          </th>
                          <th className="p-3 text-left w-20">Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visible.map((lap) => (
                          <tr
                            key={lap._id}
                            className="border-t hover:bg-gray-50"
                          >
                            <td className="p-3 align-top break-words">
                              {lap.user.name}
                            </td>
                            <td className="p-3 align-top break-words">
                              {lap.user.email}
                            </td>
                            <td className="p-3 align-top break-words">
                              {lap.judul}
                            </td>
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
                </div>

                {/* Pagination */}
                <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <span className="text-xs sm:text-sm text-gray-600">
                    Menampilkan{" "}
                    <span className="font-semibold">
                      {pageStart + 1}–
                      {Math.min(pageStart + pageSize, total)}
                    </span>{" "}
                    dari <span className="font-semibold">{total}</span> laporan
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
                      onClick={() =>
                        setPage((p) => Math.min(totalPages, p + 1))
                      }
                      className="h-9 px-3 rounded-md border bg-white text-sm disabled:opacity-50"
                      disabled={page >= totalPages}
                    >
                      Next
                    </button>
                  </div>
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
