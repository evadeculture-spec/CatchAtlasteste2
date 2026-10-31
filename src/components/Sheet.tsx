import { useEffect, useId, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface Props {
  title: string;
  eyebrow?: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  /** Está no topo da pilha (os restantes ficam inertes). */
  top: boolean;
  size?: 'default' | 'wide';
  tone?: 'light' | 'deep';
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Painel modal (folha inferior no telemóvel, diálogo centrado no computador). */
export function Sheet({ title, eyebrow, onClose, children, footer, top, size = 'default', tone = 'light' }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const returnFocus = useRef<Element | null>(null);

  useEffect(() => {
    returnFocus.current = document.activeElement;
    const el = ref.current!;
    // Formulários focam o primeiro campo marcado; painéis de leitura focam o próprio diálogo.
    const first = el.querySelector<HTMLElement>('[data-autofocus]');
    (first ?? el).focus({ preventScroll: true });
    return () => {
      const r = returnFocus.current as HTMLElement | null;
      if (r && document.contains(r)) r.focus({ preventScroll: true });
    };
  }, []);

  useEffect(() => {
    if (!top) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      } else if (e.key === 'Tab') {
        const items = [...ref.current!.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((x) => x.offsetParent !== null);
        if (!items.length) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [top, onClose]);

  return createPortal(
    <div className={`sheet-layer${top ? '' : ' is-under'}`} {...(top ? {} : { inert: '' as unknown as boolean })}>
      <div className="sheet-backdrop" onClick={onClose} aria-hidden="true" />
      <div
        ref={ref}
        className={`sheet sheet--${size} sheet--${tone}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        <header className="sheet-header">
          <div className="sheet-grip" aria-hidden="true" />
          <div className="sheet-titles">
            {eyebrow && <p className="eyebrow">{eyebrow}</p>}
            <h2 id={titleId}>{title}</h2>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Fechar">
            <X size={20} />
          </button>
        </header>
        <div className="sheet-body">{children}</div>
        {footer && <footer className="sheet-footer">{footer}</footer>}
      </div>
    </div>,
    document.body,
  );
}
