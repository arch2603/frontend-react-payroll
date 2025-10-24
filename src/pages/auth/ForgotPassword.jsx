import { useState } from "react";
import { requestPasswordReset } from "../../lib/api";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const onSubmit = async (e) => {
    e.preventDefault();
    const val = email.trim();
    if(!val) { 
      setErr("PLease enter your email");
      return;
    }
    
    setErr(""); setLoading(true);
    try {
      await requestPasswordReset(val);
      setSent(true);                // Always show success
    } catch (e) {
      // Still show success to the user to prevent account enumeration
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="max-w-md mx-auto p-6">
        <h1 className="text-xl font-semibold">Check your email</h1>
        <p className="mt-2 text-sm text-gray-600">
          If an account exists for <strong>{email}</strong>, you’ll receive a password reset link.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="max-w-md mx-auto p-6 space-y-4">
      <h1 className="text-xl font-semibold">Forgot your password?</h1>
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="you@example.com"
        className="w-full border rounded px-3 py-2"
        
      />
      {err && <div className="text-red-600 text-sm">{err}</div>}
      <button disabled={loading} className="w-full rounded bg-blue-600 text-white py-2">
        {loading ? "Sending…" : "Send reset link"}
      </button>
    </form>
  );
}
