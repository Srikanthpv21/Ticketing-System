export default function TicketCard({ ticket }) {
  const statusColor = {
    OPEN: "bg-yellow-100 text-yellow-800",
    IN_PROGRESS: "bg-blue-100 text-blue-800",
    RESOLVED: "bg-green-100 text-green-800",
    CLOSED: "bg-slate-200 text-slate-700",
  };

  return (
    <div className="bg-white rounded-xl shadow p-6 hover:shadow-lg transition">
      <div className="flex justify-between items-start">
        <h3 className="text-lg font-semibold">{ticket.title}</h3>
        <span
          className={`text-xs px-3 py-1 rounded-full ${statusColor[ticket.status]}`}
        >
          {ticket.status}
        </span>
      </div>

      <p className="text-slate-600 mt-2 text-sm">
        {ticket.description}
      </p>

      <div className="flex justify-between items-center mt-4 text-xs text-slate-500">
        <span>📂 {ticket.category}</span>
        <span>⚡ {ticket.priority}</span>
      </div>
    </div>
  );
}
