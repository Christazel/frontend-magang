"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

type ReviewStatus = "pending" | "sesuai" | "revisi";

type LaporanType = {
  _id: string;
  judul: string;
  deskripsi: string;
  createdAt: string;

  // ✅ dari backend bisa string / object (ObjectId)
  fileId: any;

  // metadata (opsional)
  originalName?: string;
  mimeType?: string;
  gfsFilename?: string;
  size?: number;

  // ✅ fitur review admin
  status?: ReviewStatus;
  adminCatatan?: string;
  reviewed?: boolean;
  reviewedAt?: string | null;
};

const MAX_MB = 4;
const MAX_BYTES = MAX_MB * 1024 * 1024;

const fmtTanggal = (iso: string) =>
  new Date(iso).toLocaleString("id-ID", {
    dateStyle: "long",
    timeStyle: "short",
  });

const bytesToMB = (bytes: number) => bytes / 1024 / 1024;

async function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Gagal membaca file."));
    reader.onload = () => {
      const result = String(reader.result || "");
      const commaIdx = result.indexOf(",");
      resolve(commaIdx >= 0 ? result.slice(commaIdx + 1) : result);
    };
    reader.readAsDataURL(file);
  });
}

function RefreshIcon({ spinning }: { spinning?: boolean }) {
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

/** ✅ Ambil nama file dari header Content-Disposition (kalau ada) */
function getFilenameFromContentDisposition(header: string | null): string | null {
  if (!header) return null;

  const filenameMatch = header.match(/filename="([^"]+)"/i);
  if (filenameMatch?.[1]) return filenameMatch[1];

  const filenameStarMatch = header.match(/filename\*\s*=\s*UTF-8''([^;]+)/i);
  if (filenameStarMatch?.[1]) {
    try {
      return decodeURIComponent(filenameStarMatch[1]);
    } catch {
      return filenameStarMatch[1];
    }
  }

  return null;
}

/** ✅ normalize ObjectId (string / object) */
function normalizeId(id: any): string | null {
  if (!id) return null;
  if (typeof id === "string") return id;

  if (typeof id === "object") {
    if (typeof id._id === "string") return id._id;
    if (typeof id.$oid === "string") return id.$oid;
    if (typeof id.toString === "function") {
      const s = id.toString();
      if (s && s !== "[object Object]") return s;
    }
  }
  return null;
}

function StatusBadge({ status }: { status?: ReviewStatus }) {
  const s: ReviewStatus = status ?? "pending";

  const base = "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border";
  const cls =
    s === "sesuai"
      ? "bg-green-50 text-green-700 border-green-200"
      : s === "revisi"
      ? "bg-amber-50 text-amber-800 border-amber-200"
      : "bg-gray-50 text-gray-700 border-gray-200";

  const label = s === "sesuai" ? "Sesuai" : s === "revisi" ? "Revisi" : "Pending";
  return <span className={`${base} ${cls}`}>{label}</span>;
}

export default function LaporanPesertaPage() {
  const [file, setFile] = useState<File | null>(null);
  const [judul, setJudul] = useState("");
  const [deskripsi, setDeskripsi] = useState("");

  const [laporanList, setLaporanList] = useState<LaporanType[]>([]);
  const [loadingList, setLoadingList] = useState(false);

  const [isUploading, setIsUploading] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDeskripsi, setEditDeskripsi] = useState("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // ✅ untuk upload revisi (resubmit file)
  const resubmitInputRef = useRef<HTMLInputElement | null>(null);
  const [resubmitForId, setResubmitForId] = useState<string | null>(null);
  const [isResubmitting, setIsResubmitting] = useState(false);

  const token = useMemo(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("token");
  }, []);

  const authHeaders = useMemo(() => {
    const h: Record<string, string> = {};
    if (token) h.Authorization = `Bearer ${token}`;
    return h;
  }, [token]);

  const parseErrorMessage = async (res: Response) => {
    const contentType = res.headers.get("content-type") || "";
    try {
      if (contentType.includes("application/json")) {
        const j = await res.json();
        return j?.msg || j?.error || `Request gagal (HTTP ${res.status})`;
      }
    } catch {}
    return `Request gagal (HTTP ${res.status})`;
  };

  const getLaporanList = async () => {
    if (!token) return;
    setLoadingList(true);
    try {
      const res = await fetch("/api/laporan", { headers: authHeaders });
      const data = await res.json();

      if (Array.isArray(data)) setLaporanList(data);
      else if (Array.isArray(data?.data)) setLaporanList(data.data);
      else setLaporanList([]);
    } catch (e) {
      console.error(e);
      setLaporanList([]);
    } finally {
      setLoadingList(false);
    }
  };

  const uploadMultipart = async () => {
    if (!file) throw new Error("File belum dipilih.");

    const formData = new FormData();
    formData.append("file", file);
    formData.append("judul", judul.trim());
    formData.append("deskripsi", deskripsi.trim());

    const res = await fetch("/api/laporan", {
      method: "POST",
      headers: { ...authHeaders },
      body: formData,
    });

    if (!res.ok) throw new Error(await parseErrorMessage(res));
  };

  const uploadBase64 = async () => {
    if (!file) throw new Error("File belum dipilih.");

    const base64 = await readFileAsBase64(file);

    const res = await fetch("/api/laporan/base64", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
      body: JSON.stringify({
        filename: file.name,
        base64,
        judul: judul.trim(),
        deskripsi: deskripsi.trim(),
        mimeType: file.type || "application/octet-stream",
      }),
    });

    if (!res.ok) throw new Error(await parseErrorMessage(res));
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return alert("Token tidak ditemukan. Silakan login ulang.");
    if (!file) return alert("Pilih file dulu.");

    if (file.size > MAX_BYTES) {
      return alert(
        `Ukuran file terlalu besar. Maksimal ${MAX_MB}MB.\nUkuran file kamu: ${bytesToMB(file.size).toFixed(2)}MB`
      );
    }

    setIsUploading(true);
    try {
      try {
        await uploadMultipart();
      } catch (err: any) {
        const SAFE_BASE64_BYTES = 3 * 1024 * 1024;
        if (file.size <= SAFE_BASE64_BYTES) {
          console.warn("Multipart gagal, coba fallback base64...", err?.message);
          await uploadBase64();
        } else {
          throw err;
        }
      }

      alert("Laporan berhasil diupload!");
      setFile(null);
      setJudul("");
      setDeskripsi("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      await getLaporanList();
    } catch (err: any) {
      console.error(err);
      alert(`Gagal upload laporan: ${err?.message || "Unknown error"}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!token) return alert("Token tidak ditemukan. Silakan login ulang.");

    const ok = confirm("Yakin mau hapus laporan ini?");
    if (!ok) return;

    const res = await fetch(`/api/laporan/${id}`, {
      method: "DELETE",
      headers: authHeaders,
    });

    if (res.ok) {
      alert("Laporan dihapus");
      getLaporanList();
    } else {
      alert(`Gagal menghapus laporan: ${await parseErrorMessage(res)}`);
    }
  };

  const handleUpdateDeskripsi = async (id: string) => {
    if (!token) return alert("Token tidak ditemukan. Silakan login ulang.");

    const res = await fetch(`/api/laporan/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
      body: JSON.stringify({ deskripsi: editDeskripsi }),
    });

    if (res.ok) {
      alert("Deskripsi berhasil diperbarui");
      setEditingId(null);
      getLaporanList();
    } else {
      alert(`Gagal update deskripsi: ${await parseErrorMessage(res)}`);
    }
  };

  /** ✅ FIX DOWNLOAD: pakai fetch + Authorization header, bukan <a href> */
  const handleDownload = async (lap: LaporanType) => {
    try {
      if (!token) return alert("Token tidak ditemukan. Silakan login ulang.");

      const fileId = normalizeId(lap.fileId);
      if (!fileId) return alert("FileId tidak ditemukan pada laporan ini.");

      const res = await fetch(`/api/laporan/download/${fileId}`, {
        method: "GET",
        headers: { ...authHeaders },
      });

      if (!res.ok) return alert(`Gagal download: ${await parseErrorMessage(res)}`);

      const blob = await res.blob();

      const cd = res.headers.get("content-disposition");
      const filenameFromHeader = getFilenameFromContentDisposition(cd);

      const fallback =
        lap.originalName ||
        (lap.judul?.trim() ? `${lap.judul}` : "laporan") +
          (lap.mimeType === "application/pdf" ? ".pdf" : "");

      const filename = filenameFromHeader || fallback;

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => window.URL.revokeObjectURL(url), 800);
    } catch (err: any) {
      console.error(err);
      alert(`Gagal download: ${err?.message || "Unknown error"}`);
    }
  };

  // ==========================
  // ✅ RESUBMIT FILE (UPLOAD ULANG)
  // ==========================
  const openResubmitPicker = (laporanId: string) => {
    setResubmitForId(laporanId);
    // reset value biar bisa pilih file yang sama lagi
    if (resubmitInputRef.current) resubmitInputRef.current.value = "";
    resubmitInputRef.current?.click();
  };

  const doResubmit = async (laporanId: string, selectedFile: File) => {
    if (!token) return alert("Token tidak ditemukan. Silakan login ulang.");

    if (selectedFile.size > MAX_BYTES) {
      return alert(
        `Ukuran file terlalu besar. Maksimal ${MAX_MB}MB.\nUkuran file kamu: ${bytesToMB(selectedFile.size).toFixed(
          2
        )}MB`
      );
    }

    setIsResubmitting(true);
    try {
      const fd = new FormData();
      fd.append("file", selectedFile);

      const res = await fetch(`/api/laporan/${laporanId}/file`, {
        method: "PUT",
        headers: { ...authHeaders },
        body: fd,
      });

      if (!res.ok) {
        return alert(`Gagal upload revisi: ${await parseErrorMessage(res)}`);
      }

      alert("Upload revisi berhasil! Status laporan kembali ke pending.");
      setResubmitForId(null);
      await getLaporanList();
    } catch (e: any) {
      console.error(e);
      alert(`Gagal upload revisi: ${e?.message || "Unknown error"}`);
    } finally {
      setIsResubmitting(false);
    }
  };

  const onResubmitFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;

    const id = resubmitForId;
    if (!id) return;

    await doResubmit(id, f);
  };

  useEffect(() => {
    if (token) getLaporanList();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const fileSizeMB = file ? bytesToMB(file.size) : 0;
  const fileTooBig = file ? file.size > MAX_BYTES : false;

  return (
    <div className="flex min-h-screen bg-gray-100 overflow-x-hidden">
      <Sidebar />

      {/* min-w-0 penting biar konten gak “maksa” melebar dan bikin ruang kosong kanan */}
      <div className="flex-1 min-w-0 md:ml-64 flex flex-col">
        <Navbar />

        <main className="flex-1 w-full p-4 sm:p-6">
          {/* biar enak dibaca di layar besar, tapi tetap full di HP */}
          <div className="w-full max-w-6xl mx-auto">
            <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-gray-800">
              Laporan Tugas Magang
            </h1>

            {/* Upload */}
            <div className="bg-white p-4 sm:p-5 rounded-lg shadow mb-6 sm:mb-8">
              <form onSubmit={handleUpload} className="grid grid-cols-1 gap-3 md:grid-cols-12 md:items-center">
                {/* File */}
                <div className="md:col-span-4">
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="w-full border p-2 rounded text-gray-800 file:mr-3 file:py-2 file:px-3 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                    accept=".pdf,.doc,.docx,.xls,.xlsx"
                    required
                  />
                </div>

                {/* Judul */}
                <div className="md:col-span-3">
                  <input
                    type="text"
                    placeholder="Judul (opsional)"
                    value={judul}
                    onChange={(e) => setJudul(e.target.value)}
                    className="w-full border p-2 rounded text-gray-800 placeholder-gray-500"
                  />
                </div>

                {/* Deskripsi */}
                <div className="md:col-span-3">
                  <input
                    type="text"
                    placeholder="Deskripsi (opsional)"
                    value={deskripsi}
                    onChange={(e) => setDeskripsi(e.target.value)}
                    className="w-full border p-2 rounded text-gray-800 placeholder-gray-500"
                  />
                </div>

                {/* Button */}
                <div className="md:col-span-2">
                  <button
                    type="submit"
                    disabled={isUploading || fileTooBig}
                    className={`w-full px-4 py-2.5 rounded text-white font-medium ${
                      isUploading || fileTooBig
                        ? "bg-blue-400 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700"
                    }`}
                  >
                    {isUploading ? "Uploading..." : "Upload"}
                  </button>
                </div>
              </form>

              {/* Notice ukuran */}
              <div
                className={`mt-3 rounded border p-3 text-sm ${
                  fileTooBig ? "border-red-200 bg-red-50 text-red-700" : "border-blue-200 bg-blue-50 text-blue-700"
                }`}
              >
                <p className="font-semibold">Catatan Upload</p>
                <p className="mt-1">
                  Ukuran file maksimal <b>{MAX_MB}MB</b>. Jika lebih besar, upload akan ditolak oleh server.
                </p>

                {file ? (
                  <p className="mt-2 break-words">
                    File dipilih: <b>{file.name}</b> — <b>{fileSizeMB.toFixed(2)}MB</b>{" "}
                    {fileTooBig ? <span className="ml-1">(terlalu besar)</span> : null}
                  </p>
                ) : (
                  <p className="mt-2">Belum ada file dipilih.</p>
                )}
              </div>
            </div>

            {/* List */}
            <div className="bg-white p-4 sm:p-5 rounded-lg shadow">
              <div className="flex items-center justify-between gap-3 mb-4">
                <h2 className="text-base sm:text-lg font-semibold text-gray-800">Riwayat Laporan</h2>

                <button
                  type="button"
                  onClick={getLaporanList}
                  disabled={loadingList}
                  title="Refresh"
                  aria-label="Refresh"
                  className={`p-2.5 rounded text-white transition focus:outline-none focus:ring-2 focus:ring-blue-300 ${
                    loadingList ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  <RefreshIcon spinning={loadingList} />
                </button>
              </div>

              {/* hidden input untuk resubmit */}
              <input
                ref={resubmitInputRef}
                type="file"
                className="hidden"
                accept=".pdf,.doc,.docx,.xls,.xlsx"
                onChange={onResubmitFileChange}
              />

              {loadingList ? (
                <p className="text-gray-600">Memuat data...</p>
              ) : laporanList.length === 0 ? (
                <p className="text-gray-600">Belum ada laporan diunggah.</p>
              ) : (
                <ul className="space-y-3 sm:space-y-4 text-gray-800">
                  {laporanList.map((lap) => {
                    const s: ReviewStatus = (lap.status ?? "pending") as ReviewStatus;
                    const showCatatan = !!lap.adminCatatan?.trim();
                    const isRevisi = s === "revisi";
                    const resubmitBusy = isResubmitting && resubmitForId === lap._id;

                    return (
                      <li key={lap._id} className="border rounded-lg p-3 sm:p-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-start justify-between gap-3">
                            <button
                              type="button"
                              onClick={() => handleDownload(lap)}
                              className="text-left text-blue-600 underline break-words"
                              title="Download laporan"
                            >
                              {lap.judul}
                            </button>

                            {/* ✅ Badge status (tambahin tanpa rombak layout) */}
                            <div className="shrink-0">
                              <StatusBadge status={s} />
                            </div>
                          </div>

                          <p className="text-xs sm:text-sm text-gray-600">{fmtTanggal(lap.createdAt)}</p>

                          {/* ✅ Catatan admin tampil kalau ada */}
                          {showCatatan && (
                            <div className="mt-2 rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
                              <p className="font-semibold">Catatan Admin</p>
                              <p className="mt-1 break-words">{lap.adminCatatan}</p>
                              {isRevisi && (
                                <p className="mt-2 text-xs text-amber-800">
                                  Status: <b>Revisi</b> — upload ulang file sesuai catatan admin.
                                </p>
                              )}
                            </div>
                          )}

                          {editingId === lap._id ? (
                            <>
                              <input
                                type="text"
                                value={editDeskripsi}
                                onChange={(e) => setEditDeskripsi(e.target.value)}
                                className="border px-2 py-2 mt-2 rounded w-full text-gray-800"
                              />

                              <div className="mt-3 flex flex-wrap gap-2 text-sm">
                                <button
                                  type="button"
                                  onClick={() => handleUpdateDeskripsi(lap._id)}
                                  className="px-3 py-2 rounded bg-green-600 text-white hover:bg-green-700"
                                >
                                  Simpan
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingId(null)}
                                  className="px-3 py-2 rounded bg-gray-200 text-gray-800 hover:bg-gray-300"
                                >
                                  Batal
                                </button>
                              </div>
                            </>
                          ) : (
                            <>
                              <p className="text-sm text-gray-700 break-words mt-2">
                                {lap.deskripsi?.trim() ? (
                                  lap.deskripsi
                                ) : (
                                  <span className="text-red-500">Belum ada deskripsi.</span>
                                )}
                              </p>

                              <div className="mt-3 flex flex-wrap gap-2 text-sm">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingId(lap._id);
                                    setEditDeskripsi(lap.deskripsi || "");
                                  }}
                                  className="px-3 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                                >
                                  Edit Deskripsi
                                </button>

                                {/* ✅ Upload revisi hanya kalau status revisi */}
                                {isRevisi && (
                                  <button
                                    type="button"
                                    onClick={() => openResubmitPicker(lap._id)}
                                    disabled={resubmitBusy}
                                    className={`px-3 py-2 rounded text-white ${
                                      resubmitBusy ? "bg-amber-400 cursor-not-allowed" : "bg-amber-600 hover:bg-amber-700"
                                    }`}
                                    title="Upload ulang file sesuai catatan admin"
                                  >
                                    {resubmitBusy ? "Uploading..." : "Upload Revisi"}
                                  </button>
                                )}

                                <button
                                  type="button"
                                  onClick={() => handleDelete(lap._id)}
                                  className="px-3 py-2 rounded bg-red-600 text-white hover:bg-red-700"
                                >
                                  Hapus
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
}
