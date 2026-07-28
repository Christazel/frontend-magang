"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ClockIcon, CheckCircleIcon, ArrowLeftIcon, MapPinIcon, CalendarDaysIcon, XMarkIcon } from "@heroicons/react/24/outline";
import useSWR from "swr";
import { presensiService, izinService, getErrorMessage } from "@/lib/api";
import type { Presensi, Izin, IzinStatus } from "@/types";
import toast from "react-hot-toast";

type WindowTime = { start: string; end: string };

const DEFAULT_MASUK: WindowTime = { start: "08:00:00", end: "08:59:59" };
const DEFAULT_KELUAR: WindowTime = { start: "16:00:00", end: "23:59:59" };

function isValidHHmmss(value?: string) {
  if (!value) return false;
  return /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/.test(value);
}

function getWindowFromEnv(prefix: "MASUK" | "KELUAR", fallback: WindowTime): WindowTime {
  const start =
    process.env[`NEXT_PUBLIC_PRESENSI_${prefix}_START` as const] || fallback.start;
  const end =
    process.env[`NEXT_PUBLIC_PRESENSI_${prefix}_END` as const] || fallback.end;
  return {
    start: isValidHHmmss(start) ? start : fallback.start,
    end: isValidHHmmss(end) ? end : fallback.end,
  };
}

function getNowWibParts() {
  const dtf = new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    weekday: "long",
  });

  const parts = dtf.formatToParts(new Date());
  const pick = (type: string) => parts.find((p) => p.type === type)?.value || "";

  const year = pick("year");
  const month = pick("month");
  const day = pick("day");
  const hour = pick("hour");
  const minute = pick("minute");
  const second = pick("second");
  const weekday = pick("weekday");

  return {
    dateISO: `${year}-${month}-${day}`,
    time: `${hour}:${minute}:${second}`,
    datePretty: `${weekday}, ${Number(day)} ${new Intl.DateTimeFormat("id-ID", {
      timeZone: "Asia/Jakarta",
      month: "long",
    }).format(new Date())} ${year}`,
  };
}

function toSeconds(hhmmss: string) {
  const [h, m, s] = hhmmss.split(":").map((x) => Number(x));
  return h * 3600 + m * 60 + s;
}

function inWindow(nowHHmmss: string, win: WindowTime) {
  const now = toSeconds(nowHHmmss);
  return now >= toSeconds(win.start) && now <= toSeconds(win.end);
}

export default function PresensiPage() {
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const masukWindow = useMemo(() => getWindowFromEnv("MASUK", DEFAULT_MASUK), []);
  const keluarWindow = useMemo(() => getWindowFromEnv("KELUAR", DEFAULT_KELUAR), []);

  const [nowWib, setNowWib] = useState<{ time: string; datePretty: string } | null>(null);

  // ─── State Izin Modal ───
  const [showIzinModal, setShowIzinModal] = useState(false);
  const [izinForm, setIzinForm] = useState({ tanggal: "", jenis: "sakit", keterangan: "" });
  const [izinLoading, setIzinLoading] = useState(false);

  // ─── Riwayat Izin ───
  const { data: riwayatIzin, mutate: refetchIzin } = useSWR<Izin[]>(
    "/izin",
    () => izinService.getMyIzin().then((r) => r.data),
  );

  // ✅ SWR untuk data presensi hari ini — otomatis refresh setelah absen
  const { data: presensiHariIni, mutate: refetchPresensi } = useSWR<Presensi | null>(
    "/presensi/hari-ini",
    () => presensiService.getHariIni(),
  );

  // Clock timer effect — runs once on mount
  useEffect(() => {
    setMounted(true);
    setNowWib(getNowWibParts());
    const t = setInterval(() => setNowWib(getNowWibParts()), 1000);
    return () => clearInterval(t);
  }, []);

  const canMasuk = useMemo(() => {
    if (!nowWib) return false;
    return inWindow(nowWib.time, masukWindow);
  }, [nowWib, masukWindow]);

  const canKeluar = useMemo(() => {
    if (!nowWib) return false;
    return inWindow(nowWib.time, keluarWindow);
  }, [nowWib, keluarWindow]);

  const getLocation = (): Promise<{ lat: number; lng: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation)
        return reject(new Error("Geolocation tidak didukung browser ini"));

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude, accuracy } = pos.coords;
          console.log("GPS:", latitude, longitude, "akurasi:", accuracy);
          resolve({ lat: latitude, lng: longitude });
        },
        (err) => {
          console.error("Error GPS:", err);
          reject(new Error("Gagal mengambil lokasi. Aktifkan GPS & izinkan akses lokasi."));
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    });
  };

  const handleAbsen = async (tipe: "masuk" | "keluar") => {
    setError("");
    setSuccess("");

    const timeNow = nowWib?.time || "";
    if (tipe === "masuk" && (!nowWib || !canMasuk)) {
      setError(
        `Presensi masuk hanya ${masukWindow.start} – ${masukWindow.end} WIB. Sekarang: ${timeNow || "-"} WIB.`
      );
      return;
    }
    if (tipe === "keluar" && (!nowWib || !canKeluar)) {
      setError(
        `Presensi keluar hanya ${keluarWindow.start} – ${keluarWindow.end} WIB. Sekarang: ${timeNow || "-"} WIB.`
      );
      return;
    }

    setLoading(true);
    try {
      const lokasi = await getLocation();
      const locStr = `${lokasi.lat.toFixed(6)},${lokasi.lng.toFixed(6)}`;

      if (tipe === "masuk") {
        await presensiService.masuk({ lokasiMasuk: locStr });
      } else {
        await presensiService.keluar({ lokasiKeluar: locStr });
      }

      setSuccess(`Presensi ${tipe} berhasil dicatat!`);
      // ✅ SWR mutate: update cache secara optimistis tanpa full reload
      refetchPresensi();
    } catch (err: unknown) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleAjukanIzin = async () => {
    if (!izinForm.tanggal || !izinForm.jenis) {
      toast.error("Tanggal dan jenis wajib diisi!");
      return;
    }
    setIzinLoading(true);
    try {
      await izinService.ajukan({
        tanggal: izinForm.tanggal,
        jenis: izinForm.jenis,
        keterangan: izinForm.keterangan,
      });
      toast.success("Pengajuan izin berhasil dikirim! Menunggu persetujuan admin.");
      setShowIzinModal(false);
      setIzinForm({ tanggal: "", jenis: "sakit", keterangan: "" });
      refetchIzin();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setIzinLoading(false);
    }
  };

  const masukDisabled = loading || !mounted || !canMasuk;
  const keluarDisabled = loading || !mounted || !canKeluar;
  const isDone = !!presensiHariIni?.jamMasuk && !!presensiHariIni?.jamKeluar;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* ── Card Utama ── */}
        <div className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden">

          {/* Header strip teal */}
          <div
            className="px-6 py-5 text-white"
            style={{ background: "linear-gradient(135deg, #0f4c35 0%, #0b2c65 100%)" }}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
                <ClockIcon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold leading-tight">Presensi Harian</h1>
                <p className="text-blue-200 text-xs">Catat kehadiran Anda hari ini</p>
              </div>
            </div>

            {/* Jam WIB realtime */}
            <div className="bg-white/10 rounded-xl px-4 py-3 flex items-center justify-between">
              <div>
                <p className="text-blue-200 text-[10px] font-semibold uppercase tracking-widest mb-0.5">
                  Waktu Sekarang (WIB)
                </p>
                <p className="text-white font-mono text-2xl font-bold tabular-nums tracking-wider">
                  {mounted && nowWib ? nowWib.time : "--:--:--"}
                </p>
              </div>
              <div className="text-right text-blue-100 text-xs leading-relaxed">
                <p>{mounted && nowWib ? nowWib.datePretty : "-"}</p>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="px-6 py-5 space-y-4">

            {/* Jadwal window */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-center">
                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-1">
                  Jam Masuk
                </p>
                <p className="text-sm font-bold text-emerald-700 font-mono">
                  {masukWindow.start.slice(0, 5)}
                </p>
                <p className="text-[10px] text-emerald-500">
                  s/d {masukWindow.end.slice(0, 5)} WIB
                </p>
              </div>
              <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 text-center">
                <p className="text-[10px] font-bold text-rose-600 uppercase tracking-wider mb-1">
                  Jam Keluar
                </p>
                <p className="text-sm font-bold text-rose-700 font-mono">
                  {keluarWindow.start.slice(0, 5)}
                </p>
                <p className="text-[10px] text-rose-500">
                  s/d {keluarWindow.end.slice(0, 5)} WIB
                </p>
              </div>
            </div>

            {/* Status presensi hari ini */}
            <div className="border border-gray-100 rounded-xl divide-y divide-gray-100">
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-gray-500 font-medium">Jam Masuk</span>
                <span
                  className={`text-sm font-bold ${
                    presensiHariIni?.jamMasuk ? "text-emerald-600" : "text-gray-300"
                  }`}
                >
                  {presensiHariIni?.jamMasuk || "—"}
                </span>
              </div>
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-sm text-gray-500 font-medium">Jam Keluar</span>
                <span
                  className={`text-sm font-bold ${
                    presensiHariIni?.jamKeluar ? "text-rose-600" : "text-gray-300"
                  }`}
                >
                  {presensiHariIni?.jamKeluar || "—"}
                </span>
              </div>
              {(presensiHariIni?.lokasiMasuk || presensiHariIni?.lokasiKeluar) && (
                <div className="flex items-start gap-2 px-4 py-3">
                  <MapPinIcon className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                  <span className="text-xs text-gray-400 break-all">
                    {presensiHariIni?.lokasiMasuk || presensiHariIni?.lokasiKeluar}
                  </span>
                </div>
              )}
            </div>

            {/* Alert messages */}
            {success && (
              <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm">
                <CheckCircleIcon className="w-4 h-4 flex-shrink-0" />
                {success}
              </div>
            )}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                {error}
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-2.5">
              {isDone ? (
                <div className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-blue-50 border-2 border-blue-200 text-blue-700 font-semibold text-sm">
                  <CheckCircleIcon className="w-5 h-5" />
                  Presensi Hari Ini Selesai
                </div>
              ) : (
                <>
                  {!presensiHariIni?.jamMasuk && (
                    <div className="space-y-1.5">
                      <button
                        onClick={() => handleAbsen("masuk")}
                        disabled={masukDisabled}
                        className="w-full py-3 rounded-xl font-semibold text-white text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{
                          background: masukDisabled
                            ? "#9ca3af"
                            : "linear-gradient(135deg, #10b981, #059669)",
                          boxShadow: masukDisabled
                            ? "none"
                            : "0 4px 14px rgba(16,185,129,0.35)",
                        }}
                      >
                        {loading ? "Memproses..." : "Presensi Masuk"}
                      </button>
                      {mounted && !canMasuk && (
                        <p className="text-center text-[11px] text-gray-400">
                          Tombol aktif pukul{" "}
                          <span className="font-semibold text-gray-500">
                            {masukWindow.start.slice(0, 5)} – {masukWindow.end.slice(0, 5)} WIB
                          </span>
                        </p>
                      )}
                    </div>
                  )}

                  {presensiHariIni?.jamMasuk && !presensiHariIni?.jamKeluar && (
                    <div className="space-y-1.5">
                      <button
                        onClick={() => handleAbsen("keluar")}
                        disabled={keluarDisabled}
                        className="w-full py-3 rounded-xl font-semibold text-white text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{
                          background: keluarDisabled
                            ? "#9ca3af"
                            : "linear-gradient(135deg, #f43f5e, #e11d48)",
                          boxShadow: keluarDisabled
                            ? "none"
                            : "0 4px 14px rgba(244,63,94,0.35)",
                        }}
                      >
                        {loading ? "Memproses..." : "Presensi Keluar"}
                      </button>
                      {mounted && !canKeluar && (
                        <p className="text-center text-[11px] text-gray-400">
                          Tombol aktif pukul{" "}
                          <span className="font-semibold text-gray-500">
                            {keluarWindow.start.slice(0, 5)} – {keluarWindow.end.slice(0, 5)} WIB
                          </span>
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}

              {/* Back button */}
              <button
                type="button"
                onClick={() => router.push("/dashboard/peserta")}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-gray-500 bg-gray-50 hover:bg-gray-100 border border-gray-200 transition-colors duration-200"
              >
                <ArrowLeftIcon className="w-4 h-4" />
                Kembali ke Dashboard
              </button>

              {/* ─── Tombol Ajukan Izin ─── */}
              <button
                id="btn-ajukan-izin"
                type="button"
                onClick={() => setShowIzinModal(true)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors duration-200"
              >
                <CalendarDaysIcon className="w-4 h-4" />
                Ajukan Izin / Sakit Hari Ini
              </button>
            </div>

          </div>
        </div>

        {/* ─── Riwayat Pengajuan Izin ─── */}
        {Array.isArray(riwayatIzin) && riwayatIzin.length > 0 && (
          <div className="mt-5 bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-sm font-bold text-gray-900">Riwayat Pengajuan Izin</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {riwayatIzin.map((item) => {
                const statusMap: Record<IzinStatus, { label: string; cls: string }> = {
                  pending:   { label: "Menunggu",  cls: "bg-amber-50 text-amber-700 border-amber-200" },
                  disetujui: { label: "Disetujui", cls: "bg-green-50 text-green-700 border-green-200" },
                  ditolak:   { label: "Ditolak",   cls: "bg-rose-50 text-rose-700 border-rose-200" },
                };
                const { label, cls } = statusMap[item.status] ?? statusMap.pending;
                return (
                  <div key={item._id} className="px-5 py-3.5 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800 capitalize">
                        {item.jenis === "sakit" ? "🤒 Sakit" : "📝 Izin"} — {item.tanggal}
                      </p>
                      {item.keterangan && (
                        <p className="text-xs text-gray-400 truncate mt-0.5">{item.keterangan}</p>
                      )}
                      {item.catatanAdmin && (
                        <p className="text-xs text-gray-500 mt-0.5 italic">Admin: {item.catatanAdmin}</p>
                      )}
                    </div>
                    <span className={`flex-shrink-0 text-xs font-semibold px-2.5 py-1 rounded-lg border ${cls}`}>
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>

      {/* ─── Modal Ajukan Izin ─── */}
      {showIzinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Ajukan Izin / Sakit</h2>
              <button
                onClick={() => setShowIzinModal(false)}
                className="p-1.5 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1.5">Tanggal</label>
                <input
                  type="date"
                  value={izinForm.tanggal}
                  onChange={(e) => setIzinForm((p) => ({ ...p, tanggal: e.target.value }))}
                  className="w-full text-sm p-2.5 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1.5">Jenis Ketidakhadiran</label>
                <select
                  value={izinForm.jenis}
                  onChange={(e) => setIzinForm((p) => ({ ...p, jenis: e.target.value }))}
                  className="w-full text-sm p-2.5 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors"
                >
                  <option value="sakit">🤒 Sakit</option>
                  <option value="izin">📝 Izin</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold text-gray-700 block mb-1.5">
                  Keterangan <span className="font-normal text-gray-400">(opsional)</span>
                </label>
                <textarea
                  rows={3}
                  value={izinForm.keterangan}
                  onChange={(e) => setIzinForm((p) => ({ ...p, keterangan: e.target.value }))}
                  placeholder="Contoh: Demam tinggi, sudah ke dokter..."
                  className="w-full text-sm p-3 rounded-xl border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-colors resize-none"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowIzinModal(false)}
                disabled={izinLoading}
                className="flex-1 py-2.5 text-sm font-semibold rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Batal
              </button>
              <button
                onClick={handleAjukanIzin}
                disabled={izinLoading}
                className="flex-1 py-2.5 text-sm font-semibold rounded-xl text-white bg-amber-500 hover:bg-amber-600 transition-colors disabled:opacity-60"
              >
                {izinLoading ? "Mengirim..." : "Kirim Pengajuan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
