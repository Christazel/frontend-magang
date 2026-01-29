"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { UserRole } from "@/types";
import Image from "next/image";
import {
  EyeIcon,
  EyeSlashIcon,
  EnvelopeIcon,
  LockClosedIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  /**
   * Handle input field change
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  /**
   * Handle login form submission
   */
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form.email, form.password);

      toast.success("Login berhasil! Selamat datang 🎉");

      // Redirect sesuai role
      if (user.role === UserRole.ADMIN) {
        router.push("/dashboard/admin");
      } else {
        router.push("/dashboard/peserta");
      }
    } catch (error) {
      toast.error("Login gagal! Periksa kembali email & password.");
      console.error("Login error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border">
        {/* Header Logo */}
        <div className="bg-white py-6 px-4 text-center border-b">
          <div className="flex justify-center mb-4">
            <div className="w-20 h-20 rounded-full overflow-hidden shadow">
              <Image
                src="/images/Logo-dikbud.png"
                alt="Logo Dinas"
                width={80}
                height={80}
                className="object-contain"
                priority
              />
            </div>
          </div>
          <h1 className="text-blue-800 text-xl font-bold">DINAS PENDIDIKAN</h1>
          <h2 className="text-blue-800 text-lg">KABUPATEN MELAWI</h2>
        </div>

        {/* Login Form */}
        <div className="p-8">
          <h3 className="text-2xl font-bold mb-6 text-center text-gray-800">
            Sistem Informasi Magang
          </h3>

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email Input */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Email
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                  <EnvelopeIcon className="h-5 w-5" />
                </span>
                <input
                  id="email"
                  type="email"
                  name="email"
                  placeholder="Masukkan email anda"
                  value={form.email}
                  onChange={handleChange}
                  className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 placeholder-gray-400"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                  <LockClosedIcon className="h-5 w-5" />
                </span>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Masukkan password anda"
                  value={form.password}
                  onChange={handleChange}
                  className="w-full pl-10 pr-10 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800 placeholder-gray-400"
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500"
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5" />
                  ) : (
                    <EyeIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 transition-colors text-white font-medium py-3 px-4 rounded-lg flex items-center justify-center"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 mr-2 text-white"
                    xmlns="http://www.w3.org/2000/svg"
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
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  Memproses...
                </>
              ) : (
                "Masuk"
              )}
            </button>
          </form>

          {/* Register Link */}
          <div className="mt-6 text-center text-gray-600">
            Belum punya akun?{" "}
            <button
              type="button"
              onClick={() => router.push("/register")}
              className="text-blue-600 hover:underline font-medium"
              disabled={loading}
            >
              Daftar
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-100 py-3 px-4 text-center text-gray-600 text-sm">
          &copy; {new Date().getFullYear()} Dinas Pendidikan Kabupaten Melawi
        </div>
      </div>
    </div>
  );
}
