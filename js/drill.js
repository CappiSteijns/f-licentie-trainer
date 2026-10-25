// Formule-spel: maakt vragen uit de formule-gegevens van een hoofdstuk (data/theorie/hoofdstuk-N.json -> "drill").
// Soorten vragen: naam -> formule, formule -> waar hoort het bij, invullen, en rekenopgaven met willekeurige getallen.

const rnd = n => Math.floor(Math.random() * n);
const pick = a => a[rnd(a.length)];
export const shuffle = a => { const r = a.slice(); for (let i = r.length - 1; i > 0; i--) { const j = rnd(i + 1); [r[i], r[j]] = [r[j], r[i]]; } return r; };

// ---- getallen netjes weergeven (SI-voorvoegsel, komma) ----------------------
const PRE = [[1e6, 'M'], [1e3, 'k'], [1, ''], [1e-3, 'm'], [1e-6, 'µ'], [1e-9, 'n'], [1e-12, 'p']];
export function val(x, unit) {
  if (x === 0) return ('0 ' + unit).trim();
  const a = Math.abs(x);
  const [f, p] = PRE.find(([f]) => a >= f * 0.9995) || PRE[PRE.length - 1];
  const m = +(x / f).toPrecision(3);
  return (String(m).replace('.', ',') + ' ' + p + unit).trim();
}
const SUPD = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
const num = x => {
  const a = Math.abs(x);
  if (a !== 0 && (a < 1e-3 || a >= 1e7)) {
    const [m, e] = x.toExponential(3).split('e');
    return String(+m).replace('.', ',') + '·10' + String(+e).split('').map(c => SUPD[c]).join('');
  }
  return String(+x.toPrecision(4)).replace('.', ',');
};

// ---- rekenopgaven -------------------------------------------------------------
// Elke generator geeft { q, a (juist, getal), unit, wrong: [getallen], how } terug.
const R_LIST = [10, 47, 100, 220, 470, 1000, 2200, 4700];
const GEN = {
  ohm() {
    const v = pick(['I', 'U', 'R']);
    if (v === 'I') { const U = pick([3, 5, 9, 12, 24]), R = pick(R_LIST), I = U / R;
      return { q: `Over een weerstand van ${val(R, 'Ω')} staat ${val(U, 'V')}. Hoe groot is de stroom?`, a: I, unit: 'A', wrong: [U * R, R / U, I * 10, I / 10], how: `I = U / R = ${num(U)} / ${num(R)}` }; }
    if (v === 'U') { const I = pick([0.002, 0.01, 0.025, 0.1, 0.5, 2]), R = pick([10, 47, 100, 220, 1000]), U = I * R;
      return { q: `Door een weerstand van ${val(R, 'Ω')} loopt ${val(I, 'A')}. Hoe groot is de spanning erover?`, a: U, unit: 'V', wrong: [I / R, R / I, U * 10, U / 10], how: `U = I · R = ${num(I)} · ${num(R)}` }; }
    const U = pick([5, 12, 24]), I = pick([0.01, 0.05, 0.1, 0.5, 2]), R = U / I;
    return { q: `Over een weerstand staat ${val(U, 'V')} en er loopt ${val(I, 'A')} doorheen. Hoe groot is de weerstand?`, a: R, unit: 'Ω', wrong: [U * I, I / U, R * 10, R / 10], how: `R = U / I = ${num(U)} / ${num(I)}` };
  },
  charge() {
    const I = pick([0.5, 2, 5, 10]), t = pick([10, 60, 120, 600]), Q = I * t;
    return { q: `Door een draad loopt ${val(I, 'A')} gedurende ${t} s. Hoeveel lading is er doorheen gestroomd?`, a: Q, unit: 'C', wrong: [I / t, t / I, Q * 10, Q / 10], how: `Q = I · t = ${num(I)} · ${t}` };
  },
  pui() {
    const U = pick([5, 12, 13.8, 24]), I = pick([0.1, 0.5, 2, 5]), P = U * I;
    return { q: `Een apparaat heeft ${val(U, 'V')} aan zijn klemmen en neemt ${val(I, 'A')} op. Hoeveel vermogen is dat?`, a: P, unit: 'W', wrong: [U / I, I / U, P * 10, P / 10], how: `P = U · I = ${num(U)} · ${num(I)}` };
  },
  pir() {
    const I = pick([0.02, 0.1, 0.5, 2]), R = pick([10, 100, 470, 1000]), P = I * I * R;
    return { q: `Door een weerstand van ${val(R, 'Ω')} loopt ${val(I, 'A')}. Hoeveel vermogen dissipeert hij?`, a: P, unit: 'W', wrong: [I * R, I * I / R, 2 * I * R, P * 10], how: `P = I² · R = ${num(I)}² · ${num(R)}` };
  },
  pur() {
    const U = pick([5, 12, 24, 230]), R = pick([47, 100, 220, 1000]), P = U * U / R;
    return { q: `Over een weerstand van ${val(R, 'Ω')} staat ${val(U, 'V')}. Hoeveel vermogen dissipeert hij?`, a: P, unit: 'W', wrong: [U / R, U * R, 2 * U / R, P * 10], how: `P = U² / R = ${num(U)}² / ${num(R)}` };
  },
  energy() {
    const P = pick([5, 40, 100, 1000]), t = pick([60, 600, 3600]), W = P * t;
    return { q: `Een apparaat van ${val(P, 'W')} staat ${t >= 3600 ? '1 uur' : t / 60 + ' minuten'} aan. Hoeveel energie gebruikt het?`, a: W, unit: 'J', wrong: [P / t, t / P, W / 60, W * 10], how: `W = P · t = ${num(P)} · ${num(t)} s` };
  },
  serie() {
    const [a, b, c] = [pick([100, 220, 470]), pick([330, 680, 1000]), pick([47, 150, 220])], R = a + b + c;
    return { q: `Drie weerstanden van ${val(a, 'Ω')}, ${val(b, 'Ω')} en ${val(c, 'Ω')} staan in serie. Wat is de totale weerstand?`, a: R, unit: 'Ω', wrong: [1 / (1 / a + 1 / b + 1 / c), (a + b + c) / 3, R * 10, R / 10], how: `R = R₁ + R₂ + R₃ = ${a} + ${b} + ${c}` };
  },
  par2() {
    const [a, b] = pick([[100, 100], [100, 300], [200, 300], [150, 300], [600, 300], [1000, 1500], [330, 330], [1200, 400]]), R = a * b / (a + b);
    return { q: `Twee weerstanden van ${val(a, 'Ω')} en ${val(b, 'Ω')} staan parallel. Wat is de vervangingsweerstand?`, a: R, unit: 'Ω', wrong: [a + b, (a + b) / 2, Math.min(a, b) * 2, R * 10], how: `R = R₁·R₂ / (R₁ + R₂) = ${a}·${b} / ${a + b}` };
  },
  div() {
    const U = pick([5, 9, 12, 24]), [r1, r2] = pick([[1000, 1000], [1000, 3000], [3000, 1000], [2000, 2000]]), U2 = U * r2 / (r1 + r2);
    return { q: `Een spanningsdeler: R₁ = ${val(r1, 'Ω')} in serie met R₂ = ${val(r2, 'Ω')} aan ${val(U, 'V')}. Hoeveel staat er over R₂?`, a: U2, unit: 'V', wrong: [U * r1 / (r1 + r2), U * r2 / r1, U / 2 + (r1 === r2 ? 1 : 0), U2 * 2].filter(x => x !== U2), how: `U₂ = U · R₂ / (R₁ + R₂) = ${num(U)} · ${num(r2)} / ${num(r1 + r2)}` };
  },
  wire() {
    const l = pick([10, 50, 100]), A = pick([0.5, 1, 2.5, 4]), R = 0.017 * l / A;
    return { q: `Een koperdraad (ρ = 0,017 Ω·mm²/m) is ${l} m lang en heeft een doorsnede van ${num(A)} mm². Hoe groot is de weerstand?`, a: R, unit: 'Ω', wrong: [0.017 * A / l, 0.017 * l * A, R * 10, R / 10], how: `R = ρ · l / A = 0,017 · ${l} / ${num(A)}` };
  },
  klem() {
    const E = pick([12, 13.8, 6]), Ri = pick([0.1, 0.2, 0.5]), I = pick([1, 2, 5, 10]), U = E - I * Ri;
    return { q: `Een bron met EMK ${num(E)} V en inwendige weerstand ${val(Ri, 'Ω')} levert ${val(I, 'A')}. Hoe groot is de klemspanning?`, a: U, unit: 'V', wrong: [E + I * Ri, E - I / Ri, E, E - 2 * I * Ri], how: `U = E − I · Rᵢ = ${num(E)} − ${num(I)} · ${num(Ri)}` };
  },
  bel() {
    const [E, Ri, Rb] = pick([[12, 2, 4], [12, 1, 5], [9, 1, 8], [24, 2, 10], [12, 2, 10], [6, 2, 1]]), I = E / (Ri + Rb);
    return { q: `Een bron met EMK ${E} V en inwendige weerstand ${Ri} Ω wordt belast met ${Rb} Ω. Hoe groot is de stroom?`, a: I, unit: 'A', wrong: [E / Rb, E / Ri, E / Math.abs(Rb - Ri), I * 2].filter(x => Number.isFinite(x)), how: `I = E / (Rᵢ + R_b) = ${E} / (${Ri} + ${Rb})` };
  },
  accu() {
    const [C, I] = pick([[60, 3], [7, 0.5], [2, 0.5], [12, 2], [100, 5]]), t = C / I;
    return { q: `Een accu van ${C} Ah levert een constante stroom van ${val(I, 'A')}. Hoeveel uur gaat hij mee?`, a: t, unit: 'h', wrong: [C * I, I / C, t * 10, t / 2], how: `t = C / I = ${C} / ${num(I)}` };
  },

  // ---- hoofdstuk 4: velden, condensatoren, spoelen ----
  efield() {
    const U = pick([5, 12, 100, 230, 1000]), dmm = pick([0.5, 1, 2, 5]), E = U / (dmm / 1000);
    return { q: `Tussen twee platen op ${num(dmm)} mm afstand staat ${val(U, 'V')}. Hoe groot is de elektrische veldsterkte?`, a: E, unit: 'V/m', wrong: [U / dmm, U * dmm, E / 10, E * 10], how: `E = U / d = ${num(U)} / ${num(dmm / 1000)}` };
  },
  qcu() {
    const C = pick([100e-9, 1e-6, 10e-6, 470e-6, 22e-6]), U = pick([5, 12, 100, 400]), Q = C * U;
    return { q: `Een condensator van ${val(C, 'F')} is opgeladen tot ${val(U, 'V')}. Hoeveel lading zit erop?`, a: Q, unit: 'C', wrong: [U / C, C / U, Q * 10, Q / 10], how: `Q = C · U = ${num(C)} · ${num(U)}` };
  },
  cplate() {
    const er = pick([1, 2, 4.3]), A = pick([10, 20, 50, 100]), d = pick([0.1, 0.2, 0.5, 1]), C = 0.0885 * er * A / d * 1e-12;
    return { q: `Een plaatcondensator heeft platen van ${A} cm², een plaatafstand van ${num(d)} cm en εr = ${num(er)}. Hoe groot is de capaciteit?`, a: C, unit: 'F', wrong: [0.0885 * er * d / A * 1e-12, C * 10, C / 10, C * 2], how: `C = 0,0885 · εr · A / d = 0,0885 · ${num(er)} · ${A} / ${num(d)} pF` };
  },
  taurc() {
    const R = pick([1e3, 10e3, 100e3, 470e3, 1e6]), C = pick([100e-12, 10e-9, 100e-9, 1e-6, 10e-6]), t = R * C;
    return { q: `Een condensator van ${val(C, 'F')} wordt opgeladen via een weerstand van ${val(R, 'Ω')}. Hoe groot is de tijdconstante?`, a: t, unit: 's', wrong: [t * 10, t / 10, t * 2 * Math.PI, t / (2 * Math.PI)], how: `τ = R · C = ${num(R)} · ${num(C)}` };
  },
  taurl() {
    const L = pick([10e-3, 100e-3, 1, 2.2]), R = pick([10, 100, 1e3, 470]), t = L / R;
    return { q: `Een spoel van ${val(L, 'H')} staat in serie met een weerstand van ${val(R, 'Ω')}. Hoe groot is de tijdconstante?`, a: t, unit: 's', wrong: [L * R, R / L, t * 10, t / 10], how: `τ = L / R = ${num(L)} / ${num(R)}` };
  },
  cpar() {
    const [a, b, c] = [pick([100e-9, 220e-9, 1e-6]), pick([47e-9, 470e-9, 2.2e-6]), pick([10e-9, 100e-9, 680e-9])], C = a + b + c;
    return { q: `Drie condensatoren van ${val(a, 'F')}, ${val(b, 'F')} en ${val(c, 'F')} staan parallel. Wat is de totale capaciteit?`, a: C, unit: 'F', wrong: [1 / (1 / a + 1 / b + 1 / c), C / 3, C * 10, C / 10], how: `C = C₁ + C₂ + C₃ = ${num(a)} + ${num(b)} + ${num(c)}` };
  },
  cser() {
    const [a, b] = pick([[100e-12, 100e-12], [100e-12, 300e-12], [200e-9, 300e-9], [1e-6, 1e-6], [470e-12, 1e-9], [6e-6, 3e-6]]), C = a * b / (a + b);
    return { q: `Twee condensatoren van ${val(a, 'F')} en ${val(b, 'F')} staan in serie. Wat is de totale capaciteit?`, a: C, unit: 'F', wrong: [a + b, (a + b) / 2, Math.min(a, b) * 2, C * 10], how: `C = C₁·C₂ / (C₁ + C₂) = ${num(a)}·${num(b)} / (${num(a)} + ${num(b)})` };
  },
  // ---- hoofdstuk 5: wisselspanning, reactantie, resonantie, filters ----
  freq() {
    if (Math.random() < 0.5) { const T = pick([2e-3, 20e-3, 1e-3, 100e-6, 10e-6]), f = 1 / T;
      return { q: `Een golfvorm heeft een periodeduur van ${val(T, 's')}. Hoe groot is de frequentie?`, a: f, unit: 'Hz', wrong: [T, f * 2, f / 2, f * Math.PI * 2], how: `f = 1 / T = 1 / ${num(T)}` }; }
    const f = pick([50, 500, 1e3, 10e3, 7e6]), T = 1 / f;
    return { q: `Een signaal heeft een frequentie van ${val(f, 'Hz')}. Hoe lang duurt één periode?`, a: T, unit: 's', wrong: [f, T * 2, T / 2, T * Math.PI * 2], how: `T = 1 / f = 1 / ${num(f)}` };
  },
  ueff() {
    if (Math.random() < 0.5) { const Um = pick([10, 6, 325, 12, 50]), Ue = Um / Math.SQRT2;
      return { q: `Een sinusvormige wisselspanning heeft een amplitude van ${val(Um, 'V')}. Hoe groot is de effectieve waarde?`, a: Ue, unit: 'V', wrong: [Um * Math.SQRT2, Um / 2, Um, Um * 0.5 * Math.SQRT2 / 2], how: `U_eff = U_max / √2 = ${num(Um)} / 1,414` }; }
    const Ue = pick([230, 10, 12, 5]), Um = Ue * Math.SQRT2;
    return { q: `Een sinusvormige wisselspanning heeft een effectieve waarde van ${val(Ue, 'V')}. Hoe groot is de amplitude (top)?`, a: Um, unit: 'V', wrong: [Ue / Math.SQRT2, Ue * 2, Ue, Ue * Math.PI], how: `U_max = U_eff · √2 = ${num(Ue)} · 1,414` };
  },
  pyth() {
    const [a, b] = pick([[3, 4], [30, 40], [6, 8], [5, 12], [50, 120]]), c = Math.hypot(a, b);
    return { q: `Twee wisselspanningen van ${val(a, 'V')} en ${val(b, 'V')} verschillen 90° in fase. Hoe groot is de som?`, a: c, unit: 'V', wrong: [a + b, Math.abs(a - b), (a + b) / 2, c * 2], how: `U = √(U₁² + U₂²) = √(${num(a)}² + ${num(b)}²)` };
  },
  xc() {
    const f = pick([100, 1e3, 10e3, 1e6, 7e6]), C = pick([100e-9, 1e-6, 10e-9, 100e-12, 1e-9]), X = 1 / (2 * Math.PI * f * C);
    return { q: `Een condensator van ${val(C, 'F')} staat aan ${val(f, 'Hz')}. Hoe groot is de reactantie?`, a: X, unit: 'Ω', wrong: [1 / (f * C), X * 10, X / 10, X * 2], how: `X_C = 1 / (2π·f·C) = 1 / (2π · ${num(f)} · ${num(C)})` };
  },
  xl() {
    const f = pick([50, 1e3, 10e3, 1e6, 7e6]), L = pick([1e-3, 10e-3, 100e-6, 1e-6, 10e-6]), X = 2 * Math.PI * f * L;
    return { q: `Een spoel van ${val(L, 'H')} staat aan ${val(f, 'Hz')}. Hoe groot is de reactantie?`, a: X, unit: 'Ω', wrong: [f * L, X * 10, X / 10, X / (2 * Math.PI)], how: `X_L = 2π·f·L = 2π · ${num(f)} · ${num(L)}` };
  },
  fres() {
    const [L, C] = pick([[1e-6, 100e-12], [10e-3, 100e-9], [100e-6, 1e-9], [1e-3, 1e-6], [10e-6, 100e-12], [2.2e-6, 47e-12]]), f = 1 / (2 * Math.PI * Math.sqrt(L * C));
    return { q: `Een LC-kring heeft L = ${val(L, 'H')} en C = ${val(C, 'F')}. Wat is de resonantiefrequentie?`, a: f, unit: 'Hz', wrong: [f * 2 * Math.PI, f / (2 * Math.PI), f * 2, f / 2], how: `f = 1 / (2π·√(L·C)) = 1 / (2π · √(${num(L)} · ${num(C)}))` };
  },
  zser() {
    const [R, X] = pick([[3, 4], [30, 40], [60, 80], [100, 100], [500, 1200]]), Z = Math.hypot(R, X);
    return { q: `Een weerstand van ${val(R, 'Ω')} staat in serie met een reactantie van ${val(X, 'Ω')}. Hoe groot is de impedantie?`, a: Z, unit: 'Ω', wrong: [R + X, Math.abs(X - R), R * X / (R + X), (R + X) / 2], how: `Z = √(R² + X²) = √(${num(R)}² + ${num(X)}²)` };
  },
  fkrc() {
    const R = pick([100, 1e3, 10e3, 100e3]), C = pick([10e-9, 100e-9, 1e-6, 1e-9]), f = 1 / (2 * Math.PI * R * C);
    return { q: `Een RC-laagdoorlaatfilter heeft R = ${val(R, 'Ω')} en C = ${val(C, 'F')}. Wat is de kantelfrequentie?`, a: f, unit: 'Hz', wrong: [1 / (R * C), f * 2 * Math.PI, f * 2, f / 10], how: `f_k = 1 / (2π·R·C) = 1 / (2π · ${num(R)} · ${num(C)})` };
  },
  fkrl() {
    const R = pick([100, 1e3, 470, 50]), L = pick([1e-3, 10e-3, 100e-6, 1e-6]), f = R / (2 * Math.PI * L);
    return { q: `Een RL-laagdoorlaatfilter heeft R = ${val(R, 'Ω')} en L = ${val(L, 'H')}. Wat is de kantelfrequentie?`, a: f, unit: 'Hz', wrong: [R / L, f * 2 * Math.PI, f * 2, f / 10], how: `f_k = R / (2π·L) = ${num(R)} / (2π · ${num(L)})` };
  },
  qfac() {
    const [X, R] = pick([[1000, 10], [500, 5], [200, 4], [1200, 20], [90, 3]]), Q = X / R;
    return { q: `Een seriekring heeft bij resonantie X_L = ${val(X, 'Ω')} en een verliesweerstand van ${val(R, 'Ω')}. Hoe groot is Q?`, a: Q, unit: '', wrong: [X * R, X + R, Q * 10, Q / 10], how: `Q = X_L / R_verlies = ${num(X)} / ${num(R)}` };
  },
  bw() {
    const [f, Q] = pick([[7e6, 70], [455e3, 100], [10.7e6, 50], [145e6, 100], [3.5e6, 35], [1e6, 20]]), B = f / Q;
    return { q: `Een kring heeft f_res = ${val(f, 'Hz')} en Q = ${Q}. Hoe groot is de bandbreedte?`, a: B, unit: 'Hz', wrong: [f * Q, f / (2 * Q), B * 10, B / 10], how: `B = f_res / Q = ${num(f)} / ${Q}` };
  }
};

// ---- vragen samenstellen --------------------------------------------------------
/** @returns {{type,kind,item,prompt,options:[{text,ok}],explain}} */
export function makeQuestion(item, all, forceType) {   // forceType: één soort of een lijst met toegestane soorten
  const types = ['name', 'where'].filter(() => item.f);
  if (item.cloze && item.cloze.length) types.push('cloze', 'cloze');
  if (item.gen && GEN[item.gen]) types.push('calc', 'calc', 'calc');
  if (item.rewrite && item.rewrite.length) types.push('rewrite', 'rewrite', 'rewrite');
  const allowed = forceType ? types.filter(t => [].concat(forceType).includes(t)) : types;
  const type = pick(allowed.length ? allowed : types);
  const others = shuffle(all.filter(x => x.id !== item.id && x.f));
  const mk = (right, wrongs) => {
    const seen = new Set([right]); const ws = [];
    for (const w of wrongs) if (!seen.has(w)) { seen.add(w); ws.push(w); }
    return shuffle([{ text: right, ok: true }, ...ws.slice(0, 3).map(text => ({ text, ok: false }))]);
  };
  if (type === 'name') {
    return { type, item, prompt: `Welke formule hoort bij “${item.name}”?`, mono: true, options: mk(item.f, others.map(o => o.f)), explain: `${item.name}: ${item.f}` };
  }
  if (type === 'where') {
    return { type, item, prompt: 'Waar hoort deze formule bij?', formula: item.f, options: mk(item.name, others.map(o => o.name)), explain: `${item.f} hoort bij: ${item.name} (${item.where}).` };
  }
  if (type === 'cloze') {
    const c = pick(item.cloze);
    return { type, item, prompt: c.q.replace('___', '＿＿＿'), mono: !!item.f && /[=/·²]/.test(c.q), sub: item.name, options: mk(c.a, c.w), explain: `${c.q.replace('___', c.a)}${item.f ? ' — ' + item.name + ': ' + item.f : ''}` };
  }
  if (type === 'rewrite') {
    const r = pick(item.rewrite);
    return { type, item, prompt: `Werk de formule om naar ${r.ask}:`, formula: r.base, mono: true, sub: item.name, options: mk(r.a, r.w), explain: `${r.base}  →  ${r.a}` };
  }
  const g = GEN[item.gen]();
  const right = val(g.a, g.unit);
  const pad = [g.a * 2, g.a / 2, g.a * 10, g.a * 1.5, g.a / 10];
  return { type: 'calc', item, prompt: g.q, sub: item.name, options: mk(right, g.wrong.concat(pad).filter(Number.isFinite).map(w => val(w, g.unit))), explain: `${g.how} = ${right}`, calc: true };
}

// ---- eenheden omrekenen (voorvoegsels) --------------------------------------------
const PX = { G: 1e9, M: 1e6, k: 1e3, '': 1, m: 1e-3, 'µ': 1e-6, n: 1e-9, p: 1e-12 };
const plain = x => { const v = +x.toPrecision(7); return String(v).includes('e') ? v.toFixed(12).replace(/0+$/, '').replace(/\.$/, '').replace('.', ',') : String(v).replace('.', ','); };
const UNITS = ['V', 'A', 'Ω', 'W'];
const CONV = [['k', ''], ['', 'k'], ['', 'm'], ['m', ''], ['m', 'µ'], ['µ', 'm'], ['M', 'k'], ['M', ''], ['', 'M'], ['m', 'k'], ['k', 'm']];
export const UNIT_ITEM = { id: 'conv', sec: 's21', name: 'Eenheden omrekenen', where: 'omrekenen tussen voorvoegsels' };
export function unitQuestion() {
  const OK = { M: ['Ω', 'W'], k: ['V', 'Ω', 'W'], m: ['V', 'A', 'W'], 'µ': ['A', 'V'], '': UNITS };   // alleen voorvoegsels die in de praktijk voorkomen
  const [from, to] = pick(CONV), u = pick(OK[from].filter(x => OK[to].includes(x)));
  const v = pick([0.47, 1.5, 2.2, 4.7, 10, 22, 47, 100, 220, 470, 3.3, 0.68]);
  const r = v * PX[from] / PX[to];
  const wrong = [r * 10, r / 10, r * 1000, r / 1000, r * 100, r / 100].filter(x => plain(x) !== plain(r));
  const ws = shuffle(wrong).slice(0, 3);
  const opts = shuffle([{ text: `${plain(r)} ${to}${u}`, ok: true }, ...ws.map(x => ({ text: `${plain(x)} ${to}${u}`, ok: false }))]);
  const name = p => ({ G: 'giga (10⁹)', M: 'mega (10⁶)', k: 'kilo (10³)', '': 'zonder voorvoegsel', m: 'milli (10⁻³)', 'µ': 'micro (10⁻⁶)', n: 'nano (10⁻⁹)' }[p]);
  return { type: 'units', item: UNIT_ITEM, sub: 'Omrekenen', prompt: `Reken om: ${plain(v)} ${from}${u} = ? ${to}${u}`, options: opts,
    explain: `${plain(v)} ${from}${u} = ${plain(r)} ${to}${u}. (${from || '—'}: ${name(from)}; ${to || '—'}: ${name(to)})` };
}
