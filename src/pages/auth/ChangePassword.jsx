import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { authApi} from "../../lib/api";
import PasswordRequirements from "./PasswordRequirements";


const ChangePassword = () => {
    
    const navigate = useNavigate(); 

    const [form, setForm] = useState({
        currentPassword: "",
        newPassword: "",
        confirm: ""
    });

    const [busy, setBusy] = useState(false);
    const [msg, setMsg] = useState({ type: "", text: "" });


    const onChange = (e) => {
        const { name, value } = e.target;
        setForm((s) => ({ ...s, [name]: value }));
    };

    const rules = useMemo(() => {
        const v = form.newPassword || "";
        return {
            minLen: v.length >= 12,
            upper: /[A-Z]/.test(v),
            lower: /[a-z]/.test(v),
            digit: /[0-9]/.test(v),
            special: /[^A-Za-z0-9]/.test(v),
            notSameAsCurrent: !!form.currentPassword && v !== form.currentPassword,
            match: v === form.confirm && v.length > 0,
        };
    }, [form]);

    async function onSubmit(e) {
        e.preventDefault();
        if (form.newPassword !== form.confirm) {
            setMsg({ type: "error", text: "New passwords do not match." });
            return;
        }
        setBusy(true);
        setMsg({ type: "", text: "" });

        try {
            const res = await authApi.post(
                "/auth/change-password",
                {
                    currentPassword: form.currentPassword,
                    newPassword: form.newPassword,
                }
            );
            setMsg({ type: "success", text: res?.data?.message || "Password changed." });
            setForm({ currentPassword: "", newPassword: "", confirm: "" });
        } catch (err) {
            const status = err?.response?.status;
            if (status === 401 || status === 403) {
                // token invalid/expired → force re-login
                navigate("/login", { replace: true });
                return;
            }
            setMsg({
                type: "error",
                text: err?.response?.data?.message || "Error updating password",
            });
            console.error("[ChangePassword]", err?.response?.data || err.message);
        } finally {
            setBusy(false);
        }
    }

    const canSubmit =
        !!form.currentPassword &&
        !!form.newPassword &&
        form.newPassword === form.confirm &&
        rules.minLen &&
        rules.match &&
        !busy;

    return (
        <div className="max-w-md mx-auto bg-white shadow p-6 rounded">
            <h2 className="text-xl font-bold mb-4">Change Password</h2>
            {msg.text && <p
                className={`text-sm mb-3 ${msg.type === "success" ? "text-green-600" : "text-red-600"}`}
            >
                {msg.text}
            </p>}
            <form onSubmit={onSubmit} className="space-y-4">
                <input
                    name="username"
                    autoComplete="username"
                    className="sr-only"
                    aria-hidden="true"
                    tabIndex={-1}
                />
                <input
                    type="password"
                    name="currentPassword"
                    placeholder="Current password"
                    value={form.currentPassword}
                    onChange={onChange}
                    className="w-full border rounded p-3"
                    autoComplete="current-password"
                    required
                />
                <input
                    type="password"
                    name="newPassword"
                    placeholder="New password"
                    value={form.newPassword}
                    onChange={onChange}
                    className="w-full border rounded p-3"
                    autoComplete="new-password"
                    required
                />
                <input
                    type="password"
                    name="confirm"
                    placeholder="Confirm new password"
                    value={form.confirm}
                    onChange={onChange}
                    className="w-full border rounded p-3"
                    autoComplete="new-password"
                    required
                />
                <PasswordRequirements
                    incomingRules={rules}
                    currentPassword={form.currentPassword}
                    newPassword={form.newPassword}
                    confirm={form.confirm}
                />
                <button
                    type="submit"
                    disabled={!canSubmit}
                    className={`w-full rounded bg-blue-600 text-white py-2 ${!canSubmit ? "opacity-60 cursor-not-allowed" : ""
                        }`}
                >
                    {busy ? "Saving..." : "Update Password"}
                </button>
            </form>
        </div>
    );
};

export default ChangePassword;
