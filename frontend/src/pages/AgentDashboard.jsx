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
export default function AgentDashboard() {
  const { user } = useAuth();

  const [tickets, setTickets] = useState([]);
  const [active, setActive] = useState(null);
  const [message, setMessage] = useState("");
  const [aiSuggestion, setAiSuggestion] = useState("");
  const [aiSummary, setAiSummary] = useState("");
  const [loadingAi, setLoadingAi] = useState(false);

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
    setLoadingAi(true);
    try {
      const res = await api.get(`/api/tickets/${active.id}/ai_reply/`);
      setAiSuggestion(res.data.suggestion);
      setMessage(res.data.suggestion);
    } catch (e) {
      console.error(e);
      alert("Failed to get AI suggestion");
    } finally {
      setLoadingAi(false);
    }
  };

  /* AI summary */
  const getAiSummary = async () => {
    setLoadingAi(true);
    try {
      const res = await api.get(`/api/tickets/${active.id}/ai_summary/`);
      setAiSummary(res.data.summary);
    } catch (e) {
      console.error(e);
      alert("Failed to get AI summary");
    } finally {
      setLoadingAi(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50 font-sans text-gray-900">
      <RoleBasedNavbar />

      <div className="flex flex-1 overflow-hidden max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 gap-6">

        {/* -------- Left Panel (Ticket List) -------- */}
        <aside className="w-full md:w-80 flex flex-col gap-4 bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50/50">
            <h2 className="font-bold text-gray-900">Assigned Tickets</h2>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
            {tickets.map((t) => (
              <div
                key={t.id}
                onClick={() => { setActive(t); setAiSummary(""); setAiSuggestion(""); }}
                className={`cursor-pointer rounded-lg p-3 text-sm transition-all duration-200 border
                  ${active?.id === t.id
                    ? "bg-purple-50 border-purple-200 shadow-sm ring-1 ring-purple-200"
                    : "bg-white border-transparent hover:bg-gray-50 hover:border-gray-200"
                  }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-medium text-gray-900 line-clamp-1">{t.title}</span>
                  <span className="text-xs text-gray-400">#{t.id}</span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex gap-2 text-xs text-gray-500">
                    <span className="bg-gray-100 px-1.5 py-0.5 rounded text-gray-600">{t.category}</span>
                  </div>
                  <StatusBadge status={t.status} />
                </div>
              </div>
            ))}
            {tickets.length === 0 && (
              <div className="text-center py-8 text-gray-400 text-sm">
                No tickets assigned.
              </div>
            )}
          </div>
        </aside>

        {/* -------- Main Panel -------- */}
        <main className="flex-1 flex flex-col bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden relative">
          {active ? (
            <>
              {/* Header & Controls */}
              <div className="bg-white border-b border-gray-100 p-6">
                <div className="flex flex-col gap-4">
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
                    <StatusBadge status={active.status} />
                  </div>

                  <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg border border-gray-100">
                    {active.description}
                  </div>

                  {/* Action Bar */}
                  <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-gray-50 mt-2">
                    <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide mr-auto">Actions:</span>

                    <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
                      <button onClick={() => updateStatus("IN_PROGRESS")} className="px-3 py-1.5 text-xs font-medium rounded-md hover:bg-white hover:shadow-sm transition-all text-blue-700">In Progress</button>
                      <button onClick={() => updateStatus("RESOLVED")} className="px-3 py-1.5 text-xs font-medium rounded-md hover:bg-white hover:shadow-sm transition-all text-green-700">Resolve</button>
                      <button onClick={() => updateStatus("CLOSED")} className="px-3 py-1.5 text-xs font-medium rounded-md hover:bg-white hover:shadow-sm transition-all text-gray-700">Close</button>
                    </div>

                    <div className="h-6 w-px bg-gray-200 mx-1"></div>

                    <button
                      onClick={getAiSummary}
                      disabled={loadingAi}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors disabled:opacity-50"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                      {loadingAi ? "Thinking..." : "AI Summary"}
                    </button>
                  </div>
                </div>
              </div>

              {/* AI Summary View */}
              {aiSummary && (
                <div className="bg-indigo-50 border-b border-indigo-100 p-4 animate-fadeIn">
                  <div className="flex items-start gap-3">
                    <div className="bg-indigo-100 p-1.5 rounded-md text-indigo-600 mt-0.5">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" /></svg>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-indigo-900 mb-1">Smart Summary</h4>
                      <p className="text-sm text-indigo-800 leading-relaxed whitespace-pre-wrap">{aiSummary}</p>
                    </div>
                    <button onClick={() => setAiSummary("")} className="ml-auto text-indigo-400 hover:text-indigo-600">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                </div>
              )}

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
                              ? "bg-purple-600 text-white rounded-br-none"
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

              {/* Suggestions & Input */}
              <div className="bg-white border-t border-gray-100 p-4">
                {aiSuggestion && (
                  <div className="mb-4 bg-purple-50 border border-purple-100 rounded-lg p-3 relative animate-slideUp">
                    <div className="text-xs font-bold text-purple-700 mb-1 uppercase tracking-wider">AI Suggested Reply</div>
                    <p className="text-sm text-gray-700 italic">"{aiSuggestion}"</p>
                    <button
                      onClick={() => setAiSuggestion("")}
                      className="absolute top-2 right-2 text-purple-300 hover:text-purple-500"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                )}

                <form onSubmit={sendMessage} className="flex gap-3 items-end">
                  <button
                    type="button"
                    onClick={getAiSuggestion}
                    disabled={loadingAi}
                    className="p-3 rounded-xl border border-purple-200 text-purple-600 hover:bg-purple-50 transition-colors shadow-sm disabled:opacity-50"
                    title="Generate AI Reply"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
                  </button>

                  <div className="flex-1 relative">
                    <textarea
                      className="w-full border-gray-200 rounded-xl focus:ring-purple-500 focus:border-purple-500 pl-4 pr-12 py-3 bg-gray-50 focus:bg-white transition-all resize-none shadow-sm text-sm"
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
                  </div>

                  <button
                    disabled={!message.trim()}
                    className="bg-purple-600 text-white p-3 rounded-xl hover:bg-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm flex-shrink-0"
                  >
                    <svg className="w-5 h-5 transform rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50/50">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              </div>
              <p className="font-medium">Agent Workspace</p>
              <p className="text-sm mt-1">Select a ticket to view details and reply.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
