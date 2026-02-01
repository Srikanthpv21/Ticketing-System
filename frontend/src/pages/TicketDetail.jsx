import { useEffect, useState } from "react";
import Sidebar from "../components/Sidebar";
import api from "../api/axios";

export default function TicketDetail({ ticketId, setPage }) {
  const [ticket, setTicket] = useState(null);
  const [message, setMessage] = useState("");
  const [comments, setComments] = useState([]);

  useEffect(() => {
    api.get(`tickets/${ticketId}/`).then((res) => {
      setTicket(res.data);
      setComments(res.data.comments);
    });
  }, [ticketId]);

  const sendComment = async () => {
    await api.post("comments/", {
      ticket: ticketId,
      message,
    });
    setMessage("");

    const res = await api.get(`tickets/${ticketId}/`);
    setComments(res.data.comments);
  };

  if (!ticket) return null;

  return (
    <div className="flex">
      <Sidebar setPage={setPage} />

      <main className="flex-1 bg-slate-100 p-10 max-w-3xl">
        <button
          onClick={() => setPage({ name: "dashboard" })}
          className="text-sm text-blue-600 mb-4"
        >
          ← Back
        </button>

        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <h2 className="text-xl font-bold">{ticket.title}</h2>
          <p className="text-slate-600 mt-2">{ticket.description}</p>

          <div className="flex gap-4 mt-4 text-sm">
            <span className="bg-yellow-100 px-2 py-1 rounded">
              {ticket.status}
            </span>
            <span>Priority: {ticket.priority}</span>
            <span>📂 {ticket.category}</span>
          </div>
        </div>

        {/* COMMENTS */}
        <div className="bg-white p-6 rounded-lg shadow space-y-4">
          <h3 className="font-semibold">Conversation</h3>

          {comments.map((c) => (
            <div key={c.id} className="border-b pb-2">
              <p className="text-sm font-medium">{c.user.username}</p>
              <p className="text-slate-600">{c.message}</p>
            </div>
          ))}

          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Reply to support..."
            className="w-full border p-2 rounded"
          />

          <button
            onClick={sendComment}
            className="bg-blue-600 text-white px-4 py-2 rounded"
          >
            Send
          </button>
        </div>
      </main>
    </div>
  );
}
