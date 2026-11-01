import { useEffect, useMemo, useRef, useState } from 'react';
import { Download, RefreshCw, Save, Share2, Info } from 'lucide-react';
import { generateNarrative, NARRATIVE_VARIANTS } from '../lib/narrative';
import { canvasToBlob, downloadBlob, renderStoryCard, storyFilename } from '../lib/storyCard';
import { useStore } from '../state/store';
import { useUi } from '../state/ui';
import { Sheet } from '../components/Sheet';
import { Photo } from '../components/ui';
import { journeyCover, journeyPlace } from '../components/journey';

export function StorySheet({ journeyId, top }: { journeyId: string; top: boolean }) {
  const { data, saveNarrative } = useStore();
  const ui = useUi();
  const j = data.journeys.find((x) => x.id === journeyId);
  const catches = useMemo(() => data.catches.filter((c) => c.journeyId === journeyId), [data.catches, journeyId]);
  const [variant, setVariant] = useState(j?.narrative?.variant ?? 0);
  const [text, setText] = useState(() => (j ? j.narrative?.text ?? generateNarrative(j, catches, 0) : ''));
  const [savedText, setSavedText] = useState(j?.narrative?.text);
  const photos = useMemo(() => {
    if (!j) return [];
    const list = [journeyCover(j), ...catches.map((c) => c.photo).filter(Boolean)] as string[];
    return [...new Set(list)];
  }, [j, catches]);
  const [photo, setPhoto] = useState(photos[0]);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState<'export' | 'share' | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Pré-visualização (re-desenhada com atraso enquanto se escreve)
  useEffect(() => {
    if (!j) return;
    let alive = true;
    const t = window.setTimeout(async () => {
      const canvas = await renderStoryCard(j, catches, text, photo ?? journeyCover(j));
      if (!alive) return;
      canvasRef.current = canvas;
      setPreview(canvas.toDataURL('image/jpeg', 0.82));
    }, 350);
    return () => {
      alive = false;
      window.clearTimeout(t);
    };
  }, [j, catches, text, photo]);

  if (!j) return null;
  const dirty = text !== (savedText ?? '');
  const generatedNow = generateNarrative(j, catches, variant);
  const edited = text !== generatedNow;

  const regenerate = () => {
    const next = (variant + 1) % NARRATIVE_VARIANTS.length;
    setVariant(next);
    setText(generateNarrative(j, catches, next));
  };

  const save = () => {
    if (!text.trim()) {
      ui.toast('O texto está vazio.', 'error');
      return;
    }
    saveNarrative(j.id, { text: text.trim(), variant, updatedAt: new Date().toISOString() });
    setSavedText(text.trim());
    setText(text.trim());
    ui.toast('História guardada no diário.');
  };

  const getBlob = async () => {
    const canvas = canvasRef.current ?? (await renderStoryCard(j, catches, text, photo ?? journeyCover(j)));
    return canvasToBlob(canvas);
  };

  const exportImg = async () => {
    setBusy('export');
    try {
      downloadBlob(await getBlob(), storyFilename(j));
      ui.toast('Imagem exportada.');
    } catch {
      ui.toast('Não foi possível exportar a imagem.', 'error');
    } finally {
      setBusy(null);
    }
  };

  const share = async () => {
    setBusy('share');
    try {
      const blob = await getBlob();
      const file = new File([blob], storyFilename(j), { type: 'image/png' });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: `CatchAtlas — ${journeyPlace(j)}` });
        ui.toast('Partilha concluída.');
      } else {
        downloadBlob(blob, storyFilename(j));
        ui.toast('A partilha não está disponível neste dispositivo. A imagem foi descarregada.', 'info');
      }
    } catch (e) {
      if ((e as DOMException)?.name !== 'AbortError') ui.toast('Não foi possível partilhar.', 'error');
    } finally {
      setBusy(null);
    }
  };

  return (
    <Sheet
      top={top}
      size="wide"
      tone="deep"
      title="A minha história"
      eyebrow={journeyPlace(j)}
      onClose={ui.close}
      footer={
        <>
          <button type="button" className="btn btn--ghost" onClick={share} disabled={!!busy}>
            <Share2 size={16} aria-hidden="true" /> {busy === 'share' ? 'A preparar…' : 'Partilhar'}
          </button>
          <button type="button" className="btn btn--ghost" onClick={exportImg} disabled={!!busy}>
            <Download size={16} aria-hidden="true" /> {busy === 'export' ? 'A exportar…' : 'Exportar imagem'}
          </button>
          <button type="button" className="btn btn--action" onClick={save} disabled={!dirty}>
            <Save size={16} aria-hidden="true" /> {dirty ? 'Guardar' : 'Guardada'}
          </button>
        </>
      }
    >
      <div className="story">
        <div className="story-editor">
          <p className="callout callout--soft">
            <Info size={18} aria-hidden="true" />
            <span>
              Texto gerado localmente a partir dos dados que registaste ({catches.length === 1 ? '1 captura' : `${catches.length} capturas`}).
              Nada é inventado: sem capturas, pesos ou condições que não existam no diário. Edita à vontade.
            </span>
          </p>
          <div className="story-toolbar">
            <span className="pill pill--soft">Modelo: {NARRATIVE_VARIANTS[variant]}</span>
            {edited && <span className="pill pill--muted">Editado</span>}
            <button type="button" className="btn btn--ghost btn--sm" onClick={regenerate}>
              <RefreshCw size={14} aria-hidden="true" /> {edited ? 'Gerar outra versão (substitui o texto)' : 'Gerar outra versão'}
            </button>
          </div>
          <label className="visually-hidden" htmlFor="story-text">Texto da história</label>
          <textarea id="story-text" className="story-text" value={text} onChange={(e) => setText(e.target.value)} rows={9} maxLength={1400} data-autofocus />
          <p className="field-hint">{text.length}/1400 caracteres. O cartão mostra o início do texto.</p>

          {photos.length > 1 && (
            <fieldset className="field">
              <legend>Imagem do cartão</legend>
              <div className="photo-pick">
                {photos.map((p, i) => (
                  <label key={p} className={`photo-pick-item${photo === p ? ' is-on' : ''}`}>
                    <input type="radio" name="story-photo" checked={photo === p} onChange={() => setPhoto(p)} aria-label={`Imagem ${i + 1}`} />
                    <Photo refId={p} alt="" />
                  </label>
                ))}
              </div>
            </fieldset>
          )}
        </div>
        <div className="story-preview">
          <p className="eyebrow">Pré-visualização 9:16</p>
          <div className="story-frame">
            {preview ? <img src={preview} alt="Pré-visualização do cartão vertical da história" /> : <div className="story-loading">A desenhar…</div>}
          </div>
          <p className="fine">Nada é publicado automaticamente. Tu decides se e onde partilhar.</p>
        </div>
      </div>
    </Sheet>
  );
}
