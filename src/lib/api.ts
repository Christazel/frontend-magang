// ============================================
// API Client — Axios dengan Global Interceptor
// Versi: Upgrade dengan auth header & auto-logout
// ============================================

import axios from "axios";
import type { LoginRequest, LoginResponse, PaginationMeta, Izin, NotifikasiRevisi } from "@/types";

// ---- Axios Instance ----

export const apiClient = axios.create({
  baseURL: "/api",
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

// ---- Request Interceptor: otomatis pasang Authorization header ----
apiClient.interceptors.request.use(
  (config) => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      if (token) {
        config.headers["Authorization"] = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ---- Response Interceptor: otomatis handle 401 (token expired) ----
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== "undefined") {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

// ---- Helper: parse pesan error dari Axios ----
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    return (
      error.response?.data?.msg ||
      error.response?.data?.error ||
      error.message ||
      "Terjadi kesalahan."
    );
  }
  if (error instanceof Error) return error.message;
  return "Terjadi kesalahan yang tidak diketahui.";
}

// ---- Helper: baca pagination meta dari response headers ----
export function parsePaginationHeaders(headers: Record<string, unknown>): Partial<PaginationMeta> {
  return {
    totalCount: Number(headers["x-total-count"] ?? 0),
    totalPages: Number(headers["x-total-pages"] ?? 1),
  };
}

// ====================
// AUTH SERVICES
// ====================

export const loginUser = async (request: LoginRequest): Promise<LoginResponse> => {
  const { data } = await apiClient.post<LoginResponse>("/auth/login", request);
  return data;
};

// ====================
// PRESENSI SERVICES
// ====================

export const presensiService = {
  getRiwayat: () => apiClient.get("/presensi/riwayat"),
  getHariIni: async () => {
    const { data } = await apiClient.get("/presensi/hari-ini");
    return data;
  },
  getAdminAll: (params: { page: number; limit: number; search?: string }) =>
    apiClient.get("/presensi/admin", { params }),
  masuk: (payload: { lokasiMasuk?: string }) =>
    apiClient.post("/presensi/masuk", payload),
  keluar: (payload: { lokasiKeluar?: string }) =>
    apiClient.post("/presensi/keluar", payload),
};

// ====================
// LAPORAN SERVICES
// ====================

export const laporanService = {
  getAll: () => apiClient.get("/laporan"),
  getAdminAll: (params: { page: number; limit: number; search?: string }) =>
    apiClient.get("/laporan/admin", { params }),
  upload: (formData: FormData) =>
    apiClient.post("/laporan", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  delete: (id: string) => apiClient.delete(`/laporan/${id}`),
  download: (fileId: string) =>
    apiClient.get(`/laporan/download/${fileId}`, { responseType: "blob" }),
  review: (id: string, payload: { status: string; adminCatatan: string }) =>
    apiClient.put(`/laporan/admin/${id}/review`, payload),
  reuploadFile: (id: string, formData: FormData) =>
    apiClient.put(`/laporan/${id}/file`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
  getNotifikasi: () =>
    apiClient.get<NotifikasiRevisi[]>("/laporan/notifikasi"),
  tandaiDibaca: (id: string) =>
    apiClient.put(`/laporan/${id}/tandai-dibaca`),
};

// ====================
// FEEDBACK SERVICES
// ====================

export const feedbackService = {
  getMyFeedback: (params?: { page: number; limit: number; search?: string }) => 
    apiClient.get("/feedback", { params }),
  getAdminAllFeedback: (params?: { page: number; limit: number; search?: string }) => 
    apiClient.get("/feedback/admin", { params }),
  send: (payload: { userId: string; feedback: string }) =>
    apiClient.post("/feedback", payload),
};

// ====================
// USER / PESERTA SERVICES
// ====================

export const userService = {
  getPesertaList: () => apiClient.get("/users/peserta"),
  getAdminPeserta: () => apiClient.get("/users/admin/peserta"),
  resetPasswordPeserta: (id: string) =>
    apiClient.put(`/users/admin/peserta/${id}/reset-password`),
};

// ====================
// IZIN / SAKIT SERVICES
// ====================

export const izinService = {
  ajukan: (payload: { tanggal: string; jenis: string; keterangan?: string }) =>
    apiClient.post<{ izin: Izin; msg: string }>("/izin", payload),
  getMyIzin: (params?: { page?: number; limit?: number }) =>
    apiClient.get<Izin[]>("/izin", { params }),
  cancelIzin: (id: string) => apiClient.delete(`/izin/${id}`),
  getAllIzin: (params?: { page?: number; limit?: number; search?: string; status?: string }) =>
    apiClient.get<Izin[]>("/izin/admin", { params }),
  approveIzin: (id: string, payload: { status: "disetujui" | "ditolak"; catatanAdmin?: string }) =>
    apiClient.put(`/izin/${id}/approve`, payload),
};

// ====================
// SWR FETCHER (tetap tersedia untuk backward compatibility)
// ====================

export const fetcher = async (url: string) => {
  const { data } = await apiClient.get(url);
  return data;
};

// Legacy alias
export const apiCall = fetcher;