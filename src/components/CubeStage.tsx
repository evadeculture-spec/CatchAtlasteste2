import { useCallback, useEffect, useLayoutEffect, useRef, type ReactNode } from 'react';

/**
 * Palco com duas faces de um cubo que roda horizontalmente.
 *
 * - O gesto acompanha o dedo (pointer events + transforms, sem re-render do React).
 * - Só assume navegação quando a intenção horizontal é clara; o scroll vertical é nativo
 *   (touch-action: pan-y), pelo que o browser trata do deslocamento vertical sozinho.
 * - Ao largar, conclui ou cancela conforme distância e velocidade.
 * - Em repouso, a face ativa fica sem transformação (texto nítido) e a inativa fica
 *   `visibility: hidden` + `inert` + `aria-hidden`.
 * - Com movimento reduzido, a rotação é substituída por um cross-fade simples.
 */

interface Props {
  active: 0 | 1;
  onChange: (i: 0 | 1) => void;
  faces: [ReactNode, ReactNode];
  faceIds: [string, string];
  labelledBy: [string, string];
  reducedMotion: boolean;
  /** Progresso contínuo 0..1 — usado pelo cabeçalho (indicador e seletor). */
  onProgress?: (p: number) => void;
  disabled?: boolean;
}

const INTENT_PX = 10;
const COMMIT_FRACTION = 0.4;
const FLING_VELOCITY = 0.45; // px/ms
const MIN_FLING_FRACTION = 0.06;
const BASE_DURATION = 420;

const NO_SWIPE_SELECTOR =
  'input, textarea, select, [contenteditable="true"], [data-no-swipe], input[type="range"], .map, [role="slider"]';

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

export function CubeStage({ active, onChange, faces, faceIds, labelledBy, reducedMotion, onProgress, disabled }: Props) {
  const stageRef = useRef<HTMLDivElement>(null);
  const faceRefs = [useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null)];
  const shadeRefs = [useRef<HTMLDivElement>(null), useRef<HTMLDivElement>(null)];
  const progress = useRef<number>(active);
  const target = useRef<0 | 1>(active);
  const raf = useRef<number>(0);
  const width = useRef(1);
  const reduced = useRef(reducedMotion);
  reduced.current = reducedMotion;
  const onProgressRef = useRef(onProgress);
  onProgressRef.current = onProgress;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const gesture = useRef<{
    id: number;
    x0: number;
    y0: number;
    p0: number;
    mode: 'pending' | 'horizontal' | 'ignored';
    samples: { x: number; t: number }[];
    wasAnimating: boolean;
  } | null>(null);
  const suppressClick = useRef(false);

  /** Aplica o progresso às duas faces. Sem leitura de layout: só transforms/opacity. */
  const apply = useCallback((p: number) => {
    progress.current = p;
    const [a, b] = [faceRefs[0].current, faceRefs[1].current];
    if (!a || !b) return;
    const atRest = p === 0 || p === 1;
    const w = width.current;

    if (reduced.current) {
      a.style.transform = 'none';
      b.style.transform = 'none';
      a.style.opacity = String(1 - p);
      b.style.opacity = String(p);
      shadeRefs[0].current!.style.opacity = '0';
      shadeRefs[1].current!.style.opacity = '0';
    } else {
      a.style.opacity = '';
      b.style.opacity = '';
      if (atRest) {
        a.style.transform = p === 0 ? 'none' : '';
        b.style.transform = p === 1 ? 'none' : '';
      } else {
        // Cubo verdadeiro: cada face roda em torno do centro do cubo (a W/2 de profundidade).
        const angle = p * 90;
        const half = w / 2;
        a.style.transform = `translateZ(${-half}px) rotateY(${-angle}deg) translateZ(${half}px)`;
        b.style.transform = `translateZ(${-half}px) rotateY(${90 - angle}deg) translateZ(${half}px)`;
      }
      // Sombra subtil: a face que se afasta escurece; a que entra clareia.
      shadeRefs[0].current!.style.opacity = String(Math.min(0.55, p * 0.6));
      shadeRefs[1].current!.style.opacity = String(Math.min(0.55, (1 - p) * 0.6));
    }

    // Visibilidade / acessibilidade
    const show = (el: HTMLElement, visible: boolean, interactive: boolean) => {
      el.style.visibility = visible ? 'visible' : 'hidden';
      if (interactive) {
        el.removeAttribute('inert');
        el.removeAttribute('aria-hidden');
      } else {
        el.setAttribute('inert', '');
        el.setAttribute('aria-hidden', 'true');
      }
    };
    show(a, p < 1, atRest ? p === 0 : target.current === 0 && !gesture.current);
    show(b, p > 0, atRest ? p === 1 : target.current === 1 && !gesture.current);
    stageRef.current?.classList.toggle('is-moving', !atRest);
    onProgressRef.current?.(p);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const animateTo = useCallback(
    (to: 0 | 1, velocity = 0) => {
      cancelAnimationFrame(raf.current);
      target.current = to;
      const from = progress.current;
      const dist = Math.abs(to - from);
      if (dist < 0.0005) {
        apply(to);
        return;
      }
      let duration = reduced.current ? 180 : BASE_DURATION * Math.max(0.45, dist);
      if (!reduced.current && velocity > FLING_VELOCITY) {
        // Um gesto rápido termina um pouco mais depressa, sem ficar brusco.
        duration = Math.max(220, Math.min(duration, ((dist * width.current) / velocity) * 2.2));
      }
      const t0 = performance.now();
      const step = (now: number) => {
        const t = Math.min(1, (now - t0) / duration);
        const p = from + (to - from) * easeOutCubic(t);
        apply(t === 1 ? to : p);
        if (t < 1) raf.current = requestAnimationFrame(step);
        else raf.current = 0;
      };
      raf.current = requestAnimationFrame(step);
    },
    [apply],
  );

  // Medidas e perspetiva
  useLayoutEffect(() => {
    const stage = stageRef.current!;
    const measure = () => {
      width.current = stage.clientWidth || 1;
      stage.style.perspective = `${Math.max(900, width.current * 2.4)}px`;
      apply(progress.current);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(stage);
    return () => ro.disconnect();
  }, [apply]);

  // Mudanças externas (seletor, teclado)
  useEffect(() => {
    if (target.current !== active || (progress.current !== active && !raf.current && !gesture.current)) {
      animateTo(active);
    }
  }, [active, animateTo]);

  useEffect(() => {
    apply(progress.current);
  }, [reducedMotion, apply]);

  // Se o foco ficou na face que deixou de estar ativa, leva-o para a face ativa.
  useEffect(() => {
    const id = window.setTimeout(() => {
      const inactive = faceRefs[active === 0 ? 1 : 0].current;
      if (inactive && inactive.contains(document.activeElement)) faceRefs[active].current?.focus({ preventScroll: true });
    }, reduced.current ? 200 : BASE_DURATION + 20);
    return () => window.clearTimeout(id);
  }, [active]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---- Gesto ----
  const onPointerDown = (e: React.PointerEvent) => {
    if (disabled || gesture.current) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    const el = e.target as HTMLElement;
    if (el.closest(NO_SWIPE_SELECTOR)) return;
    const wasAnimating = raf.current !== 0;
    gesture.current = {
      id: e.pointerId,
      x0: e.clientX,
      y0: e.clientY,
      p0: progress.current,
      mode: 'pending',
      samples: [{ x: e.clientX, t: e.timeStamp }],
      wasAnimating,
    };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const g = gesture.current;
    if (!g || g.id !== e.pointerId || g.mode === 'ignored') return;
    const dx = e.clientX - g.x0;
    const dy = e.clientY - g.y0;
    if (g.mode === 'pending') {
      if (Math.abs(dy) >= INTENT_PX && Math.abs(dy) >= Math.abs(dx)) {
        g.mode = 'ignored';
        return;
      }
      if (Math.abs(dx) >= INTENT_PX && Math.abs(dx) > Math.abs(dy) * 1.3) {
        // Sem passagem circular: na primeira face, deslizar para a direita não faz nada (e vice-versa).
        const towards = dx < 0 ? 1 : 0;
        if (towards === Math.round(g.p0) && !g.wasAnimating) {
          g.mode = 'ignored';
          return;
        }
        g.mode = 'horizontal';
        cancelAnimationFrame(raf.current);
        raf.current = 0;
        g.p0 = progress.current;
        g.x0 = e.clientX;
        try {
          stageRef.current?.setPointerCapture(e.pointerId);
        } catch {
          /* ignore */
        }
        window.getSelection()?.removeAllRanges();
        stageRef.current?.classList.add('is-dragging');
      } else {
        return;
      }
    }
    const p = Math.max(0, Math.min(1, g.p0 - (e.clientX - g.x0) / width.current));
    g.samples.push({ x: e.clientX, t: e.timeStamp });
    if (g.samples.length > 6) g.samples.shift();
    apply(p);
  };

  const finish = (e: React.PointerEvent, cancelled: boolean) => {
    const g = gesture.current;
    if (!g || g.id !== e.pointerId) return;
    gesture.current = null;
    stageRef.current?.classList.remove('is-dragging');
    if (g.mode !== 'horizontal') {
      if (g.wasAnimating) animateTo(target.current);
      return;
    }
    suppressClick.current = true;
    window.setTimeout(() => (suppressClick.current = false), 80);

    const start = Math.round(g.p0) as 0 | 1;
    const p = progress.current;
    const first = g.samples[0];
    const last = g.samples[g.samples.length - 1];
    const dt = Math.max(1, last.t - first.t);
    const vx = (last.x - first.x) / dt; // px/ms (negativo = para a esquerda)
    let to: 0 | 1 = start;
    if (!cancelled) {
      const moved = p - start; // >0 quando avança para "Gera a tua história"
      if (Math.abs(vx) > FLING_VELOCITY && Math.abs(moved) > MIN_FLING_FRACTION) {
        to = vx < 0 ? 1 : 0;
      } else if (Math.abs(moved) > COMMIT_FRACTION) {
        to = moved > 0 ? 1 : 0;
      } else if (start !== Math.round(target.current)) {
        to = target.current;
      }
    }
    animateTo(to, Math.abs(vx));
    if (to !== active) onChangeRef.current(to);
  };

  const onClickCapture = (e: React.MouseEvent) => {
    if (suppressClick.current) {
      e.preventDefault();
      e.stopPropagation();
      suppressClick.current = false;
    }
  };

  return (
    <div
      ref={stageRef}
      className="cube-stage"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={(e) => finish(e, false)}
      onPointerCancel={(e) => finish(e, true)}
      onClickCapture={onClickCapture}
      onDragStart={(e) => gesture.current?.mode === 'horizontal' && e.preventDefault()}
    >
      {faces.map((face, i) => (
        <div
          key={i}
          ref={faceRefs[i]}
          id={faceIds[i]}
          className={`cube-face cube-face--${i === 0 ? 'prepare' : 'history'}`}
          role="tabpanel"
          aria-labelledby={labelledBy[i]}
          tabIndex={-1}
        >
          <div className="face-scroll" data-face-scroll={i}>
            {face}
          </div>
          <div ref={shadeRefs[i]} className="cube-shade" aria-hidden="true" />
        </div>
      ))}
    </div>
  );
}
