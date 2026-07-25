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
  AcademicCapIcon,
  ClipboardDocumentCheckIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import toast from "react-hot-toast";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const user = await login(form.email, form.password);
      toast.success("Login berhasil! Selamat datang 🎉");
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

  const features = [
    {
      icon: AcademicCapIcon,
      title: "Monitoring Magang",
      desc: "Pantau kehadiran & progres peserta magang secara real-time",
    },
    {
      icon: ClipboardDocumentCheckIcon,
      title: "Manajemen Laporan",
      desc: "Upload & kelola laporan dengan sistem persetujuan digital",
    },
    {
      icon: UserGroupIcon,
      title: "Manajemen Peserta",
      desc: "Kelola data seluruh peserta magang dalam satu platform",
    },
  ];

  return (
    <div className="min-h-screen flex">
      {/* ─── LEFT PANEL: Branding ─── */}
      <div
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col justify-between p-12"
        style={{
          background: "linear-gradient(135deg, #061c47 0%, #0b2c65 50%, #1e3a8a 100%)",
        }}
      >
        {/* Decorative blobs */}
        <div
          className="absolute -top-20 -left-20 w-80 h-80 rounded-full opacity-20 animate-float"
          style={{ background: "radial-gradient(circle, #60a5fa, transparent)" }}
        />
        <div
          className="absolute bottom-10 -right-16 w-96 h-96 rounded-full opacity-15 animate-float-slow"
          style={{ background: "#93c5fd" }}
        />
        <div
          className="absolute top-1/2 left-1/3 w-40 h-40 rounded-full opacity-10"
          style={{
            background: "radial-gradient(circle, #fff, transparent)",
            animation: "float 7s ease-in-out infinite",
          }}
        />

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.3) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        {/* Logo & Institution */}
        <div className="relative z-10 animate-slide-in-left">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-xl bg-white/10 p-1 animate-pulse-glow">
              <Image
                src="/images/Logo-dikbud.png"
                alt="Logo Dinas"
                width={56}
                height={56}
                className="object-contain rounded-xl"
                priority
              />
            </div>
            <div>
              <p className="text-white/80 text-sm font-medium tracking-widest uppercase">
                Resmi
              </p>
              <h1 className="text-white text-xl font-bold leading-tight">
                Dinas Pendidikan
              </h1>
              <h2 className="text-blue-200 text-base font-medium">
                Kabupaten Melawi
              </h2>
            </div>
          </div>
        </div>

        {/* Hero text */}
        <div className="relative z-10 space-y-6">
          <div className="animate-fade-in-up" style={{ animationDelay: "0.2s", opacity: 0 }}>
            <p className="text-blue-200 text-sm font-semibold tracking-widest uppercase mb-3">
              Platform Digital
            </p>
            <h2 className="text-white text-4xl font-bold leading-tight">
              SIPMA
              <span className="block text-transparent bg-clip-text"
                style={{ backgroundImage: "linear-gradient(90deg, #93c5fd, #bfdbfe)" }}>
                Melawi
              </span>
            </h2>
            <p className="text-white/70 text-base mt-4 leading-relaxed max-w-sm">
              Platform resmi pengelolaan magang Kabupaten Melawi. Efisien, transparan, dan modern.
            </p>
          </div>

          {/* Feature list */}
          <div className="space-y-4">
            {features.map((f, i) => (
              <div
                key={f.title}
                className="flex items-start gap-3 animate-fade-in-up"
                style={{ animationDelay: `${0.4 + i * 0.15}s`, opacity: 0 }}
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-xl glass flex items-center justify-center">
                  <f.icon className="w-5 h-5 text-blue-300" />
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{f.title}</p>
                  <p className="text-white/60 text-xs leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="relative z-10 animate-fade-in-up" style={{ animationDelay: "0.8s", opacity: 0 }}>
          <p className="text-white/40 text-xs">
            &copy; {new Date().getFullYear()} Dinas Pendidikan Kabupaten Melawi
          </p>
        </div>
      </div>

      {/* ─── RIGHT PANEL: Login Form ─── */}
      <div className="flex-1 flex flex-col justify-center items-center p-6 lg:p-16 bg-gray-50 relative overflow-hidden">
        {/* Subtle background pattern */}
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "radial-gradient(circle at 30% 20%, rgba(20,184,166,0.07) 0%, transparent 50%), radial-gradient(circle at 80% 80%, rgba(13,148,136,0.05) 0%, transparent 50%)",
          }}
        />

        <div className="w-full max-w-md relative z-10">
          {/* Mobile logo (shown only on small screens) */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-12 h-12 rounded-xl overflow-hidden shadow-lg bg-white p-1">
              <Image
                src="/images/Logo-dikbud.png"
                alt="Logo Dinas"
                width={44}
                height={44}
                className="object-contain"
                priority
              />
            </div>
            <div>
              <p className="font-bold text-gray-800 text-base leading-tight">Dinas Pendidikan</p>
              <p className="text-gray-500 text-sm">Kabupaten Melawi</p>
            </div>
          </div>

          {/* Heading */}
          <div className="mb-8 animate-fade-in-up" style={{ animationDelay: "0.1s", opacity: 0 }}>
            <h3 className="text-3xl font-bold text-gray-900">Selamat Datang 👋</h3>
            <p className="text-gray-500 mt-2 text-base">
              Masuk untuk mengelola data magang Anda
            </p>
          </div>

          {/* Form */}
          <form
            onSubmit={handleLogin}
            className="space-y-5 animate-fade-in-up"
            style={{ animationDelay: "0.25s", opacity: 0 }}
          >
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                Alamat Email
              </label>
              <div className="relative">
                <span
                  className={`absolute inset-y-0 left-0 flex items-center pl-4 transition-colors duration-200 ${
                    focused === "email" ? "text-blue-500" : "text-gray-400"
                  }`}
                >
                  <EnvelopeIcon className="h-5 w-5" />
                </span>
                <input
                  id="email"
                  type="email"
                  name="email"
                  placeholder="nama@email.com"
                  value={form.email}
                  onChange={handleChange}
                  onFocus={() => setFocused("email")}
                  onBlur={() => setFocused(null)}
                  className={`w-full pl-12 pr-4 py-3.5 bg-white border-2 rounded-xl text-gray-800 placeholder-gray-400 text-sm transition-all duration-200 outline-none shadow-sm ${
                    focused === "email"
                      ? "border-blue-500 shadow-blue-100 shadow-lg"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <span
                  className={`absolute inset-y-0 left-0 flex items-center pl-4 transition-colors duration-200 ${
                    focused === "password" ? "text-blue-500" : "text-gray-400"
                  }`}
                >
                  <LockClosedIcon className="h-5 w-5" />
                </span>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="Masukkan password Anda"
                  value={form.password}
                  onChange={handleChange}
                  onFocus={() => setFocused("password")}
                  onBlur={() => setFocused(null)}
                  className={`w-full pl-12 pr-12 py-3.5 bg-white border-2 rounded-xl text-gray-800 placeholder-gray-400 text-sm transition-all duration-200 outline-none shadow-sm ${
                    focused === "password"
                      ? "border-blue-500 shadow-blue-100 shadow-lg"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-gray-600 transition-colors"
                  tabIndex={-1}
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
              className="w-full relative py-3.5 px-6 rounded-xl font-semibold text-white text-base transition-all duration-300 overflow-hidden group disabled:opacity-70 disabled:cursor-not-allowed"
              style={{
                background: loading
                  ? "#6b7280"
                  : "linear-gradient(135deg, #0b2c65 0%, #1e3a8a 100%)",
                boxShadow: loading ? "none" : "0 8px 30px rgba(11, 44, 101, 0.4)",
              }}
            >
              {/* Hover shimmer effect */}
              <span className="absolute inset-0 w-full h-full transition-all duration-500 ease-in-out bg-white opacity-0 group-hover:opacity-10 group-active:opacity-20" />

              <span className="relative flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span>Memproses...</span>
                  </>
                ) : (
                  "Masuk ke Dashboard"
                )}
              </span>
            </button>
          </form>

          {/* Divider & Register link */}
          <div
            className="mt-6 text-center animate-fade-in-up"
            style={{ animationDelay: "0.4s", opacity: 0 }}
          >
            <p className="text-gray-500 text-sm">
              Belum punya akun?{" "}
              <button
                type="button"
                onClick={() => router.push("/register")}
                className="text-blue-600 font-semibold hover:text-blue-700 transition-colors hover:underline"
                disabled={loading}
              >
                Daftar Sekarang
              </button>
            </p>
          </div>

          {/* Footer mobile */}
          <div
            className="lg:hidden mt-10 text-center animate-fade-in-up"
            style={{ animationDelay: "0.5s", opacity: 0 }}
          >
            <p className="text-gray-400 text-xs">
              &copy; {new Date().getFullYear()} Dinas Pendidikan Kabupaten Melawi
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
