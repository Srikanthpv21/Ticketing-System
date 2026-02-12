import { useEffect, useState } from "react";
import api from "../api/client";
import { useAuth } from "../auth/AuthContext";

/* ---------------- Components ---------------- */

import RoleBasedNavbar from "../components/RoleBasedNavbar";

function StatusBadge({ status }) {
  const styles = {
    OPEN: "bg-yellow-50 text-yellow-700 ring-yellow-600/20",
    IN_PROGRESS: "bg-blue-50 text-blue-700 ring-blue-700/10",
    RESOLVED: "bg-green-50 text-green-700 ring-green-600/20",
    CLOSED: "bg-gray-50 text-gray-600 ring-gray-500/10",
  }[status] || "bg-gray-50 text-gray-600 ring-gray-500/10";

  return (
    <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${styles}`}>
      {status.replace("_", " ")}
    </span>
  );
}

/* ---------------- Dashboard ---------------- */
export default function CustomerDashboard() {
  const { user } = useAuth();

  const [tickets, setTickets] = useState([]);
  const [active, setActive] = useState(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  /* Load tickets */
  const loadTickets = async () => {
    const res = await api.get("/api/tickets/");
    setTickets(res.data);
    if (!active && res.data.length) setActive(res.data[0]);
  };

  const loadTicket = async (id) => {
    const res = await api.get(`/api/tickets/${id}/`);
    setActive(res.data);
  };

  useEffect(() => {
    loadTickets();
  }, []);

  /* Create ticket */
  const createTicket = async (e) => {
    e.preventDefault();
    if (!title || !description) return;

    await api.post("/api/tickets/", { title, description });
    setTitle("");
    setDescription("");
    setIsCreating(false);
    loadTickets();
  };

  /* Send message */
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    await api.post(`/api/tickets/${active.id}/comments/`, {
      message,
      is_internal: false,
    });

    setMessage("");
    loadTicket(active.id);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50 font-sans text-gray-900">
      <RoleBasedNavbar />

      <div className="flex flex-1 overflow-hidden max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 gap-6">

        {/* -------- Left Panel (List) -------- */}
        <aside className="w-full md:w-80 flex flex-col gap-4 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <h2 className="font-bold text-gray-900">My Tickets</h2>
            <button
              onClick={() => setIsCreating(true)}
              className="p-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-sm"
              title="Create Ticket"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
            {tickets.map((t) => (
              <div
                key={t.id}
                onClick={() => { setActive(t); setIsCreating(false); }}
                className={`cursor-pointer rounded-lg p-3 text-sm transition-all duration-200 border
                  ${active?.id === t.id && !isCreating
                    ? "bg-blue-50 border-blue-200 shadow-sm ring-1 ring-blue-200"
                    : "bg-white border-transparent hover:bg-gray-50 hover:border-gray-200"
                  }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-medium text-gray-900 line-clamp-1">{t.title}</span>
                  <span className="text-xs text-gray-400">#{t.id}</span>
                </div>
                <div className="flex items-center justify-between">
                  <StatusBadge status={t.status} />
                  <span className="text-xs text-gray-400 font-mono">
                    {new Date(t.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
            {tickets.length === 0 && (
              <div className="text-center py-8 text-gray-400 text-sm">
                No tickets yet.
              </div>
            )}
          </div>
        </aside>

        {/* -------- Main Panel (Chat or Create) -------- */}
        <main className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden relative">
          {isCreating ? (
            <div className="flex-1 flex flex-col p-8 max-w-2xl mx-auto w-full">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Create New Ticket</h2>
                <p className="text-gray-500 mt-1">Describe your issue and we'll get back to you shortly.</p>
              </div>

              <form onSubmit={createTicket} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                  <input
                    className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 p-2.5 bg-gray-50 border transition-all"
                    placeholder="Brief summary of the issue"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 p-3 bg-gray-50 border transition-all"
                    rows="6"
                    placeholder="Please provide detailed information about your issue..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm"
                  >
                    Submit Ticket
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCreating(false)}
                    className="px-6 py-2.5 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          ) : active ? (
            <>
              {/* Ticket Header */}
              <div className="bg-white border-b border-gray-100 p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{active.title}</h2>
                    <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                        {active.created_by}
                      </span>
                      <span>•</span>
                      <span>{new Date(active.created_at).toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <StatusBadge status={active.status} />
                    <span className="text-xs font-mono text-gray-400">#{active.id}</span>
                  </div>
                </div>
                <div className="mt-4 bg-gray-50 p-4 rounded-lg text-gray-700 text-sm leading-relaxed border border-gray-100">
                  {active.description}
                </div>
              </div>

              {/* Chat Area */}
              <div className="flex-1 p-6 space-y-6 overflow-y-auto bg-gray-50/30">
                {active.comments.map((c) => {
                  const isMine = c.user === user.username;
                  return (
                    <div
                      key={c.id}
                      className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                    >
                      <div className={`flex flex-col max-w-[80%] ${isMine ? "items-end" : "items-start"}`}>
                        <div
                          className={`px-5 py-3 rounded-2xl text-sm shadow-sm
                            ${isMine
                              ? "bg-blue-600 text-white rounded-br-none"
                              : "bg-white border border-gray-200 text-gray-800 rounded-bl-none"
                            }`}
                        >
                          <p className="leading-relaxed whitespace-pre-wrap">{c.message}</p>
                        </div>
                        <span className="text-[10px] text-gray-400 mt-1 px-1">
                          {c.user} • {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Input Area */}
              <form
                onSubmit={sendMessage}
                className="bg-white border-t border-gray-100 p-4 flex gap-3 items-end"
              >
                <div className="flex-1 relative">
                  <textarea
                    className="w-full border-gray-200 rounded-xl focus:ring-blue-500 focus:border-blue-500 pl-4 pr-12 py-3 bg-gray-50 focus:bg-white transition-all resize-none shadow-sm text-sm"
                    placeholder="Type your reply..."
                    rows="1"
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    style={{ minHeight: '46px', maxHeight: '120px' }}
                    onInput={(e) => {
                      e.target.style.height = 'auto';
                      e.target.style.height = e.target.scrollHeight + 'px';
                    }}
                  />
                  <div className="absolute right-3 bottom-2.5 text-gray-400 hover:text-gray-600 cursor-pointer">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                  </div>
                </div>

                <button
                  disabled={!message.trim()}
                  className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex-shrink-0"
                >
                  <svg className="w-5 h-5 transform rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50/50">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
              </div>
              <p className="font-medium">Welcome to HelpDesk</p>
              <p className="text-sm mt-1">Select a ticket or create a new one to get started.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
