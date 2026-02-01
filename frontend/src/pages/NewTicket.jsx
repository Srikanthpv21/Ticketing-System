import { useState } from "react";
import api from "../api/axios";

export default function NewTicket({ setPage }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const submit = async () => {
    await api.post("tickets/", { title, description });
    setPage("dashboard");
  };

  return (
    <div>
      <h2>New Ticket</h2>
      <input placeholder="Title" onChange={e => setTitle(e.target.value)} />
      <textarea placeholder="Description" onChange={e => setDescription(e.target.value)} />
      <button onClick={submit}>Create</button>
    </div>
  );
}
