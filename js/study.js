// Leersessie met timer. De timer telt alleen ACTIEVE leertijd: de tijd loopt niet als je een tijdje niets doet
// (geen tik, toets of scroll), als de app op de achtergrond staat of als je op Voortgang/Account kijkt. Alles waarmee je
// leert telt wel mee: vragen maken, theorie lezen, flashcards, formulespel en cursusopgaven.
//
// Waarom een korte, vaste periode? Onderzoek geeft geen exact optimum, maar wel een duidelijk beeld:
//  - concentratie zakt na ongeveer 20-30 minuten merkbaar (vigilantieonderzoek, Mackworth 1948);
//  - gespreid leren wint van één lange sessie: 6 x 30 minuten leert meer dan 1 x 3 uur (Carpenter e.a.);
//  - veel gebruikte blokken zijn 25 tot 50 minuten met 5 tot 15 minuten pauze (Pomodoro-onderzoek is overwegend zelfgerapporteerd).
const KEY = 'flic.study';
const IDLE_MS = 90 * 1000;        // zo lang zonder aanraking blijft de timer nog lopen (je leest of denkt na)
export const PRESETS = [15, 25, 45];

const dayKey = () => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };
const get = () => { try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; } };
const put = v => { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch { /* geen opslag: dan werkt de timer tot herladen */ } };

let st = get();           // { goal (s), active (s), day, ended, q0 (vragen vandaag bij start) } of null
let last = Date.now();    // laatste aanraking
let opts = {};
let sinceSave = 0;
if (st && st.day !== dayKey()) st = null;   // een nieuwe dag begint zonder oude timer

export const current = () => st;
export const remaining = () => (st ? Math.max(0, st.goal - st.active) : 0);
export const isActiveNow = () => !!st && !st.ended && document.visibilityState === 'visible' && Date.now() - last < IDLE_MS && opts.inLearning?.() !== false;

export function start(minutes, q0 = 0) {
  st = { goal: Math.round(minutes * 60), active: 0, day: dayKey(), ended: false, q0 };
  last = Date.now(); put(st); opts.onTick?.();
}
export function extend(minutes) { if (st) { st.goal += minutes * 60; st.ended = false; put(st); opts.onTick?.(); } }
export function stop() { st = null; try { localStorage.removeItem(KEY); } catch { /* */ } opts.onTick?.(); }

export function init(o) {
  opts = o;
  const touch = () => { last = Date.now(); };
  for (const ev of ['pointerdown', 'keydown', 'scroll', 'touchstart', 'wheel']) window.addEventListener(ev, touch, { capture: true, passive: true });
  setInterval(() => {
    if (!st) return;
    if (st.day !== dayKey()) { stop(); return; }
    if (!st.ended && isActiveNow()) {
      st.active++;
      if (++sinceSave >= 5) { sinceSave = 0; put(st); }
      if (st.active >= st.goal && (opts.canInterrupt?.() ?? true)) { st.ended = true; put(st); opts.onEnd?.(st); }
    }
    opts.onTick?.();
  }, 1000);
}

export const fmt = s => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
