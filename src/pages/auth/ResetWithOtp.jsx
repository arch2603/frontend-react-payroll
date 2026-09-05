import { useMemo, useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { resetPasswordWithOtp, requestPasswordOtp } from "../../lib/api";
import PasswordRequirements from "./PasswordRequirements"; // optional

export default function ResetWithOtp() {
    const [sp] = useSearchParams();
    const navigate = useNavigate();
    const [emailOrUsername, setEmailOrUsername] = useState(sp.get("id") || "");
    const [otp, setOtp] = useState("");
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [busy, setBusy] = useState(false);
    const [msg, setMsg] = useState({ type: "", text: "" });

    // Optional: simple 60s resend timer
    const [cooldown, setCooldown] = useState(0);
    useEffect(() => {
        if (!cooldown) return;
        const t = setInterval(() => setCooldown((c) => (c > 0 ? c - 1 : 0)), 1000);
        return () => clearInterval(t);
    }, [cooldown]);

    const okToSubmit = useMemo(() => {
        const passOk = password.length >= 12 && password === confirm;
        const otpOk = /^\d{6}$/.test(otp.trim());
        return !!emailOrUsername.trim() && passOk && otpOk;
    }, [emailOrUsername, password, confirm, otp]);

    const onResend = async () => {
        if (cooldown) return;
        setMsg({ type: "", text: "" });
        try {
            const idv = emailOrUsername.trim();
            if (!idv) return;
            const payload = idv.includes("@") ? { email: idv } : { username: idv };
            await requestPasswordOtp(payload);
            setMsg({ type: "success", text: "If an account exists, a new OTP has been sent." });
            setCooldown(60);
        } catch (e) {
            console.error(e);
            setMsg({ type: "error", text: "Failed to resend code. Try again." });
        }
    };

    const onSubmit = async (e) => {
        e.preventDefault();
        if (!okToSubmit) return;
        setBusy(true);
        setMsg({ type: "", text: "" });
        try {
            await resetPasswordWithOtp({
                emailOrUsername: emailOrUsername.trim(),
                otp: otp.trim(),
                password
            });
            setMsg({ type: "success", text: "Password updated. You can now log in." });
            setTimeout(() => navigate("/login"), 1000);
        } catch (err) {
            console.error(err);
            // Backend returns generic messages; show generic error to avoid info leaks
            setMsg({ type: "error", text: "Invalid or expired code." });
        } finally {
            setBusy(false);
        }
    };

    return (
        <div className="max-w-md mx-auto p-6">
            <h1 className="text-2xl font-semibold mb-4">Reset with OTP</h1>
            <form onSubmit={onSubmit} className="space-y-4">
                <label className="block">
                    <span className="text-sm">Email or Username</span>
                    <input
                        type="text"
                        className="mt-1 w-full rounded border p-2"
                        value={emailOrUsername}
                        onChange={(e) => setEmailOrUsername(e.target.value)}
                        required
                    />
                </label>

                <label className="block">
                    <span className="text-sm">6-digit code</span>
                    <input
                        inputMode="numeric"
                        pattern="\d{6}"
                        maxLength={6}
                        className="mt-1 w-full rounded border p-2 tracking-widest"
                        placeholder="______"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        required
                    />
                </label>

                <label className="block">
                    <span className="text-sm">New password</span>
                    <input
                        type="password"
                        className="mt-1 w-full rounded border p-2"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </label>

                <label className="block">
                    <span className="text-sm">Confirm password</span>
                    <input
                        type="password"
                        className="mt-1 w-full rounded border p-2"
                        value={confirm}
                        onChange={(e) => setConfirm(e.target.value)}
                        required
                    />
                </label>

                {typeof PasswordRequirements === "function" && (
                    <PasswordRequirements
                        currentPassword=""
                        newPassword={password}
                        confirm={confirm}
                        rules={{
                            minLen: password.length >= 12,
                            upper: /[A-Z]/.test(password),
                            lower: /[a-z]/.test(password),
                            digit: /\d/.test(password),
                            special: /[^A-Za-z0-9]/.test(password),
                            notSameAsCurrent: true,
                            match: confirm && password === confirm,
                        }}
                    />
                )}

                <div className="flex items-center justify-between">
                    <button
                        type="button"
                        onClick={onResend}
                        disabled={cooldown > 0}
                        className="text-sm underline disabled:opacity-50"
                    >
                        {cooldown > 0 ? `Resend in ${cooldown}s` : "Resend code"}
                    </button>

                    <button
                        disabled={!okToSubmit || busy}
                        className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-50"
                    >
                        {busy ? "Updating…" : "Update Password"}
                    </button>
                </div>

                {msg.text && (
                    <p className={`${msg.type === "error" ? "text-red-600" : "text-green-700"} text-sm`}>
                        {msg.text}
                    </p>
                )}
            </form>
        </div>
    );
}
