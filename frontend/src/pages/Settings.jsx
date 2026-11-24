import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";
import { useAuth } from "../auth/useAuth";
import RoleBasedNavbar from "../components/RoleBasedNavbar";
import { ErrorBanner, SuccessBanner } from "../components/Badges";
import { Field, inputClass } from "../components/AuthShell";

const ROLE_LABELS = { customer: "Customer", agent: "Agent", admin: "Administrator" };
const HOME = { customer: "/customer", agent: "/agent", admin: "/admin" };

const readOnlyClass =
  "block w-full rounded-md border border-gray-200 bg-gray-100 px-3 py-2.5 text-sm text-gray-600 cursor-not-allowed";

const buttonClass =
  "rounded-md bg-blue-700 px-5 py-2 text-sm font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed";

const secondaryButtonClass =
  "rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60 disabled:cursor-not-allowed";

const dangerButtonClass =
  "rounded-md bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed";

function Section({ id, title, description, danger, children }) {
  return (
    <section
      id={id}
      className={`bg-white border rounded-lg scroll-mt-20 ${danger ? "border-red-200" : "border-gray-200"}`}
    >
      <div className={`px-6 py-5 border-b ${danger ? "border-red-200" : "border-gray-200"}`}>
        <h2 className={`text-base font-semibold ${danger ? "text-red-800" : "text-gray-900"}`}>{title}</h2>
        {description && <p className="text-sm text-gray-600 mt-1">{description}</p>}
      </div>
      {children}
    </section>
  );
}

function Footer({ children }) {
  return (
    <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end rounded-b-lg">
      {children}
    </div>
  );
}

// Pull a readable message out of a DRF error response.
function errorText(err, fallback) {
  const data = err.response?.data;
  if (err.response?.status === 429) return "Too many attempts. Please try again later.";
  if (!data || typeof data !== "object") return fallback;
  const first = Object.values(data)[0];
  return (Array.isArray(first) ? first.join(" ") : String(first)) || fallback;
}

/* ---------------------------------------------------------------- Profile */
function ProfileForm() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({
    first_name: user.first_name || "",
    last_name: user.last_name || "",
    email: user.email || "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const update = (key) => (e) => {
    setForm({ ...form, [key]: e.target.value });
    setSaved(false);
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setSaved(false);
    setSaving(true);
    try {
      const res = await api.patch("/auth/me/", form);
      updateUser(res.data);
      setSaved(true);
    } catch (err) {
      setError(errorText(err, "Could not save your changes."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Section id="profile" title="Profile" description="Your contact details. Support replies and password resets are sent to your email.">
      <form onSubmit={submit}>
        <div className="px-6 py-6 space-y-5">
          {error && <ErrorBanner message={error} />}
          {saved && <SuccessBanner message="Your profile has been updated." />}

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Username" id="username">
              <input id="username" value={user.username} disabled className={readOnlyClass} />
            </Field>
            <Field label="Account type" id="role">
              <input id="role" value={ROLE_LABELS[user.role] || user.role} disabled className={readOnlyClass} />
            </Field>
            <Field label="First name" id="first_name">
              <input id="first_name" autoComplete="given-name" value={form.first_name} onChange={update("first_name")} maxLength={150} className={inputClass} />
            </Field>
            <Field label="Last name" id="last_name">
              <input id="last_name" autoComplete="family-name" value={form.last_name} onChange={update("last_name")} maxLength={150} className={inputClass} />
            </Field>
          </div>

          <Field label="Email address" id="email">
            <input id="email" type="email" required autoComplete="email" value={form.email} onChange={update("email")} className={inputClass} />
          </Field>
        </div>

        <Footer>
          <button type="submit" disabled={saving} className={buttonClass}>
            {saving ? "Saving…" : "Save changes"}
          </button>
        </Footer>
      </form>
    </Section>
  );
}

/* ---------------------------------------------------------- Notifications */
const NOTIFICATION_OPTIONS = {
  customer: [
    { key: "email_on_reply", label: "Replies from support", text: "Email me when an agent replies to my ticket." },
    { key: "email_on_status", label: "Status changes", text: "Email me when my ticket is moved to In progress, Resolved or Closed." },
  ],
  agent: [
    { key: "email_on_reply", label: "Customer replies", text: "Email me when a customer replies to one of my tickets." },
    { key: "email_on_assignment", label: "New assignments", text: "Email me when a ticket is assigned to me." },
  ],
  admin: [],
};

function NotificationsForm() {
  const { user, updateUser } = useAuth();
  const options = NOTIFICATION_OPTIONS[user.role] || [];

  const [prefs, setPrefs] = useState(
    Object.fromEntries(options.map((o) => [o.key, Boolean(user[o.key])]))
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setSaved(false);
    setSaving(true);
    try {
      const res = await api.patch("/auth/me/", prefs);
      updateUser(res.data);
      setSaved(true);
    } catch (err) {
      setError(errorText(err, "Could not save your preferences."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Section id="notifications" title="Email notifications" description="Choose which emails you receive. They are sent to the address on your profile.">
      {options.length === 0 ? (
        <p className="px-6 py-6 text-sm text-gray-600">
          Administrator accounts do not receive ticket notification emails.
        </p>
      ) : (
        <form onSubmit={submit}>
          <div className="px-6 py-2 divide-y divide-gray-100">
            {error && <div className="py-4"><ErrorBanner message={error} /></div>}
            {saved && <div className="py-4"><SuccessBanner message="Your notification preferences have been saved." /></div>}

            {options.map((o) => (
              <label key={o.key} htmlFor={o.key} className="flex items-start gap-3 py-4 cursor-pointer">
                <input
                  id={o.key}
                  type="checkbox"
                  checked={prefs[o.key]}
                  onChange={(e) => {
                    setPrefs({ ...prefs, [o.key]: e.target.checked });
                    setSaved(false);
                  }}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-700 focus:ring-blue-600"
                />
                <span>
                  <span className="block text-sm font-medium text-gray-900">{o.label}</span>
                  <span className="block text-sm text-gray-600">{o.text}</span>
                </span>
              </label>
            ))}
          </div>

          <Footer>
            <button type="submit" disabled={saving} className={buttonClass}>
              {saving ? "Saving…" : "Save preferences"}
            </button>
          </Footer>
        </form>
      )}
    </Section>
  );
}

/* --------------------------------------------------------------- Security */
function PasswordForm() {
  const [form, setForm] = useState({ current: "", next: "", confirm: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  const update = (key) => (e) => {
    setForm({ ...form, [key]: e.target.value });
    setSaved(false);
  };

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setSaved(false);

    if (form.next !== form.confirm) {
      setError("The new passwords do not match.");
      return;
    }

    setSaving(true);
    try {
      const res = await api.post("/auth/change-password/", {
        current_password: form.current,
        new_password: form.next,
      });
      // Other devices are signed out; keep this one signed in.
      if (res.data.access) localStorage.setItem("access_token", res.data.access);
      if (res.data.refresh) localStorage.setItem("refresh_token", res.data.refresh);
      setForm({ current: "", next: "", confirm: "" });
      setSaved(true);
    } catch (err) {
      setError(errorText(err, "Could not change your password."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Section id="password" title="Password" description="Choose a strong password you do not use elsewhere. Changing it signs you out on your other devices.">
      <form onSubmit={submit}>
        <div className="px-6 py-6 space-y-5">
          {error && <ErrorBanner message={error} />}
          {saved && <SuccessBanner message="Your password has been changed." />}

          <div className="max-w-sm space-y-5">
            <Field label="Current password" id="current">
              <input id="current" type="password" required autoComplete="current-password" value={form.current} onChange={update("current")} className={inputClass} />
            </Field>
            <Field label="New password" id="next" hint="At least 8 characters. Avoid common or all-numeric passwords.">
              <input id="next" type="password" required minLength={8} autoComplete="new-password" value={form.next} onChange={update("next")} className={inputClass} />
            </Field>
            <Field label="Confirm new password" id="confirm">
              <input id="confirm" type="password" required minLength={8} autoComplete="new-password" value={form.confirm} onChange={update("confirm")} className={inputClass} />
            </Field>
          </div>
        </div>

        <Footer>
          <button type="submit" disabled={saving} className={buttonClass}>
            {saving ? "Updating…" : "Update password"}
          </button>
        </Footer>
      </form>
    </Section>
  );
}

function SessionsSection() {
  const { logout } = useAuth();
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");

  const signOutEverywhere = async () => {
    if (!window.confirm("Sign out of HelpDesk on all devices, including this one?")) return;
    setError("");
    setWorking(true);
    try {
      await api.post("/auth/sign-out-everywhere/");
      logout();
    } catch (err) {
      setError(errorText(err, "Could not sign you out. Please try again."));
      setWorking(false);
    }
  };

  return (
    <Section id="sessions" title="Sessions" description="If you used a shared or public computer, or think someone else has access to your account, sign out everywhere.">
      <div className="px-6 py-6 space-y-4">
        {error && <ErrorBanner message={error} />}
        <p className="text-sm text-gray-600">
          This signs you out on every device immediately, including this one.
          You will need to sign in again.
        </p>
      </div>
      <Footer>
        <button type="button" onClick={signOutEverywhere} disabled={working} className={secondaryButtonClass}>
          {working ? "Signing out…" : "Sign out on all devices"}
        </button>
      </Footer>
    </Section>
  );
}

/* ---------------------------------------------------------------- Account */
function CloseAccountSection() {
  const { user, logout } = useAuth();
  const [confirming, setConfirming] = useState(false);
  const [password, setPassword] = useState("");
  const [working, setWorking] = useState(false);
  const [error, setError] = useState("");

  if (user.role !== "customer") {
    return (
      <Section id="account" title="Close account" description="Agent and administrator accounts are managed by an administrator.">
        <p className="px-6 py-6 text-sm text-gray-600">
          To close or change your account, contact your administrator.
        </p>
      </Section>
    );
  }

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setWorking(true);
    try {
      await api.post("/auth/close-account/", { current_password: password });
      logout();
    } catch (err) {
      setError(errorText(err, "Could not close your account."));
      setWorking(false);
    }
  };

  return (
    <Section id="account" danger title="Close account" description="Deactivate your account and sign out everywhere.">
      <div className="px-6 py-6 space-y-4">
        <p className="text-sm text-gray-700">
          You will no longer be able to sign in. Your tickets and their history
          are kept by our support team. To reopen your account, contact support.
        </p>

        {confirming && (
          <form onSubmit={submit} className="space-y-4 max-w-sm">
            {error && <ErrorBanner message={error} />}
            <Field label="Enter your password to confirm" id="close-password">
              <input
                id="close-password"
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
              />
            </Field>
            <div className="flex gap-3">
              <button type="submit" disabled={working} className={dangerButtonClass}>
                {working ? "Closing…" : "Close my account"}
              </button>
              <button
                type="button"
                onClick={() => { setConfirming(false); setPassword(""); setError(""); }}
                className={secondaryButtonClass}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {!confirming && (
        <Footer>
          <button type="button" onClick={() => setConfirming(true)} className={dangerButtonClass}>
            Close account…
          </button>
        </Footer>
      )}
    </Section>
  );
}

/* ------------------------------------------------------------------- Page */
const NAV = [
  { id: "profile", label: "Profile", Component: ProfileForm },
  { id: "notifications", label: "Email notifications", Component: NotificationsForm },
  { id: "password", label: "Password", Component: PasswordForm },
  { id: "sessions", label: "Sessions", Component: SessionsSection },
  { id: "account", label: "Close account", Component: CloseAccountSection },
];

const initialSection = () => {
  const hash = window.location.hash.replace("#", "");
  return NAV.some((n) => n.id === hash) ? hash : "profile";
};

export default function Settings() {
  const { user } = useAuth();
  const [activeId, setActiveId] = useState(initialSection);
  const Active = (NAV.find((n) => n.id === activeId) || NAV[0]).Component;

  const select = (id) => {
    setActiveId(id);
    window.history.replaceState(null, "", `#${id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
      <RoleBasedNavbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link to={HOME[user.role] || "/login"} className="text-sm font-medium text-blue-700 hover:underline">
          ← Back to dashboard
        </Link>
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900 mt-3">Account settings</h1>
        <p className="text-sm text-gray-600 mt-1">Manage your profile, notifications and security.</p>

        <div className="mt-8 lg:grid lg:grid-cols-[200px_1fr] lg:gap-10">
          <nav aria-label="Settings sections" className="mb-6 lg:mb-0">
            <ul className="no-scrollbar flex gap-1 overflow-x-auto border-b border-gray-200 lg:block lg:space-y-1 lg:border-0 lg:overflow-visible">
              {NAV.map((item) => {
                const current = item.id === activeId;
                return (
                  <li key={item.id} className="shrink-0">
                    <button
                      type="button"
                      onClick={() => select(item.id)}
                      aria-current={current ? "page" : undefined}
                      className={`w-full text-left whitespace-nowrap px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                        current
                          ? "bg-white text-blue-700 border border-gray-200 lg:border-gray-200"
                          : "text-gray-700 hover:bg-gray-100 hover:text-gray-900 border border-transparent"
                      }`}
                    >
                      {item.label}
                    </button>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div key={activeId}>
            <Active />
          </div>
        </div>
      </main>
    </div>
  );
}
