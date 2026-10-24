// Handschrift -> som. Herkent cijfers en rekentekens uit pen-streken, volledig op het apparaat (geen internet, geen AI-dienst).
// Methode: streken worden tot tekens gegroepeerd, elk teken wordt als puntenwolk vergeleken met sjablonen ($P-herkenner).
// Sjablonen: ingebouwde standaardvormen, aangevuld met jouw eigen handschrift (trainen en corrigeren).

const N = 32;

// ---- puntenwolken ----------------------------------------------------------------
function resample(strokes, n = N) {
  // Elke streek krijgt een aantal punten naar verhouding van zijn lengte, minstens 2 (zodat stippen, zoals in ÷, meetellen).
  const segs = strokes.filter(s => s.length > 0);
  const lens = segs.map(s => { let l = 0; for (let i = 1; i < s.length; i++) l += Math.hypot(s[i][0] - s[i - 1][0], s[i][1] - s[i - 1][1]); return l; });
  const maxLen = Math.max(...lens, 1e-9);
  const w = lens.map(l => Math.max(l, 0.12 * maxLen));
  const sum = w.reduce((a, b) => a + b, 0);
  let counts = w.map(x => Math.max(2, Math.round(n * x / sum)));
  let diff = counts.reduce((a, b) => a + b, 0) - n;
  for (let guard = 0; diff !== 0 && guard < 200; guard++) {
    const i = diff > 0 ? counts.indexOf(Math.max(...counts)) : counts.indexOf(Math.min(...counts));
    if (diff > 0 && counts[i] <= 2) break;
    counts[i] += diff > 0 ? -1 : 1; diff += diff > 0 ? -1 : 1;
  }
  const out = [];
  segs.forEach((s, si) => {
    const L = lens[si], k = counts[si];
    const cum = [0]; for (let i = 1; i < s.length; i++) cum.push(cum[i - 1] + Math.hypot(s[i][0] - s[i - 1][0], s[i][1] - s[i - 1][1]));
    for (let j = 0; j < k; j++) {
      const target = L < 1e-9 ? 0 : L * (k === 1 ? 0.5 : j / (k - 1));
      let i = 1; while (i < s.length - 1 && cum[i] < target) i++;
      if (s.length === 1) { out.push([s[0][0], s[0][1], si]); continue; }
      const seg = cum[i] - cum[i - 1], t = seg < 1e-12 ? 0 : (target - cum[i - 1]) / seg;
      out.push([s[i - 1][0] + (s[i][0] - s[i - 1][0]) * t, s[i - 1][1] + (s[i][1] - s[i - 1][1]) * t, si]);
    }
  });
  while (out.length > n) out.pop();
  while (out.length < n) out.push(out[out.length - 1]);
  return out;
}
function normalize(cloud) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const [x, y] of cloud) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  const s = Math.max(x1 - x0, y1 - y0) || 1;
  const pts = cloud.map(([x, y]) => [(x - x0) / s, (y - y0) / s]);
  let cx = 0, cy = 0; for (const [x, y] of pts) { cx += x; cy += y; } cx /= pts.length; cy /= pts.length;
  return pts.map(([x, y]) => [x - cx, y - cy]);
}
const cloudOf = strokes => normalize(resample(strokes));
function cloudDist(a, b) {
  const n = a.length, step = Math.floor(Math.pow(n, 0.5)), matched = new Array(n).fill(false);
  let best = Infinity;
  for (let s = 0; s < n; s += step) {
    matched.fill(false);
    let sum = 0, i = s, k = 0;
    do {
      let min = Infinity, idx = -1;
      for (let j = 0; j < n; j++) if (!matched[j]) { const d = Math.hypot(a[i][0] - b[j][0], a[i][1] - b[j][1]); if (d < min) { min = d; idx = j; } }
      matched[idx] = true; sum += (1 - (k++) / n) * min; i = (i + 1) % n;
    } while (i !== s);
    best = Math.min(best, sum);
  }
  return best;
}

// ---- ingebouwde sjablonen ---------------------------------------------------------
const arc = (cx, cy, rx, ry, a0, a1, n = 14) => Array.from({ length: n + 1 }, (_, i) => { const a = a0 + (a1 - a0) * i / n; return [cx + rx * Math.cos(a), cy + ry * Math.sin(a)]; });
const PI = Math.PI;
export const GLYPHS = {
  '0': [[arc(.3, .5, .28, .5, -PI / 2, 1.5 * PI, 24)]],
  '1': [[[[.3, 0], [.3, 1]]], [[[.06, .22], [.3, 0], [.3, 1]]], [[[.08, .2], [.3, 0], [.3, 1]], [[.1, 1], [.5, 1]]]],
  '2': [[[...arc(.3, .28, .27, .28, PI, 2 * PI + .5, 12), [.03, 1], [.6, 1]]]],
  '3': [[[...arc(.28, .25, .26, .25, -PI * .85, PI * .5, 12), ...arc(.28, .75, .3, .25, -PI * .5, PI * .85, 12)]], [[[.05, 0], [.55, 0], [.26, .45], ...arc(.28, .75, .3, .25, -PI * .5, PI * .85, 12)]]],
  '4': [[[[.5, 1], [.5, 0], [.02, .68], [.62, .68]]], [[[.4, 0], [.02, .65], [.6, .65]], [[.45, .15], [.45, 1]]]],
  '5': [[[[.55, 0], [.1, 0], [.08, .45], ...arc(.3, .68, .3, .3, -2.4, 2.3, 12)]], [[[.55, 0], [.1, 0]], [[.1, 0], [.08, .45], ...arc(.3, .68, .3, .3, -2.4, 2.3, 12)]]],
  '6': [[[[.5, 0], [.18, .3], [.04, .65]], arc(.3, .72, .27, .28, PI, 3 * PI, 18)], [[[.5, 0], [.15, .35], ...arc(.3, .72, .27, .28, PI, 3 * PI, 18)]]],
  '7': [[[[.02, 0], [.58, 0], [.2, 1]]], [[[.02, 0], [.58, 0], [.2, 1]], [[.12, .5], [.42, .5]]]],
  '8': [[arc(.3, .25, .22, .24, 0, 2 * PI, 16), arc(.3, .75, .27, .26, 0, 2 * PI, 16)], [Array.from({ length: 33 }, (_, i) => { const t = 2 * PI * i / 32; return [.3 + .27 * Math.sin(2 * t), .5 - .5 * Math.cos(t)]; })]],
  '9': [[arc(.3, .28, .26, .27, 0, 2 * PI, 16), [[.56, .3], [.55, .7], [.35, 1], [.1, .95]]], [[...arc(.3, .28, .26, .27, 0, 2 * PI, 16), [.56, .3], [.55, .75], [.4, 1], [.1, .95]]]],
  '+': [[[[0, .5], [1, .5]], [[.5, 0], [.5, 1]]]],
  '-': [[[[0, .5], [1, .5]]]],
  '=': [[[[0, 0], [1, 0]], [[0, .35], [1, .35]]]],
  '×': [[[[0, 0], [1, 1]], [[1, 0], [0, 1]]]],
  '÷': [[[[0, .5], [1, .5]], [[.5, .05], [.5, .1]], [[.5, .9], [.5, .95]]]],
  '/': [[[[.4, 0], [0, 1]]]],
  '(': [], ')': [],
  ',': [[[[.4, 0], [.1, 1]]]],
};
const ALIAS = { '/': '÷' };
const LABELS = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', '+', '-', '×', '÷', '=', '(', ')', ','];
export const TRAIN_LABELS = LABELS;

// '(' en ')' moeten werkelijk tegengesteld zijn: bouw ze opnieuw uit één boog
(() => {
  const bow = Array.from({ length: 15 }, (_, i) => { const a = -PI / 2 + PI * i / 14; return [Math.cos(a) * .3, Math.sin(a) * .5 + .5]; });   // bol naar rechts
  GLYPHS[')'] = [[bow], [[[0, 0], [.3, .5], [0, 1]]]];
  GLYPHS['('] = [[bow.map(([x, y]) => [.3 - x, y])], [[[.3, 0], [0, .5], [.3, 1]]]];
})();

const jitter = (strokes, amp) => strokes.map(s => s.map(([x, y]) => [x + (Math.random() - .5) * amp, y + (Math.random() - .5) * amp]));
let BUILTIN = null;
function builtin() {
  if (BUILTIN) return BUILTIN;
  BUILTIN = [];
  for (const [ch, variants] of Object.entries(GLYPHS)) for (const v of variants) BUILTIN.push({ ch: ALIAS[ch] || ch, cloud: cloudOf(v) });
  return BUILTIN;
}

// ---- eigen sjablonen (trainen en corrigeren) --------------------------------------
const KEY = 'flic.hw';
let personal = (() => { try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } })();
const savePersonal = () => { try { localStorage.setItem(KEY, JSON.stringify(personal)); } catch { /* negeren */ } };
export const personalCount = () => Object.values(personal).reduce((n, a) => n + a.length, 0);
export function resetPersonal() { personal = {}; savePersonal(); }
/** Leg een voorbeeld van jouw handschrift vast (bijv. uit een correctie of de training). */
export function addSample(ch, strokes) {
  const c = cloudOf(strokes.map(s => s.map(p => [p[0], p[1]])));
  (personal[ch] = personal[ch] || []).push(c.map(([x, y]) => [+x.toFixed(4), +y.toFixed(4)]));
  if (personal[ch].length > 12) personal[ch].shift();
  savePersonal();
}

// ---- tekens herkennen -------------------------------------------------------------
function bbox(strokes) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const s of strokes) for (const [x, y] of s) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  return { x0, y0, x1, y1, w: x1 - x0, h: y1 - y0, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 };
}
/** Beste teken + afstand + alternatieven. */
export function classify(strokes, ctx = {}) {
  const b = bbox(strokes), ref = ctx.refH || Math.max(b.w, b.h);
  const size = Math.max(b.w, b.h);
  // kleine stip onderaan = decimaalteken
  if (strokes.length === 1 && ctx.refH && size < 0.45 * ref && b.cy > (ctx.baseY ?? -Infinity) - 0.3 * ref && b.w < 0.5 * ref) return { ch: ',', d: 0, alts: [] };
  const c = cloudOf(strokes);
  const scores = new Map();
  const consider = (ch, d) => { if (!scores.has(ch) || d < scores.get(ch)) scores.set(ch, d); };
  for (const t of builtin()) consider(t.ch, cloudDist(c, t.cloud));
  for (const [ch, list] of Object.entries(personal)) for (const t of list) consider(ch, cloudDist(c, t) * 0.8);   // eigen handschrift telt zwaarder
  // vlakke vormen: min of is-teken
  const flat = b.h < 0.2 * b.w;
  if (strokes.length === 1 && flat && b.w > 0.6 * ref) { consider('-', 0); }
  const ranked = [...scores.entries()].sort((x, y) => x[1] - y[1]);
  return { ch: ranked[0][0], d: ranked[0][1], alts: ranked.slice(1, 4).map(r => r[0]) };
}

// ---- streken -> tekens (groeperen) -------------------------------------------------
/** strokes: [{ p: [[x,y,..],...], t: tijd(ms, optioneel) }]  in volgorde van tekenen. */
export function groupSymbols(strokes) {
  const syms = [];
  for (const st of strokes) {
    const pts = st.p.map(q => [q[0], q[1]]);
    const b = bbox([pts]);
    let joined = null;
    for (let i = syms.length - 1; i >= Math.max(0, syms.length - 2); i--) {
      const s = syms[i], sb = s.b;
      const bigH = Math.max(10, b.h, ...syms.map(q => q.b.h));
      const tw = Math.max(sb.w, 0.2 * bigH), cw = Math.max(b.w, 0.2 * bigH);
      const a0 = sb.cx - tw / 2, a1 = sb.cx + tw / 2, c0 = b.cx - cw / 2, c1 = b.cx + cw / 2;
      const overlap = Math.min(a1, c1) - Math.max(a0, c0);
      const near = Math.abs(b.cy - sb.cy) < Math.max(Math.max(sb.h, b.h, 10) * 1.6, 0.5 * bigH);
      const gap = st.t != null && s.t1 != null ? st.t - s.t1 : 0;
      if (overlap > 0.3 * Math.min(tw, cw) && near && gap < 1500) { joined = s; break; }
    }
    if (joined) { joined.strokes.push(pts); joined.b = bbox(joined.strokes); joined.t1 = st.t ?? joined.t1; joined.idx.push(st.i); }
    else syms.push({ strokes: [pts], b, t1: st.t, idx: [st.i] });
  }
  return syms;
}

const median = a => { const s = a.slice().sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : 0; };

/** Bouwt de som (rekentekst) en de weergave uit herkende tekens; c.sup = exponent. */
export function compose(cls) {
  let expr = '', shown = '', inExp = false;
  for (const c of cls) {
    if (c.sup && !inExp) { expr += '^('; shown += '^('; inExp = true; }
    if (!c.sup && inExp) { expr += ')'; shown += ')'; inExp = false; }
    expr += c.ch === ',' ? '.' : c.ch; shown += c.ch;
  }
  if (inExp) { expr += ')'; shown += ')'; }
  return { expr, shown };
}

/** Leest de regel waar het laatst getekende teken een "=" is en rekent hem uit. */
export function readLine(strokes, evaluate) {
  const syms = groupSymbols(strokes);
  if (syms.length < 3) return null;
  const last = syms.reduce((m, s) => ((s.t1 ?? 0) >= (m.t1 ?? 0) ? s : m), syms[0]);
  const tall = syms.filter(s => s.strokes.length > 1 || s.b.h > 0.5 * s.b.w).map(s => s.b.h);
  const refH0 = median(tall.length ? tall : syms.map(s => Math.max(s.b.w, s.b.h)));
  const lc = classify(last.strokes, {});
  if (lc.ch !== '=' || lc.d > 1.6) return null;
  // regel = tekens links van '=' die ongeveer op dezelfde hoogte staan en aansluiten
  const band = syms.filter(s => s !== last && s.b.cy > last.b.cy - 1.3 * refH0 && s.b.cy < last.b.cy + 1.3 * refH0 && s.b.x1 <= last.b.x0 + 0.3 * refH0);
  band.sort((a, b2) => a.b.x0 - b2.b.x0);
  const line = [];
  let edge = last.b.x0;
  for (let i = band.length - 1; i >= 0; i--) {
    const s = band[i];
    if (edge - s.b.x1 > 2.2 * refH0) break;
    line.unshift(s); edge = s.b.x0;
  }
  if (line.length < 2) return null;
  // referentiehoogte: cijfers/haakjes, zonder de kleine (exponent, plus, komma)
  const pre = line.map(s => ({ s, ch: classify(s.strokes, {}).ch }));
  const hs = pre.filter(p => /[0-9()]/.test(p.ch)).map(p => p.s.b.h);
  const hmax = Math.max(...hs, 0);
  const big = hs.filter(h => h >= 0.7 * hmax);
  const refH = big.length ? median(big) : refH0;
  const baseY = median(pre.filter(p => /[0-9()]/.test(p.ch) && p.s.b.h >= 0.7 * hmax).map(p => p.s.b.y1)) || median(line.map(s => s.b.y1));
  const cls = line.map(s => ({ s, ...classify(s.strokes, { refH, baseY }) }));
  // exponenten: klein en hoog, vlak na een cijfer of haakje
  let expr = '', shown = '';
  const parts = [];
  cls.forEach((c, i) => {
    const prev = cls[i - 1];
    const sup = prev && /[0-9)]/.test(prev.ch) && c.s.b.h < 0.72 * refH && c.s.b.cy < (prev.s.b.cy - 0.18 * prev.s.b.h) && /[0-9\-]/.test(c.ch) && !(prev.sup && false);
    c.sup = !!sup || (prev && prev.sup && c.s.b.h < 0.8 * refH && c.s.b.cy < baseY - 0.35 * refH && /[0-9\-]/.test(c.ch));
    parts.push(c);
  });
  ({ expr, shown } = compose(parts));
  const nums = (expr.match(/[0-9]+/g) || []).length, ops = /[+\-×÷^]/.test(expr);
  if (nums < 2 || !ops && !/\(/.test(expr)) return { symbols: cls, expr, shown, value: null, anchor: anchorOf(last, refH), last };
  let value = null;
  try { value = evaluate(expr); } catch { value = null; }
  return { symbols: cls, expr, shown, value, anchor: anchorOf(last, refH), last, uncertain: cls.some(c => c.d > 1.9) };
}
const anchorOf = (last, refH) => ({ x: last.b.x1 + 0.45 * refH, y: last.b.cy, h: refH });
