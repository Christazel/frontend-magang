# 📁 SIPMA Melawi — Frontend Documentation

**Sistem Informasi Peserta Magang — Dinas Pendidikan Kabupaten Melawi**  
**Tech Stack:** Next.js 15 · TypeScript · Tailwind CSS v3 · Axios · SWR

---

## 🗂️ Project Structure

```
src/
├── app/                        # Next.js App Router
│   ├── layout.tsx              # Root layout (metadata, fonts)
│   ├── page.tsx                # Landing page (redirect by role)
│   ├── providers.tsx           # Global providers: SWRConfig, AuthProvider, Toaster
│   ├── error.tsx               # Global error boundary page
│   ├── (auth)/
│   │   ├── login/page.tsx      # Login page
│   │   └── register/page.tsx   # Register peserta page
│   └── (dashboard)/
│       └── dashboard/
│           ├── page.tsx                      # Role-based redirect
│           ├── admin/
│           │   ├── page.tsx                  # Admin dashboard overview
│           │   ├── feedback/page.tsx         # Kirim & lihat riwayat feedback
│           │   ├── laporan/page.tsx          # Review & evaluasi laporan
│           │   ├── manajemen-peserta/page.tsx # CRUD peserta
│           │   └── rekap-presensi/page.tsx   # Rekap kehadiran semua peserta
│           └── peserta/
│               ├── page.tsx                  # Peserta dashboard overview
│               ├── feedback/page.tsx         # Riwayat feedback dari admin
│               ├── laporan/page.tsx          # Upload & kelola laporan
│               └── presensi/page.tsx         # Presensi masuk/keluar (GPS)
│
├── components/
│   ├── layout/
│   │   ├── Navbar.tsx          # Top navigation bar
│   │   ├── Sidebar.tsx         # Role-based sidebar navigation
│   │   └── Footer.tsx          # Footer component
│   └── ui/
│       ├── Button.tsx          # Reusable button with variants
│       ├── Card.tsx            # Card container components
│       ├── Input.tsx           # Form input component
│       ├── Pagination.tsx      # Server-side pagination component
│       └── ErrorBoundary.tsx   # Client-side error boundary
│
├── context/
│   └── AuthContext.tsx         # JWT auth state: login, logout, user info
│
├── hooks/
│   └── useAuth.ts              # Hook wrapper for AuthContext
│
├── lib/
│   ├── api.ts                  # All API services (apiClient, authService, etc.)
│   └── utils.ts                # Helper utilities
│
├── constants/
│   └── menu.ts                 # Sidebar menu config per role
│
├── types/
│   └── index.ts                # Global TypeScript interfaces & enums
│
└── styles/
    └── globals.css             # Tailwind base + custom animations + utilities
```

---

## 🔌 API Layer (`src/lib/api.ts`)

Central Axios instance with automatic token injection and 401 redirect.

| Service | Methods |
|---|---|
| `authService` | `login`, `register` |
| `userService` | `getProfile`, `getPesertaList` |
| `presensiService` | `masuk`, `keluar`, `getHariIni`, `getAdminAll` |
| `laporanService` | `submit`, `getMyLaporan`, `getAdminAll`, `review` |
| `feedbackService` | `send`, `getMyFeedback`, `getAdminAllFeedback` |

---

## 🔄 Data Fetching Strategy

| Pattern | Used For |
|---|---|
| **SWR** (`useSWR`) | Data read-only yang perlu auto-revalidation (presensi hari ini) |
| **SWR + mutate** | Data yang perlu di-refresh setelah user action |
| **Axios + useCallback** | Paginated data dengan filter/search (rekap presensi, laporan) |

Global SWR fetcher dikonfigurasi di `providers.tsx` menggunakan `apiClient`.

---

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Development server (with Turbopack)
npm run dev

# Production build
npm run build

# Linting (must pass with 0 errors)
npm run lint
```

### Environment Variables

Buat file `.env.local` di root project:
```
NEXT_PUBLIC_API_URL=http://localhost:5000
```

---

## ✅ Code Quality Standards

- **ESLint:** `npm run lint` harus menghasilkan `0 warnings or errors`
- **TypeScript:** Strict mode, tidak ada `any` type casting
- **React Hooks:** Semua `useEffect` harus memiliki dependency array yang benar
- **Build:** `npm run build` harus sukses tanpa error TypeScript
