// ============================================
// Global TypeScript Types & Interfaces
// Versi: Lengkap dengan semua entitas aplikasi
// ============================================

import React from "react";

// ---- Auth & User ----

export enum UserRole {
  ADMIN = "admin",
  PESERTA = "peserta",
}

export interface User {
  id?: string;
  _id?: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface MenuItem {
  href: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
}

// ---- API ----

export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface ApiError {
  msg?: string;
  error?: string;
}

export interface PaginationMeta {
  page: number;
  totalPages: number;
  totalCount: number;
  rowsPerPage: number;
}

// ---- Presensi ----

export type KeteranganPresensi = "hadir" | "izin" | "sakit";

export interface Presensi {
  _id: string;
  tanggal: string;
  jamMasuk?: string;
  jamKeluar?: string;
  lokasiMasuk?: string;
  lokasiKeluar?: string;
  keterangan?: KeteranganPresensi;
  user?: Pick<User, "name" | "email">;
}

// ---- Laporan ----

export type ReviewStatus = "pending" | "sesuai" | "revisi";

export type SortOption = "terbaru" | "terlama";

export interface Laporan {
  _id: string;
  judul: string;
  deskripsi: string;
  createdAt: string;
  fileId: any;
  originalName?: string;
  mimeType?: string;
  gfsFilename?: string;
  size?: number;
  // Review fields
  status?: ReviewStatus;
  adminCatatan?: string;
  reviewed?: boolean;
  reviewedBy?: any;
  reviewedAt?: string | null;
  // Populated user (untuk tampilan admin)
  user?: Pick<User, "name" | "email">;
}

// ---- Peserta (Admin View) ----

export interface Peserta {
  _id: string;
  name: string;
  email: string;
  hadir: number;
  tugas: number;
}

// ---- Feedback ----

export interface Feedback {
  _id: string;
  feedback: string;
  createdAt: string;
  user?: Pick<User, "name" | "email">;
}