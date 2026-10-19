// Vragen laden en sessies samenstellen.
import { record } from './store.js';

let INDEX = null;
const CACHE = new Map();   // hoofdstuk -> vragen[]
export const QMAP = new Map(); // id -> vraag

export async function loadIndex() {
  if (!INDEX) {
    const res = await fetch('data/index.json', { cache: 'no-cache' });
    if (!res.ok) throw new Error('data/index.json niet gevonden');
    INDEX = (await res.json()).chapters;
  }
  return INDEX;
}

export async function loadChapter(n) {
  if (CACHE.has(n)) return CACHE.get(n);
  const res = await fetch(`data/hoofdstuk-${n}.json`, { cache: 'no-cache' });
  if (!res.ok) throw new Error(`Hoofdstuk ${n} kon niet worden geladen`);
  const list = await res.json();
  list.forEach(q => QMAP.set(q.id, q));
  CACHE.set(n, list);
  return list;
}

export async function loadChapters(nums) {
  return (await Promise.all(nums.map(loadChapter))).flat();
}

export function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Oefenvolgorde. 'Slim': eerst de foutenvijver, dan nog niet geziene vragen, dan de rest (oudste eerst). */
export function practiceOrder(pool, smart) {
  if (!smart) return shuffle(pool).map(q => q.id);
  const pond = [], fresh = [], rest = [];
  for (const q of shuffle(pool)) {
    const r = record(q.id);
    if (r && r.p) pond.push(q);
    else if (!r) fresh.push(q);
    else rest.push(q);
  }
  rest.sort((a, b) => (record(a.id).l - record(b.id).l) || (record(a.id).t - record(b.id).t));
  return [...pond, ...fresh, ...rest].map(q => q.id);
}

export const examQuestions = (pool, n) => shuffle(pool).slice(0, n).map(q => q.id);

/** Slaagdrempel: 35/50; bij minder vragen dezelfde verhouding (70%), naar boven afgerond. */
export const passThreshold = (total, mark = 35, of = 50) => Math.ceil(total * mark / of);

export const chapterOf = id => parseInt(id.match(/^hs(\d+)-/)[1], 10);
export const fmtTime = s => {
  s = Math.max(0, Math.round(s));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60;
  const mm = String(m).padStart(2, '0'), ss = String(x).padStart(2, '0');
  return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
};
