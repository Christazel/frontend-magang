export default function Footer() {
  return (
    <footer
      className="w-full text-center text-xs px-6 py-3 mt-auto"
      style={{
        background: "rgba(255,255,255,0.7)",
        backdropFilter: "blur(8px)",
        borderTop: "1px solid rgba(0,0,0,0.06)",
        color: "#9ca3af",
      }}
    >
      &copy; {new Date().getFullYear()}{" "}
      <span className="font-semibold" style={{ color: "#0d9488" }}>
        SIPMA Melawi
      </span>{" "}
      &mdash; Dinas Pendidikan Kabupaten Melawi
    </footer>
  );
}
