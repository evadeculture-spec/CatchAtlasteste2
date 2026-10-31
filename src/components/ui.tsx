import { useId, useRef, useState, type ReactNode } from 'react';
import { Camera, ImagePlus, Trash2, CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { usePhotoUrl, savePhoto } from '../lib/photos';
import { useUi } from '../state/ui';

export function Photo({ refId, alt, className }: { refId?: string; alt: string; className?: string }) {
  const url = usePhotoUrl(refId);
  return (
    <div className={`photo ${className ?? ''}`}>
      {url ? <img src={url} alt={alt} loading="lazy" draggable={false} /> : <div className="photo-fallback" aria-hidden="true" />}
      {refId?.startsWith('art:') && <span className="photo-tag">Ilustração</span>}
    </div>
  );
}

export function DemoBadge({ onDark }: { onDark?: boolean }) {
  return <span className={`badge badge--demo${onDark ? ' badge--on-dark' : ''}`}>Exemplo</span>;
}

export function Field({
  label,
  hint,
  error,
  optional,
  children,
  htmlFor,
}: {
  label: string;
  hint?: string;
  error?: string;
  optional?: boolean;
  children: ReactNode;
  htmlFor?: string;
}) {
  return (
    <div className={`field${error ? ' has-error' : ''}`}>
      <label htmlFor={htmlFor}>
        {label}
        {optional && <span className="optional"> · opcional</span>}
      </label>
      {children}
      {error ? (
        <p className="field-error" role="alert">
          <AlertCircle size={14} aria-hidden="true" /> {error}
        </p>
      ) : (
        hint && <p className="field-hint">{hint}</p>
      )}
    </div>
  );
}

/** Grupo de opções exclusivas apresentado como botões (radiogroup acessível). */
export function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T | undefined;
  options: { id: T; label: string }[];
  onChange: (v: T) => void;
}) {
  const id = useId();
  return (
    <fieldset className="field">
      <legend id={id}>{label}</legend>
      <div className="segmented" role="radiogroup" aria-labelledby={id}>
        {options.map((o) => (
          <label key={o.id} className={`seg-option${value === o.id ? ' is-on' : ''}`}>
            <input type="radio" name={id} value={o.id} checked={value === o.id} onChange={() => onChange(o.id)} />
            <span>{o.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function Chips({
  label,
  values,
  options,
  onToggle,
  hint,
}: {
  label: string;
  values: string[];
  options: string[];
  onToggle: (v: string) => void;
  hint?: string;
}) {
  const id = useId();
  return (
    <fieldset className="field">
      <legend id={id}>
        {label} <span className="optional">· opcional</span>
      </legend>
      <div className="chips" aria-labelledby={id}>
        {options.map((o) => {
          const on = values.includes(o);
          return (
            <button key={o} type="button" className={`chip${on ? ' is-on' : ''}`} aria-pressed={on} onClick={() => onToggle(o)}>
              {o}
            </button>
          );
        })}
      </div>
      {hint && <p className="field-hint">{hint}</p>}
    </fieldset>
  );
}

export function PhotoInput({ value, onChange, label = 'Fotografia' }: { value?: string; onChange: (ref?: string) => void; label?: string }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const { toast } = useUi();
  const id = useId();
  const url = usePhotoUrl(value);
  const pick = async (f?: File) => {
    if (!f) return;
    setBusy(true);
    try {
      const ref = await savePhoto(f);
      onChange(ref);
    } catch (e) {
      toast(e instanceof Error ? e.message : 'Não foi possível guardar a fotografia.', 'error');
    } finally {
      setBusy(false);
      if (input.current) input.current.value = '';
    }
  };
  return (
    <div className="field">
      <span className="label-like" id={id}>
        {label} <span className="optional">· opcional</span>
      </span>
      <div className="photo-input" aria-labelledby={id}>
        {url ? (
          <div className="photo-input-preview">
            <img src={url} alt="Pré-visualização da fotografia escolhida" />
            <div className="photo-input-actions">
              <button type="button" className="btn btn--ghost btn--sm" onClick={() => input.current?.click()}>
                <Camera size={16} aria-hidden="true" /> Trocar
              </button>
              <button type="button" className="btn btn--ghost btn--sm" onClick={() => onChange(undefined)}>
                <Trash2 size={16} aria-hidden="true" /> Remover
              </button>
            </div>
          </div>
        ) : (
          <button type="button" className="photo-drop" onClick={() => input.current?.click()} disabled={busy}>
            <ImagePlus size={22} aria-hidden="true" />
            <span>{busy ? 'A guardar…' : 'Escolher ou tirar fotografia'}</span>
            <small>Fica guardada apenas neste dispositivo.</small>
          </button>
        )}
        <input
          ref={input}
          type="file"
          accept="image/*"
          className="visually-hidden"
          tabIndex={-1}
          aria-hidden="true"
          onChange={(e) => pick(e.target.files?.[0])}
        />
      </div>
    </div>
  );
}

export function Toasts() {
  const { toasts, dismissToast } = useUi();
  return (
    <div className="toasts" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast--${t.tone}`}>
          {t.tone === 'success' ? <CheckCircle2 size={18} aria-hidden="true" /> : t.tone === 'error' ? <AlertCircle size={18} aria-hidden="true" /> : <Info size={18} aria-hidden="true" />}
          <span>{t.text}</span>
          <button type="button" className="toast-x" onClick={() => dismissToast(t.id)} aria-label="Fechar mensagem">
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}

export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <rect width="64" height="64" rx="18" fill="#102F40" />
      <path d="M13 41c6.3-4.2 12.7-4.2 19 0s12.7 4.2 19 0" fill="none" stroke="#88D653" strokeWidth="4.5" strokeLinecap="round" />
      <path d="M13 30.5c6.3-4.2 12.7-4.2 19 0s12.7 4.2 19 0" fill="none" stroke="#F3F5F3" strokeWidth="4.5" strokeLinecap="round" opacity=".5" />
      <circle cx="32" cy="19" r="5" fill="#88D653" />
    </svg>
  );
}

export function ProgressBar({ value, max, label }: { value: number; max: number; label: string }) {
  const pct = max ? Math.round((value / max) * 100) : 0;
  return (
    <div className="progress" role="progressbar" aria-valuemin={0} aria-valuemax={max} aria-valuenow={value} aria-label={label}>
      <span style={{ transform: `scaleX(${pct / 100})` }} />
    </div>
  );
}
