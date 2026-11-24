const CATEGORY_LABELS = {
  LOGIN: "Login",
  PAYMENT: "Payment",
  BUG: "Bug",
  FEATURE: "Feature",
  OTHER: "Other",
};

const STATUS_LABELS = {
  OPEN: "Open",
  IN_PROGRESS: "In progress",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
};

const STATUS_DOTS = {
  OPEN: "bg-amber-500",
  IN_PROGRESS: "bg-blue-600",
  RESOLVED: "bg-green-600",
  CLOSED: "bg-gray-400",
};

// Plain text with a small status dot. No pill, no ring.
export function StatusBadge({ status }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-700 whitespace-nowrap">
      <span
        aria-hidden="true"
        className={`h-2 w-2 rounded-full ${STATUS_DOTS[status] || STATUS_DOTS.CLOSED}`}
      />
      {STATUS_LABELS[status] || String(status)}
    </span>
  );
}

// Plain gray text.
export function CategoryBadge({ category }) {
  if (!category) return null;
  return (
    <span className="text-xs text-gray-500 whitespace-nowrap">
      {CATEGORY_LABELS[category] || category}
    </span>
  );
}

export function SuccessBanner({ message }) {
  if (!message) return null;
  return (
    <div
      role="status"
      className="rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-800"
    >
      {message}
    </div>
  );
}

export function ErrorBanner({ message, onDismiss }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="flex items-start justify-between gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700"
    >
      <span>{message}</span>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="text-red-700 underline hover:text-red-900 shrink-0"
        >
          Dismiss
        </button>
      )}
    </div>
  );
}
