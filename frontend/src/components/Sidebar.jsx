export default function Sidebar({ onLogout }) {
  return (
    <aside className="w-64 min-h-screen bg-gradient-to-b from-indigo-600 to-purple-600 text-white p-6">
      <h1 className="text-2xl font-bold mb-10">HelpDesk</h1>

      <nav className="space-y-4">
        <button className="w-full text-left px-4 py-2 rounded bg-white/20 hover:bg-white/30">
          📊 Dashboard
        </button>

        <button className="w-full text-left px-4 py-2 rounded bg-white/20 hover:bg-white/30">
          ➕ New Ticket
        </button>

        <button
          onClick={onLogout}
          className="w-full text-left px-4 py-2 rounded bg-red-500/80 hover:bg-red-500"
        >
          🚪 Logout
        </button>
      </nav>
    </aside>
  );
}
