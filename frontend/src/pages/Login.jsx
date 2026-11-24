import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/useAuth";
import {
  AuthShell,
  Field,
  inputClass,
  primaryButtonClass,
} from "../components/AuthShell";
import { ErrorBanner } from "../components/Badges";

export default function Login() {
  const { login } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await login(username, password);

    if (!result.success) {
      setError(result.error || "Invalid username or password");
    }
    // Navigation is handled by AuthContext
    setLoading(false);
  };

  return (
    <AuthShell
      title="Sign in to your account"
      subtitle="Welcome back. Enter your details to continue."
      footer={
        <>
          New to the support portal?{" "}
          <Link to="/register" className="font-medium text-blue-700 hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      {error && (
        <div className="mb-4">
          <ErrorBanner message={error} />
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <Field label="Username" id="username">
          <input
            id="username"
            type="text"
            required
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className={inputClass}
          />
        </Field>

        <Field label="Password" id="password">
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`${inputClass} pr-16`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 px-3 text-xs font-medium text-gray-500 hover:text-gray-700"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>
        </Field>

        <div className="text-right -mt-2">
          <Link to="/forgot-password" className="text-sm font-medium text-blue-700 hover:underline">
            Forgot password?
          </Link>
        </div>

        <button type="submit" disabled={loading} className={primaryButtonClass}>
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>
    </AuthShell>
  );
}
