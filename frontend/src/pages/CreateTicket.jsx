import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Topbar from "../components/Topbar";
import api from "../api/axios";

export default function CreateTicket() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const navigate = useNavigate();

  const submit = async () => {
    await api.post("tickets/", {
      title,
      description,
      priority: "MEDIUM",
      status: "OPEN",
    });
    navigate("/");
  };

  return (
    <div className="flex">
      <Sidebar navigate={navigate} onLogout={() => {
        localStorage.clear(); window.location.reload();
      }} />

      <div className="flex-1">
        <Topbar title="Create Ticket" />

        <div className="p-8 max-w-xl">
          <div className="bg-white rounded-xl shadow p-6 space-y-4">
            <input
              className="w-full border p-2 rounded"
              placeholder="Subject"
              onChange={e => setTitle(e.target.value)}
            />

            <textarea
              className="w-full border p-2 rounded"
              rows={5}
              placeholder="Describe your issue"
              onChange={e => setDescription(e.target.value)}
            />

            <button
              onClick={submit}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg"
            >
              Submit Ticket
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
