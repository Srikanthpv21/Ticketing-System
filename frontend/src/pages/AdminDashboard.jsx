import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import api from "@/api/client";
import { StatusBadge, CategoryBadge, ErrorBanner } from "../components/Badges";
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

import RoleBasedNavbar from "../components/RoleBasedNavbar";
import CountUp from "../components/CountUp";
import AnimatedBar from "../components/AnimatedBar";
import { displayName } from "../utils/format";

const PAGE_SIZE = 10;

const STATUS_OPTIONS = [
  { value: "OPEN", label: "Open" },
  { value: "IN_PROGRESS", label: "In progress" },
  { value: "RESOLVED", label: "Resolved" },
  { value: "CLOSED", label: "Closed" },
];

const CATEGORY_OPTIONS = [
  { value: "LOGIN", label: "Login" },
  { value: "PAYMENT", label: "Payment" },
  { value: "BUG", label: "Bug" },
  { value: "FEATURE", label: "Feature" },
  { value: "OTHER", label: "Other" },
];

const PRIORITY_OPTIONS = [
  { value: "HIGH", label: "High" },
  { value: "MEDIUM", label: "Medium" },
  { value: "LOW", label: "Low" },
];

const PRIORITY_RANK = { HIGH: 3, MEDIUM: 2, LOW: 1 };

const selectClass =
  "border border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:bg-white focus:ring-blue-500 focus:border-blue-500";

const delay = (ms) => ({ animationDelay: `${ms}ms` });

const chartAnimation = { duration: 900, easing: "easeOutQuart" };

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

function StatCard({ label, value, className = "", active = false, onClick, style }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      style={style}
      className={`reveal text-left bg-white rounded-lg border p-4 sm:p-5 transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-md active:translate-y-0 active:shadow-none ${
        active ? "border-blue-600 ring-1 ring-blue-600" : "border-gray-200 hover:border-gray-300"
      } ${className}`}
    >
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-2xl font-semibold text-gray-900 mt-1 tabular-nums">
        <CountUp value={value} />
      </p>
    </button>
  );
}

// Placeholder shown while the first load is in flight
function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <RoleBasedNavbar />
      <main className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-8" aria-busy="true">
        <div className="skeleton h-7 w-56 mb-2" />
        <div className="skeleton h-4 w-44 mb-8" />
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-8">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className={`bg-white rounded-lg border border-gray-200 p-5 ${i === 0 ? "col-span-2 lg:col-span-1" : ""}`}>
              <div className="skeleton h-4 w-20 mb-3" />
              <div className="skeleton h-7 w-12" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {[0, 1, 2].map((i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="skeleton h-5 w-40 mb-5" />
              <div className="skeleton h-48 w-full" />
            </div>
          ))}
        </div>
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
          <div className="skeleton h-5 w-32" />
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="skeleton h-10 w-full" />
          ))}
        </div>
      </main>
    </div>
  );
}

/* ---------------- Dashboard ---------------- */
export default function AdminDashboard() {
  const [tickets, setTickets] = useState([]);
  const [agents, setAgents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [error, setError] = useState("");

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [assigneeFilter, setAssigneeFilter] = useState("ALL"); // ALL | UNASSIGNED | <agent id>
  const [sort, setSort] = useState("new");
  const [page, setPage] = useState(1);

  const tableRef = useRef(null);

  // Fetch data (used on first load and by Refresh)
  const loadData = useCallback(async () => {
    try {
      const [ticketRes, agentRes] = await Promise.all([
        api.get("/api/tickets/"),
        api.get("/api/tickets/agents/"),
      ]);
      setTickets(ticketRes.data);
      setAgents(agentRes.data);
      setUpdatedAt(new Date());
      setError("");
    } catch (err) {
      console.error("Failed to load dashboard data:", err);
      setError("Could not load dashboard data. Is the backend running?");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const refresh = () => {
    setRefreshing(true);
    loadData();
  };

  // Filter setters also return to page 1
  const withReset = (setter) => (value) => {
    setter(value);
    setPage(1);
  };
  const changeQuery = withReset(setQuery);
  const changeStatus = withReset(setStatusFilter);
  const changeCategory = withReset(setCategoryFilter);
  const changePriority = withReset(setPriorityFilter);
  const changeAssignee = withReset(setAssigneeFilter);
  const changeSort = withReset(setSort);

  const filtersActive =
    query.trim() !== "" ||
    statusFilter !== "ALL" ||
    categoryFilter !== "ALL" ||
    priorityFilter !== "ALL" ||
    assigneeFilter !== "ALL";

  const clearFilters = () => {
    setQuery("");
    setStatusFilter("ALL");
    setCategoryFilter("ALL");
    setPriorityFilter("ALL");
    setAssigneeFilter("ALL");
    setPage(1);
  };

  const showStatus = (value) => {
    changeStatus(statusFilter === value ? "ALL" : value);
    tableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const showAssignee = (value) => {
    changeAssignee(assigneeFilter === value ? "ALL" : value);
    tableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Handle Assignment
  const handleAssign = async (ticketId, agentId) => {
    try {
      const payload = { assigned_to: agentId ? parseInt(agentId) : null };

      await api.patch(`/api/tickets/${ticketId}/`, payload);

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
    } catch (err) {
      console.error("Failed to assign ticket:", err);
      setError("Could not assign the ticket. Please try again.");
    }
  };

  const renderAssignee = (t) => (
    <div className="relative">
      <select
        aria-label={`Assignee for ticket ${t.id}`}
        className="appearance-none bg-gray-50 border border-gray-300 text-gray-700 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 pr-8 cursor-pointer hover:border-gray-300 transition-colors"
        value={t.assigned_to || ""}
        onChange={(e) => handleAssign(t.id, e.target.value)}
      >
        <option value="">Unassigned</option>
        {agents.map((agent) => (
          <option key={agent.id} value={agent.id}>
            {displayName(agent.username)}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
      </div>
    </div>
  );

  const priorityClass = (priority) =>
    priority === "CRITICAL" || priority === "HIGH" ? "text-red-600" : "text-gray-600";

  /* ---------------- Filtering, sorting, paging ---------------- */
  const filteredTickets = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = tickets.filter((t) => {
      if (statusFilter !== "ALL" && t.status !== statusFilter) return false;
      if (categoryFilter !== "ALL" && t.category !== categoryFilter) return false;
      if (priorityFilter !== "ALL" && t.priority !== priorityFilter) return false;
      if (assigneeFilter === "UNASSIGNED" && t.assigned_to) return false;
      if (assigneeFilter !== "ALL" && assigneeFilter !== "UNASSIGNED" && String(t.assigned_to) !== assigneeFilter) return false;
      if (!q) return true;
      return (
        t.title.toLowerCase().includes(q) ||
        String(t.id) === q.replace("#", "") ||
        String(t.created_by).toLowerCase().includes(q)
      );
    });

    const byDate = (a, b) => new Date(b.created_at) - new Date(a.created_at);
    list.sort((a, b) => {
      if (sort === "old") return -byDate(a, b);
      if (sort === "priority") {
        return (PRIORITY_RANK[b.priority] || 0) - (PRIORITY_RANK[a.priority] || 0) || byDate(a, b);
      }
      return byDate(a, b);
    });
    return list;
  }, [tickets, query, statusFilter, categoryFilter, priorityFilter, assigneeFilter, sort]);

  const totalPages = Math.max(1, Math.ceil(filteredTickets.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageStart = (currentPage - 1) * PAGE_SIZE;
  const pageTickets = filteredTickets.slice(pageStart, pageStart + PAGE_SIZE);
  // Changing this remounts the rows so they ease in again
  const rowsKey = [currentPage, statusFilter, categoryFilter, priorityFilter, assigneeFilter, sort].join("|");

  /* ---------------- Analytics ---------------- */
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

  // Active (open or in progress) tickets per agent, plus unassigned
  const workload = useMemo(() => {
    const isActive = (t) => t.status === "OPEN" || t.status === "IN_PROGRESS";
    const rows = agents.map((a) => ({
      key: String(a.id),
      name: displayName(a.username),
      active: tickets.filter((t) => t.assigned_to === a.id && isActive(t)).length,
      total: tickets.filter((t) => t.assigned_to === a.id).length,
    }));
    rows.sort((a, b) => b.active - a.active);
    const unassigned = tickets.filter((t) => !t.assigned_to && isActive(t)).length;
    const max = Math.max(1, unassigned, ...rows.map((r) => r.active));
    return { rows, unassigned, max };
  }, [agents, tickets]);

  const chartData = {
    doughnut: {
      labels: Object.keys(stats.categories),
      datasets: [
        {
          data: Object.values(stats.categories),
          backgroundColor: [
            "#1d4ed8",
            "#3b82f6",
            "#93c5fd",
            "#64748b",
            "#cbd5e1",
            "#0f172a",
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
          backgroundColor: ["#ca8a04", "#2563eb", "#16a34a", "#6b7280"],
          borderRadius: 6,
        },
      ],
    },
  };

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <RoleBasedNavbar />

      <main className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {error && (
          <div className="mb-6">
            <ErrorBanner message={error} onDismiss={() => setError("")} />
          </div>
        )}

        {/* Header */}
        <div className="reveal mb-8 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Dashboard Overview</h2>
            <p className="text-gray-500 mt-1">All tickets across the system.</p>
          </div>
          <div className="flex items-center gap-3">
            {updatedAt && (
              <span className="text-xs text-gray-500">
                Updated {updatedAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            )}
            <button
              type="button"
              onClick={refresh}
              disabled={refreshing}
              className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 active:bg-gray-100 disabled:opacity-60"
            >
              <svg
                className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h5M20 20v-5h-5M5.6 15A8 8 0 0018.4 9M18.4 9L20 9M5.6 15L4 15" />
              </svg>
              {refreshing ? "Refreshing" : "Refresh"}
            </button>
          </div>
        </div>

        {/* Stats Grid: click a card to filter the list */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-8">
          <StatCard
            label="Total Tickets"
            value={stats.total}
            className="col-span-2 lg:col-span-1"
            active={statusFilter === "ALL" && !filtersActive}
            onClick={clearFilters}
            style={delay(60)}
          />
          {STATUS_OPTIONS.map((s, i) => (
            <StatCard
              key={s.value}
              label={s.label}
              value={stats[s.value]}
              active={statusFilter === s.value}
              onClick={() => showStatus(s.value)}
              style={delay(120 + i * 60)}
            />
          ))}
        </div>

        {/* Charts + workload */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Category Breakdown */}
          <div className="reveal bg-white p-6 rounded-lg border border-gray-200" style={delay(360)}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Tickets by Category</h3>
            <div className="h-64 flex items-center justify-center">
              <Doughnut
                data={chartData.doughnut}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  animation: chartAnimation,
                  plugins: {
                    legend: { position: 'bottom' }
                  }
                }}
              />
            </div>
          </div>

          {/* Status Breakdown Bar Chart */}
          <div className="reveal bg-white p-6 rounded-lg border border-gray-200" style={delay(430)}>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Ticket Status Overview</h3>
            <div className="h-64">
              <Bar
                data={chartData.bar}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  animation: chartAnimation,
                  plugins: { legend: { display: false } },
                  scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
                }}
              />
            </div>
          </div>

          {/* Team workload */}
          <div className="reveal bg-white p-6 rounded-lg border border-gray-200" style={delay(500)}>
            <h3 className="text-lg font-semibold text-gray-900">Team workload</h3>
            <p className="text-sm text-gray-500 mt-1 mb-4">Open and in-progress tickets per agent. Select a row to filter the list.</p>

            <ul className="-mx-2 space-y-1 max-h-64 overflow-y-auto custom-scrollbar">
              {workload.rows.map((r) => (
                <li key={r.key}>
                  <button
                    type="button"
                    onClick={() => showAssignee(r.key)}
                    aria-pressed={assigneeFilter === r.key}
                    className={`w-full text-left rounded-md p-2 transition-colors duration-150 hover:bg-gray-50 ${assigneeFilter === r.key ? "bg-gray-50" : ""}`}
                  >
                    <div className="flex items-baseline justify-between text-sm">
                      <span className="font-medium text-gray-900">{r.name}</span>
                      <span className="text-gray-500">{r.active} active · {r.total} total</span>
                    </div>
                    <AnimatedBar percent={(r.active / workload.max) * 100} />
                  </button>
                </li>
              ))}

              <li>
                <button
                  type="button"
                  onClick={() => showAssignee("UNASSIGNED")}
                  aria-pressed={assigneeFilter === "UNASSIGNED"}
                  className={`w-full text-left rounded-md p-2 transition-colors duration-150 hover:bg-gray-50 ${assigneeFilter === "UNASSIGNED" ? "bg-gray-50" : ""}`}
                >
                  <div className="flex items-baseline justify-between text-sm">
                    <span className="font-medium text-gray-900">Unassigned</span>
                    <span className="text-gray-500">{workload.unassigned} active</span>
                  </div>
                  <AnimatedBar percent={(workload.unassigned / workload.max) * 100} fillClass="bg-amber-500" />
                </button>
              </li>
            </ul>

            {agents.length === 0 && (
              <p className="text-sm text-gray-500 mt-4">No agents yet. Create agent accounts in the Django admin.</p>
            )}
          </div>
        </div>

        {/* Ticket Management Table */}
        <div ref={tableRef} className="reveal bg-white rounded-lg border border-gray-200 overflow-hidden scroll-mt-20" style={delay(570)}>
          <div className="p-6 border-b border-gray-200 space-y-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Tickets <span className="text-sm font-normal text-gray-400">({filteredTickets.length})</span></h3>
                <p className="text-sm text-gray-500">Manage and assign tickets to agents</p>
              </div>
              {filtersActive && (
                <button type="button" onClick={clearFilters} className="text-sm font-medium text-blue-700 hover:underline">
                  Clear filters
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <input
                type="search"
                aria-label="Search tickets"
                placeholder="Search title, #id or customer"
                value={query}
                onChange={(e) => changeQuery(e.target.value)}
                className="w-full sm:w-64 border border-gray-300 bg-gray-50 focus:bg-white rounded-lg px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
              />
              <select aria-label="Filter by status" value={statusFilter} onChange={(e) => changeStatus(e.target.value)} className={selectClass}>
                <option value="ALL">All statuses</option>
                {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <select aria-label="Filter by category" value={categoryFilter} onChange={(e) => changeCategory(e.target.value)} className={selectClass}>
                <option value="ALL">All categories</option>
                {CATEGORY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <select aria-label="Filter by priority" value={priorityFilter} onChange={(e) => changePriority(e.target.value)} className={selectClass}>
                <option value="ALL">All priorities</option>
                {PRIORITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <select aria-label="Filter by assignee" value={assigneeFilter} onChange={(e) => changeAssignee(e.target.value)} className={selectClass}>
                <option value="ALL">All assignees</option>
                <option value="UNASSIGNED">Unassigned</option>
                {agents.map((a) => <option key={a.id} value={String(a.id)}>{displayName(a.username)}</option>)}
              </select>
              <select aria-label="Sort tickets" value={sort} onChange={(e) => changeSort(e.target.value)} className={`${selectClass} sm:ml-auto`}>
                <option value="new">Newest first</option>
                <option value="old">Oldest first</option>
                <option value="priority">Highest priority</option>
              </select>
            </div>
          </div>

          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500 font-semibold">
                  <th className="px-6 py-4">ID / Subject</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Priority</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Created</th>
                  <th className="px-6 py-4">Assignee</th>
                </tr>
              </thead>
              <tbody key={rowsKey} className="divide-y divide-gray-100">
                {pageTickets.map((t, i) => (
                  <tr key={t.id} style={delay(i * 30)} className="reveal hover:bg-gray-50 transition-colors duration-150">
                    <td className="px-6 py-4">
                      <div className="flex items-start gap-3">
                        <span className="text-xs font-mono text-gray-400 mt-1">#{t.id}</span>
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900 line-clamp-1">{t.title}</p>
                          <p className="text-xs text-gray-500 mt-0.5">by {displayName(t.created_by)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-semibold ${priorityClass(t.priority)}`}>
                        {t.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <CategoryBadge category={t.category} />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600 whitespace-nowrap">
                      {formatDate(t.created_at)}
                    </td>
                    <td className="px-6 py-4 min-w-[11rem]">
                      {renderAssignee(t)}
                    </td>
                  </tr>
                ))}

                {pageTickets.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                      {tickets.length === 0 ? "No tickets yet." : "No tickets match your filters."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Phones: stacked cards instead of a wide table */}
          <ul key={rowsKey} className="md:hidden divide-y divide-gray-100">
            {pageTickets.map((t, i) => (
              <li key={t.id} style={delay(i * 30)} className="reveal p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <span className="text-xs font-mono text-gray-400 mt-1">#{t.id}</span>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 [overflow-wrap:anywhere]">{t.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">by {displayName(t.created_by)} · {formatDate(t.created_at)}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <StatusBadge status={t.status} />
                  <CategoryBadge category={t.category} />
                  <span className={`text-xs font-semibold ${priorityClass(t.priority)}`}>{t.priority}</span>
                </div>
                {renderAssignee(t)}
              </li>
            ))}
            {pageTickets.length === 0 && (
              <li className="px-4 py-10 text-center text-sm text-gray-500">
                {tickets.length === 0 ? "No tickets yet." : "No tickets match your filters."}
              </li>
            )}
          </ul>

          {/* Pagination */}
          {filteredTickets.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-gray-600">
                Showing {pageStart + 1}–{Math.min(pageStart + PAGE_SIZE, filteredTickets.length)} of {filteredTickets.length}
              </p>
              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 active:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-600">Page {currentPage} of {totalPages}</span>
                  <button
                    type="button"
                    onClick={() => setPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 active:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
