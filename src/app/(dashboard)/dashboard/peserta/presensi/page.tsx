"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface Presensi {
  jamMasuk?: string;
  jamKeluar?: string;
  lokasi?: string;
}

export default function PresensiPage() {
  const router = useRouter();
  const [presensiHariIni, setPresensiHariIni] = useState<Presensi | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchPresensiHariIni();
  }, []);

  // 🔹 Ambil data presensi hari ini dari backend
  const fetchPresensiHariIni = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/presensi/hari-ini", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setPresensiHariIni(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 🔹 Ambil lokasi GPS (dipaksa ambil posisi terbaru & high accuracy)
  const getLocation = (): Promise<{ lat: number; lng: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        return reject(new Error("Geolocation tidak didukung browser ini"));
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude, accuracy } = pos.coords;
          console.log("GPS RAW:", latitude, longitude, "akurasi:", accuracy, "meter");
          resolve({ lat: latitude, lng: longitude });
        },
        (err) => {
          console.error("Error GPS:", err);
          reject(new Error("Gagal mengambil lokasi. Aktifkan GPS & izinkan akses lokasi."));
        },
        {
          enableHighAccuracy: true,
          timeout: 15000, // beri waktu cukup untuk lock GPS
          maximumAge: 0,  // jangan pakai cache lokasi lama
        }
      );
    });
  };

  // 🔹 Fungsi Presensi
  const handleAbsen = async (tipe: "masuk" | "keluar") => {
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Token tidak ditemukan. Silakan login kembali.");
      }

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

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 px-3 py-6 sm:px-4 sm:py-8 md:px-6 lg:px-8">
      <div className="bg-white p-4 sm:p-6 md:p-8 rounded-2xl shadow-2xl w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-xl border border-gray-100">
        {/* Header dengan Icon */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full mb-3 sm:mb-4 shadow-lg">
            <svg
              className="w-7 h-7 sm:w-8 sm:h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 leading-snug">
            Presensi Hari Ini
          </h2>
          <p className="text-xs sm:text-sm text-gray-500 mt-1 sm:mt-2 px-4 sm:px-0">
            Catat kehadiran Anda dengan mudah
          </p>
        </div>

        {/* Alert Messages dengan animasi */}
        {success && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-green-50 border-l-4 border-green-500 rounded-lg animate-fadeIn">
            <div className="flex items-start">
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 mr-2 sm:mr-3 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-xs sm:text-sm text-green-700 font-medium">
                {success}
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-red-50 border-l-4 border-red-500 rounded-lg animate-fadeIn">
            <div className="flex items-start">
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 mr-2 sm:mr-3 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-xs sm:text-sm text-red-700 font-medium">
                {error}
              </p>
            </div>
          </div>
        )}

        {/* Info Card dengan design lebih menarik */}
        <div className="mb-5 sm:mb-6 bg-gradient-to-br from-gray-50 to-gray-100 p-4 sm:p-5 rounded-xl border border-gray-200 shadow-sm">
          <div className="space-y-2.5 sm:space-y-3">
            <div className="flex items-start justify-between gap-3 py-2 border-b border-gray-200">
              <span className="text-gray-600 font-medium flex items-center text-xs sm:text-sm md:text-base">
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2 text-blue-500 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                Tanggal
              </span>
              <span className="text-gray-800 font-semibold text-xs sm:text-sm md:text-base text-right break-words max-w-[60%] sm:max-w-[70%]">
                {new Date().toLocaleDateString("id-ID", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
            </div>

            <div className="flex items-center justify-between gap-3 py-2 border-b border-gray-200">
              <span className="text-gray-600 font-medium flex items-center text-xs sm:text-sm md:text-base">
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2 text-green-500 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                  />
                </svg>
                Jam Masuk
              </span>
              <span
                className={`font-bold text-sm sm:text-base md:text-lg ${
                  presensiHariIni?.jamMasuk
                    ? "text-green-600"
                    : "text-gray-400"
                }`}
              >
                {presensiHariIni?.jamMasuk || "Belum Presensi"}
              </span>
            </div>

            <div className="flex items-center justify-between gap-3 py-2">
              <span className="text-gray-600 font-medium flex items-center text-xs sm:text-sm md:text-base">
                <svg
                  className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2 text-red-500 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                Jam Keluar
              </span>
              <span
                className={`font-bold text-sm sm:text-base md:text-lg ${
                  presensiHariIni?.jamKeluar
                    ? "text-red-600"
                    : "text-gray-400"
                }`}
              >
                {presensiHariIni?.jamKeluar || "Belum Presensi"}
              </span>
            </div>
          </div>
        </div>

        {/* Tombol Presensi dengan design modern */}
        <div className="flex flex-col gap-2.5 sm:gap-3 mb-4 sm:mb-5">
          {!presensiHariIni?.jamMasuk && (
            <button
              onClick={() => handleAbsen("masuk")}
              disabled={loading}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-3 sm:py-3.5 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center text-sm sm:text-base"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 sm:h-5 sm:w-5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Memproses...
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                    />
                  </svg>
                  Presensi Masuk
                </>
              )}
            </button>
          )}

          {presensiHariIni?.jamMasuk && !presensiHariIni?.jamKeluar && (
            <button
              onClick={() => handleAbsen("keluar")}
              disabled={loading}
              className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold py-3 sm:py-3.5 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center text-sm sm:text-base"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin -ml-1 mr-2 h-4 w-4 sm:h-5 sm:w-5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Memproses...
                </>
              ) : (
                <>
                  <svg
                    className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                  Presensi Keluar
                </>
              )}
            </button>
          )}

          {presensiHariIni?.jamMasuk && presensiHariIni?.jamKeluar && (
            <div className="w-full bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 text-blue-700 font-semibold py-3 sm:py-3.5 rounded-xl flex items-center justify-center text-sm sm:text-base text-center px-2">
              <svg
                className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              Presensi Hari Ini Lengkap
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => router.push("/dashboard/peserta")}
          className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2.5 sm:py-3 rounded-xl transition-all duration-200 flex items-center justify-center shadow-sm hover:shadow border border-gray-200 text-sm sm:text-base"
        >
          <svg
            className="w-4 h-4 sm:w-5 sm:h-5 mr-1.5 sm:mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Kembali ke Dashboard
        </button>
      </div>
    </div>
  );
}
