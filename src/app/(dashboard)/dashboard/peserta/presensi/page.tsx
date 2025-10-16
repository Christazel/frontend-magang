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

  // 🔹 Ambil lokasi GPS
  const getLocation = (): Promise<{ lat: number; lng: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Geolocation tidak didukung browser ini"));
      }
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => reject(err),
        { enableHighAccuracy: true }
      );
    });
  };

  // 🔹 Fungsi Absen
  const handleAbsen = async (tipe: "masuk" | "keluar") => {
    setError("");
    setSuccess("");
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const lokasi = await getLocation();

      const res = await fetch(`/api/presensi/${tipe}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          latitude: lokasi.lat,
          longitude: lokasi.lng,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || "Gagal melakukan presensi");

      setSuccess(`Absen ${tipe} berhasil!`);
      fetchPresensiHariIni();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 px-4 py-10 items-center">
      <div className="bg-white p-6 sm:p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-xl sm:text-2xl font-bold text-center text-gray-800 mb-6">
          Presensi Hari Ini
        </h2>

        {success && <p className="text-green-600 mb-4">{success}</p>}
        {error && <p className="text-red-600 mb-4">{error}</p>}

        <div className="mb-4">
          <p className="text-gray-700">
            <strong>Tanggal:</strong> {new Date().toLocaleDateString("id-ID")}
          </p>
          <p className="text-gray-700">
            <strong>Jam Masuk:</strong> {presensiHariIni?.jamMasuk || "-"}
          </p>
          <p className="text-gray-700">
            <strong>Jam Keluar:</strong> {presensiHariIni?.jamKeluar || "-"}
          </p>
        </div>

        {/* Tombol Presensi */}
        <div className="flex flex-col gap-3">
          {!presensiHariIni?.jamMasuk && (
            <button
              onClick={() => handleAbsen("masuk")}
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-md transition"
            >
              {loading ? "Memproses..." : "Absen Masuk"}
            </button>
          )}

          {presensiHariIni?.jamMasuk && !presensiHariIni?.jamKeluar && (
            <button
              onClick={() => handleAbsen("keluar")}
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 rounded-md transition"
            >
              {loading ? "Memproses..." : "Absen Keluar"}
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => router.push("/dashboard/peserta")}
          className="w-full mt-4 bg-gray-200 hover:bg-gray-300 text-gray-800 font-medium py-2 rounded-md transition"
        >
          ← Kembali ke Dashboard
        </button>
      </div>
    </div>
  );
}
