import { useEffect, useMemo, useState } from "react";
import api from "@/api/client";
import { useAuth } from "../auth/AuthContext";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from "chart.js";
import { Doughnut, Bar } from "react-chartjs-2";

// Register ChartJS components
ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

/* ---------------- Components ---------------- */

function Navbar() {
  const { logout, user } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 p-1.5 rounded-lg">
            <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h1 className="font-bold text-xl text-gray-900 tracking-tight">Admin<span className="text-indigo-600">Portal</span></h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-sm font-semibold text-gray-900">{user?.username}</span>
            <span className="text-xs text-gray-500 font-medium bg-gray-100 px-2 py-0.5 rounded-full">Administrator</span>
          </div>
          <button
            onClick={logout}
            className="text-sm bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-red-600 hover:border-red-200 px-4 py-2 rounded-lg transition-all duration-200 font-medium shadow-sm"
          >
            Sign Out
          </button>
        </div>
      </div>
    </header>
  );
}

function StatCard({ label, value, icon, color }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex items-center justify-between hover:shadow-md transition-shadow duration-300">
      <div>
        <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
        <p className="text-3xl font-bold text-gray-900">{value}</p>
      </div>
      <div className={`p-3 rounded-lg ${color}`}>
        {icon}
      </div>
    </div>
  );
}

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
export default function AdminDashboard() {
  const [tickets, setTickets] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch initial data
  const loadData = async () => {
    try {
      const [ticketRes, agentRes] = await Promise.all([
        api.get("/api/tickets/"),
        api.get("/api/tickets/agents/"),
      ]);
      setTickets(ticketRes.data);
      setAgents(agentRes.data);
    } catch (error) {
      console.error("Failed to load dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Handle Assignment
  const handleAssign = async (ticketId, agentId) => {
    try {
      const payload = { assigned_to: agentId ? parseInt(agentId) : null };

      const res = await api.patch(`/api/tickets/${ticketId}/`, payload); // eslint-disable-line no-unused-vars

      // Update local state
      setTickets((prev) =>
        prev.map((t) =>
          t.id === ticketId
            ? {
              ...t,
              assigned_to: payload.assigned_to,
              assigned_to_username: agents.find(a => a.id === payload.assigned_to)?.username
            }
            : t
        )
      );
    } catch (error) {
      console.error("Failed to assign ticket:", error);
      alert("Failed to assign ticket");
    }
  };

  /* ---------------- Analytics Data ---------------- */
  const stats = useMemo(() => {
    const base = {
      total: tickets.length,
      OPEN: 0,
      IN_PROGRESS: 0,
      RESOLVED: 0,
      CLOSED: 0,
      categories: {},
    };

    tickets.forEach((t) => {
      base[t.status] = (base[t.status] || 0) + 1;
      base.categories[t.category] = (base.categories[t.category] || 0) + 1;
    });

    return base;
  }, [tickets]);

  const chartData = {
    doughnut: {
      labels: Object.keys(stats.categories),
      datasets: [
        {
          data: Object.values(stats.categories),
          backgroundColor: [
            "#6366f1", // Indigo
            "#ec4899", // Pink
            "#f59e0b", // Amber
            "#10b981", // Emerald
            "#8b5cf6", // Violet
            "#3b82f6", // Blue
          ],
          borderWidth: 0,
        },
      ],
    },
    bar: {
      labels: ["Open", "In Progress", "Resolved", "Closed"],
      datasets: [
        {
          label: "Tickets by Status",
          data: [stats.OPEN, stats.IN_PROGRESS, stats.RESOLVED, stats.CLOSED],
          backgroundColor: ["#f59e0b", "#3b82f6", "#10b981", "#6b7280"],
          borderRadius: 6,
        },
      ],
    },
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
          <p className="text-gray-500 mt-1">Welcome back! Here's what's happening today.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5 mb-8">
          <StatCard
            label="Total Tickets"
            value={stats.total}
            color="bg-indigo-50 text-indigo-600"
            icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
          />
          <StatCard
            label="Open"
            value={stats.OPEN}
            color="bg-yellow-50 text-yellow-600"
            icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
          />
          <StatCard
            label="In Progress"
            value={stats.IN_PROGRESS}
            color="bg-blue-50 text-blue-600"
            icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          />
          <StatCard
            label="Resolved"
            value={stats.RESOLVED}
            color="bg-green-50 text-green-600"
            icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
          />
          <StatCard
            label="Closed"
            value={stats.CLOSED}
            color="bg-gray-100 text-gray-600"
            icon={<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>}
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Category Breakdown */}
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm col-span-1">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Tickets by Category</h3>
            <div className="h-64 flex items-center justify-center">
              <Doughnut
                data={chartData.doughnut}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { position: 'bottom' }
                  }
                }}
              />
            </div>
          </div>

          {/* Status Breakdown Bar Chart */}
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm col-span-1 lg:col-span-2">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Ticket Status Overview</h3>
            <div className="h-64">
              <Bar
                data={chartData.bar}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: { legend: { display: false } },
                  scales: { y: { beginAtZero: true } }
                }}
              />
            </div>
          </div>
        </div>

        {/* Ticket Management Table */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Recent Tickets</h3>
              <p className="text-sm text-gray-500">Manage and assign tickets to agents</p>
            </div>
            {/* Optional: Add search/filter here later */}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-xs uppercase tracking-wider text-gray-500 font-semibold">
                  <th className="px-6 py-4">ID / Subject</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Priority</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Assignee</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {tickets.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-3">
                        <span className="text-xs font-mono text-gray-400 mt-1">#{t.id}</span>
                        <div>
                          <p className="font-medium text-gray-900 line-clamp-1">{t.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5">by {t.created_by}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-semibold ${t.priority === 'CRITICAL' || t.priority === 'HIGH' ? 'text-red-600' : 'text-gray-600'
                        }`}>
                        {t.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">
                        {t.category}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="relative">
                        <select
                          className="appearance-none bg-white border border-gray-200 text-gray-700 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block w-full p-2.5 pr-8 cursor-pointer hover:border-gray-300 transition-colors"
                          value={t.assigned_to || ""}
                          onChange={(e) => handleAssign(t.id, e.target.value)}
                        >
                          <option value="">Unassigned</option>
                          {agents.map((agent) => (
                            <option key={agent.id} value={agent.id}>
                              {agent.username}
                            </option>
                          ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                          <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}

                {tickets.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                      No tickets found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
