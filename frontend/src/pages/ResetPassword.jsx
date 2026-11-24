import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../api/client";
import {
  AuthShell,
  Field,
  inputClass,
  primaryButtonClass,
} from "../components/AuthShell";
import { ErrorBanner } from "../components/Badges";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const uid = params.get("uid");
  const token = params.get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const signIn = (
    <Link to="/login" className="font-medium text-blue-700 hover:underline">
      Back to sign in
    </Link>
  );

  if (!uid || !token) {
    return (
      <AuthShell title="Link not valid" footer={signIn}>
        <p className="text-sm text-gray-700">
          This reset link is incomplete. Request a new one from the{" "}
          <Link to="/forgot-password" className="font-medium text-blue-700 hover:underline">
            reset page
          </Link>
          .
        </p>
      </AuthShell>
    );
  }

  if (done) {
    return (
      <AuthShell title="Password updated" footer={signIn}>
        <p className="text-sm text-gray-700">
          Your password has been changed. You can now sign in with the new one.
        </p>
      </AuthShell>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("The two passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      await api.post("/auth/password-reset/confirm/", {
        uid,
        token,
        new_password: password,
      });
      setDone(true);
    } catch (err) {
      const data = err.response?.data;
      setError(
        data?.detail ||
          data?.new_password?.join(" ") ||
          (err.response?.status === 429
            ? "Too many attempts. Please try again later."
            : "Could not reset the password. Please try again.")
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Choose a new password"
      subtitle="Use at least 8 characters. Avoid common or all-numeric passwords."
      footer={signIn}
    >
      {error && (
        <div className="mb-4">
          <ErrorBanner message={error} />
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <Field label="New password" id="password">
          <input
            id="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
          />
        </Field>

        <Field label="Confirm new password" id="confirm">
          <input
            id="confirm"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className={inputClass}
          />
        </Field>

        <button type="submit" disabled={loading} className={primaryButtonClass}>
          {loading ? "Updating…" : "Update password"}
        </button>
      </form>
    </AuthShell>
  );
}
