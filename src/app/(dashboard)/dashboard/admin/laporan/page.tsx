"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import toast from "react-hot-toast";
import { Card, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Pagination } from "@/components/ui/Pagination";
import { DocumentTextIcon, ArrowPathIcon, DocumentArrowDownIcon, CheckBadgeIcon } from "@heroicons/react/24/outline";
import { laporanService, getErrorMessage, parsePaginationHeaders } from "@/lib/api";
import type { Laporan, ReviewStatus, SortOption } from "@/types";

const fmtTanggal = (iso: string) =>
  new Date(iso).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

const toDateInputValue = (d: Date) => {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const csvEscape = (v: unknown) => {
  const s = (v ?? "").toString();
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
};

function normalizeFileId(fileId: any): string | null {
  if (!fileId) return null;
  if (typeof fileId === "string") return fileId;
  if (typeof fileId === "object") {
    if (typeof fileId._id === "string") return fileId._id;
    if (typeof fileId.$oid === "string") return fileId.$oid;
    if (typeof fileId.toString === "function") {
      const s = fileId.toString();
      if (s && s !== "[object Object]") return s;
    }
  }
  return null;
}

function StatusBadge({ status }: { status?: ReviewStatus }) {
  const s: ReviewStatus = status ?? "pending";
  const base = "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border whitespace-nowrap";
  const cls =
    s === "sesuai"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : s === "revisi"
      ? "bg-rose-50 text-rose-700 border-rose-200"
      : "bg-gray-100 text-gray-600 border-gray-200";

  const label = s === "sesuai" ? "Sesuai" : s === "revisi" ? "Revisi" : "Pending";
  return <span className={`${base} ${cls}`}>{label}</span>;
}

interface ReviewModalProps {
  open: boolean;
  row: Laporan | null;
  status: ReviewStatus;
  catatan: string;
  saving: boolean;
  onClose: () => void;
  onChangeStatus: (s: ReviewStatus) => void;
  onChangeCatatan: (c: string) => void;
  onSubmit: () => void;
}

function ReviewModal({
  open,
  row,
  status,
  catatan,
  saving,
  onClose,
  onChangeStatus,
  onChangeCatatan,
  onSubmit,
}: ReviewModalProps) {
  const areaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    window.setTimeout(() => areaRef.current?.focus(), 50);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !row) return null;

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center px-3 sm:px-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-xl rounded-2xl bg-white shadow-xl flex flex-col">
        <div className="p-4 sm:p-5 border-b border-gray-100 flex items-start justify-between">
          <div className="min-w-0">
            <h2 className="text-base sm:text-lg font-bold text-gray-900">Nilai Laporan Peserta</h2>
            <p className="mt-1 text-sm text-gray-600">
              <span className="font-semibold text-teal-800">{row.user?.name}</span> <span className="text-gray-400">({row.user?.email})</span>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-500 transition-colors"
          >
            ✕
          </button>
        </div>
        <div className="p-4 sm:p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-semibold text-gray-700 block mb-1.5">Status Penilaian</label>
              <select
                value={status}
                onChange={(e) => onChangeStatus(e.target.value as ReviewStatus)}
                className="w-full text-sm p-2.5 rounded-xl bg-white border border-gray-200 text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors"
              >
                <option value="pending">Pending (Belum Dinilai)</option>
                <option value="sesuai">Sesuai</option>
                <option value="revisi">Revisi</option>
              </select>
              <div className="mt-2"><StatusBadge status={status} /></div>
            </div>
            <div className="sm:text-right">
              <label className="text-sm font-semibold text-gray-700 block mb-1.5">Tanggal Upload</label>
              <div className="mt-1 inline-flex justify-end">
                <span className="text-xs bg-teal-50 text-teal-700 border border-teal-100 px-3 py-1.5 rounded-full font-medium">
                  {fmtTanggal(row.createdAt)}
                </span>
              </div>
            </div>
          </div>
          <div>
            <label className="text-sm font-semibold text-gray-700 block mb-1.5">Catatan Admin</label>
            <textarea
              ref={areaRef}
              value={catatan}
              onChange={(e) => onChangeCatatan(e.target.value)}
              placeholder="Contoh: Lampirkan tanda tangan pembimbing di bagian penutup..."
              rows={4}
              className="w-full text-sm p-3 rounded-xl bg-white border border-gray-200 text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors resize-none"
            />
            <p className="mt-1.5 text-[11px] text-gray-500 font-medium">
              Jika Revisi, berikan petunjuk yang jelas. Catatan ini akan terbaca oleh peserta.
            </p>
          </div>
        </div>
        <div className="p-4 sm:p-5 border-t border-gray-100 bg-gray-50/50 flex flex-col-reverse sm:flex-row justify-end gap-3 rounded-b-2xl">
          <Button variant="secondary" onClick={onClose} disabled={saving}>Batal</Button>
          <Button onClick={onSubmit} disabled={saving} isLoading={saving} leftIcon={<CheckBadgeIcon className="w-5 h-5"/>}>Simpan Penilaian</Button>
        </div>
      </div>
    </div>
  );
}

export default function RekapLaporanAdminPage() {
  const [data, setData] = useState<Laporan[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [tanggal, setTanggal] = useState<string>("");
  const [sortBy, setSortBy] = useState<SortOption>("terbaru");

  const [page, setPage] = useState(1);
  const rowsPerPage = 10;
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const debounceRef = useRef<number | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");

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

  const fetchLaporanAdmin = useCallback(async (silent = false) => {
    try {
      setLoading(true);
      const res = await laporanService.getAdminAll({
        page,
        limit: rowsPerPage,
        search: debouncedSearch || undefined,
      });

      const meta = parsePaginationHeaders(res.headers);
      setTotalCount(meta.totalCount || 0);
      setTotalPages(meta.totalPages || 1);
      setData(Array.isArray(res.data) ? res.data : []);
      if (!silent) toast.success("Data laporan berhasil dimuat.");
    } catch (e) {
      console.error(e);
      setData([]);
      toast.error(getErrorMessage(e) || "Terjadi kesalahan saat mengambil data.");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, rowsPerPage]);

  useEffect(() => {
    fetchLaporanAdmin(true);
  }, [fetchLaporanAdmin]);

  const filtered = data
    .filter((x) => {
      if (!tanggal) return true;
      const dVal = toDateInputValue(new Date(x.createdAt));
      return dVal === tanggal;
    })
    .sort((a, b) => {
      const ta = new Date(a.createdAt).getTime();
      const tb = new Date(b.createdAt).getTime();
      return sortBy === "terbaru" ? tb - ta : ta - tb;
    });

  const paged = filtered;

  const resetFilter = () => {
    setSearch("");
    setDebouncedSearch("");
    setTanggal("");
    setSortBy("terbaru");
    setPage(1);
    toast.success("Filter direset.");
  };

  const exportCSV = () => {
    const header = ["Nama", "Email", "Judul", "Deskripsi", "Tanggal Upload", "Status", "Catatan Admin"];
    const rows = filtered.map((x) => [
      csvEscape(x.user?.name),
      csvEscape(x.user?.email),
      csvEscape(x.judul),
      csvEscape(x.deskripsi),
      csvEscape(fmtTanggal(x.createdAt)),
      csvEscape(x.status ?? "pending"),
      csvEscape(x.adminCatatan ?? ""),
    ]);
    const csv = [header, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rekap_laporan_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    toast.success("CSV berhasil diekspor.");
  };

  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleDownload = async (row: Laporan) => {
    const fileId = normalizeFileId(row.fileId);
    if (!fileId) return toast.error("fileId tidak ditemukan pada data laporan.");

    setDownloadingId(row._id);
    const tId = toast.loading("Menyiapkan file untuk diunduh...");

    try {
      const res = await laporanService.download(fileId);
      const blob = new Blob([res.data]);
      
      const cd = res.headers["content-disposition"] || "";
      let filename = "";
      const match = cd.match(/filename="([^"]+)"/i);
      if (match?.[1]) filename = match[1];
      if (!filename) {
        const safeTitle = (row.judul || "laporan").replace(/[\\/:*?"<>|]+/g, "-");
        filename = `${safeTitle}.pdf`;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.dismiss(tId);
      toast.success("Download berhasil.");
    } catch (e) {
      console.error(e);
      toast.dismiss(tId);
      toast.error("Gagal download file. Coba lagi.");
    } finally {
      setDownloadingId(null);
    }
  };

  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewRow, setReviewRow] = useState<Laporan | null>(null);
  const [reviewStatus, setReviewStatus] = useState<ReviewStatus>("pending");
  const [reviewCatatan, setReviewCatatan] = useState("");
  const [savingReview, setSavingReview] = useState(false);

  const openReview = (row: Laporan) => {
    setReviewRow(row);
    setReviewStatus((row.status ?? "pending") as ReviewStatus);
    setReviewCatatan(row.adminCatatan ?? "");
    setReviewOpen(true);
  };

  const closeReview = () => {
    if (savingReview) return;
    setReviewOpen(false);
    setReviewRow(null);
    setReviewStatus("pending");
    setReviewCatatan("");
  };

  const submitReview = async () => {
    if (!reviewRow?._id) return;

    setSavingReview(true);
    try {
      const payload = {
        status: reviewStatus,
        adminCatatan: reviewCatatan,
      };
      
      const res = await laporanService.review(reviewRow._id, payload);

      setData((prev) =>
        prev.map((x) => {
          if (x._id !== reviewRow._id) return x;
          const next: Laporan = {
            ...x,
            status: reviewStatus,
            adminCatatan: reviewCatatan,
            reviewed: reviewStatus !== "pending",
            reviewedBy: res.data?.laporan?.reviewedBy ?? x.reviewedBy,
            reviewedAt: res.data?.laporan?.reviewedAt ?? new Date().toISOString(),
          };
          return next;
        })
      );
      toast.success("Penilaian laporan berhasil disimpan.");
      closeReview();
    } catch (e) {
      console.error(e);
      toast.error(getErrorMessage(e) || "Gagal menyimpan penilaian. Coba lagi.");
    } finally {
      setSavingReview(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50/50">
      <ReviewModal
        open={reviewOpen}
        row={reviewRow}
        status={reviewStatus}
        catatan={reviewCatatan}
        saving={savingReview}
        onClose={closeReview}
        onChangeStatus={setReviewStatus}
        onChangeCatatan={setReviewCatatan}
        onSubmit={submitReview}
      />
      <Sidebar />
      <div className="flex-1 md:ml-64 flex flex-col min-w-0">
        <Navbar />
        <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-teal-100 rounded-xl">
                <DocumentTextIcon className="w-6 h-6 text-teal-700" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Rekap Laporan Tugas</h1>
                <p className="text-sm text-gray-500">Pantau dan nilai laporan dari seluruh peserta</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex px-3 py-1.5 rounded-lg bg-teal-50 border border-teal-100 items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
                <span className="text-xs font-semibold text-teal-700">Total: {totalCount} Laporan</span>
              </div>
              <Button variant="secondary" size="sm" onClick={() => fetchLaporanAdmin(false)} disabled={loading} leftIcon={<ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}/>}>Refresh</Button>
            </div>
          </div>

          <Card className="mb-6">
            <CardBody className="p-5">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                <div className="md:col-span-5">
                  <Input
                    label="Pencarian"
                    placeholder="Cari nama, email, judul..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <div className="md:col-span-3">
                  <label className="text-sm font-semibold text-gray-700 block mb-1.5">Tanggal Upload</label>
                  <input
                    type="date"
                    value={tanggal}
                    onChange={(e) => { setTanggal(e.target.value); setPage(1); }}
                    className="w-full text-sm p-2.5 rounded-xl bg-white border border-gray-200 text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="text-sm font-semibold text-gray-700 block mb-1.5">Urutkan</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="w-full text-sm p-2.5 rounded-xl bg-white border border-gray-200 text-gray-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors"
                  >
                    <option value="terbaru">Terbaru</option>
                    <option value="terlama">Terlama</option>
                  </select>
                </div>
                <div className="md:col-span-2 flex flex-col gap-2">
                  <Button variant="secondary" className="w-full" onClick={resetFilter}>Reset</Button>
                  <Button className="w-full" onClick={exportCSV}>Ekspor CSV</Button>
                </div>
              </div>
            </CardBody>
          </Card>

          <Card>
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 text-teal-600">
                <ArrowPathIcon className="w-8 h-8 animate-spin mb-3" />
                <p className="text-sm font-semibold">Memuat data laporan...</p>
              </div>
            ) : paged.length === 0 ? (
              <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50 m-6">
                <DocumentTextIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm font-semibold text-gray-500">Tidak ada laporan ditemukan</p>
                <p className="text-xs text-gray-400 mt-1">Coba sesuaikan kata kunci atau filter pencarian Anda.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-[1200px] w-full text-sm text-left text-gray-700">
                  <thead className="bg-gray-50/50 border-b border-gray-100 text-gray-800">
                    <tr>
                      <th className="px-6 py-4 font-bold w-[220px]">Peserta</th>
                      <th className="px-6 py-4 font-bold min-w-[320px]">Informasi Laporan</th>
                      <th className="px-6 py-4 font-bold w-[160px]">Status</th>
                      <th className="px-6 py-4 font-bold w-[180px]">Tanggal</th>
                      <th className="px-6 py-4 font-bold w-[220px] text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {paged.map((row) => {
                      const isDownloading = downloadingId === row._id;
                      return (
                        <tr key={row._id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-6 py-4 align-top">
                            <p className="font-bold text-gray-900 truncate max-w-[200px]">{row.user?.name}</p>
                            <p className="text-xs text-gray-500 truncate max-w-[200px] mt-0.5">{row.user?.email}</p>
                          </td>
                          <td className="px-6 py-4 align-top">
                            <p className="font-bold text-gray-800 text-sm mb-1">{row.judul}</p>
                            <p className="text-xs text-gray-600 leading-relaxed mb-2 line-clamp-2">
                              {row.deskripsi?.trim() ? row.deskripsi : <span className="italic text-gray-400">Tidak ada deskripsi</span>}
                            </p>
                            {!!row.adminCatatan?.trim() && (
                              <div className="mt-2 bg-rose-50/50 border border-rose-100 rounded-lg p-2.5">
                                <p className="text-[10px] font-bold text-rose-700 uppercase tracking-wider mb-0.5">Catatan Admin</p>
                                <p className="text-xs text-rose-800 line-clamp-2">{row.adminCatatan}</p>
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 align-top">
                            <StatusBadge status={row.status} />
                          </td>
                          <td className="px-6 py-4 align-top">
                            <span className="text-xs font-medium text-gray-600 bg-gray-50 px-2.5 py-1 rounded-md border border-gray-100">
                              {fmtTanggal(row.createdAt)}
                            </span>
                          </td>
                          <td className="px-6 py-4 align-top text-right">
                            <div className="flex items-center justify-end gap-2 flex-wrap">
                              <Button size="xs" variant="outline" onClick={() => openReview(row)}>Nilai</Button>
                              <Button size="xs" onClick={() => handleDownload(row)} disabled={isDownloading} isLoading={isDownloading} leftIcon={<DocumentArrowDownIcon className="w-4 h-4"/>}>Unduh</Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {!loading && paged.length > 0 && (
              <Pagination
                page={page}
                totalPages={totalPages}
                totalCount={totalCount}
                rowsPerPage={rowsPerPage}
                onPageChange={setPage}
                itemName="laporan"
              />
            )}
          </Card>
        </main>
        <Footer />
      </div>
    </div>
  );
}
