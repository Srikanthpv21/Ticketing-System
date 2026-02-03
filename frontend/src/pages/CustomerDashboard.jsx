import { useEffect, useState } from "react";
import api from "../api/client";
import { useAuth } from "../auth/AuthContext";

/* ---------------- Navbar ---------------- */
function Navbar() {
  const { logout, user } = useAuth();

  return (
    <div className="h-14 bg-white border-b flex items-center justify-between px-6">
      <h1 className="font-semibold text-lg">Help Desk</h1>

      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600">
          {user?.username} (Customer)
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
export default function CustomerDashboard() {
  const { user } = useAuth();

  const [tickets, setTickets] = useState([]);
  const [active, setActive] = useState(null);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [message, setMessage] = useState("");

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
    <div className="h-screen flex flex-col bg-gray-100">
      <Navbar />

      <div className="flex flex-1 overflow-hidden">
        {/* -------- Left Panel -------- */}
        <aside className="w-80 bg-white border-r flex flex-col">
          <div className="p-4 border-b font-semibold">Create Ticket</div>

          <form onSubmit={createTicket} className="p-4 space-y-3 border-b">
            <input
              className="w-full border rounded px-3 py-2 text-sm"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <textarea
              className="w-full border rounded px-3 py-2 text-sm"
              rows="3"
              placeholder="Describe your issue..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <button className="w-full bg-blue-600 text-white py-2 rounded">
              Submit Ticket
            </button>
          </form>

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
                <div className="text-xs text-gray-500">{t.status}</div>
              </div>
            ))}
          </div>
        </aside>

        {/* -------- Chat Panel -------- */}
        <main className="flex-1 flex flex-col">
          {active ? (
            <>
              <div className="bg-white p-4 border-b">
                <h2 className="font-semibold">{active.title}</h2>
                <p className="text-sm text-gray-600 mt-1">
                  {active.description}
                </p>
              </div>

              <div className="flex-1 p-4 space-y-4 overflow-y-auto">
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

              <form
                onSubmit={sendMessage}
                className="bg-white border-t p-4 flex gap-3"
              >
                <input
                  className="flex-1 border rounded px-4 py-2"
                  placeholder="Type a message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
                <button className="bg-blue-600 text-white px-6 rounded">
                  Send
                </button>
              </form>
            </>
          ) : (
            <div className="p-6 text-gray-500">
              Create or select a ticket to start chatting
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
