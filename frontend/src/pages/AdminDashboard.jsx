import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import api from "../api/axios";

export default function AdminDashboard({ setPage }) {
  const [stats, setStats] = useState(null);
  const [tickets, setTickets] = useState([]);

  useEffect(() => {
    api.get("admin/stats/").then(res => setStats(res.data));
    api.get("tickets/").then(res => setTickets(res.data));
  }, []);

  return (
    <div className="flex">
      <Sidebar setPage={setPage} />

      <main className="flex-1 bg-slate-100 p-10">
        <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

        {stats && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-white p-4 rounded shadow">
              <p className="text-sm">Total Tickets</p>
              <p className="text-xl font-bold">{stats.total_tickets}</p>
            </div>
          </div>
        )}

        <h2 className="font-semibold mb-4">All Tickets</h2>

        <div className="grid gap-4 max-w-2xl">
          {tickets.map(t => (
            <div
              key={t.id}
              className="bg-white p-5 rounded shadow"
              onClick={() => setPage({ name: "ticket", id: t.id })}
            >
              <h3>{t.title}</h3>
              <p className="text-sm text-slate-600">{t.description}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
