"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const API_BASE = "/api";

type ReviewStatus = "pending" | "sesuai" | "revisi";

type LaporanAdmin = {
  _id: string;
  judul: string;
  deskripsi: string;
  createdAt: string;
  fileId: any;
  user: {
    name: string;
    email: string;
  };

  // ✅ tambahan fitur review
  status?: ReviewStatus;
  adminCatatan?: string;
  reviewed?: boolean;
  reviewedBy?: any;
  reviewedAt?: string | null;
};

type SortOption = "terbaru" | "terlama";

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

async function parseErrorMessage(res: Response) {
  const ct = res.headers.get("content-type") || "";
  try {
    if (ct.includes("application/json")) {
      const j = await res.json();
      return j?.msg || j?.error || `Request gagal (HTTP ${res.status})`;
    }
  } catch {}
  return `Request gagal (HTTP ${res.status})`;
}

type ToastType = "success" | "error" | "info";
function Toast({
  open,
  type,
  message,
  onClose,
}: {
  open: boolean;
  type: ToastType;
  message: string;
  onClose: () => void;
}) {
  if (!open) return null;

  const base =
    "fixed top-4 right-4 z-[9999] w-[92vw] max-w-sm rounded-2xl shadow-lg border px-4 py-3";
  const theme =
    type === "success"
      ? "bg-green-50 border-green-200 text-green-800"
      : type === "error"
      ? "bg-red-50 border-red-200 text-red-800"
      : "bg-blue-50 border-blue-200 text-blue-800";

  return (
    <div className={`${base} ${theme}`}>
      <div className="flex gap-3 items-start">
        <div className="flex-1 text-sm leading-relaxed">{message}</div>
        <button
          type="button"
          onClick={onClose}
          className="text-sm font-semibold opacity-70 hover:opacity-100"
          aria-label="Tutup notifikasi"
          title="Tutup"
        >
          ✕
        </button>
      </div>
    </div>
  );
}

function IconRefresh({ spinning }: { spinning?: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`h-5 w-5 ${spinning ? "animate-spin" : ""}`}
      aria-hidden="true"
    >
      <path d="M21 12a9 9 0 1 1-3-6.7" />
      <path d="M21 3v7h-7" />
    </svg>
  );
}

function IconDownload({ spinning }: { spinning?: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={`h-4 w-4 ${spinning ? "animate-spin" : ""}`}
      aria-hidden="true"
    >
      {spinning ? (
        <>
          <path d="M21 12a9 9 0 1 1-3-6.7" />
          <path d="M21 3v7h-7" />
        </>
      ) : (
        <>
          <path d="M12 3v12" />
          <path d="M7 10l5 5 5-5" />
          <path d="M5 21h14" />
        </>
      )}
    </svg>
  );
}

function IconCheck() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-4 w-4"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function StatusBadge({ status }: { status?: ReviewStatus }) {
  const s: ReviewStatus = status ?? "pending";
  const base = "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border whitespace-nowrap";
  const cls =
    s === "sesuai"
      ? "bg-green-50 text-green-700 border-green-200"
      : s === "revisi"
      ? "bg-amber-50 text-amber-800 border-amber-200"
      : "bg-gray-50 text-gray-700 border-gray-200";

  const label = s === "sesuai" ? "Sesuai" : s === "revisi" ? "Revisi" : "Pending";
  return <span className={`${base} ${cls}`}>{label}</span>;
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
}: {
  open: boolean;
  row: LaporanAdmin | null;
  status: ReviewStatus;
  catatan: string;
  saving: boolean;
  onClose: () => void;
  onChangeStatus: (v: ReviewStatus) => void;
  onChangeCatatan: (v: string) => void;
  onSubmit: () => void;
}) {
  const areaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!open) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);

    // fokus ke textarea biar cepat ngetik
    window.setTimeout(() => areaRef.current?.focus(), 50);

    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !row) return null;

  return (
    <div className="fixed inset-0 z-[9998] flex items-center justify-center px-3 sm:px-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      <div className="relative w-full max-w-xl rounded-2xl bg-white border border-gray-200 shadow-xl">
        <div className="p-4 sm:p-5 border-b border-gray-100">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900">
                Nilai Laporan Peserta
              </h2>
              <p className="mt-1 text-sm text-gray-600">
                <span className="font-medium text-gray-800">{row.user?.name}</span>{" "}
                <span className="text-gray-500">({row.user?.email})</span>
              </p>
              <p className="mt-1 text-sm text-gray-700 break-words">
                <span className="text-gray-500">Judul:</span>{" "}
                <span className="font-medium">{row.judul}</span>
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-700"
              title="Tutup"
              aria-label="Tutup"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="p-4 sm:p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700">Status penilaian</label>
              <select
                value={status}
                onChange={(e) => onChangeStatus(e.target.value as ReviewStatus)}
                className="
                  mt-1 w-full p-2.5 rounded-xl shadow-sm font-medium
                  bg-white text-gray-800
                  border border-gray-300
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                  hover:border-gray-400
                "
              >
                <option value="pending">Pending (belum dinilai)</option>
                <option value="sesuai">Sesuai</option>
                <option value="revisi">Revisi</option>
              </select>

              <div className="mt-2">
                <StatusBadge status={status} />
              </div>
            </div>

            <div className="sm:text-right">
              <label className="text-sm font-medium text-gray-700 block">Tanggal upload</label>
              <div className="mt-1 inline-flex items-center justify-end">
                <span className="text-xs bg-gray-50 border border-gray-200 text-gray-700 px-2.5 py-1 rounded-full">
                  {fmtTanggal(row.createdAt)}
                </span>
              </div>

              <p className="mt-2 text-xs text-gray-500">
                Jika <b>Revisi</b>, tulis catatan yang jelas agar peserta bisa perbaiki lalu upload ulang.
              </p>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700">Catatan admin</label>
            <textarea
              ref={areaRef}
              value={catatan}
              onChange={(e) => onChangeCatatan(e.target.value)}
              placeholder="Contoh: Cover belum sesuai, tambahkan tanda tangan pembimbing..."
              rows={5}
              className="
                mt-1 w-full p-3 rounded-xl shadow-sm
                bg-white text-gray-800 placeholder:text-gray-500
                border border-gray-300
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                hover:border-gray-400
              "
            />
            <p className="mt-1 text-xs text-gray-500">
              Catatan ini akan terlihat oleh peserta pada halaman laporan.
            </p>
          </div>
        </div>

        <div className="p-4 sm:p-5 border-t border-gray-100 flex flex-col sm:flex-row gap-2 sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-gray-800 disabled:opacity-60"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={onSubmit}
            disabled={saving}
            className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white transition ${
              saving ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            <IconCheck />
            <span className="text-sm font-medium">{saving ? "Menyimpan..." : "Simpan Penilaian"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function RekapLaporanTugasAdminPage() {
  const [data, setData] = useState<LaporanAdmin[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [tanggal, setTanggal] = useState<string>("");
  const [sortBy, setSortBy] = useState<SortOption>("terbaru");

  const [page, setPage] = useState(1);
  const rowsPerPage = 10;

  // debounce search
  const debounceRef = useRef<number | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // toast
  const [toastOpen, setToastOpen] = useState(false);
  const [toastType, setToastType] = useState<ToastType>("info");
  const [toastMsg, setToastMsg] = useState("");
  const toastTimerRef = useRef<number | null>(null);

  const showToast = (type: ToastType, message: string, ms = 2400) => {
    setToastType(type);
    setToastMsg(message);
    setToastOpen(true);
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToastOpen(false), ms);
  };

  const token = useMemo(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("token");
  }, []);

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
      setPage(1);
    }, 250);

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [search]);

  const fetchLaporanAdmin = async (silent = false) => {
    try {
      setLoading(true);

      if (!token) {
        setData([]);
        showToast("error", "Token tidak ditemukan. Silakan login ulang.");
        return;
      }

      const res = await fetch(`${API_BASE}/laporan/admin`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });

      const json = await res.json();
      if (!res.ok) {
        setData([]);
        showToast("error", json?.msg || "Gagal mengambil data laporan.");
        return;
      }

      setData(Array.isArray(json) ? json : []);
      if (!silent) showToast("success", "Data laporan berhasil dimuat.");
    } catch (e) {
      console.error(e);
      setData([]);
      showToast("error", "Terjadi kesalahan saat mengambil data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLaporanAdmin(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const filtered = useMemo(() => {
    const q = debouncedSearch.toLowerCase();

    let list = data.filter((x) => {
      const hay = `${x.user?.name ?? ""} ${x.user?.email ?? ""} ${x.judul ?? ""}`.toLowerCase();
      const okSearch = q ? hay.includes(q) : true;

      let okTanggal = true;
      if (tanggal) {
        const dVal = toDateInputValue(new Date(x.createdAt));
        okTanggal = dVal === tanggal;
      }

      return okSearch && okTanggal;
    });

    list.sort((a, b) => {
      const ta = new Date(a.createdAt).getTime();
      const tb = new Date(b.createdAt).getTime();
      return sortBy === "terbaru" ? tb - ta : ta - tb;
    });

    return list;
  }, [data, debouncedSearch, tanggal, sortBy]);

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / rowsPerPage));
  const pageSafe = Math.min(page, totalPages);
  const startIdx = (pageSafe - 1) * rowsPerPage;
  const endIdx = startIdx + rowsPerPage;
  const paged = filtered.slice(startIdx, endIdx);

  const resetFilter = () => {
    setSearch("");
    setDebouncedSearch("");
    setTanggal("");
    setSortBy("terbaru");
    setPage(1);
    showToast("info", "Filter direset.");
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

    showToast("success", "CSV berhasil diekspor.");
  };

  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleDownload = async (row: LaporanAdmin) => {
    if (!token) return showToast("error", "Token tidak tersedia. Silakan login ulang.");

    const fileId = normalizeFileId(row.fileId);
    if (!fileId) return showToast("error", "fileId tidak ditemukan pada data laporan.");

    setDownloadingId(row._id);
    showToast("info", "Menyiapkan file untuk diunduh...");

    try {
      const res = await fetch(`${API_BASE}/laporan/download/${fileId}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const msg = await parseErrorMessage(res);
        showToast("error", msg);
        return;
      }

      const blob = await res.blob();

      const cd = res.headers.get("content-disposition") || "";
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

      showToast("success", "Download berhasil.");
    } catch (e) {
      console.error(e);
      showToast("error", "Gagal download file. Coba lagi.");
    } finally {
      setDownloadingId(null);
    }
  };

  // =========================
  // ✅ REVIEW ADMIN (modal)
  // =========================
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewRow, setReviewRow] = useState<LaporanAdmin | null>(null);
  const [reviewStatus, setReviewStatus] = useState<ReviewStatus>("pending");
  const [reviewCatatan, setReviewCatatan] = useState("");
  const [savingReview, setSavingReview] = useState(false);

  const openReview = (row: LaporanAdmin) => {
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
    if (!token) return showToast("error", "Token tidak tersedia. Silakan login ulang.");
    if (!reviewRow?._id) return;

    setSavingReview(true);
    try {
      const res = await fetch(`${API_BASE}/laporan/admin/${reviewRow._id}/review`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          status: reviewStatus,
          adminCatatan: reviewCatatan,
        }),
      });

      if (!res.ok) {
        const msg = await parseErrorMessage(res);
        showToast("error", msg);
        return;
      }

      // server mengembalikan laporan (populated), tapi biar aman kita update minimal di state
      const payload = await res.json().catch(() => null);

      setData((prev) =>
        prev.map((x) => {
          if (x._id !== reviewRow._id) return x;

          const next: LaporanAdmin = {
            ...x,
            status: reviewStatus,
            adminCatatan: reviewCatatan,
            reviewed: reviewStatus !== "pending",
            reviewedBy: payload?.laporan?.reviewedBy ?? x.reviewedBy,
            reviewedAt: payload?.laporan?.reviewedAt ?? new Date().toISOString(),
          };
          return next;
        })
      );

      showToast("success", "Penilaian laporan berhasil disimpan.");
      closeReview();
    } catch (e) {
      console.error(e);
      showToast("error", "Gagal menyimpan penilaian. Coba lagi.");
    } finally {
      setSavingReview(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-gray-100 overflow-x-hidden">
      <Toast open={toastOpen} type={toastType} message={toastMsg} onClose={() => setToastOpen(false)} />

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

      <div className="flex-1 md:ml-64 flex flex-col w-full min-w-0">
        <Navbar />

        <main className="flex-1 mt-14 px-3 sm:px-4 lg:px-8 py-6 w-full min-w-0">
          <div className="mx-auto w-full max-w-7xl space-y-4">
            {/* Header */}
            <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h1 className="text-lg sm:text-xl font-semibold text-gray-900">Rekap Laporan Tugas</h1>
                  <p className="text-gray-600 mt-1 text-sm sm:text-base">
                    Pantau, nilai, dan unduh laporan yang diunggah peserta.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100 px-3 py-1.5 rounded-full">
                    Total: {total}
                  </span>

                  <button
                    type="button"
                    onClick={() => fetchLaporanAdmin(false)}
                    disabled={loading}
                    title="Refresh"
                    aria-label="Refresh"
                    className={`p-2.5 rounded-xl text-white transition focus:outline-none focus:ring-2 focus:ring-blue-300 ${
                      loading ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
                    }`}
                  >
                    <IconRefresh spinning={loading} />
                  </button>
                </div>
              </div>
            </div>

            {/* Filter */}
            <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                <div className="md:col-span-6">
                  <label className="text-sm font-medium text-gray-700">Cari laporan</label>
                  <input
                    type="text"
                    placeholder="Cari nama, email, atau judul tugas..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="
                      mt-1 w-full p-2.5 rounded-xl shadow-sm
                      bg-white text-gray-800 placeholder:text-gray-500
                      border border-gray-300
                      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                      hover:border-gray-400
                    "
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="text-sm font-medium text-gray-700">Tanggal upload</label>
                  <input
                    type="date"
                    value={tanggal}
                    onChange={(e) => {
                      setTanggal(e.target.value);
                      setPage(1);
                    }}
                    className="
                      mt-1 w-full p-2.5 rounded-xl shadow-sm
                      bg-white text-gray-800
                      border border-gray-300
                      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                      hover:border-gray-400
                    "
                  />
                </div>

                <div className="md:col-span-3">
                  <label className="text-sm font-medium text-gray-700">Urutkan</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="
                      mt-1 w-full p-2.5 rounded-xl shadow-sm font-medium
                      bg-white text-gray-800
                      border border-gray-300
                      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                      hover:border-gray-400
                    "
                  >
                    <option value="terbaru">Tanggal terbaru</option>
                    <option value="terlama">Tanggal terlama</option>
                  </select>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:flex lg:justify-end gap-2">
                <button
                  type="button"
                  onClick={resetFilter}
                  className="w-full lg:w-auto px-4 py-2.5 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-gray-800"
                >
                  Reset
                </button>

                <button
                  type="button"
                  onClick={exportCSV}
                  className="w-full lg:w-auto px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Ekspor CSV
                </button>
              </div>

              <p className="text-xs text-gray-500 mt-3">
                Tips: gunakan pencarian untuk nama/email/judul. Filter tanggal untuk laporan pada hari tertentu.
              </p>
            </div>

            {/* DATA CARD */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
              {loading ? (
                <div className="p-6">
                  <div className="animate-pulse space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-1/3" />
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                    <div className="h-4 bg-gray-200 rounded w-2/3" />
                  </div>
                </div>
              ) : (
                <>
                  {/* MOBILE: CARD LIST */}
                  <div className="block md:hidden p-4 space-y-3">
                    {paged.length === 0 ? (
                      <div className="text-center text-gray-500 py-10">
                        Tidak ada data laporan yang sesuai filter.
                      </div>
                    ) : (
                      paged.map((row) => {
                        const isDownloading = downloadingId === row._id;
                        return (
                          <div key={row._id} className="border border-gray-200 rounded-2xl p-4">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-gray-900 truncate" title={row.user?.name}>
                                  {row.user?.name}
                                </p>
                                <p className="text-xs text-gray-600 truncate" title={row.user?.email}>
                                  {row.user?.email}
                                </p>

                                <div className="mt-2">
                                  <StatusBadge status={row.status ?? "pending"} />
                                </div>
                              </div>

                              <span className="text-xs bg-gray-50 border border-gray-200 text-gray-700 px-2.5 py-1 rounded-full whitespace-nowrap">
                                {fmtTanggal(row.createdAt)}
                              </span>
                            </div>

                            <div className="mt-3 space-y-2">
                              <div>
                                <p className="text-xs text-gray-500">Judul</p>
                                <p className="text-sm text-gray-800 break-words">{row.judul}</p>
                              </div>

                              <div>
                                <p className="text-xs text-gray-500">Deskripsi</p>
                                <p className="text-sm text-gray-800 break-words">
                                  {row.deskripsi?.trim() ? row.deskripsi : <span className="text-gray-400">-</span>}
                                </p>

                                {!!row.adminCatatan?.trim() && (
                                  <p className="mt-2 text-xs text-gray-600 break-words">
                                    <span className="text-gray-500">Catatan admin:</span> {row.adminCatatan}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={() => openReview(row)}
                                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-gray-800"
                              >
                                Nilai
                              </button>

                              <button
                                type="button"
                                onClick={() => handleDownload(row)}
                                disabled={isDownloading}
                                className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white transition ${
                                  isDownloading ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
                                }`}
                              >
                                <IconDownload spinning={isDownloading} />
                                <span className="text-sm font-medium">{isDownloading ? "Proses..." : "Download"}</span>
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* DESKTOP/TABLET: TABLE */}
                  <div className="hidden md:block">
                    <div className="overflow-x-auto rounded-2xl">
                      <table className="min-w-[1200px] w-full text-sm text-left text-gray-700">
                        <thead className="bg-gray-50 text-gray-900">
                          <tr>
                            <th className="px-4 py-3 font-semibold w-[220px]">Nama</th>
                            <th className="px-4 py-3 font-semibold w-[220px]">Email</th>
                            <th className="px-4 py-3 font-semibold min-w-[320px]">Judul</th>
                            <th className="px-4 py-3 font-semibold min-w-[320px]">Deskripsi</th>
                            <th className="px-4 py-3 font-semibold w-[140px] whitespace-nowrap">Status</th>
                            <th className="px-4 py-3 font-semibold w-[170px] whitespace-nowrap">Tanggal</th>
                            <th className="px-6 py-3 font-semibold w-[260px] whitespace-nowrap">Aksi</th>
                          </tr>
                        </thead>

                        <tbody className="bg-white">
                          {paged.map((row) => {
                            const isDownloading = downloadingId === row._id;

                            return (
                              <tr key={row._id} className="border-t hover:bg-gray-50 align-top">
                                <td className="px-4 py-4 font-medium">
                                  <div className="max-w-[220px] truncate" title={row.user?.name}>
                                    {row.user?.name}
                                  </div>
                                </td>

                                <td className="px-4 py-4">
                                  <div className="max-w-[220px] truncate" title={row.user?.email}>
                                    {row.user?.email}
                                  </div>
                                </td>

                                <td className="px-4 py-4">
                                  <div className="max-w-[420px] break-words" title={row.judul}>
                                    {row.judul}
                                  </div>
                                </td>

                                <td className="px-4 py-4">
                                  <div className="max-w-[520px] break-words text-gray-700">
                                    {row.deskripsi?.trim() ? row.deskripsi : <span className="text-gray-400">-</span>}
                                  </div>

                                  {!!row.adminCatatan?.trim() && (
                                    <div className="mt-2 max-w-[520px] break-words text-xs text-gray-600">
                                      <span className="text-gray-500">Catatan admin:</span> {row.adminCatatan}
                                    </div>
                                  )}
                                </td>

                                <td className="px-4 py-4">
                                  <StatusBadge status={row.status ?? "pending"} />
                                </td>

                                <td className="px-4 py-4 whitespace-nowrap">{fmtTanggal(row.createdAt)}</td>

                                <td className="px-6 py-4">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <button
                                      type="button"
                                      onClick={() => openReview(row)}
                                      className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-gray-800 whitespace-nowrap"
                                    >
                                      Nilai
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => handleDownload(row)}
                                      disabled={isDownloading}
                                      className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-white transition whitespace-nowrap ${
                                        isDownloading
                                          ? "bg-blue-400 cursor-not-allowed"
                                          : "bg-blue-600 hover:bg-blue-700"
                                      }`}
                                    >
                                      <IconDownload spinning={isDownloading} />
                                      <span className="text-sm font-medium">
                                        {isDownloading ? "Proses..." : "Download"}
                                      </span>
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}

                          {paged.length === 0 && (
                            <tr>
                              <td colSpan={7} className="px-4 py-10 text-center text-gray-500">
                                Tidak ada data laporan yang sesuai filter.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Pagination */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-4 border-t bg-white rounded-b-2xl">
                    <p className="text-sm text-gray-600">
                      Menampilkan <b>{total === 0 ? 0 : startIdx + 1}</b>–<b>{Math.min(endIdx, total)}</b> dari{" "}
                      <b>{total}</b> laporan
                    </p>

                    <div className="flex items-center justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={pageSafe <= 1}
                        className={`px-4 py-2 rounded-xl border ${
                          pageSafe <= 1
                            ? "text-gray-400 border-gray-200 cursor-not-allowed"
                            : "text-gray-800 border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        Prev
                      </button>

                      <span className="text-sm text-gray-700">
                        {pageSafe} / {totalPages}
                      </span>

                      <button
                        type="button"
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={pageSafe >= totalPages}
                        className={`px-4 py-2 rounded-xl border ${
                          pageSafe >= totalPages
                            ? "text-gray-400 border-gray-200 cursor-not-allowed"
                            : "text-gray-800 border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="h-2" />
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
}
