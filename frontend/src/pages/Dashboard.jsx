import { useEffect, useState } from "react";
import api from "../api/axios";

export default function Dashboard({ setPage }) {
  const [tickets, setTickets] = useState([]);

  useEffect(() => {
    api.get("tickets/").then(res => setTickets(res.data));
  }, []);

  return (
    <div>
      <button onClick={() => setPage("new")}>New Ticket</button>
      <button onClick={() => { localStorage.clear(); window.location.reload(); }}>Logout</button>

      <h2>My Tickets</h2>
      {tickets.map(t => (
        <div key={t.id}>
          <h4>{t.title}</h4>
          <p>{t.description}</p>
          <small>{t.status} | {t.category}</small>
        </div>
      ))}
    </div>
  );
}
