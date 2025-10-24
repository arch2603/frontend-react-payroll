import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { resetPassword } from "../../lib/api";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!token) setErr("Invalid or missing reset token.");
  }, [token]);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!token) return;
    if (password !== confirm) {
      setErr("Passwords do not match.");
      return;
    }
    setErr(""); setLoading(true);
    try {
      await resetPassword({ token, password });
      setMsg("Password updated. You can now sign in.");
      setTimeout(() => navigate("/login"), 1200);
    } catch (e) {
      setErr("Reset failed. Your link may be expired or invalid.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="max-w-md mx-auto p-6 space-y-4">
      <h1 className="text-xl font-semibold">Set a new password</h1>
      <input
        name="password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="New password"
        className="w-full border rounded px-3 py-2"
        required
      />
      <input
        name="confirmpassword"
        type="password"
        value={confirm}
        onChange={(e) => setConfirm(e.target.value)}
        placeholder="Confirm new password"
        className="w-full border rounded px-3 py-2"
        autoComplete="confirmpassword"
        required
      />
      {/* Optional: <PasswordRequirements value={password} /> */}
      {err && <div className="text-red-600 text-sm">{err}</div>}
      {msg && <div className="text-green-600 text-sm">{msg}</div>}
      <button disabled={loading || !token} className="w-full rounded bg-blue-600 text-white py-2">
        {loading ? "Updating…" : "Update password"}
      </button>
    </form>
  );
}
