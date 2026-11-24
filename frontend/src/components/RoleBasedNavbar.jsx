import { Link } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import { displayName } from "../utils/format";
import { APP_NAME } from "../config";

const ROLE_LABELS = {
  customer: "Customer",
  agent: "Agent",
  admin: "Administrator",
};

export default function RoleBasedNavbar() {
  const { logout, user } = useAuth();

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        <div className="flex items-baseline gap-3">
          <span className="font-semibold text-gray-900 tracking-tight">{APP_NAME}</span>
          <span className="hidden sm:inline text-sm text-gray-500">
            {ROLE_LABELS[user?.role] || ""}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <span className="hidden sm:inline text-sm text-gray-700">{displayName(user?.username)}</span>
          <Link to="/settings" className="text-sm font-medium text-gray-700 hover:text-blue-700">
            Settings
          </Link>
          <button
            onClick={logout}
            className="text-sm font-medium text-gray-700 border border-gray-300 rounded-md px-3 py-1.5 hover:bg-gray-50"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
