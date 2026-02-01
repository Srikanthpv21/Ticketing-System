import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import api from "../api/axios";

export default function AgentDashboard({ setPage }) {
  const [tickets, setTickets] = useState([]);

  useEffect(() => {
    api.get("tickets/").then(res => setTickets(res.data));
  }, []);

  return (
    <div className="flex">
      <Sidebar setPage={setPage} />

      <main className="flex-1 bg-slate-100 p-10">
        <h1 className="text-2xl font-bold mb-6">Assigned Tickets</h1>

        <div className="grid gap-4 max-w-2xl">
          {tickets.map(t => (
            <div
              key={t.id}
              className="bg-white p-5 rounded shadow cursor-pointer"
              onClick={() => setPage({ name: "ticket", id: t.id })}
            >
              <h3 className="font-semibold">{t.title}</h3>
              <p className="text-sm text-slate-600">{t.description}</p>

              <div className="flex justify-between mt-4 text-sm">
                <span className="bg-blue-100 px-2 py-1 rounded">
                  {t.status}
                </span>
                <span>Priority: {t.priority}</span>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
