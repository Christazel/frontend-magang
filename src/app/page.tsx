"use client";

import {
  ArrowRight,
  Users,
  FileText,
  Calendar,
  Shield,
  CheckCircle,
  TrendingUp,
} from "lucide-react";
import React, { useState, useEffect, ReactNode } from "react";

/* =========================
   Client-only Floating Particles
   (menghindari hydration mismatch)
========================= */
type Particle = { top: number; left: number; delay: number; duration: number };

function Particles({ count = 20 }: { count?: number }) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const arr = Array.from({ length: count }, () => ({
      top: Math.random() * 100,
      left: Math.random() * 100,
      delay: Math.random() * 3,
      duration: 2 + Math.random() * 3,
    }));
    setParticles(arr);
  }, [count]);

  if (particles.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none">
      {particles.map((p, i) => (
        <div
          key={i}
          className="absolute w-1 h-1 bg-white/20 rounded-full animate-pulse"
          style={{
            top: `${p.top}%`,
            left: `${p.left}%`,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
          }}
        />
      ))}
    </div>
  );
}

/* =========================
   Halaman Landing
========================= */
export default function Home() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const handleLogin = () => {
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute w-96 h-96 bg-blue-500/30 rounded-full blur-3xl animate-pulse"
          style={{
            top: "10%",
            left: "10%",
            transform: `translate(${mousePosition.x * 0.02}px, ${
              mousePosition.y * 0.02
            }px)`,
            transition: "transform 0.3s ease-out",
          }}
        />
        <div
          className="absolute w-96 h-96 bg-purple-500/30 rounded-full blur-3xl animate-pulse"
          style={{
            bottom: "10%",
            right: "10%",
            animationDelay: "1s",
            transform: `translate(${-(mousePosition.x * 0.02)}px, ${
              -(mousePosition.y * 0.02)
            }px)`,
            transition: "transform 0.3s ease-out",
          }}
        />
        <div
          className="absolute w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse"
          style={{
            top: "50%",
            left: "50%",
            animationDelay: "2s",
          }}
        />
      </div>

      {/* Floating Particles (client-only) */}
      <Particles count={20} />

      {/* Main Content */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 py-12 sm:py-20">
        <div
          className={`max-w-6xl mx-auto text-center space-y-6 sm:space-y-10 transition-all duration-1000 ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
          }`}
        >
          {/* ===== Title langsung, tanpa badge & logo ===== */}
          <div className="space-y-4 sm:space-y-6 px-4">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white leading-tight tracking-tight">
              <span className="inline-block bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 bg-clip-text text-transparent animate-pulse">
                Sistem Informasi
              </span>
              <br />
              <span className="inline-block bg-gradient-to-r from-purple-400 via-pink-400 to-cyan-400 bg-clip-text text-transparent">
                Magang Digital
              </span>
            </h1>
            <p className="text-lg sm:text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto px-2 leading-relaxed">
              Revolusi manajemen magang dengan teknologi modern, efisien, dan
              terstruktur untuk masa depan yang lebih baik
            </p>
            <div className="flex items-center justify-center gap-2 text-cyan-400 font-semibold text-base sm:text-lg">
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
              <span>Dinas Pendidikan Kabupaten Melawi</span>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4 sm:pt-6">
            <button
              onClick={handleLogin}
              className="group relative inline-flex items-center gap-3 px-8 sm:px-10 py-4 sm:py-5 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 text-white text-base sm:text-lg font-bold rounded-2xl shadow-2xl hover:shadow-cyan-500/50 overflow-hidden transition-all duration-300 hover:scale-105"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <span className="relative z-10">Mulai Sekarang</span>
              <ArrowRight className="relative z-10 w-5 h-5 group-hover:translate-x-2 transition-transform duration-300" />
            </button>

            <button className="inline-flex items-center gap-2 px-8 sm:px-10 py-4 sm:py-5 bg-white/10 backdrop-blur-md border border-white/20 text-white text-base sm:text-lg font-semibold rounded-2xl hover:bg-white/20 transition-all duration-300 hover:scale-105">
              <TrendingUp className="w-5 h-5" />
              <span>Pelajari Lebih Lanjut</span>
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 sm:gap-8 pt-8 sm:pt-12 max-w-3xl mx-auto">
            <StatCard number="500+" label="Peserta Aktif" />
            <StatCard number="50+" label="Instansi Partner" />
            <StatCard number="98%" label="Tingkat Kepuasan" />
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 pt-12 sm:pt-16 px-2">
            <FeatureCard
              icon={<Users className="w-7 h-7 sm:w-9 sm:h-9" />}
              title="Manajemen Peserta"
              description="Kelola data peserta magang dengan sistem yang terintegrasi dan real-time"
              color="cyan"
              delay="0"
            />
            <FeatureCard
              icon={<Calendar className="w-7 h-7 sm:w-9 sm:h-9" />}
              title="Presensi Digital"
              description="Absensi otomatis dengan teknologi GPS dan verifikasi biometrik"
              color="blue"
              delay="100"
            />
            <FeatureCard
              icon={<FileText className="w-7 h-7 sm:w-9 sm:h-9" />}
              title="Laporan Harian"
              description="Submit dan monitor laporan kegiatan dengan dashboard interaktif"
              color="purple"
              delay="200"
            />
            <FeatureCard
              icon={<Shield className="w-7 h-7 sm:h-9 sm:w-9" />}
              title="Keamanan Data"
              description="Enkripsi tingkat enterprise dengan backup otomatis 24/7"
              color="pink"
              delay="300"
            />
          </div>

          {/* Benefits Section */}
          <div className="pt-12 sm:pt-20 space-y-6">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">
              Mengapa Memilih Platform Kami?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 max-w-5xl mx-auto">
              <BenefitCard
                icon={<CheckCircle className="w-6 h-6" />}
                title="Mudah Digunakan"
                description="Interface intuitif yang ramah pengguna"
              />
              <BenefitCard
                icon={<CheckCircle className="w-6 h-6" />}
                title="Akses 24/7"
                description="Tersedia kapan saja, dimana saja"
              />
              <BenefitCard
                icon={<CheckCircle className="w-6 h-6" />}
                title="Support Responsif"
                description="Tim support siap membantu Anda"
              />
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-6 sm:py-8 px-4 sm:px-6 bg-white/5 backdrop-blur-xl border-t border-white/10">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs sm:text-sm text-gray-400">
              © 2025 Dinas Pendidikan Kabupaten Melawi. All rights reserved.
            </p>
            <div className="flex items-center gap-4 text-xs sm:text-sm text-gray-400">
              <a href="#" className="hover:text-cyan-400 transition-colors">
                Kebijakan Privasi
              </a>
              <span>•</span>
              <a href="#" className="hover:text-cyan-400 transition-colors">
                Syarat & Ketentuan
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

/* =========================
   Small UI pieces
========================= */
function StatCard({ number, label }: { number: string; label: string }) {
  return (
    <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 sm:p-6 hover:bg-white/10 transition-all duration-300 hover:scale-105">
      <div className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent mb-1">
        {number}
      </div>
      <div className="text-xs sm:text-sm text-gray-400">{label}</div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  color,
  delay,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  color: "cyan" | "blue" | "purple" | "pink";
  delay: string;
}) {
  const styleMap: Record<
    "cyan" | "blue" | "purple" | "pink",
    { bg: string; text: string; border: string }
  > = {
    cyan: {
      bg: "bg-cyan-500/10",
      text: "text-cyan-400",
      border: "border-cyan-500/20",
    },
    blue: {
      bg: "bg-blue-500/10",
      text: "text-blue-400",
      border: "border-blue-500/20",
    },
    purple: {
      bg: "bg-purple-500/10",
      text: "text-purple-400",
      border: "border-purple-500/20",
    },
    pink: {
      bg: "bg-pink-500/10",
      text: "text-pink-400",
      border: "border-pink-500/20",
    },
  };

  const s = styleMap[color];

  return (
    <div
      className={`group bg-white/5 backdrop-blur-md p-5 sm:p-7 rounded-2xl border ${s.border} hover:bg-white/10 hover:border-white/30 transition-all duration-500 hover:-translate-y-3 hover:shadow-2xl`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div
        className={`inline-flex p-3 sm:p-4 ${s.bg} backdrop-blur-sm rounded-xl sm:rounded-2xl mb-4 sm:mb-5 group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 border ${s.border}`}
      >
        <div className={s.text}>{icon}</div>
      </div>
      <h3 className="text-base sm:text-lg font-bold text-white mb-2 sm:mb-3 group-hover:text-cyan-400 transition-colors">
        {title}
      </h3>
      <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
        {description}
      </p>
    </div>
  );
}

function BenefitCard({
  icon,
  title,
  description,
}: {
  icon: ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="group bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-5 sm:p-6 hover:bg-white/10 hover:border-cyan-500/30 transition-all duration-300 hover:scale-105">
      <div className="flex items-start gap-3 sm:gap-4">
        <div className="text-cyan-400 group-hover:scale-110 transition-transform">
          {icon}
        </div>
        <div className="flex-1">
          <h4 className="text-sm sm:text-base font-semibold text-white mb-1 group-hover:text-cyan-400 transition-colors">
            {title}
          </h4>
          <p className="text-xs sm:text-sm text-gray-400">{description}</p>
        </div>
      </div>
    </div>
  );
}
