import { useAuth } from "../auth/AuthContext";

export default function RoleBasedNavbar() {
  const { logout, user } = useAuth();

  const roleConfig = {
    customer: {
      title: "Customer",
      suffix: "Portal",
      color: "text-blue-600",
      bgColor: "bg-blue-600",
      badge: "bg-gray-100 text-gray-500",
      icon: (
        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
        </svg>
      )
    },
    agent: {
      title: "Agent",
      suffix: "Workspace",
      color: "text-purple-600",
      bgColor: "bg-purple-600",
      badge: "bg-gray-100 text-gray-500",
      icon: (
        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
      )
    },
    admin: {
      title: "Admin",
      suffix: "Portal",
      color: "text-indigo-600",
      bgColor: "bg-indigo-600",
      badge: "bg-gray-100 text-gray-500",
      icon: (
        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      )
    }
  };

  const config = roleConfig[user?.role] || roleConfig.customer;

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`${config.bgColor} p-1.5 rounded-lg`}>
            {config.icon}
          </div>
          <h1 className="font-bold text-xl text-gray-900 tracking-tight">
            {config.title}<span className={config.color}>{config.suffix}</span>
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-sm font-semibold text-gray-900">{user?.username}</span>
            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${config.badge}`}>
              {user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : ''}
            </span>
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
