// ============================================
// Menu Configuration Constants
// ============================================

import {
  LayoutDashboard,
  ClipboardList,
  Users,
  FileText,
  MessageSquare,
  CheckSquare,
} from "lucide-react";
import type { MenuItem } from "@/types";

/**
 * Admin menu items
 */
export const ADMIN_MENU_ITEMS: MenuItem[] = [
  {
    href: "/dashboard",
    icon: LayoutDashboard,
    label: "Dashboard",
  },
  {
    href: "/dashboard/admin/rekap-presensi",
    icon: ClipboardList,
    label: "Rekap Presensi",
  },
  {
    href: "/dashboard/admin/manajemen-peserta",
    icon: Users,
    label: "Manajemen Peserta",
  },
  {
    href: "/dashboard/admin/laporan",
    icon: FileText,
    label: "Rekap Laporan Tugas",
  },
  {
    href: "/dashboard/admin/feedback",
    icon: MessageSquare,
    label: "Feedback & Evaluasi",
  },
];

/**
 * Peserta menu items
 */
export const PESERTA_MENU_ITEMS: MenuItem[] = [
  {
    href: "/dashboard",
    icon: LayoutDashboard,
    label: "Dashboard",
  },
  {
    href: "/dashboard/peserta/presensi",
    icon: CheckSquare,
    label: "Presensi",
  },
  {
    href: "/dashboard/peserta/laporan",
    icon: FileText,
    label: "Laporan Tugas Magang",
  },
  {
    href: "/dashboard/peserta/feedback",
    icon: MessageSquare,
    label: "Feedback",
  },
];

/**
 * Get menu items based on user role
 * @param role - User role ('admin' or 'peserta')
 * @returns Menu items array
 */
export const getMenuItems = (role: string): MenuItem[] => {
  return role === "admin" ? ADMIN_MENU_ITEMS : PESERTA_MENU_ITEMS;
};
