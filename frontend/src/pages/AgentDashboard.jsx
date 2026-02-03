import { useEffect, useState } from "react";
import api from "../api/client";
import { useAuth } from "../auth/AuthContext";

/* ---------------- Navbar ---------------- */
function Navbar() {
  const { logout, user } = useAuth();

  return (
    <div className="h-14 bg-white border-b flex items-center justify-between px-6">
      <h1 className="font-semibold text-lg">Help Desk — Agent</h1>

      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600">
          {user?.username} (Agent)
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
export default function AgentDashboard() {
  const { user } = useAuth();

  const [tickets, setTickets] = useState([]);
  const [active, setActive] = useState(null);
  const [message, setMessage] = useState("");
  const [aiSuggestion, setAiSuggestion] = useState("");
  const [aiSummary, setAiSummary] = useState("");

  /* Load tickets */
  const loadTickets = async () => {
    const res = await api.get("/api/tickets/");
    setTickets(res.data);
    if (!active && res.data.length) setActive(res.data[0]);
  };

  const loadTicket = async (id) => {
    const res = await api.get(`/api/tickets/${id}/`);
    setActive(res.data);
    setAiSummary("");
    setAiSuggestion("");
  };

  useEffect(() => {
    loadTickets();
  }, []);

  /* Send reply */
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    await api.post(`/api/tickets/${active.id}/comments/`, {
      message,
      is_internal: false,
    });

    setMessage("");
    setAiSuggestion("");
    loadTicket(active.id);
  };

  /* Update ticket status */
  const updateStatus = async (status) => {
    await api.patch(`/api/tickets/${active.id}/update_status/`, { status });
    loadTicket(active.id);
    loadTickets();
  };

  /* AI reply suggestion */
  const getAiSuggestion = async () => {
    const res = await api.get(`/api/tickets/${active.id}/ai_reply/`);
    setAiSuggestion(res.data.suggestion);
    setMessage(res.data.suggestion);
  };

  /* AI summary */
  const getAiSummary = async () => {
    const res = await api.get(`/api/tickets/${active.id}/ai_summary/`);
    setAiSummary(res.data.summary);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      <Navbar />

      <div className="flex flex-1 overflow-hidden">
        {/* -------- Ticket List -------- */}
        <aside className="w-80 bg-white border-r flex flex-col">
          <div className="p-4 border-b font-semibold">Assigned Tickets</div>

          <div className="flex-1 overflow-y-auto p-2 space-y-2">
            {tickets.map((t) => (
              <div
                key={t.id}
                onClick={() => loadTicket(t.id)}
                className={`cursor-pointer border rounded p-3 text-sm
                  ${
                    active?.id === t.id
                      ? "bg-blue-50 border-blue-500"
                      : "bg-white"
                  }`}
              >
                <div className="font-medium">{t.title}</div>
                <div className="text-xs text-gray-500">
                  {t.status} • {t.category}
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* -------- Chat Panel -------- */}
        <main className="flex-1 flex flex-col">
          {active ? (
            <>
              {/* Header */}
              <div className="bg-white p-4 border-b space-y-2">
                <h2 className="font-semibold">{active.title}</h2>
                <p className="text-sm text-gray-600">
                  {active.description}
                </p>

                <div className="flex gap-2 pt-2 flex-wrap">
                  <button
                    onClick={() => updateStatus("IN_PROGRESS")}
                    className="px-3 py-1 text-sm rounded bg-blue-600 text-white"
                  >
                    In Progress
                  </button>
                  <button
                    onClick={() => updateStatus("RESOLVED")}
                    className="px-3 py-1 text-sm rounded bg-green-600 text-white"
                  >
                    Resolve
                  </button>
                  <button
                    onClick={() => updateStatus("CLOSED")}
                    className="px-3 py-1 text-sm rounded bg-gray-600 text-white"
                  >
                    Close
                  </button>
                  <button
                    onClick={getAiSummary}
                    className="px-3 py-1 text-sm rounded bg-indigo-600 text-white"
                  >
                    AI Summary
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 p-6 space-y-4 overflow-y-auto">
                {active.comments.map((c) => {
                  const isMine = c.user === user.username;

                  return (
                    <div
                      key={c.id}
                      className={`flex ${
                        isMine ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-lg px-4 py-2 rounded-lg text-sm
                          ${
                            isMine
                              ? "bg-blue-600 text-white"
                              : "bg-gray-200 text-gray-900"
                          }`}
                      >
                        <div className="text-xs font-medium mb-1 opacity-70">
                          {c.user}
                        </div>
                        {c.message}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Reply box */}
              <form
                onSubmit={sendMessage}
                className="bg-white border-t p-4 flex gap-2"
              >
                <input
                  className="flex-1 border rounded px-4 py-2"
                  placeholder="Reply to customer..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />

                <button
                  type="submit"
                  className="bg-blue-600 text-white px-5 rounded"
                >
                  Send
                </button>

                <button
                  type="button"
                  onClick={getAiSuggestion}
                  className="bg-purple-600 text-white px-4 rounded"
                >
                  AI Suggest
                </button>
              </form>

              {/* AI Suggestion */}
              {aiSuggestion && (
                <div className="bg-purple-50 border-t p-3 text-sm">
                  <strong>AI Suggested Reply</strong>
                  <p className="mt-1 whitespace-pre-wrap">
                    {aiSuggestion}
                  </p>
                </div>
              )}

              {/* AI Summary */}
              {aiSummary && (
                <div className="bg-indigo-50 border-t p-4 text-sm">
                  <strong className="block mb-1">
                    AI Ticket Summary
                  </strong>
                  <pre className="whitespace-pre-wrap text-gray-700">
                    {aiSummary}
                  </pre>
                </div>
              )}
            </>
          ) : (
            <div className="p-6 text-gray-500">
              Select a ticket to start working
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
