import { useEffect, useRef, useState } from "react";
import api from "../api/client";
import { useAuth } from "../auth/useAuth";
import RoleBasedNavbar from "../components/RoleBasedNavbar";
import { StatusBadge, CategoryBadge, ErrorBanner } from "../components/Badges";
import { displayName } from "../utils/format";

const apiError = (err, fallback) =>
  err?.response?.data?.detail || fallback;

/* ---------------- Dashboard ---------------- */
export default function CustomerDashboard() {
  const { user } = useAuth();

  const [tickets, setTickets] = useState([]);
  const [active, setActive] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  // Mobile: show either the list or the detail panel
  const [showDetail, setShowDetail] = useState(false);

  const chatEndRef = useRef(null);
  const replyRef = useRef(null);

  /* Load tickets */
  const loadTickets = async (selectId) => {
    const res = await api.get("/api/tickets/");
    setTickets(res.data);
    setActive((prev) => {
      if (selectId) return res.data.find((t) => t.id === selectId) ?? prev;
      return prev ?? res.data[0] ?? null;
    });
  };

  const loadTicket = async (id) => {
    const res = await api.get(`/api/tickets/${id}/`);
    setActive(res.data);
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
      .catch((err) => {
        if (!cancelled) setError(apiError(err, "Could not load your tickets."));
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
    setIsCreating(false);
    setShowDetail(true);
    setError("");
    try {
      await loadTicket(t.id); // refresh with latest comments
    } catch {
      /* keep the list copy */
    }
  };

  /* Create ticket */
  const createTicket = async (e) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || submitting) return;

    setSubmitting(true);
    setError("");
    try {
      const res = await api.post("/api/tickets/", {
        title: title.trim(),
        description: description.trim(),
      });
      setTitle("");
      setDescription("");
      setIsCreating(false);
      setShowDetail(true);
      await loadTickets(res.data.id);
    } catch (err) {
      setError(apiError(err, "Could not create the ticket. Please try again."));
    } finally {
      setSubmitting(false);
    }
  };

  /* Send message */
  const sendMessage = async (e) => {
    e?.preventDefault();
    if (!message.trim() || submitting) return;

    setSubmitting(true);
    setError("");
    try {
      await api.post(`/api/tickets/${active.id}/comments/`, {
        message: message.trim(),
        is_internal: false,
      });
      setMessage("");
      await loadTicket(active.id);
    } catch (err) {
      setError(apiError(err, "Message failed to send. Please try again."));
    } finally {
      setSubmitting(false);
    }
  };

  // Enter sends, Shift+Enter adds a new line
  const onMessageKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const startCreating = () => {
    setIsCreating(true);
    setShowDetail(true);
    setError("");
  };

  return (
    <div className="h-screen flex flex-col bg-gray-50 font-sans text-gray-900">
      <RoleBasedNavbar />

      <div className="flex flex-1 overflow-hidden w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-4 md:py-6 gap-6">
        {/* -------- Left Panel (List) -------- */}
        <aside
          className={`${showDetail ? "hidden" : "flex"} md:flex w-full md:w-80 xl:w-96 md:shrink-0 flex-col bg-white rounded-lg border border-gray-100 overflow-hidden`}
        >
          <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <div>
              <h2 className="font-semibold text-gray-900">My Tickets</h2>
              <p className="text-xs text-gray-400">
                {tickets.length} {tickets.length === 1 ? "ticket" : "tickets"}
              </p>
            </div>
            <button
              onClick={startCreating}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-700 text-white text-sm font-medium rounded-lg hover:bg-blue-800 transition"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New
            </button>
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
                  ${active?.id === t.id && !isCreating
                    ? "bg-blue-50 border-blue-200 ring-1 ring-blue-200"
                    : "bg-white border-transparent hover:bg-gray-50 hover:border-gray-200"
                  }`}
              >
                <div className="flex justify-between items-start mb-2 gap-2">
                  <span className="font-medium text-gray-900 line-clamp-1">{t.title}</span>
                  <span className="text-xs text-gray-400">#{t.id}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <StatusBadge status={t.status} />
                    <span aria-hidden="true" className="text-gray-300">·</span>
                    <CategoryBadge category={t.category} />
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(t.created_at).toLocaleDateString()}
                  </span>
                </div>
              </button>
            ))}

            {!initialLoading && tickets.length === 0 && (
              <div className="text-center py-10 px-4">
                <p className="text-gray-500 text-sm font-medium">No tickets yet</p>
                <p className="text-gray-400 text-xs mt-1 mb-4">
                  Need help? Open a ticket and our team will respond.
                </p>
                <button
                  onClick={startCreating}
                  className="text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                  Create a ticket
                </button>
              </div>
            )}
          </div>
        </aside>

        {/* -------- Main Panel (Chat or Create) -------- */}
        <main
          className={`${showDetail ? "flex" : "hidden"} md:flex flex-1 min-w-0 flex-col bg-white rounded-lg border border-gray-100 overflow-hidden relative`}
        >
          {/* Mobile back button */}
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

          {isCreating ? (
            <form onSubmit={createTicket} className="flex-1 min-h-0 flex flex-col">
              {/* Header */}
              <div className="px-6 md:px-8 py-5 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Create a ticket</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Tell us what you need help with. Your ticket is categorised
                  automatically and assigned to a support agent.
                </p>
              </div>

              {/* Fields */}
              <div className="flex-1 overflow-y-auto px-6 md:px-8 py-6">
                <div className="max-w-2xl space-y-6">
                  <div>
                    <div className="flex items-baseline justify-between mb-1.5">
                      <label htmlFor="ticket-title" className="text-sm font-medium text-gray-700">
                        Subject <span className="text-red-600">*</span>
                      </label>
                      <span className="text-xs text-gray-400">{title.length}/200</span>
                    </div>
                    <input
                      id="ticket-title"
                      className="block w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                      placeholder="e.g. I can't reset my password"
                      value={title}
                      maxLength={200}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="ticket-desc" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Description <span className="text-red-600">*</span>
                    </label>
                    <textarea
                      id="ticket-desc"
                      className="block w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 resize-y min-h-[200px]"
                      rows="9"
                      placeholder="What happened, and what did you expect to happen?"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      required
                    />
                    <p className="text-xs text-gray-500 mt-1.5">
                      Include any error messages and the steps that led to the problem.
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="px-6 md:px-8 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-md bg-blue-700 px-5 py-2 text-sm font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting ? "Submitting…" : "Submit ticket"}
                </button>
              </div>
            </form>
          ) : active ? (
            <>
              {/* Ticket Header */}
              <div className="bg-white border-b border-gray-100 p-4 md:p-6 max-h-[40%] overflow-y-auto">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="text-xl font-semibold text-gray-900 [overflow-wrap:anywhere]">{active.title}</h2>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-sm text-gray-500">
                      <span>{displayName(active.created_by)}</span>
                      <span>•</span>
                      <span>{new Date(active.created_at).toLocaleString()}</span>
                      {active.assigned_to_username && (
                        <>
                          <span>•</span>
                          <span>Handled by {displayName(active.assigned_to_username)}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <StatusBadge status={active.status} />
                    <CategoryBadge category={active.category} />
                    <span className="text-xs font-mono text-gray-400">#{active.id}</span>
                  </div>
                </div>
                <div className="mt-4 w-fit max-w-3xl bg-gray-50 px-4 py-3 rounded-lg text-gray-700 text-sm leading-relaxed border border-gray-200 whitespace-pre-wrap [overflow-wrap:anywhere]">
                  {active.description}
                </div>
              </div>

              {/* Chat Area */}
              <div className="flex-1 p-4 md:p-6 space-y-6 overflow-y-auto bg-gray-50/30 custom-scrollbar">
                {active.comments.length === 0 && (
                  <p className="text-center text-sm text-gray-400 pt-6">
                    No replies yet. Our team will respond here.
                  </p>
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
                          {displayName(c.user)} • {new Date(c.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                    </div>
                  );
                })}
                <div ref={chatEndRef} />
              </div>

              {/* Input Area */}
              <form
                onSubmit={sendMessage}
                className="bg-white border-t border-gray-100 p-4 flex gap-3 items-end"
              >
                <textarea
                  aria-label="Reply"
                  className="flex-1 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 px-4 py-3 bg-gray-50 focus:bg-white transition-all resize-none text-sm"
                  placeholder="Type your reply…"
                  title="Enter to send, Shift+Enter for a new line"
                  ref={replyRef}
                  rows="1"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={onMessageKeyDown}
                  style={{ minHeight: "46px", maxHeight: "220px" }}
                />

                <button
                  aria-label="Send message"
                  disabled={!message.trim() || submitting}
                  className="bg-blue-700 text-white p-3 rounded-lg hover:bg-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
                >
                  <svg className="w-5 h-5 transform rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50/50 p-6 text-center">
              <p className="font-medium text-gray-600">No ticket selected</p>
              <p className="text-sm mt-1 mb-4">Choose a ticket from the list, or create a new one.</p>
              <button
                onClick={startCreating}
                className="px-4 py-2 bg-blue-700 text-white text-sm font-medium rounded-lg hover:bg-blue-800 transition"
              >
                Create a ticket
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
