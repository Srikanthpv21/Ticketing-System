import { useEffect, useRef, useState } from "react";
import api from "../api/client";
import { StatusBadge, CategoryBadge, ErrorBanner } from "../components/Badges";
import { useAuth } from "../auth/useAuth";

/* ---------------- Components ---------------- */

import RoleBasedNavbar from "../components/RoleBasedNavbar";
import { displayName } from "../utils/format";


/* ---------------- Dashboard ---------------- */
export default function AgentDashboard() {
  const { user } = useAuth();

  const [tickets, setTickets] = useState([]);
  const [active, setActive] = useState(null);
  const [message, setMessage] = useState("");
  const [aiSuggestion, setAiSuggestion] = useState("");
  const [aiSummary, setAiSummary] = useState("");
  const [loadingAi, setLoadingAi] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [showDetail, setShowDetail] = useState(false);
  const chatEndRef = useRef(null);
  const replyRef = useRef(null);

  /* Load tickets */
  const loadTickets = async () => {
    const res = await api.get("/api/tickets/");
    setTickets(res.data);
    setActive((prev) => prev ?? res.data[0] ?? null);
  };

  const loadTicket = async (id) => {
    const res = await api.get(`/api/tickets/${id}/`);
    setActive(res.data);
    setAiSummary("");
    setAiSuggestion("");
  };

  useEffect(() => {
    let cancelled = false;
    api
      .get("/api/tickets/")
      .then((res) => {
        if (cancelled) return;
        setTickets(res.data);
        setActive((prev) => prev ?? res.data[0] ?? null);
      })
      .catch(() => {
        if (!cancelled) setError("Could not load your tickets.");
      })
      .finally(() => {
        if (!cancelled) setInitialLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Keep the newest message in view
  const commentCount = active?.comments?.length ?? 0;
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [active?.id, commentCount]);

  // Grow the reply box to fit its text (also when text is inserted for us)
  useEffect(() => {
    const el = replyRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 220) + "px";
  }, [message, active?.id]);

  const openTicket = async (t) => {
    setActive(t);
    setShowDetail(true);
    setAiSummary("");
    setAiSuggestion("");
    setError("");
    try {
      await loadTicket(t.id);
    } catch {
      /* keep the list copy */
    }
  };

  /* Send reply */
  const sendMessage = async (e) => {
    e?.preventDefault();
    if (!message.trim() || sending) return;

    setSending(true);
    setError("");
    try {
      await api.post(`/api/tickets/${active.id}/comments/`, {
        message: message.trim(),
        is_internal: false,
      });
      setMessage("");
      setAiSuggestion("");
      await loadTicket(active.id);
    } catch {
      setError("Message failed to send. Please try again.");
    } finally {
      setSending(false);
    }
  };

  // Enter sends, Shift+Enter adds a new line
  const onMessageKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  /* Update ticket status */
  const updateStatus = async (status) => {
    if (active.status === status) return;
    setError("");
    try {
      await api.patch(`/api/tickets/${active.id}/update_status/`, { status });
      await Promise.all([loadTicket(active.id), loadTickets()]);
    } catch {
      setError("Could not update the ticket status.");
    }
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
      setError("Could not get an AI suggestion. Check the Gemini API key.");
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
      setError("Could not get an AI summary. Check the Gemini API key.");
    } finally {
      setLoadingAi(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50 font-sans text-gray-900">
      <RoleBasedNavbar />

      <div className="flex flex-1 overflow-hidden w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6 gap-6">

        {/* -------- Left Panel (Ticket List) -------- */}
        <aside className={`${showDetail ? "hidden" : "flex"} md:flex w-full md:w-80 xl:w-96 md:shrink-0 flex-col bg-white rounded-lg border border-gray-100 overflow-hidden`}>
          <div className="p-4 border-b border-gray-100 bg-gray-50/50">
            <h2 className="font-semibold text-gray-900">Assigned Tickets</h2>
            <p className="text-xs text-gray-400">
              {tickets.filter((t) => t.status === "OPEN" || t.status === "IN_PROGRESS").length} active · {tickets.length} total
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
            {initialLoading &&
              [0, 1, 2].map((i) => (
                <div key={i} className="p-3 space-y-2">
                  <div className="skeleton h-4 w-3/4" />
                  <div className="skeleton h-3 w-1/2" />
                </div>
              ))}

            {tickets.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => openTicket(t)}
                className={`w-full text-left cursor-pointer rounded-lg p-3 text-sm transition-all duration-200 border
                  ${active?.id === t.id
                    ? "bg-blue-50 border-blue-200 ring-1 ring-blue-200"
                    : "bg-white border-transparent hover:bg-gray-50 hover:border-gray-200"
                  }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-medium text-gray-900 line-clamp-1">{t.title}</span>
                  <span className="text-xs text-gray-400">#{t.id}</span>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex gap-2 text-xs text-gray-500">
                    <CategoryBadge category={t.category} />
                  </div>
                  <StatusBadge status={t.status} />
                </div>
              </button>
            ))}
            {!initialLoading && tickets.length === 0 && (
              <div className="text-center py-10 px-4">
                <p className="text-gray-500 text-sm font-medium">No tickets assigned</p>
                <p className="text-gray-400 text-xs mt-1">New tickets go to the agent with the lightest workload.</p>
              </div>
            )}
          </div>
        </aside>

        {/* -------- Main Panel -------- */}
        <main className={`${showDetail ? "flex" : "hidden"} md:flex flex-1 min-w-0 flex-col bg-white rounded-lg border border-gray-100 overflow-hidden relative`}>
          <button
            type="button"
            onClick={() => setShowDetail(false)}
            className="md:hidden flex items-center gap-1 px-4 py-2 text-sm text-blue-600 border-b border-gray-100 text-left"
          >
            ← All tickets
          </button>

          {error && (
            <div className="p-3 pb-0">
              <ErrorBanner message={error} onDismiss={() => setError("")} />
            </div>
          )}

          {active ? (
            <>
              {/* Header & Controls */}
              <div className="bg-white border-b border-gray-100 p-4 md:p-6 max-h-[45%] overflow-y-auto">
                <div className="flex flex-col gap-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900">{active.title}</h2>
                      <div className="flex items-center gap-3 mt-2 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                          {displayName(active.created_by)}
                        </span>
                        <span>•</span>
                        <span>{new Date(active.created_at).toLocaleString()}</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <StatusBadge status={active.status} />
                      <CategoryBadge category={active.category} />
                    </div>
                  </div>

                  <div className="self-start w-fit max-w-3xl text-sm text-gray-700 bg-gray-50 px-4 py-3 rounded-lg border border-gray-200 whitespace-pre-wrap [overflow-wrap:anywhere]">
                    {active.description}
                  </div>

                  {/* Action Bar */}
                  <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-gray-50 mt-2">
                    <span className="hidden sm:inline text-xs font-semibold text-gray-400 uppercase tracking-wide mr-auto">Actions:</span>

                    <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
                      <button onClick={() => updateStatus("IN_PROGRESS")} disabled={active.status === "IN_PROGRESS"} className="px-3 py-1.5 text-xs font-medium rounded-md hover:bg-white transition-all text-blue-700 disabled:bg-white disabled:opacity-60 disabled:cursor-default">In Progress</button>
                      <button onClick={() => updateStatus("RESOLVED")} disabled={active.status === "RESOLVED"} className="px-3 py-1.5 text-xs font-medium rounded-md hover:bg-white transition-all text-green-700 disabled:bg-white disabled:opacity-60 disabled:cursor-default">Resolve</button>
                      <button onClick={() => updateStatus("CLOSED")} disabled={active.status === "CLOSED"} className="px-3 py-1.5 text-xs font-medium rounded-md hover:bg-white transition-all text-gray-700 disabled:bg-white disabled:opacity-60 disabled:cursor-default">Close</button>
                    </div>

                    <div className="h-6 w-px bg-gray-200 mx-1"></div>

                    <button
                      onClick={getAiSummary}
                      disabled={loadingAi}
                      className="px-3 py-1.5 text-xs font-medium border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                    >
                      {loadingAi ? "Working…" : "Summarize"}
                    </button>
                  </div>
                </div>
              </div>

              {/* AI Summary View */}
              {aiSummary && (
                <div className="bg-gray-50 border-b border-gray-200 p-4">
                  <div className="flex items-start gap-3">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-1">Ticket summary</h4>
                      <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{aiSummary}</p>
                    </div>
                    <button onClick={() => setAiSummary("")} className="ml-auto text-gray-400 hover:text-gray-600">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                  </div>
                </div>
              )}

              {/* Chat Area */}
              <div className="flex-1 p-4 md:p-6 space-y-6 overflow-y-auto bg-gray-50/30 custom-scrollbar">
                {active.comments.length === 0 && (
                  <p className="text-center text-sm text-gray-400 pt-6">No messages yet. Send the first reply below.</p>
                )}
                {active.comments.map((c) => {
                  const isMine = c.user === user.username;
                  return (
                    <div
                      key={c.id}
                      className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                    >
                      <div className={`flex flex-col min-w-0 max-w-[85%] md:max-w-[80%] ${isMine ? "items-end" : "items-start"}`}>
                        <div
                          className={`px-5 py-3 rounded-lg text-sm
                            ${isMine
                              ? "bg-blue-700 text-white"
                              : "bg-white border border-gray-200 text-gray-800"
                            }`}
                        >
                          <p className="leading-relaxed whitespace-pre-wrap [overflow-wrap:anywhere]">{c.message}</p>
                        </div>
                        <span className="text-[10px] text-gray-400 mt-1 px-1">
                          {displayName(c.user)} • {new Date(c.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>

              {/* Suggestions & Input */}
              <div className="bg-white border-t border-gray-100 p-4">
                {aiSuggestion && (
                  <div className="mb-3 flex items-center justify-between gap-3 text-xs text-gray-600">
                    <span>Suggested reply added below. Review and edit it before sending.</span>
                    <button
                      type="button"
                      onClick={() => { setAiSuggestion(""); setMessage(""); }}
                      className="shrink-0 font-medium text-blue-700 hover:underline"
                    >
                      Discard
                    </button>
                  </div>
                )}

                <form onSubmit={sendMessage} className="flex gap-3 items-end">
                  <button
                    type="button"
                    onClick={getAiSuggestion}
                    disabled={loadingAi}
                    className="px-3 py-3 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 whitespace-nowrap"
                    title="Draft a reply from the conversation"
                  >
                    Suggest reply
                  </button>

                  <div className="flex-1 relative">
                    <textarea
                      className="w-full border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 px-4 py-3 bg-gray-50 focus:bg-white transition-all resize-none text-sm"
                      aria-label="Reply"
                      placeholder="Type your reply…"
                      title="Enter to send, Shift+Enter for a new line"
                      ref={replyRef}
                      rows="1"
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      onKeyDown={onMessageKeyDown}
                      style={{ minHeight: '46px', maxHeight: '220px' }}
                    />
                  </div>

                  <button
                    aria-label="Send message"
                    disabled={!message.trim() || sending}
                    className="bg-blue-700 text-white p-3 rounded-lg hover:bg-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
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
              <p className="font-medium">No ticket selected</p>
              <p className="text-sm mt-1">Choose a ticket from the list to view and reply.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
