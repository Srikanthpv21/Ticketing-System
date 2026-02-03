import { useEffect, useMemo, useState } from "react";
import api from "@/api/client";
import { useAuth } from "../auth/AuthContext";

/* ---------------- Navbar ---------------- */
function Navbar() {
  const { logout, user } = useAuth();

  return (
    <div className="h-14 bg-white border-b flex items-center justify-between px-6">
      <h1 className="font-semibold text-lg">Help Desk — Admin</h1>

      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600">
          {user?.username} (Admin)
        </span>
        <button
          onClick={logout}
          className="text-sm bg-red-500 text-white px-3 py-1 rounded"
        >
          Logout
        </button>
      </div>
    </div>
  );
}

/* ---------------- Dashboard ---------------- */
export default function AdminDashboard() {
  const [tickets, setTickets] = useState([]);

  useEffect(() => {
    api.get("/api/tickets/").then((res) => setTickets(res.data));
  }, []);

  /* ---------------- Analytics ---------------- */
  const stats = useMemo(() => {
    const base = {
      total: tickets.length,
      OPEN: 0,
      IN_PROGRESS: 0,
      RESOLVED: 0,
      CLOSED: 0,
      categories: {},
    };

    tickets.forEach((t) => {
      base[t.status] = (base[t.status] || 0) + 1;
      base.categories[t.category] =
        (base.categories[t.category] || 0) + 1;
    });

    return base;
  }, [tickets]);

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      <Navbar />

      <div className="p-6 space-y-6 overflow-y-auto">
        {/* -------- Stats Cards -------- */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard label="Total Tickets" value={stats.total} />
          <StatCard label="Open" value={stats.OPEN} />
          <StatCard label="In Progress" value={stats.IN_PROGRESS} />
          <StatCard label="Resolved" value={stats.RESOLVED} />
          <StatCard label="Closed" value={stats.CLOSED} />
        </div>

        {/* -------- Category Breakdown -------- */}
        <div className="bg-white rounded-lg shadow p-5">
          <h2 className="font-semibold mb-4">Tickets by Category</h2>

          <div className="space-y-2">
            {Object.entries(stats.categories).map(([cat, count]) => (
              <div
                key={cat}
                className="flex items-center justify-between text-sm"
              >
                <span className="font-medium">{cat}</span>
                <span className="text-gray-600">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* -------- Recent Tickets -------- */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b font-semibold">
            Recent Tickets
          </div>

          <div className="divide-y">
            {tickets.slice(0, 10).map((t) => (
              <div
                key={t.id}
                className="p-4 flex justify-between text-sm"
              >
                <div>
                  <div className="font-medium">{t.title}</div>
                  <div className="text-xs text-gray-500">
                    {t.category} • Created by {t.created_by}
                  </div>
                </div>

                <span className="text-xs px-2 py-1 rounded bg-gray-100">
                  {t.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------- Components ---------------- */
function StatCard({ label, value }) {
  return (
    <div className="bg-white rounded-lg shadow p-4 text-center">
      <div className="text-2xl font-semibold">{value}</div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  );
}
