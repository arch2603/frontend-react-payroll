import { useState } from 'react';
import { PayRunApi } from '../../lib/api';

export default function PayRunActionBar({ status, onChanged }) {
  const [busy, setBusy] = useState(false);
  const run = async (fn) => {
    try {
      setBusy(true);
      await fn();
      await onChanged?.();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex gap-2">
      {status === 'None' && (
        <button className="btn btn-primary" disabled={busy} onClick={() => run(PayRunApi.start)}>
          Start
        </button>
      )}
      {status === 'Draft' && (
        <>
          <button className="btn" disabled={busy} onClick={() => run(PayRunApi.recalc)}>
            Recalculate
          </button>
          <button className="btn btn-success" disabled={busy} onClick={() => run(PayRunApi.approve)}>
            Approve
          </button>
        </>
      )}
      {status === 'Approved' && (
        <button className="btn btn-accent" disabled={busy} onClick={() => run(PayRunApi.post)}>
          Post
        </button>
      )}
    </div>
  );
}
