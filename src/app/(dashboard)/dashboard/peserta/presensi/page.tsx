"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

interface Presensi {
  jamMasuk?: string;
  jamKeluar?: string;
  lokasi?: string;
}

type WindowTime = { start: string; end: string };

const DEFAULT_MASUK: WindowTime = { start: "08:00:00", end: "08:59:59" };
const DEFAULT_KELUAR: WindowTime = { start: "16:00:00", end: "23:59:59" };

function isValidHHmmss(value?: string) {
  if (!value) return false;
  // HH:mm:ss, HH 00-23, mm/ss 00-59
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
  // Jam WIB walaupun device timezone beda
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
  const start = toSeconds(win.start);
  const end = toSeconds(win.end);
  return now >= start && now <= end;
}

export default function PresensiPage() {
  const router = useRouter();

  // ✅ Anti hydration mismatch: render jam/date setelah mount
  const [mounted, setMounted] = useState(false);

  const [presensiHariIni, setPresensiHariIni] = useState<Presensi | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const masukWindow = useMemo(() => getWindowFromEnv("MASUK", DEFAULT_MASUK), []);
  const keluarWindow = useMemo(() => getWindowFromEnv("KELUAR", DEFAULT_KELUAR), []);

  const [nowWib, setNowWib] = useState<{ time: string; datePretty: string } | null>(null);

  useEffect(() => {
    setMounted(true);
    setNowWib(getNowWibParts());
    const t = setInterval(() => setNowWib(getNowWibParts()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    fetchPresensiHariIni();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const canMasuk = useMemo(() => {
    if (!nowWib) return false;
    return inWindow(nowWib.time, masukWindow);
  }, [nowWib, masukWindow]);

  const canKeluar = useMemo(() => {
    if (!nowWib) return false;
    return inWindow(nowWib.time, keluarWindow);
  }, [nowWib, keluarWindow]);

  const fetchPresensiHariIni = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/presensi/hari-ini", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setPresensiHariIni(data);
    } catch (err) {
      console.error(err);
    }
  };

  const getLocation = (): Promise<{ lat: number; lng: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) return reject(new Error("Geolocation tidak didukung browser ini"));

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

    // Guard UX (backend tetap final)
    const timeNow = nowWib?.time || "";
    if (tipe === "masuk" && (!nowWib || !canMasuk)) {
      setError(
        `Presensi masuk hanya ${masukWindow.start} - ${masukWindow.end} WIB. Sekarang: ${
          timeNow || "-"
        } WIB.`
      );
      return;
    }
    if (tipe === "keluar" && (!nowWib || !canKeluar)) {
      setError(
        `Presensi keluar hanya ${keluarWindow.start} - ${keluarWindow.end} WIB. Sekarang: ${
          timeNow || "-"
        } WIB.`
      );
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("Token tidak ditemukan. Silakan login kembali.");

      const lokasi = await getLocation();

      const res = await fetch(`/api/presensi/${tipe}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          latitude: Number(lokasi.lat.toFixed(6)),
          longitude: Number(lokasi.lng.toFixed(6)),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || "Gagal melakukan presensi");

      setSuccess(`Presensi ${tipe} berhasil!`);
      fetchPresensiHariIni();
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan saat presensi");
    } finally {
      setLoading(false);
    }
  };

  const masukDisabled = loading || !mounted || !canMasuk;
  const keluarDisabled = loading || !mounted || !canKeluar;

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 px-3 py-6 sm:px-4 sm:py-8 md:px-6 lg:px-8">
      <div className="bg-white p-4 sm:p-6 md:p-8 rounded-2xl shadow-2xl w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl border border-gray-100">
        {/* Header */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full mb-3 sm:mb-4 shadow-lg">
            <svg className="w-7 h-7 sm:w-8 sm:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 leading-snug">
            Presensi Hari Ini
          </h2>

          <p className="text-xs sm:text-sm text-gray-500 mt-1 sm:mt-2 px-4 sm:px-0">
            Catat kehadiran Anda dengan mudah
          </p>

          {/* Jam WIB realtime */}
          <div className="mt-3 flex flex-col items-center gap-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-gray-50 border border-gray-200 px-3 py-1.5 text-xs sm:text-sm">
              <span className="text-gray-500">WIB</span>
              <span className="font-semibold text-gray-800 tabular-nums">
                {mounted && nowWib ? nowWib.time : "--:--:--"}
              </span>
            </div>

            <div className="text-[11px] sm:text-xs text-gray-600">
              <div>
                Jam Masuk: <b>{masukWindow.start} - {masukWindow.end} WIB</b>
              </div>
              <div>
                Jam Keluar: <b>{keluarWindow.start} - {keluarWindow.end} WIB</b>
              </div>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {success && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-green-50 border-l-4 border-green-500 rounded-lg">
            <p className="text-xs sm:text-sm text-green-700 font-medium">{success}</p>
          </div>
        )}
        {error && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
            <p className="text-xs sm:text-sm text-red-700 font-medium">{error}</p>
          </div>
        )}

        {/* Info Card */}
        <div className="mb-5 sm:mb-6 bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-3 py-2 border-b border-gray-200">
              <span className="text-gray-600 font-medium text-xs sm:text-sm">Tanggal</span>
              <span className="text-gray-800 font-semibold text-xs sm:text-sm text-right">
                {mounted && nowWib ? nowWib.datePretty : "-"}
              </span>
            </div>

            <div className="flex items-center justify-between gap-3 py-2 border-b border-gray-200">
              <span className="text-gray-600 font-medium text-xs sm:text-sm">Jam Masuk</span>
              <span className={`font-bold ${presensiHariIni?.jamMasuk ? "text-green-600" : "text-gray-400"}`}>
                {presensiHariIni?.jamMasuk || "Belum Presensi"}
              </span>
            </div>

            <div className="flex items-center justify-between gap-3 py-2">
              <span className="text-gray-600 font-medium text-xs sm:text-sm">Jam Keluar</span>
              <span className={`font-bold ${presensiHariIni?.jamKeluar ? "text-red-600" : "text-gray-400"}`}>
                {presensiHariIni?.jamKeluar || "Belum Presensi"}
              </span>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-3 mb-4 sm:mb-5">
          {!presensiHariIni?.jamMasuk && (
            <>
              <button
                onClick={() => handleAbsen("masuk")}
                disabled={masukDisabled}
                title={!canMasuk ? `Aktif ${masukWindow.start}-${masukWindow.end} WIB` : undefined}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Memproses..." : "Presensi Masuk"}
              </button>

              {mounted && !canMasuk && (
                <p className="text-[11px] sm:text-xs text-gray-500 text-center">
                  Tombol aktif pada <b>{masukWindow.start} - {masukWindow.end} WIB</b>
                </p>
              )}
            </>
          )}

          {presensiHariIni?.jamMasuk && !presensiHariIni?.jamKeluar && (
            <>
              <button
                onClick={() => handleAbsen("keluar")}
                disabled={keluarDisabled}
                title={!canKeluar ? `Aktif ${keluarWindow.start}-${keluarWindow.end} WIB` : undefined}
                className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold py-3 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Memproses..." : "Presensi Keluar"}
              </button>

              {mounted && !canKeluar && (
                <p className="text-[11px] sm:text-xs text-gray-500 text-center">
                  Tombol aktif pada <b>{keluarWindow.start} - {keluarWindow.end} WIB</b>
                </p>
              )}
            </>
          )}

          {presensiHariIni?.jamMasuk && presensiHariIni?.jamKeluar && (
            <div className="w-full bg-blue-50 border-2 border-blue-200 text-blue-700 font-semibold py-3 rounded-xl text-center">
              Presensi Hari Ini Lengkap
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => router.push("/dashboard/peserta")}
          className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 rounded-xl border border-gray-200"
        >
          Kembali ke Dashboard
        </button>
      </div>
    </div>
  );
}
