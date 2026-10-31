// Fotografias guardadas em IndexedDB (nunca em base64 no localStorage).
import { useEffect, useState } from 'react';
import { landscapeDataUrl } from './landscape';
import { uid } from './format';

const DB_NAME = 'catchatlas';
const STORE = 'photos';

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      if (typeof indexedDB === 'undefined') {
        reject(new Error('IndexedDB indisponível'));
        return;
      }
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => {
        req.result.createObjectStore(STORE);
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
    dbPromise.catch(() => {
      dbPromise = null;
    });
  }
  return dbPromise;
}

function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(STORE, mode);
        const req = fn(t.objectStore(STORE));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      }),
  );
}

/** Reduz a fotografia (máx. 1600 px) antes de guardar, para poupar espaço. */
async function downscale(file: Blob, max = 1600): Promise<Blob> {
  try {
    const bmp = await createImageBitmap(file);
    const scale = Math.min(1, max / Math.max(bmp.width, bmp.height));
    if (scale === 1 && file.size < 1_500_000) {
      bmp.close();
      return file;
    }
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext('2d')!.drawImage(bmp, 0, 0, canvas.width, canvas.height);
    bmp.close();
    const out = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/jpeg', 0.86));
    return out ?? file;
  } catch {
    return file;
  }
}

export async function savePhoto(file: Blob): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('O ficheiro escolhido não é uma imagem.');
  const blob = await downscale(file);
  const id = uid('ph');
  await tx('readwrite', (s) => s.put(blob, id));
  return `idb:${id}`;
}

export async function getPhotoBlob(ref: string): Promise<Blob | undefined> {
  if (!ref.startsWith('idb:')) return undefined;
  return tx<Blob | undefined>('readonly', (s) => s.get(ref.slice(4)) as IDBRequest<Blob | undefined>);
}

export async function deletePhoto(ref?: string): Promise<void> {
  if (!ref || !ref.startsWith('idb:')) return;
  urlCache.delete(ref);
  await tx('readwrite', (s) => s.delete(ref.slice(4))).catch(() => undefined);
}

export async function clearPhotos(): Promise<void> {
  urlCache.clear();
  await tx('readwrite', (s) => s.clear()).catch(() => undefined);
}

const urlCache = new Map<string, string>();

export async function resolvePhotoUrl(ref?: string): Promise<string | null> {
  if (!ref) return null;
  if (ref.startsWith('art:')) {
    const [variant, seed] = ref.slice(4).split(':');
    return landscapeDataUrl(variant, seed ? Number(seed) : 7);
  }
  if (ref.startsWith('idb:')) {
    const cached = urlCache.get(ref);
    if (cached) return cached;
    const blob = await getPhotoBlob(ref).catch(() => undefined);
    if (!blob) return null;
    const url = URL.createObjectURL(blob);
    urlCache.set(ref, url);
    return url;
  }
  return null;
}

export function usePhotoUrl(ref?: string): string | null {
  const sync = ref?.startsWith('art:') ? null : ref ? urlCache.get(ref) ?? null : null;
  const [url, setUrl] = useState<string | null>(sync);
  useEffect(() => {
    let alive = true;
    resolvePhotoUrl(ref).then((u) => alive && setUrl(u));
    return () => {
      alive = false;
    };
  }, [ref]);
  return url;
}
