import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../api/client";
import {
  AuthShell,
  Field,
  inputClass,
  primaryButtonClass,
} from "../components/AuthShell";
import { ErrorBanner } from "../components/Badges";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await api.post("/auth/password-reset/", { email });
      setSent(true);
    } catch (err) {
      setError(
        err.response?.status === 429
          ? "Too many requests. Please try again later."
          : err.response?.data?.email?.[0] || "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const back = (
    <Link to="/login" className="font-medium text-blue-700 hover:underline">
      Back to sign in
    </Link>
  );

  if (sent) {
    return (
      <AuthShell title="Check your email" footer={back}>
        <p className="text-sm text-gray-700 leading-relaxed">
          If an account exists for <span className="font-medium">{email}</span>,
          we have sent a link to reset your password. The link expires after a
          short time.
        </p>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Reset your password"
      subtitle="Enter the email address you registered with and we will send you a reset link."
      footer={back}
    >
      {error && (
        <div className="mb-4">
          <ErrorBanner message={error} />
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <Field label="Email address" id="email">
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
          />
        </Field>

        <button type="submit" disabled={loading} className={primaryButtonClass}>
          {loading ? "Sending…" : "Send reset link"}
        </button>
      </form>
    </AuthShell>
  );
}
