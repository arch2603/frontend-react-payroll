import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { requestPasswordReset, requestPasswordOtp } from "../../lib/api";

export default function ForgotPassword() {
  const [mode, setMode] = useState("link"); // 'link' | 'otp'
  const [identifier, setIdentifier] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const navigate = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    const val = identifier.trim();
    if (!val) {
      setErr("Please enter your email or username");
      return;
    }

    setErr(""); setLoading(true);
    try {
      const payload = val.includes("@") ? { email: val.trim() } : { username: val.trim() };
      if (mode === "link") {
        await requestPasswordReset(payload);
        setSent(true);
      } else {
        await requestPasswordOtp(payload);
        navigate(`/reset-with-otp?id=${encodeURIComponent(val)}`);
      }
    } catch (e) {
      if (mode === "link") {
        setSent(true);

      } else {
        setErr("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  if (sent && mode === "link") {
    const shown = identifier.trim();
    return (
      <div className="max-w-md mx-auto p-6">
        <h1 className="text-xl font-semibold">Check your email</h1>
        <p className="mt-2 text-sm text-gray-600">
          If an account exists for <strong>{/\S+@\S+\.\S+/.test(shown) ? shown : `username “${shown}”`}</strong>, you’ll receive a password reset link.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="max-w-md mx-auto p-6 space-y-4">
      <h1 className="text-xl font-semibold">Forgot your password?</h1>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setMode("link")}
          className={`px-3 py-2 rounded ${mode === "link" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
          aria-pressed={mode === "link"}
        >
          Email link
        </button>
        <button
          type="button"
          onClick={() => setMode("otp")}
          className={`px-3 py-2 rounded ${mode === "otp" ? "bg-blue-600 text-white" : "bg-gray-200"}`}
          aria-pressed={mode === "otp"}
        >
          OTP code
        </button>
      </div>
      <input
        type="text"
        required
        value={identifier}
        onChange={(e) => setIdentifier(e.target.value)}
        placeholder="you@example.com or your username"
        className="w-full border rounded px-3 py-2"
        autoComplete="username email"
        aria-label="Email or username"
      />

      {err && <div className="text-red-600 text-sm">{err}</div>}

      <button disabled={loading} className="w-full rounded bg-blue-600 text-white py-2">
        {loading ? (mode === "link" ? "Sending…" : "Requesting code…") : (mode === "link" ? "Send reset link" : "Send OTP code")}
      </button>
    </form>
  );
}
