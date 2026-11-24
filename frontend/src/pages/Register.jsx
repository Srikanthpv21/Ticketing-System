import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/client";
import {
  AuthShell,
  Field,
  inputClass,
  primaryButtonClass,
} from "../components/AuthShell";
import { ErrorBanner } from "../components/Badges";

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const update = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await api.post("/auth/register/", {
        username: form.username,
        email: form.email,
        password: form.password,
      });

      // Redirect to login after successful registration
      navigate("/login", { replace: true });
    } catch (err) {
      const data = err.response?.data;
      const msg =
        data?.detail ||
        data?.username?.[0] ||
        data?.email?.[0] ||
        data?.password?.[0] ||
        "Registration failed";

      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Create an account"
      subtitle="Register to submit requests and follow their progress."
      footer={
        <>
          Already registered?{" "}
          <Link to="/login" className="font-medium text-blue-700 hover:underline">
            Sign in
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
            value={form.username}
            onChange={update("username")}
            className={inputClass}
          />
        </Field>

        <Field label="Email" id="email">
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={form.email}
            onChange={update("email")}
            className={inputClass}
          />
        </Field>

        <Field label="Password" id="password">
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              required
              minLength={8}
              autoComplete="new-password"
              value={form.password}
              onChange={update("password")}
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
          <p className="text-xs text-gray-500 mt-1.5">At least 8 characters.</p>
        </Field>

        <button type="submit" disabled={loading} className={primaryButtonClass}>
          {loading ? "Creating account…" : "Create account"}
        </button>
      </form>
    </AuthShell>
  );
}
