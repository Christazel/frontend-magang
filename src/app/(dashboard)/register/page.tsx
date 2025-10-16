"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "peserta",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Registrasi gagal");
      router.push("/login");
    } catch (err) {
      alert("Registrasi gagal");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-neutral-950 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5">
          <h2 className="text-2xl font-bold text-center text-gray-800">
            Daftar Akun
          </h2>

          <input
            type="text"
            name="name"
            placeholder="Nama Lengkap"
            value={form.name}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />

          <input
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-lg text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />

          <select
            name="role"
            value={form.role}
            onChange={handleChange}
            className="w-full p-3 border border-gray-300 rounded-lg text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="peserta">Peserta Magang</option>
            <option value="admin">Admin / Pembimbing</option>
          </select>

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 rounded-lg transition-colors"
          >
            Daftar
          </button>

          <p className="text-center text-sm text-gray-600">
            Sudah punya akun?{" "}
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="text-blue-600 hover:underline font-medium"
            >
              Masuk
            </button>
          </p>
        </form>

        <div className="bg-gray-100 py-3 px-4 text-center text-gray-600 text-sm">
          &copy; {new Date().getFullYear()} Dinas Pendidikan Kabupaten Melawi
        </div>
      </div>
    </div>
  );
}
