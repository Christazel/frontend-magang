"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Card, CardBody } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import {
  CalendarDaysIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import { izinService, getErrorMessage } from "@/lib/api";
import type { Izin, IzinStatus } from "@/types";
import toast from "react-hot-toast";

// ─── Badge Status ───────────────────────────────
const StatusBadge = ({ status }: { status: IzinStatus }) => {
  const map: Record<IzinStatus, { label: string; cls: string }> = {
    pending:   { label: "Menunggu",  cls: "bg-amber-50 text-amber-700 border-amber-200" },
    disetujui: { label: "Disetujui", cls: "bg-green-50 text-green-700 border-green-200" },
    ditolak:   { label: "Ditolak",   cls: "bg-rose-50  text-rose-700  border-rose-200"  },
  };
  const { label, cls } = map[status] ?? map.pending;
  return (
    <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-lg border ${cls}`}>
      {label}
    </span>
  );
};

// ─── Modal Approve / Reject ─────────────────────
interface ApproveModalProps {
  izin: Izin;
  onClose: () => void;
  onSuccess: () => void;
}
function ApproveModal({ izin, onClose, onSuccess }: ApproveModalProps) {
  const [action, setAction] = useState<"disetujui" | "ditolak">("disetujui");
  const [catatan, setCatatan] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await izinService.approveIzin(izin._id, {
        status: action,
        catatanAdmin: catatan,
      });
      toast.success(
        action === "disetujui"
          ? "Pengajuan izin berhasil disetujui ✅"
          : "Pengajuan izin ditolak ❌"
      );
      onSuccess();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
        <h2 className="text-lg font-bold text-gray-900">Proses Pengajuan Izin</h2>
        <div className="bg-gray-50 rounded-xl p-4 space-y-1.5 text-sm">
          <p><span className="font-semibold text-gray-600">Peserta:</span> {typeof izin.user === "object" ? izin.user?.name : "—"}</p>
          <p><span className="font-semibold text-gray-600">Tanggal:</span> {izin.tanggal}</p>
          <p><span className="font-semibold text-gray-600">Jenis:</span>{" "}
            <span className={`capitalize font-semibold ${izin.jenis === "sakit" ? "text-rose-600" : "text-amber-600"}`}>
              {izin.jenis}
            </span>
          </p>
          {izin.keterangan && (
            <p><span className="font-semibold text-gray-600">Keterangan:</span> {izin.keterangan}</p>
          )}
        </div>

        {/* Pilih Tindakan */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setAction("disetujui")}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${
              action === "disetujui"
                ? "border-green-500 bg-green-50 text-green-700"
                : "border-gray-200 text-gray-500 hover:border-green-300"
            }`}
          >
            <CheckCircleIcon className="w-4 h-4" />
            Setujui
          </button>
          <button
            onClick={() => setAction("ditolak")}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${
              action === "ditolak"
                ? "border-rose-500 bg-rose-50 text-rose-700"
                : "border-gray-200 text-gray-500 hover:border-rose-300"
            }`}
          >
            <XCircleIcon className="w-4 h-4" />
            Tolak
          </button>
        </div>

        {/* Catatan Admin */}
        <div>
          <label className="text-sm font-semibold text-gray-700 block mb-1.5">
            Catatan (opsional)
          </label>
          <textarea
            rows={3}
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            placeholder="Tambahkan catatan untuk peserta..."
            className="w-full text-sm p-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-2.5 text-sm font-semibold rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className={`flex-1 py-2.5 text-sm font-semibold rounded-xl text-white transition-all disabled:opacity-60 ${
              action === "disetujui" ? "bg-green-600 hover:bg-green-700" : "bg-rose-600 hover:bg-rose-700"
            }`}
          >
            {loading ? "Menyimpan..." : action === "disetujui" ? "Setujui" : "Tolak"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page Utama ──────────────────────────────────
export default function AdminIzinPage() {
  const [izinList, setIzinList] = useState<Izin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<"" | IzinStatus>("");
  const [selectedIzin, setSelectedIzin] = useState<Izin | null>(null);
  const debounceRef = useRef<number | null>(null);

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => { if (debounceRef.current) window.clearTimeout(debounceRef.current); };
  }, [search]);

  const fetchIzin = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data } = await izinService.getAllIzin({
        search: debouncedSearch || undefined,
        status: filterStatus || undefined,
        limit: 50,
      });
      setIzinList(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, filterStatus]);

  useEffect(() => { fetchIzin(); }, [fetchIzin]);

  const handleApproveSuccess = () => {
    setSelectedIzin(null);
    fetchIzin();
  };

  const pendingCount = izinList.filter((i) => i.status === "pending").length;

  return (
    <div className="flex min-h-screen w-full bg-gray-50/50 overflow-x-hidden">
      <Sidebar />
      <div className="flex-1 md:ml-64 flex flex-col min-w-0">
        <Navbar />
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 w-full max-w-7xl mx-auto">
          <div className="space-y-6">

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-amber-100 rounded-xl">
                  <CalendarDaysIcon className="w-6 h-6 text-amber-700" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Pengajuan Izin & Sakit</h1>
                  <p className="text-gray-500 text-sm">Review dan setujui pengajuan ketidakhadiran peserta</p>
                </div>
              </div>
              {pendingCount > 0 && (
                <span className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 rounded-lg">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                  {pendingCount} Menunggu Review
                </span>
              )}
            </div>

            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2">
                <span>⚠️</span> {error}
              </div>
            )}

            <Card>
              <CardBody className="p-5">
                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="md:col-span-2">
                    <Input
                      label="Pencarian"
                      placeholder="Cari nama atau email peserta..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-700 block mb-1.5">Filter Status</label>
                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value as "" | IzinStatus)}
                      className="w-full text-sm p-2.5 rounded-xl bg-white border border-gray-200 text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                    >
                      <option value="">Semua Status</option>
                      <option value="pending">Menunggu</option>
                      <option value="disetujui">Disetujui</option>
                      <option value="ditolak">Ditolak</option>
                    </select>
                  </div>
                </div>

                {/* Loading */}
                {loading && (
                  <div className="flex flex-col items-center justify-center py-16 text-amber-600">
                    <ArrowPathIcon className="w-8 h-8 animate-spin mb-3" />
                    <p className="text-sm font-semibold">Memuat data pengajuan izin...</p>
                  </div>
                )}

                {/* Table */}
                {!loading && !error && (
                  <>
                    {/* Mobile cards */}
                    <div className="block md:hidden space-y-4">
                      {izinList.length === 0 ? (
                        <div className="text-center text-gray-500 py-10 bg-gray-50/50 rounded-xl border border-dashed border-gray-200">
                          Tidak ada pengajuan izin ditemukan.
                        </div>
                      ) : (
                        izinList.map((item) => (
                          <div key={item._id} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm space-y-3">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="font-bold text-gray-900 text-sm truncate">
                                  {typeof item.user === "object" ? item.user?.name : "—"}
                                </p>
                                <p className="text-xs text-gray-500 truncate">
                                  {typeof item.user === "object" ? item.user?.email : ""}
                                </p>
                              </div>
                              <StatusBadge status={item.status} />
                            </div>
                            <div className="flex flex-wrap gap-2 text-xs">
                              <span className="px-2 py-1 bg-gray-100 rounded-lg font-medium text-gray-600">
                                📅 {item.tanggal}
                              </span>
                              <span className={`px-2 py-1 rounded-lg font-medium capitalize ${item.jenis === "sakit" ? "bg-rose-50 text-rose-600" : "bg-amber-50 text-amber-600"}`}>
                                {item.jenis === "sakit" ? "🤒 Sakit" : "📝 Izin"}
                              </span>
                            </div>
                            {item.keterangan && (
                              <p className="text-xs text-gray-500 italic line-clamp-2">&quot;{item.keterangan}&quot;</p>
                            )}
                            {item.status === "pending" && (
                              <button
                                onClick={() => setSelectedIzin(item)}
                                className="w-full py-2 text-xs font-bold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                              >
                                Proses Pengajuan
                              </button>
                            )}
                            {item.catatanAdmin && (
                              <p className="text-xs text-gray-500 bg-gray-50 rounded-lg p-2">
                                <span className="font-semibold">Catatan Admin:</span> {item.catatanAdmin}
                              </p>
                            )}
                          </div>
                        ))
                      )}
                    </div>

                    {/* Desktop table */}
                    <div className="hidden md:block overflow-x-auto">
                      <table className="min-w-full text-sm text-left text-gray-700 border-t border-gray-100">
                        <thead className="bg-gray-50/80 text-gray-800">
                          <tr>
                            <th className="px-6 py-4 font-bold">Peserta</th>
                            <th className="px-6 py-4 font-bold">Tanggal</th>
                            <th className="px-6 py-4 font-bold">Jenis</th>
                            <th className="px-6 py-4 font-bold">Keterangan</th>
                            <th className="px-6 py-4 text-center font-bold">Status</th>
                            <th className="px-6 py-4 text-center font-bold">Aksi</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                          {izinList.length === 0 ? (
                            <tr>
                              <td colSpan={6} className="px-6 py-12 text-center text-gray-500 bg-gray-50/30">
                                Tidak ada pengajuan izin ditemukan.
                              </td>
                            </tr>
                          ) : (
                            izinList.map((item) => (
                              <tr key={item._id} className="hover:bg-gray-50/50 transition-colors">
                                <td className="px-6 py-4">
                                  <p className="font-semibold text-gray-900 truncate max-w-[180px]">
                                    {typeof item.user === "object" ? item.user?.name : "—"}
                                  </p>
                                  <p className="text-xs text-gray-400 truncate max-w-[180px]">
                                    {typeof item.user === "object" ? item.user?.email : ""}
                                  </p>
                                </td>
                                <td className="px-6 py-4 text-gray-600 font-medium">{item.tanggal}</td>
                                <td className="px-6 py-4">
                                  <span className={`capitalize text-xs font-semibold px-2.5 py-1 rounded-lg border ${item.jenis === "sakit" ? "bg-rose-50 text-rose-700 border-rose-200" : "bg-amber-50 text-amber-700 border-amber-200"}`}>
                                    {item.jenis === "sakit" ? "🤒 Sakit" : "📝 Izin"}
                                  </span>
                                </td>
                                <td className="px-6 py-4 max-w-[220px]">
                                  <p className="text-gray-500 text-xs line-clamp-2 italic">
                                    {item.keterangan || "—"}
                                  </p>
                                  {item.catatanAdmin && (
                                    <p className="text-gray-400 text-xs mt-1">
                                      <span className="font-semibold not-italic">Admin:</span> {item.catatanAdmin}
                                    </p>
                                  )}
                                </td>
                                <td className="px-6 py-4 text-center">
                                  <StatusBadge status={item.status} />
                                </td>
                                <td className="px-6 py-4 text-center">
                                  {item.status === "pending" ? (
                                    <button
                                      onClick={() => setSelectedIzin(item)}
                                      className="px-3 py-1.5 text-xs font-bold rounded-xl bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                                    >
                                      Proses
                                    </button>
                                  ) : (
                                    <span className="text-gray-400 text-xs">—</span>
                                  )}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </CardBody>
            </Card>
          </div>
        </main>
        <Footer />
      </div>

      {/* Modal */}
      {selectedIzin && (
        <ApproveModal
          izin={selectedIzin}
          onClose={() => setSelectedIzin(null)}
          onSuccess={handleApproveSuccess}
        />
      )}
    </div>
  );
}
