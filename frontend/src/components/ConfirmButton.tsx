import { useEffect, useState } from 'react';
import { Icon } from './Icon';

interface ConfirmButtonProps {
  label: string;
  confirmLabel: string;
  onConfirm: () => void;
  busy?: boolean;
}

/** A destructive action that needs a second click. Resets itself after a few seconds. */
export function ConfirmButton({ label, confirmLabel, onConfirm, busy = false }: ConfirmButtonProps) {
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (!armed) return;
    const timer = window.setTimeout(() => setArmed(false), 4000);
    return () => window.clearTimeout(timer);
  }, [armed]);

  if (busy) {
    return (
      <span className="btn btn-quiet pointer-events-none opacity-60" aria-live="polite">
        Deleting
      </span>
    );
  }

  if (!armed) {
    return (
      <button type="button" className="btn btn-quiet btn-icon" onClick={() => setArmed(true)} aria-label={label} title={label}>
        <Icon name="trash" />
      </button>
    );
  }

  return (
    <span className="inline-flex items-center gap-1">
      <button
        type="button"
        className="btn btn-danger"
        onClick={() => {
          setArmed(false);
          onConfirm();
        }}
        autoFocus
      >
        {confirmLabel}
      </button>
      <button type="button" className="btn btn-quiet" onClick={() => setArmed(false)}>
        Keep
      </button>
    </span>
  );
}
