import { APP_NAME, SUPPORT_EMAIL } from "../config";

const FEATURES = [
  {
    title: "Raise a request in minutes",
    text: "Describe the issue once. It is categorised and routed to a support agent automatically.",
  },
  {
    title: "Track every ticket",
    text: "Follow each request from Open to Closed and see who is handling it.",
  },
  {
    title: "Talk to support on the ticket",
    text: "Reply directly in the conversation, with the full history kept in one place.",
  },
];

function Check() {
  return (
    <svg className="w-5 h-5 mt-0.5 shrink-0 text-blue-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      <path fillRule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-7.5 7.5a1 1 0 01-1.4 0L3.3 9.7a1 1 0 111.4-1.4l3.8 3.8 6.8-6.8a1 1 0 011.4 0z" clipRule="evenodd" />
    </svg>
  );
}

export function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2 font-sans text-gray-900">
      {/* Brand panel */}
      <aside className="hidden lg:flex flex-col justify-between bg-slate-900 text-white px-14 py-12">
        <p className="text-lg font-semibold tracking-tight">{APP_NAME}</p>

        <div className="max-w-md">
          <h2 className="text-3xl font-semibold leading-tight tracking-tight">
            Customer support, all in one place.
          </h2>
          <p className="mt-4 text-slate-300 leading-relaxed">
            {APP_NAME} is the support portal where you submit requests, follow
            their progress and get answers from our team.
          </p>

          <ul className="mt-10 space-y-6">
            {FEATURES.map((f) => (
              <li key={f.title} className="flex gap-3">
                <Check />
                <div>
                  <p className="font-medium">{f.title}</p>
                  <p className="text-sm text-slate-400 mt-0.5 leading-relaxed">{f.text}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="text-sm text-slate-400">
          {SUPPORT_EMAIL ? (
            <>
              Need help signing in?{" "}
              <a href={`mailto:${SUPPORT_EMAIL}`} className="text-slate-200 hover:underline">
                {SUPPORT_EMAIL}
              </a>
            </>
          ) : (
            <>&nbsp;</>
          )}
        </p>
      </aside>

      {/* Form panel */}
      <main className="flex flex-col justify-center bg-white px-6 py-12 sm:px-12">
        <div className="w-full max-w-sm mx-auto">
          <div className="lg:hidden mb-8">
            <p className="text-lg font-semibold tracking-tight">{APP_NAME}</p>
            <p className="text-sm text-gray-600 mt-1">
              Submit requests and get answers from our support team.
            </p>
          </div>

          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">{title}</h1>
          {subtitle && <p className="text-sm text-gray-600 mt-2">{subtitle}</p>}

          <div className="mt-8">{children}</div>

          {footer && <p className="text-sm text-gray-600 mt-8">{footer}</p>}
        </div>
      </main>
    </div>
  );
}

export function Field({ label, id, children, hint }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-gray-500 mt-1.5">{hint}</p>}
    </div>
  );
}

export const inputClass =
  "block w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600";

export const primaryButtonClass =
  "w-full rounded-md bg-blue-700 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed";
