export default function PasswordRequirements({ currentPassword, newPassword, confirm, incomingRules }) {
  const rules = incomingRules ?? {
    minLen: newPassword.length >= 8,
    upper: /[A-Z]/.test(newPassword),
    lower: /[a-z]/.test(newPassword),
    digit: /\d/.test(newPassword),
    special: /[^A-Za-z0-9]/.test(newPassword),
    notSameAsCurrent:
      currentPassword ? newPassword && newPassword !== currentPassword : true,
    match: newPassword && confirm && newPassword === confirm,
  };

  const Item = ({ ok, children }) => (
    <li className={`text-sm ${ok ? "text-emerald-600" : "text-gray-600"}`}>
      <span className={`inline-block w-4`}>
        {ok ? "✓" : "•"}
      </span>{" "}
      {children}
    </li>
  );

  return (
    <div className="rounded-md bg-gray-50 dark:bg-gray-800 p-3">
      <div className="text-sm font-medium mb-2">Password must contain:</div>
      <ul className="space-y-1">
        <Item ok={rules.minLen}>At least 8 characters</Item>
        <Item ok={rules.upper}>An uppercase letter (A-Z)</Item>
        <Item ok={rules.lower}>A lowercase letter (a-z)</Item>
        <Item ok={rules.digit}>A number (0-9)</Item>
        <Item ok={rules.special}>A symbol (e.g. !@#$%)</Item>
        <Item ok={rules.notSameAsCurrent}>Not equal to current password</Item>
        <Item ok={rules.match}>New password &amp; confirm match</Item>
      </ul>

      {/* Optional strength hint */}
      <StrengthBar value={newPassword} />
    </div>
  );
}

// Very simple strength bar (length + variety)
function StrengthBar({ value = "" }) {
  const lengthScore = Math.min(value.length / 12, 1);
  const variety =
    (/[A-Z]/.test(value) ? 1 : 0) +
    (/[a-z]/.test(value) ? 1 : 0) +
    (/[0-9]/.test(value) ? 1 : 0) +
    (/[^A-Za-z0-9]/.test(value) ? 1 : 0);
  const varietyScore = variety / 4;
  const score = Math.round(((lengthScore + varietyScore) / 2) * 100);

  return (
    <div className="mt-3">
      <div className="h-2 w-full bg-gray-200 rounded">
        <div
          className="h-2 rounded bg-emerald-500 transition-all"
          style={{ width: `${score}%` }}
          aria-label={`Password strength ${score}%`}
        />
      </div>
      <div className="text-xs mt-1 opacity-75">Strength: {score}%</div>
    </div>
  );
}
