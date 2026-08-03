/**
 * Utility: Export data ke format CSV yang kompatibel dengan Microsoft Excel.
 * Menggunakan BOM (Byte Order Mark) UTF-8 agar karakter Indonesia tampil benar.
 */

type ExcelRow = Record<string, string | number | null | undefined>;

/**
 * Escape nilai CSV: bungkus dengan kutip jika mengandung koma, kutip, atau newline.
 */
function escapeCsvValue(value: string | number | null | undefined): string {
  const str = (value ?? "").toString();
  if (/[",\n\r]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

/**
 * Konversi array of objects ke string CSV.
 * @param headers - Array label kolom (judul header)
 * @param keys    - Array key objek yang berurutan dengan headers
 * @param rows    - Data baris
 */
function buildCsvString(
  headers: string[],
  keys: string[],
  rows: ExcelRow[]
): string {
  const headerRow = headers.map(escapeCsvValue).join(",");
  const dataRows = rows.map((row) =>
    keys.map((k) => escapeCsvValue(row[k])).join(",")
  );
  return [headerRow, ...dataRows].join("\r\n");
}

/**
 * Trigger unduhan file CSV di browser.
 */
function downloadCsv(filename: string, csvContent: string): void {
  // BOM UTF-8 agar Excel membaca karakter Indonesia (huruf beraksara) dengan benar
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csvContent], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.style.display = "none";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/* ─────────────────────────────────────────────── */
/*  FUNGSI EXPORT PUBLIK                           */
/* ─────────────────────────────────────────────── */

export interface PresensiExportRow {
  nama: string;
  email: string;
  tanggal: string;
  jamMasuk: string;
  lokasiMasuk: string;
  jamKeluar: string;
  lokasiKeluar: string;
}

/**
 * Export data rekap presensi ke Excel (CSV).
 */
export function exportPresensiToExcel(
  rows: PresensiExportRow[],
  filename = "Rekap_Presensi_Peserta"
): void {
  const headers = [
    "Nama Peserta",
    "Email",
    "Tanggal",
    "Jam Masuk",
    "Lokasi Masuk",
    "Jam Keluar",
    "Lokasi Keluar",
  ];
  const keys: (keyof PresensiExportRow)[] = [
    "nama",
    "email",
    "tanggal",
    "jamMasuk",
    "lokasiMasuk",
    "jamKeluar",
    "lokasiKeluar",
  ];

  const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const csv = buildCsvString(headers, keys as string[], rows as unknown as ExcelRow[]);
  downloadCsv(`${filename}_${today}.csv`, csv);
}

export interface LaporanExportRow {
  nama: string;
  email: string;
  judul: string;
  tanggal: string;
  status: string;
  catatan: string;
}

/**
 * Export data laporan tugas ke Excel (CSV).
 */
export function exportLaporanToExcel(
  rows: LaporanExportRow[],
  filename = "Rekap_Laporan_Tugas"
): void {
  const headers = [
    "Nama Peserta",
    "Email",
    "Judul Laporan",
    "Tanggal Kirim",
    "Status Review",
    "Catatan Admin",
  ];
  const keys: (keyof LaporanExportRow)[] = [
    "nama",
    "email",
    "judul",
    "tanggal",
    "status",
    "catatan",
  ];

  const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const csv = buildCsvString(headers, keys as string[], rows as unknown as ExcelRow[]);
  downloadCsv(`${filename}_${today}.csv`, csv);
}
