import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../api/client";
import { useAuth } from "../auth/AuthContext";

export default function TicketChat() {
  const { id } = useParams();
  const { user } = useAuth();

  const [ticket, setTicket] = useState(null);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const loadTicket = async () => {
    const res = await api.get(`/api/tickets/${id}/`);
    setTicket(res.data);
  };

  useEffect(() => {
    loadTicket();
  }, [id]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    setLoading(true);
    await api.post(`/api/tickets/${id}/comments/`, {
      message,
      is_internal: false,
    });
    setMessage("");
    setLoading(false);
    loadTicket();
  };

  if (!ticket) {
    return <p className="p-6">Loading...</p>;
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="mx-auto max-w-3xl bg-white rounded-xl shadow p-6 flex flex-col h-[80vh]">
        {/* Header */}
        <div className="border-b pb-3 mb-4">
          <h2 className="text-xl font-semibold text-gray-800">
            {ticket.title}
          </h2>
          <p className="text-sm text-gray-500">
            Status: {ticket.status}
          </p>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-3 mb-4">
          {ticket.comments.map((c) => (
            <div
              key={c.id}
              className={`max-w-[75%] rounded-lg px-4 py-2 text-sm
                ${
                  c.user === user.username
                    ? "ml-auto bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-800"
                }`}
            >
              <p className="font-medium mb-1">{c.user}</p>
              <p>{c.message}</p>
            </div>
          ))}
        </div>

        {/* Input */}
        <form onSubmit={sendMessage} className="flex gap-2">
          <input
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2
                       focus:ring-2 focus:ring-blue-500 focus:outline-none"
            placeholder="Type your message…"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <button
            disabled={loading}
            className="rounded-lg bg-blue-600 px-5 py-2 text-white
                       hover:bg-blue-700 disabled:opacity-50"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
