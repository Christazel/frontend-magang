"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import toast from "react-hot-toast";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { DocumentTextIcon, DocumentArrowUpIcon, DocumentArrowDownIcon, TrashIcon, PencilSquareIcon, ArrowPathIcon } from "@heroicons/react/24/outline";

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

  const base = "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border tracking-wide uppercase";
  const cls =
    s === "sesuai"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : s === "revisi"
      ? "bg-rose-50 text-rose-700 border-rose-200"
      : "bg-gray-100 text-gray-600 border-gray-200";

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

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return toast.error("Token tidak ditemukan. Silakan login ulang.");
    if (!file) return toast.error("Pilih file dulu.");

    if (file.size > MAX_BYTES) {
      return toast.error(
        `Ukuran file terlalu besar. Maksimal ${MAX_MB}MB.\nUkuran file kamu: ${bytesToMB(file.size).toFixed(2)}MB`
      );
    }

    setIsUploading(true);
    try {
      await uploadMultipart();

      toast.success("Laporan berhasil diupload!");
      setFile(null);
      setJudul("");
      setDeskripsi("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      await getLaporanList();
    } catch (err: any) {
      console.error(err);
      toast.error(`Gagal upload laporan: ${err?.message || "Unknown error"}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!token) return toast.error("Token tidak ditemukan. Silakan login ulang.");

    const ok = window.confirm("Yakin mau hapus laporan ini?");
    if (!ok) return;

    const res = await fetch(`/api/laporan/${id}`, {
      method: "DELETE",
      headers: authHeaders,
    });

    if (res.ok) {
      toast.success("Laporan dihapus");
      getLaporanList();
    } else {
      toast.error(`Gagal menghapus laporan: ${await parseErrorMessage(res)}`);
    }
  };

  const handleUpdateDeskripsi = async (id: string) => {
    if (!token) {
      toast.error("Token tidak ditemukan. Silakan login ulang.");
      return;
    }

    const res = await fetch(`/api/laporan/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
      body: JSON.stringify({ deskripsi: editDeskripsi }),
    });

    if (res.ok) {
      toast.success("Deskripsi berhasil diperbarui");
      setEditingId(null);
      getLaporanList();
    } else {
      toast.error(`Gagal update deskripsi: ${await parseErrorMessage(res)}`);
    }
  };

  const handleDownload = async (lap: LaporanType) => {
    try {
      if (!token) {
        toast.error("Token tidak ditemukan. Silakan login ulang.");
        return;
      }

      const fileId = normalizeId(lap.fileId);
      if (!fileId) {
        toast.error("FileId tidak ditemukan pada laporan ini.");
        return;
      }

      const res = await fetch(`/api/laporan/download/${fileId}`, {
        method: "GET",
        headers: { ...authHeaders },
      });

      if (!res.ok) {
        toast.error(`Gagal download: ${await parseErrorMessage(res)}`);
        return;
      }

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
      toast.error(`Gagal download: ${err?.message || "Unknown error"}`);
    }
  };

  const openResubmitPicker = (laporanId: string) => {
    setResubmitForId(laporanId);
    if (resubmitInputRef.current) resubmitInputRef.current.value = "";
    resubmitInputRef.current?.click();
  };

  const doResubmit = async (laporanId: string, selectedFile: File) => {
    if (!token) {
      toast.error("Token tidak ditemukan. Silakan login ulang.");
      return;
    }

    if (selectedFile.size > MAX_BYTES) {
      toast.error(
        `Ukuran file terlalu besar. Maksimal ${MAX_MB}MB.\nUkuran file kamu: ${bytesToMB(selectedFile.size).toFixed(
          2
        )}MB`
      );
      return;
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
        toast.error(`Gagal upload revisi: ${await parseErrorMessage(res)}`);
        return;
      }

      toast.success("Upload revisi berhasil! Status laporan kembali ke pending.");
      setResubmitForId(null);
      await getLaporanList();
    } catch (e: any) {
      console.error(e);
      toast.error(`Gagal upload revisi: ${e?.message || "Unknown error"}`);
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
    <div className="flex min-h-screen bg-gray-50/50">
      <Sidebar />

      <div className="flex-1 md:ml-64 flex flex-col min-w-0">
        <Navbar />

        <main className="flex-1 w-full max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
          {/* Header Title */}
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2.5 bg-teal-100 rounded-xl">
              <DocumentTextIcon className="w-6 h-6 text-teal-700" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-gray-800">
                Laporan Tugas Magang
              </h1>
              <p className="text-sm text-gray-500">Unggah dan pantau laporan harian Anda</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            
            {/* ─── Kiri: Form Upload ─── */}
            <div className="lg:col-span-1 space-y-6">
              <Card>
                <CardHeader title="Upload Laporan Baru" />
                <CardBody>
                  <form onSubmit={handleUpload} className="space-y-4">
                    <div>
                      <label className="text-sm font-semibold text-gray-700 block mb-1.5">
                        File Laporan
                      </label>
                      <input
                        ref={fileInputRef}
                        type="file"
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                        className="w-full text-sm text-gray-600 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100 transition-colors border border-gray-200 rounded-xl"
                        accept=".pdf,.doc,.docx,.xls,.xlsx"
                        required
                      />
                    </div>

                    <Input
                      label="Judul Laporan"
                      placeholder="Cth: Laporan Kegiatan Minggu 1"
                      value={judul}
                      onChange={(e) => setJudul(e.target.value)}
                    />

                    <Input
                      label="Deskripsi (Opsional)"
                      placeholder="Tambahkan catatan singkat..."
                      value={deskripsi}
                      onChange={(e) => setDeskripsi(e.target.value)}
                    />

                    <Button
                      type="submit"
                      disabled={isUploading || fileTooBig}
                      isLoading={isUploading}
                      className="w-full mt-2"
                      leftIcon={<DocumentArrowUpIcon className="w-5 h-5" />}
                    >
                      Unggah Laporan
                    </Button>
                  </form>

                  {/* Catatan Upload */}
                  <div
                    className={`mt-5 rounded-xl border p-4 text-sm transition-colors duration-300 ${
                      fileTooBig ? "border-rose-200 bg-rose-50 text-rose-700" : "border-teal-100 bg-teal-50 text-teal-800"
                    }`}
                  >
                    <p className="font-bold mb-1">Catatan Upload</p>
                    <p className="text-xs opacity-90 leading-relaxed">
                      Maksimal ukuran file adalah <b>{MAX_MB}MB</b>. Format yang didukung: PDF, Word, Excel.
                    </p>

                    {file && (
                      <div className="mt-3 p-2 bg-white rounded-lg border border-teal-100 flex items-center justify-between">
                        <span className="text-xs font-medium truncate max-w-[150px]">{file.name}</span>
                        <span className="text-xs font-bold whitespace-nowrap">
                          {fileSizeMB.toFixed(2)} MB {fileTooBig && <span className="text-rose-500 ml-1">!</span>}
                        </span>
                      </div>
                    )}
                  </div>
                </CardBody>
              </Card>
            </div>

            {/* ─── Kanan: Riwayat Laporan ─── */}
            <div className="lg:col-span-2">
              <Card>
                <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                  <div>
                    <h2 className="text-base font-bold text-gray-800">Riwayat Laporan</h2>
                    <p className="text-xs text-gray-500">Daftar semua laporan yang telah diunggah</p>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={getLaporanList}
                    disabled={loadingList}
                    leftIcon={<ArrowPathIcon className={`w-4 h-4 ${loadingList ? "animate-spin" : ""}`} />}
                  >
                    Refresh
                  </Button>
                </div>

                <CardBody className="p-6">
                  {/* hidden input untuk resubmit */}
                  <input
                    ref={resubmitInputRef}
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx,.xls,.xlsx"
                    onChange={onResubmitFileChange}
                  />

                  {loadingList ? (
                    <div className="flex flex-col items-center justify-center py-12 text-teal-600">
                      <ArrowPathIcon className="w-8 h-8 animate-spin mb-3" />
                      <p className="text-sm font-semibold">Memuat riwayat laporan...</p>
                    </div>
                  ) : laporanList.length === 0 ? (
                    <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
                      <DocumentTextIcon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-sm font-semibold text-gray-500">Belum ada laporan</p>
                      <p className="text-xs text-gray-400 mt-1">Laporan yang Anda unggah akan muncul di sini.</p>
                    </div>
                  ) : (
                    <ul className="space-y-4">
                      {laporanList.map((lap) => {
                        const s: ReviewStatus = (lap.status ?? "pending") as ReviewStatus;
                        const showCatatan = !!lap.adminCatatan?.trim();
                        const isRevisi = s === "revisi";
                        const resubmitBusy = isResubmitting && resubmitForId === lap._id;

                        return (
                          <li key={lap._id} className="border border-gray-200 rounded-2xl p-5 hover:shadow-md transition-shadow duration-200 bg-white">
                            
                            {/* Header Item */}
                            <div className="flex items-start justify-between gap-4 mb-3">
                              <div>
                                <h3 className="text-base font-bold text-gray-800 line-clamp-1">
                                  {lap.judul || "Laporan Tanpa Judul"}
                                </h3>
                                <p className="text-xs font-medium text-gray-500 mt-0.5">
                                  {fmtTanggal(lap.createdAt)}
                                </p>
                              </div>
                              <div className="shrink-0 flex items-center gap-2">
                                <StatusBadge status={s} />
                              </div>
                            </div>

                            {/* Deskripsi Edit Mode vs View Mode */}
                            {editingId === lap._id ? (
                              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 mb-4">
                                <Input
                                  value={editDeskripsi}
                                  onChange={(e) => setEditDeskripsi(e.target.value)}
                                  placeholder="Update deskripsi..."
                                />
                                <div className="mt-3 flex gap-2">
                                  <Button size="sm" onClick={() => handleUpdateDeskripsi(lap._id)}>
                                    Simpan
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                                    Batal
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="mb-4">
                                {lap.deskripsi?.trim() ? (
                                  <p className="text-sm text-gray-600 leading-relaxed bg-gray-50 p-3 rounded-lg border border-gray-100">
                                    {lap.deskripsi}
                                  </p>
                                ) : (
                                  <p className="text-xs italic text-gray-400">Tidak ada deskripsi disertakan.</p>
                                )}
                              </div>
                            )}

                            {/* Catatan Admin */}
                            {showCatatan && (
                              <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50/50 p-4">
                                <div className="flex items-center gap-2 mb-1.5">
                                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                  <p className="text-xs font-bold text-rose-800 uppercase tracking-wide">Catatan Admin</p>
                                </div>
                                <p className="text-sm text-rose-700 leading-relaxed font-medium">"{lap.adminCatatan}"</p>
                                {isRevisi && (
                                  <p className="mt-2 text-xs text-rose-600 bg-white/60 p-2 rounded-lg border border-rose-100 font-semibold inline-block">
                                    Tindakan diperlukan: Silakan upload ulang file revisi Anda.
                                  </p>
                                )}
                              </div>
                            )}

                            {/* Actions Footer */}
                            <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-gray-100">
                              <Button
                                size="xs"
                                variant="outline"
                                leftIcon={<DocumentArrowDownIcon className="w-4 h-4" />}
                                onClick={() => handleDownload(lap)}
                              >
                                Unduh File
                              </Button>

                              {!editingId && (
                                <Button
                                  size="xs"
                                  variant="ghost"
                                  leftIcon={<PencilSquareIcon className="w-4 h-4" />}
                                  onClick={() => {
                                    setEditingId(lap._id);
                                    setEditDeskripsi(lap.deskripsi || "");
                                  }}
                                >
                                  Edit Info
                                </Button>
                              )}

                              {isRevisi && (
                                <Button
                                  size="xs"
                                  variant="secondary"
                                  leftIcon={<DocumentArrowUpIcon className="w-4 h-4" />}
                                  onClick={() => openResubmitPicker(lap._id)}
                                  disabled={resubmitBusy}
                                  isLoading={resubmitBusy}
                                >
                                  {resubmitBusy ? "Mengunggah..." : "Upload Revisi"}
                                </Button>
                              )}

                              <div className="flex-1" />

                              <Button
                                size="xs"
                                variant="ghost"
                                className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                                leftIcon={<TrashIcon className="w-4 h-4" />}
                                onClick={() => handleDelete(lap._id)}
                              >
                                Hapus
                              </Button>
                            </div>

                          </li>
                        );
                      })}
                    </ul>
                  )}
                </CardBody>
              </Card>
            </div>

          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
}
