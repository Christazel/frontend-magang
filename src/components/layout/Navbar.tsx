export default function Navbar() {
  return (
    <>
      <nav className="fixed top-0 left-0 w-full z-30 bg-blue-600 text-white h-14 px-4 sm:px-6 shadow flex items-center justify-center md:justify-start md:ml-64">
        <h1 className="text-lg sm:text-xl font-bold text-center w-full md:w-auto">
          Sistem Magang
        </h1>
      </nav>

      {/* Spacer hanya untuk layar mobile biar konten tidak tertimpa navbar */}
      <div className="h-14 md:hidden" />
    </>
  );
}
