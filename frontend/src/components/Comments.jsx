import { useEffect, useState } from "react";
import api from "../api/axios";

export default function Comments({ ticketId }) {
  const [comments, setComments] = useState([]);
  const [message, setMessage] = useState("");

  const load = async () => {
    const res = await api.get("comments/");
    setComments(res.data.filter(c => c.ticket === ticketId));
  };

  useEffect(() => {
    load();
  }, []);

  const send = async () => {
    if (!message.trim()) return;
    await api.post("comments/", { ticket: ticketId, message });
    setMessage("");
    load();
  };

  return (
    <div className="pt-4 border-t">
      <h4 className="text-sm font-semibold mb-2 text-gray-700">
        💬 Conversation
      </h4>

      {comments.map(c => (
        <div
          key={c.id}
          className="bg-slate-50 p-3 rounded-lg mb-2"
        >
          <span className="text-indigo-600 font-semibold text-sm">
            {c.user.username}
          </span>
          <p className="text-sm text-gray-700">
            {c.message}
          </p>
        </div>
      ))}

      <textarea
        className="w-full border rounded-lg p-2 text-sm mt-2"
        rows={2}
        placeholder="Reply to support..."
        value={message}
        onChange={e => setMessage(e.target.value)}
      />

      <button
        onClick={send}
        className="mt-2 bg-indigo-600 text-white px-4 py-1 rounded-full text-sm hover:bg-indigo-700"
      >
        Send
      </button>
    </div>
  );
}
