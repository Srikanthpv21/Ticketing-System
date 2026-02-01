export default function Layout({ children, onLogout }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
      {/* Navbar */}
      <nav className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold tracking-wide">
            🎫 Ticketing System
          </h1>
          <button
            onClick={onLogout}
            className="text-sm bg-white/20 px-3 py-1 rounded hover:bg-white/30"
          >
            Logout
          </button>
        </div>
      </nav>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
}
