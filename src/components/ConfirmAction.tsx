import { useState } from 'react';
import { Trash2 } from 'lucide-react';

/** Ação destrutiva em dois passos (evita window.confirm e toques acidentais). */
export function ConfirmAction({
  label,
  confirmLabel,
  onConfirm,
  description,
}: {
  label: string;
  confirmLabel: string;
  onConfirm: () => void | Promise<void>;
  description?: string;
}) {
  const [asking, setAsking] = useState(false);
  if (!asking)
    return (
      <button type="button" className="btn btn--danger-link" onClick={() => setAsking(true)}>
        <Trash2 size={16} aria-hidden="true" /> {label}
      </button>
    );
  return (
    <div className="confirm-box" role="group" aria-label={label}>
      <p>{description ?? 'Esta ação não pode ser anulada.'}</p>
      <div className="btn-row">
        <button type="button" className="btn btn--ghost btn--sm" onClick={() => setAsking(false)} autoFocus>
          Cancelar
        </button>
        <button type="button" className="btn btn--danger btn--sm" onClick={() => onConfirm()}>
          {confirmLabel}
        </button>
      </div>
    </div>
  );
}
