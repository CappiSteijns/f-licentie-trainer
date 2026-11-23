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
  trafoU() {
    const [n1, n2] = pick([[900, 300], [1000, 250], [500, 100], [200, 50], [100, 1000], [1000, 5000], [20, 100]]), U1 = pick([12, 24, 100, 230, 240]), U2 = U1 * n2 / n1;
    return { q: `Een ideale transformator heeft ${n1} primaire en ${n2} secundaire windingen. Op de primaire staat ${val(U1, 'V')}. Hoeveel is de secundaire spanning?`, a: U2, unit: 'V', wrong: [U1 * n1 / n2, U1 * n2 / n1 * 3, U1 * (n1 - n2) / n1 || U1 / 2, U2 * 10], how: `U₂ = U₁ · N₂ / N₁ = ${num(U1)} · ${n2} / ${n1}` };
  },
  trafoI() {
    const [n1, n2] = pick([[900, 300], [1000, 250], [500, 100], [200, 50], [100, 1000], [20, 100]]), I2 = pick([0.1, 0.5, 0.9, 2, 4]), I1 = I2 * n2 / n1;
    return { q: `Een ideale transformator heeft ${n1} primaire en ${n2} secundaire windingen. De secundaire levert ${val(I2, 'A')}. Hoeveel stroom loopt er primair?`, a: I1, unit: 'A', wrong: [I2 * n1 / n2, I2 * n2 / n1 * 3, I2 * 10, I1 * 10], how: `I₁ = I₂ · N₂ / N₁ = ${num(I2)} · ${n2} / ${n1}` };
  },
  trafoZ() {
    const [n1, n2] = pick([[900, 300], [1000, 250], [20, 100], [10, 1], [3, 1], [1, 4]]), Z2 = pick([8, 50, 100, 400, 4, 6]), Z1 = Z2 * (n1 / n2) ** 2;
    return { q: `Een ideale transformator heeft ${n1} primaire en ${n2} secundaire windingen. De secundaire is belast met ${val(Z2, 'Ω')}. Welke impedantie ziet de primaire?`, a: Z1, unit: 'Ω', wrong: [Z2 * n1 / n2, Z2 * (n2 / n1) ** 2, Z2 * n2 / n1, Z1 * 10], how: `Z₁ = Z₂ · (N₁/N₂)² = ${num(Z2)} · (${n1}/${n2})²` };
  },
  trafoN() {
    const [Z1, Z2] = pick([[800, 8], [3200, 8], [1000, 10], [450, 50], [200, 50], [200, 2]]), r = Math.sqrt(Z1 / Z2);
    return { q: `Een aanpassingstrafo moet ${val(Z2, 'Ω')} aan de secundaire laten lijken op ${val(Z1, 'Ω')} aan de primaire. Hoeveel is de wikkelverhouding N₁ : N₂ (als getal N₁/N₂)?`, a: r, unit: '', wrong: [Z1 / Z2, r * 2, r + 1, r * 10], how: `N₁/N₂ = √(Z₁/Z₂) = √(${num(Z1)}/${num(Z2)})` };
  },
  rend() {
    const Pin = pick([50, 100, 200, 500]), eta = pick([0.8, 0.9, 0.75, 0.6, 0.96]), Pu = Pin * eta;
    return { q: `Een trafo neemt ${val(Pin, 'W')} op en levert ${val(Pu, 'W')} af. Hoeveel is het rendement (in procenten)?`, a: eta * 100, unit: '%', wrong: [Pu / Pin * 10, Pin / Pu * 100, (1 - eta) * 100, Pu], how: `η = P_uit / P_in · 100% = ${num(Pu)} / ${num(Pin)}` };
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
  lek() {
    const C = pick([2.2e-9, 4.7e-9, 10e-9, 22e-9]), U = 230, f = 50, I = U * 2 * Math.PI * f * 2 * C;
    return { q: `Een netfilter heeft twee Y-condensatoren van ${val(C, 'F')} (fase en nul naar aarde). De aarde is onderbroken en je raakt het chassis aan bij 230 V / 50 Hz. Hoe groot is de lekstroom?`, a: I, unit: 'A', wrong: [I / 2, I * 2, I * 1000, U * f * C * 2], how: `I = U · 2π · f · C_totaal = 230 · 2π · 50 · 2 · ${num(C)}` };
  },
  veilig() {
    const [P, g, E] = pick([[100, 6, 27.7], [400, 10, 27.7], [50, 3, 27.7], [100, 6, 61], [25, 3, 27.7]]), EIRP = P * Math.pow(10, g / 10), d = Math.sqrt(30 * EIRP) / E;
    return { q: `Een zender geeft ${val(P, 'W')} aan een antenne met ${g} dB winst t.o.v. een isotrope antenne (EIRP = P · ${num(Math.pow(10, g / 10))}). De limiet is ${E} V/m. Hoe groot is de veilige afstand?`, a: d, unit: 'm', wrong: [d * d, d / 2, Math.sqrt(EIRP) / E, 30 * EIRP / E], how: `d = √(30 · EIRP) / E = √(30 · ${num(EIRP)}) / ${E}` };
  },
  diss() {
    const [mat, Ud] = pick([['siliciumdiode', 0.6], ['germaniumdiode', 0.2]]), I = pick([0.5, 1, 2, 5, 10]), P = I * Ud;
    return { q: `Door een ${mat} loopt in doorlaatrichting ${val(I, 'A')} (spanning over de diode ≈ ${val(Ud, 'V')}). Hoeveel vermogen dissipeert de diode?`, a: P, unit: 'W', wrong: [I / Ud, I * (Ud === 0.6 ? 0.2 : 0.6), P * 10, P / 10], how: `P = I_F · U_D = ${num(I)} · ${num(Ud)}` };
  },
  umax() {
    const Ue = pick([5, 10, 12, 18, 24, 100, 230]), U = Ue * Math.SQRT2;
    return { q: `Een gelijkrichter met afvlakcondensator krijgt ${val(Ue, 'V')} effectief van de trafo. Hoe groot is de onbelaste gelijkspanning?`, a: U, unit: 'V', wrong: [Ue, Ue / Math.SQRT2, Ue * 2, Ue * 2 * Math.SQRT2], how: `U_max = U_eff · √2 = ${num(Ue)} · 1,414` };
  },
  sper() {
    const Ue = pick([10, 12, 24, 50, 100, 230]), U = 2 * Ue * Math.SQRT2;
    return { q: `Een enkelzijdige gelijkrichter met afvlakcondensator wordt gevoed met ${val(Ue, 'V')} effectief. Waartegen moet de diode minstens kunnen sperren?`, a: U, unit: 'V', wrong: [Ue * Math.SQRT2, Ue * 2, Ue, Ue * 4 * Math.SQRT2], how: `U_sper ≥ 2 · U_max = 2 · U_eff · √2 = 2 · ${num(Ue)} · 1,414` };
  },
  zi() {
    const [Ub, Uz] = pick([[10, 6.8], [12, 5.1], [9, 5.6], [24, 12], [15, 9.1]]), R = pick([100, 220, 470, 1000]), I = (Ub - Uz) / R;
    return { q: `Een zenerdiode van ${val(Uz, 'V')} staat in sperrichting in serie met een weerstand van ${val(R, 'Ω')} op een bron van ${val(Ub, 'V')}. Hoeveel stroom loopt er?`, a: I, unit: 'A', wrong: [Ub / R, Uz / R, (Ub + Uz) / R, I * 10], how: `I = (U_bron − U_Z) / R = (${num(Ub)} − ${num(Uz)}) / ${num(R)}` };
  },
  zr() {
    const [Ub, Uz, Ib, Iz] = pick([[7.4, 5, 0.1, 0.02], [12, 5.6, 0.05, 0.01], [15, 9.1, 0.1, 0.02], [9, 5.1, 0.04, 0.01], [24, 12, 0.2, 0.05]]), R = (Ub - Uz) / (Ib + Iz);
    return { q: `Een zenerdiode moet ${val(Uz, 'V')} stabiliseren uit een bron van ${val(Ub, 'V')}. De belasting neemt ${val(Ib, 'A')} op en door de zener loopt ${val(Iz, 'A')}. Hoe groot moet de voorschakelweerstand zijn?`, a: R, unit: 'Ω', wrong: [(Ub - Uz) / Ib, (Ub - Uz) / Iz, Ub / (Ib + Iz), R * 2], how: `R_s = (U_bron − U_Z) / (I_Z + I_bel) = (${num(Ub)} − ${num(Uz)}) / (${num(Iz)} + ${num(Ib)})` };
  },
  zp() {
    const [Uz, I] = pick([[5.1, 0.02], [6.8, 0.05], [10, 0.3], [12, 0.1], [9.1, 0.04]]), P = Uz * I;
    return { q: `Door een zenerdiode van ${val(Uz, 'V')} loopt ${val(I, 'A')}. Hoeveel vermogen dissipeert de diode?`, a: P, unit: 'W', wrong: [I / Uz, Uz / I, P * 10, P / 10], how: `P_Z = U_Z · I_Z = ${num(Uz)} · ${num(I)}` };
  },
  ledr() {
    const [Ub, Ul, I] = pick([[5, 1.7, 0.02], [12, 2.0, 0.02], [9, 2.1, 0.01], [5, 3.2, 0.02], [12, 1.7, 0.01]]), R = (Ub - Ul) / I;
    return { q: `Een LED (${val(Ul, 'V')}, ${val(I, 'A')}) wordt gevoed uit ${val(Ub, 'V')}. Hoe groot is de serieweerstand?`, a: R, unit: 'Ω', wrong: [Ub / I, Ul / I, (Ub + Ul) / I, R * 10], how: `R = (U_bron − U_LED) / I = (${num(Ub)} − ${num(Ul)}) / ${num(I)}` };
  },
  vari() {
    const n = pick([2, 3, 4]), a = 1 / (n * n);
    return { q: `De resonantiefrequentie van een LC-kring met varicap moet een factor ${n} hoger worden. Met welke factor moet de capaciteit worden vermenigvuldigd?`, a, unit: '', wrong: [1 / n, n, n * n, 1 / (n * n * n)], how: `f ∝ 1/√C, dus C ∝ 1/f². Factor ${n} in f betekent factor 1/${n * n} in C` };
  },
  steil() {
    const [dU, dI] = pick([[1, 3.9], [0.5, 2], [2, 5], [1, 6], [0.2, 1.2], [0.5, 4]]), S = dI / dU;
    return { q: `Bij een FET verandert de gatespanning met ${val(dU, 'V')}. De drainstroom verandert daardoor met ${val(dI / 1000, 'A')}. Hoe groot is de steilheid?`, a: S / 1000, unit: 'A/V', wrong: [dU / (dI / 1000), S, S / 100, S / 10000], how: `S = ΔI_D / ΔU_GS = ${num(dI)} mA / ${num(dU)} V = ${num(S)} mA/V` };
  },
  ires() {
    const S = pick([2, 4, 5, 8, 10]), R = 1000 / S;
    return { q: `De steilheid van een FET of buis is ${S} mA/V. Hoe groot is de weerstand 1/S aan de source- (of kathode-)kant?`, a: R, unit: 'Ω', wrong: [R * 1000, S * 1000, S, R / 10], how: `1/S = 1 / ${S} mA/V = ${num(R)} Ω` };
  },
  aus() {
    const S = pick([2, 4, 5, 8, 10]), RD = pick([2200, 3300, 4700, 5000, 10000]), A = RD * S / 1000;
    return { q: `Een FET (of buis) heeft een steilheid van ${S} mA/V en een drain- of anodeweerstand van ${val(RD, 'Ω')}. Er is geen source- of kathodeweerstand. Hoe groot is de spanningsversterking?`, a: A, unit: '', wrong: [RD / S, RD * S, A * 10, A / 10], how: `Au = R_D · S = ${num(RD)} · ${num(S / 1000)} A/V` };
  },
  aur() {
    const [S, RS, RD] = pick([[4, 1000, 3300], [5, 500, 5000], [10, 1000, 10000], [2, 2200, 6800], [8, 470, 4700]]), A = RD / (RS + 1000 / S);
    return { q: `Een FET met S = ${S} mA/V heeft R_D = ${val(RD, 'Ω')} en R_S = ${val(RS, 'Ω')}. Hoe groot is de spanningsversterking (GSS)?`, a: A, unit: '', wrong: [RD / RS, RD * S / 1000, RD / (1000 / S), A * 2], how: `Au = R_D / (R_S + 1/S) = ${num(RD)} / (${num(RS)} + ${num(1000 / S)})` };
  },
  aure() {
    const [Rc, Re] = pick([[3300, 1000], [4700, 1000], [2000, 500], [10000, 2200], [1500, 470], [6800, 1000]]), A = Rc / Re;
    return { q: `Een transistor in gemeenschappelijke emitterschakeling heeft R_c = ${val(Rc, 'Ω')} en R_e = ${val(Re, 'Ω')}. Hoe groot is de spanningsversterking ongeveer?`, a: A, unit: '', wrong: [Re / Rc, Rc * Re / 1000, A * 10, Rc / (Rc + Re)], how: `Au ≈ R_c / R_e = ${num(Rc)} / ${num(Re)}` };
  },
  ic() {
    const [b, Ib] = pick([[100, 50e-6], [200, 20e-6], [150, 40e-6], [300, 10e-6], [100, 200e-6], [400, 25e-6]]), I = b * Ib;
    return { q: `Een transistor met β = ${b} heeft een basisstroom van ${val(Ib, 'A')}. Hoe groot is de collectorstroom?`, a: I, unit: 'A', wrong: [Ib / b, I * 10, I / 10, I + Ib], how: `I_c = β · I_b = ${b} · ${num(Ib)}` };
  },
  ib() {
    const [b, Ic] = pick([[100, 2e-3], [200, 4e-3], [150, 3e-3], [400, 8e-3], [100, 20e-3], [50, 5e-3]]), I = Ic / b;
    return { q: `De collectorstroom van een transistor is ${val(Ic, 'A')} en β = ${b}. Hoe groot is de basisstroom?`, a: I, unit: 'A', wrong: [Ic * b, I * 10, I / 10, Ic - b * 1e-6], how: `I_b = I_c / β = ${num(Ic)} / ${b}` };
  },
  ie() {
    const [Ic, Ib] = pick([[20e-3, 200e-6], [10e-3, 100e-6], [5e-3, 50e-6], [2e-3, 10e-6], [1e-3, 20e-6]]), I = Ic + Ib;
    return { q: `Door de collector van een transistor loopt ${val(Ic, 'A')} en door de basis ${val(Ib, 'A')}. Hoe groot is de emitterstroom?`, a: I, unit: 'A', wrong: [Ic - Ib, Ic, Ic * Ib, Ic / Ib], how: `I_e = I_c + I_b = ${num(Ic)} + ${num(Ib)}` };
  },
  beta() {
    const [Ic, Ib] = pick([[20e-3, 200e-6], [10e-3, 50e-6], [5e-3, 25e-6], [2e-3, 10e-6], [8e-3, 40e-6]]), b = Ic / Ib;
    return { q: `Een transistor heeft I_c = ${val(Ic, 'A')} en I_b = ${val(Ib, 'A')}. Hoe groot is de stroomversterking β (h_FE)?`, a: b, unit: '', wrong: [b + 1, b - 1, b * 10, Ib / Ic], how: `β = I_c / I_b = ${num(Ic)} / ${num(Ib)}` };
  },
  rb() {
    const [Ub, Ic, b] = pick([[10, 4.5e-3, 100], [12, 2e-3, 200], [9, 3e-3, 150], [15, 6e-3, 100], [10, 2e-3, 100]]), Ib = Ic / b, R = (Ub - 0.6) / Ib;
    return { q: `De basis van een Si-transistor (U_be = 0,6 V) wordt via R_b op ${val(Ub, 'V')} aangesloten. De collectorstroom moet ${val(Ic, 'A')} zijn bij β = ${b}. Hoe groot is R_b?`, a: R, unit: 'Ω', wrong: [Ub / Ib, (Ub + 0.6) / Ib, (Ub - 0.6) / Ic, R / 10], how: `I_b = I_c/β = ${num(Ib)}; R_b = (U_b − 0,6 V) / I_b = ${num(Ub - 0.6)} / ${num(Ib)}` };
  },
  uc() {
    const [Ub, Ic, Rc] = pick([[10, 2e-3, 2000], [12, 3e-3, 1500], [9, 1e-3, 3300], [15, 2e-3, 4700], [10, 4.5e-3, 1000]]), U = Ub - Ic * Rc;
    return { q: `Een transistor staat op ${val(Ub, 'V')}. Door R_c = ${val(Rc, 'Ω')} loopt ${val(Ic, 'A')}. Hoe groot is de collectorspanning t.o.v. massa?`, a: U, unit: 'V', wrong: [Ic * Rc, Ub + Ic * Rc, Ub, Ub / 2], how: `U_c = U_voeding − I_c · R_c = ${num(Ub)} − ${num(Ic * Rc)}` };
  },
  ubase() {
    const [Ie, Re, mat, Ud] = pick([[2e-3, 500, 'silicium', 0.6], [1e-3, 1000, 'silicium', 0.6], [5e-3, 220, 'silicium', 0.6], [1e-3, 470, 'germanium', 0.2], [2e-3, 1000, 'silicium', 0.6]]), Ue = Ie * Re, U = Ue + Ud;
    return { q: `Door de emitterweerstand van ${val(Re, 'Ω')} van een ${mat}transistor loopt ${val(Ie, 'A')}. Hoe groot is de basisspanning t.o.v. massa?`, a: U, unit: 'V', wrong: [Ue, Ue - Ud, Ie * Re * 2, Ue + 0.7 + Ud], how: `U_e = I_e · R_e = ${num(Ue)} V; U_b = U_e + U_be = ${num(Ue)} + ${num(Ud)}` };
  },
  rx() {
    const [b, Re] = pick([[100, 1000], [200, 500], [150, 1000], [300, 470], [100, 2200]]), R = b * Re;
    return { q: `Een transistor met β = ${b} heeft een emitterweerstand van ${val(Re, 'Ω')}. Welke weerstand ‘ziet’ de spanningsdeler vanaf de basis (ongeveer)?`, a: R, unit: 'Ω', wrong: [Re / b, Re, R * 10, b + Re], how: `R_x ≈ β · R_e = ${b} · ${num(Re)}` };
  },
  pce() {
    const [U, I] = pick([[5, 0.1], [6, 0.5], [10, 0.2], [12, 0.05], [4, 1], [8, 0.25]]), P = U * I;
    return { q: `Over een transistor staat ${val(U, 'V')} (collector-emitter) bij een collectorstroom van ${val(I, 'A')}. Hoeveel vermogen dissipeert hij ongeveer?`, a: P, unit: 'W', wrong: [U / I, I / U, P * 10, P / 10], how: `P = U_ce · I_c = ${num(U)} · ${num(I)}` };
  },
  rs() {
    const [U, I] = pick([[3, 8e-3], [2.8, 9e-3], [2, 5e-3], [3, 4e-3], [1.5, 3e-3], [4, 10e-3]]), R = U / I;
    return { q: `Bij een FET geldt I_D = ${val(I, 'A')} en U_GS = −${val(U, 'V')}. Hoe groot is de sourceweerstand R_S?`, a: R, unit: 'Ω', wrong: [U * I, I / U, R * 10, R / 10], how: `De spanning over R_S is −U_GS = ${num(U)} V; R_S = U / I = ${num(U)} / ${num(I)}` };
  },
  rdrs() {
    const [U, I] = pick([[25, 20e-3], [30, 20e-3], [20, 10e-3], [12, 8e-3], [15, 5e-3], [24, 12e-3]]), R = U / I;
    return { q: `Een FET is in serie met R_D en R_S op ${val(U, 'V')} aangesloten. Bij U_DS = 0 V (punt A van de belastingslijn) zou ${val(I, 'A')} lopen. Hoe groot is R_D + R_S?`, a: R, unit: 'Ω', wrong: [U * I, I / U, R * 10, R / 10], how: `R_D + R_S = U_voeding / I_A = ${num(U)} / ${num(I)}` };
  },
  rdd() {
    const [U, Uds, Ugs, I] = pick([[25, 14, 3, 8e-3], [30, 15, 2.8, 9e-3], [24, 12, 2, 5e-3], [20, 10, 2, 4e-3], [15, 8, 1.5, 3e-3]]), R = (U - Uds - Ugs) / I;
    return { q: `Een FET staat op ${val(U, 'V')} met werkpunt U_DS = ${val(Uds, 'V')}, U_GS = −${val(Ugs, 'V')} en I_D = ${val(I, 'A')}. Hoe groot is R_D?`, a: R, unit: 'Ω', wrong: [(U - Uds) / I, (U - Uds + Ugs) / I, Uds / I, R * 10], how: `Over R_D staat U − U_DS − U_RS = ${num(U)} − ${num(Uds)} − ${num(Ugs)} = ${num(U - Uds - Ugs)} V; R_D = U / I_D` };
  },
  pdis() {
    const [U, I] = pick([[14, 8e-3], [10, 20e-3], [25, 10e-3], [12, 15e-3], [20, 5e-3]]), P = U * I;
    return { q: `Over een FET staat U_DS = ${val(U, 'V')} bij een drainstroom van ${val(I, 'A')}. Hoeveel vermogen dissipeert hij?`, a: P, unit: 'W', wrong: [U / I, I / U, P * 10, P / 10], how: `P = I_D · U_DS = ${num(I)} · ${num(U)}` };
  },
  idp() {
    const [P, U] = pick([[0.1, 10], [0.25, 25], [0.5, 10], [1, 20], [0.25, 5]]), I = P / U;
    return { q: `Een element mag maximaal ${val(P, 'W')} dissiperen. Hoe groot mag de stroom hoogstens zijn bij U_DS = ${val(U, 'V')} (punt op de dissipatiehyperbool)?`, a: I, unit: 'A', wrong: [P * U, U / P, I * 10, I / 10], how: `I_D = P / U_DS = ${num(P)} / ${num(U)}` };
  },
  zin() {
    const [R1, R2, b, Re] = pick([[82e3, 33e3, 100, 1e3], [100e3, 47e3, 100, 1e3], [47e3, 22e3, 200, 470], [68e3, 27e3, 150, 680]]), Rx = b * Re, Z = 1 / (1 / R1 + 1 / R2 + 1 / Rx);
    return { q: `Een transistorversterker heeft een spanningsdeler van ${val(R1, 'Ω')} en ${val(R2, 'Ω')}, β = ${b} en R_e = ${val(Re, 'Ω')} (niet ontkoppeld). Hoe groot is de ingangsweerstand ongeveer?`, a: Z, unit: 'Ω', wrong: [R1 + R2 + Rx, 1 / (1 / R1 + 1 / R2), R2, Z * 10], how: `1/Z = 1/${num(R1)} + 1/${num(R2)} + 1/(β·R_e) = 1/${num(R1)} + 1/${num(R2)} + 1/${num(Rx)}` };
  },
  opinv() {
    const [R1, R2, U] = pick([[10e3, 100e3, 0.5], [10e3, 47e3, 1], [1e3, 5e3, 0.2], [2e3, 10e3, 0.5], [5e3, 20e3, 0.1], [10e3, 30e3, 1]]), A = -R2 / R1, Uo = A * U;
    return { q: `Een inverterende opamp heeft R1 = ${val(R1, 'Ω')} (ingang) en tegenkoppelweerstand R2 = ${val(R2, 'Ω')}. De ingangsspanning is +${val(U, 'V')}. Hoe groot is de uitgangsspanning?`, a: Uo, unit: 'V', wrong: [-Uo, U * (1 + R2 / R1), U * R2 / R1 / 10, -U * R1 / R2], how: `Au = −R2/R1 = −${num(R2)}/${num(R1)} = ${num(A)}; Uuit = Au · Uin` };
  },
  opnon() {
    const [R1, R2, U] = pick([[10e3, 90e3, 0.5], [1e3, 9e3, 0.2], [10e3, 47e3, 1], [2e3, 6e3, 0.5], [5e3, 20e3, 0.1], [10e3, 10e3, 1]]), A = 1 + R2 / R1, Uo = A * U;
    return { q: `Een niet-inverterende opamp heeft R1 = ${val(R1, 'Ω')} (naar massa) en tegenkoppelweerstand R2 = ${val(R2, 'Ω')}. De ingangsspanning is ${val(U, 'V')}. Hoe groot is de uitgangsspanning?`, a: Uo, unit: 'V', wrong: [-R2 / R1 * U, R2 / R1 * U, (1 + R1 / R2) * U, Uo * 10], how: `Au = 1 + R2/R1 = 1 + ${num(R2)}/${num(R1)} = ${num(A)}; Uuit = Au · Uin` };
  },
  opver() {
    const [R, U1, U2] = pick([[10e3, 1, 3], [10e3, 2, 5], [10e3, 0.5, 2], [10e3, 4, 1.5], [10e3, 3, 3.5]]), Uo = U2 - U1;
    return { q: `Een verschilversterker met vier gelijke weerstanden van ${val(R, 'Ω')} krijgt U1 = ${val(U1, 'V')} (op de inverterende ingang) en U2 = ${val(U2, 'V')} (op de niet-inverterende ingang). Hoe groot is Uuit?`, a: Uo, unit: 'V', wrong: [-Uo, U1 + U2, -(U1 + U2), U2 * U1], how: `Bij gelijke weerstanden: Uuit = U2 − U1 = ${num(U2)} − ${num(U1)}` };
  },
  opsom() {
    const [U1, U2, U3] = pick([[1, 2, 3], [0.5, 1, 1.5], [2, 2, 1], [1, 0.5, 0.5], [3, 1, 1]]), Uo = -(U1 + U2 + U3);
    return { q: `Een optelversterker met gelijke weerstanden krijgt ingangsspanningen van ${val(U1, 'V')}, ${val(U2, 'V')} en ${val(U3, 'V')}. Hoe groot is de uitgangsspanning?`, a: Uo, unit: 'V', wrong: [-Uo, Uo / 3, (U1 + U2 + U3) / 3, Uo * 2], how: `Uuit = −(U1 + U2 + U3) = −(${num(U1)} + ${num(U2)} + ${num(U3)})` };
  },
  zrs() {
    const [Uin, Uz, Ib, Iz] = pick([[12, 5.1, 20e-3, 10e-3], [15, 9.1, 30e-3, 10e-3], [12, 6.8, 40e-3, 20e-3], [18, 12, 50e-3, 10e-3], [9, 5.6, 10e-3, 5e-3]]), R = (Uin - Uz) / (Ib + Iz);
    return { q: `Een zenerdiode van ${val(Uz, 'V')} stabiliseert de spanning over een belasting uit ${val(Uin, 'V')}. De belasting neemt ${val(Ib, 'A')} op en door de zenerdiode moet minimaal ${val(Iz, 'A')} blijven lopen. Hoe groot is de serieweerstand Rs ongeveer?`, a: R, unit: 'Ω', wrong: [(Uin - Uz) / Ib, (Uin - Uz) / Iz, Uin / (Ib + Iz), R * 10], how: `Over Rs staat ${num(Uin)} − ${num(Uz)} = ${num(Uin - Uz)} V; de stroom is I_bel + I_z = ${num(Ib)} + ${num(Iz)}; Rs = U / I` };
  },
  zpz() {
    const [Uz, Iz] = pick([[5.1, 40e-3], [9.1, 20e-3], [6.8, 50e-3], [12, 30e-3], [5.6, 100e-3]]), P = Uz * Iz;
    return { q: `Door een zenerdiode van ${val(Uz, 'V')} loopt ${val(Iz, 'A')}. Hoeveel vermogen dissipeert de zenerdiode?`, a: P, unit: 'W', wrong: [Uz / Iz, Iz / Uz, P * 10, P / 10], how: `P = U_z · I_z = ${num(Uz)} · ${num(Iz)}` };
  },
  vemit() {
    const [Uz, n] = pick([[9, 1], [12, 1], [6.8, 1], [9.1, 2], [12, 2], [15, 2]]), U = Uz - 0.6 * n;
    return { q: `Een zenerdiode van ${val(Uz, 'V')} stuurt de basis van ${n === 1 ? 'een siliciumtransistor' : 'een Darlington van twee siliciumtransistoren'} als emittervolger. Hoe groot is de uitgangsspanning ongeveer?`, a: U, unit: 'V', wrong: [Uz, Uz + 0.6 * n, Uz - 0.6 * (3 - n), Uz - 0.6 * n * 2], how: `Per basis-emitterovergang gaat circa 0,6 V af: Uuit = ${num(Uz)} − ${n} · 0,6 V` };
  },
  fosc() {
    const [L, C] = pick([[1e-6, 100e-12], [10e-6, 100e-12], [100e-6, 1e-9], [2.2e-6, 220e-12], [4.7e-6, 100e-12], [10e-6, 47e-12]]), f = 1 / (2 * Math.PI * Math.sqrt(L * C));
    return { q: `De afgestemde kring van een LC-oscillator bestaat uit L = ${val(L, 'H')} en C = ${val(C, 'F')}. Op welke frequentie oscilleert hij ongeveer?`, a: f, unit: 'Hz', wrong: [f * 10, f / 10, f * 2 * Math.PI, f / Math.sqrt(10)], how: `f = 1 / (2π · √(L · C)) = 1 / (2π · √(${num(L)} · ${num(C)}))` };
  },
  ovt() {
    const [f0, n] = pick([[3e6, 3], [7e6, 3], [8e6, 5], [10e6, 3], [12e6, 5], [9e6, 3]]), f = f0 * n;
    return { q: `Een kristal heeft een grondtoon van ${val(f0, 'Hz')}. In een overtone-oscillator wordt de ${n}e harmonische benut. Op welke frequentie oscilleert de schakeling ongeveer?`, a: f, unit: 'Hz', wrong: [f0 * (n + 1), f0 * (n - 1), f0 / n, f0 * n * 2], how: `Een overtone-oscillator werkt op een oneven harmonische: ${n} × ${num(f0)}` };
  },
  mill() {
    const [C, A] = pick([[5e-12, 20], [10e-12, 10], [2e-12, 50], [4e-12, 25], [3e-12, 30]]), Ce = C * (A + 1);
    return { q: `Tussen ingang en uitgang van een versterker met spanningsversterking ${A} zit een capaciteit van ${val(C, 'F')}. Hoe groot is de vervangende capaciteit aan de ingang volgens het Miller-effect?`, a: Ce, unit: 'F', wrong: [C * A, C / (A + 1), C * (A - 1), C * A * A], how: `Miller-effect: C · (Au + 1) = ${num(C)} · (${A} + 1)` };
  },
  duty() {
    const [tp, T] = pick([[2e-6, 10e-6], [5e-6, 20e-6], [1e-6, 4e-6], [3e-6, 10e-6], [8e-6, 10e-6]]), D = tp / T * 100;
    return { q: `Een pulsbreedtemodulator geeft pulsen van ${val(tp, 's')} bij een periodeduur van ${val(T, 's')}. Hoe groot is de duty cycle?`, a: D, unit: '%', wrong: [100 - D, T / tp, D * 10, D / 10], how: `D = tp / T = ${num(tp)} / ${num(T)} (in procenten)` };
  },
  ncomb() {
    const n = pick([3, 4, 5, 6, 8, 10, 12]);
    if (Math.random() < 0.5) return { txt: true, q: `Hoeveel verschillende combinaties kun je maken met ${n} bits?`, a: 2 ** n, wrong: [2 * n, n * n, 2 ** n - 1, 2 ** (n + 1)], how: `2ⁿ = 2^${n}` };
    return { txt: true, q: `Wat is het hoogste getal (decimaal) dat je met ${n} bits kunt voorstellen, als je bij 0 begint?`, a: 2 ** n - 1, wrong: [2 ** n, 2 * n, 2 ** (n - 1), n * n], how: `2ⁿ − 1 = 2^${n} − 1` };
  },
  bin2dec() {
    const x = pick([5, 6, 9, 11, 13, 14, 18, 21, 25, 37, 45, 52, 77, 100, 142]), b = x.toString(2);
    return { txt: true, q: `Wat is het binaire getal ${b} in decimale vorm?`, a: x, wrong: [x + 1, x - 1, x * 2, parseInt(b.split('').reverse().join(''), 2)], how: `Tel de bitwaarden (…, 8, 4, 2, 1) op waar een 1 staat in ${b}` };
  },
  dec2bin() {
    const x = pick([5, 6, 9, 11, 13, 14, 18, 21, 25, 37, 45, 52, 77, 100]), b = x.toString(2);
    return { txt: true, q: `Wat is het decimale getal ${x} in binaire vorm?`, a: b, wrong: [(x + 1).toString(2), (x - 1).toString(2), b.split('').reverse().join(''), (x * 2).toString(2)], how: `Deel telkens door 2 en noteer de resten van rechts naar links` };
  },
  bin2hex() {
    const x = pick([0xA5, 0x3C, 0xF0, 0x1B, 0x7E, 0xC9, 0x2F, 0xD4, 0x96]), b = x.toString(2).padStart(8, '0'), h = x.toString(16).toUpperCase();
    return { txt: true, q: `Wat is het binaire getal ${b} in hexadecimale vorm?`, a: h, wrong: [((x + 1) & 255).toString(16).toUpperCase(), ((x ^ 0x0F) & 255).toString(16).toUpperCase(), h.split('').reverse().join(''), ((x >> 1)).toString(16).toUpperCase()], how: `Groepen van 4 bits: ${b.slice(0, 4)} ${b.slice(4)}` };
  },
  binadd() {
    const [a, b] = pick([[5, 3], [9, 6], [7, 7], [11, 5], [13, 9], [6, 10], [14, 3], [9, 9]]), s = (a + b).toString(2);
    return { txt: true, q: `Hoeveel is ${a.toString(2)} + ${b.toString(2)} (binair)?`, a: s, wrong: [(a + b + 1).toString(2), (a + b - 1).toString(2), (a ^ b).toString(2), (a | b).toString(2), (a + b + 2).toString(2), (a + b - 2).toString(2)], how: `Tel op van rechts naar links met carry: ${a} + ${b} = ${a + b}` };
  },
  fdiv() {
    const [f, n] = pick([[1e6, 3], [16e6, 4], [32768, 15], [10e6, 5], [8e3, 3], [1e3, 2], [4e6, 6]]), o = f / 2 ** n;
    return { q: `Een kloksignaal van ${val(f, 'Hz')} gaat door een deler van ${n} flipflops achter elkaar. Hoe groot is de uitgangsfrequentie?`, a: o, unit: 'Hz', wrong: [f / n, f / 2 ** (n + 1), f / 2 ** (n - 1), f * 2 ** n], how: `f_uit = f_klok / 2ⁿ = ${num(f)} / 2^${n}` };
  },
  tel() {
    const n = pick([3, 4, 5, 6, 8]);
    return { txt: true, q: `Een binaire teller bestaat uit ${n} flipflops. Tot welk decimaal getal kan hij hoogstens tellen (vanaf 0)?`, a: 2 ** n - 1, wrong: [2 ** n, 2 * n, n * n, 2 ** (n - 1)], how: `2ⁿ − 1 = 2^${n} − 1` };
  },
  bw() {
    const [f, Q] = pick([[7e6, 70], [455e3, 100], [10.7e6, 50], [145e6, 100], [3.5e6, 35], [1e6, 20]]), B = f / Q;
    return { q: `Een kring heeft f_res = ${val(f, 'Hz')} en Q = ${Q}. Hoe groot is de bandbreedte?`, a: B, unit: 'Hz', wrong: [f * Q, f / (2 * Q), B * 10, B / 10], how: `B = f_res / Q = ${num(f)} / ${Q}` };
  }
};

// ---- vragen samenstellen --------------------------------------------------------
/** @returns {{type,kind,item,prompt,options:[{text,ok}],explain}} */
export function makeQuestion(item, all, forceType) {   // forceType: één soort of een lijst met toegestane soorten
  const types = ['name', 'where'].filter(() => item.f && all.filter(x => x.f).length >= 4);
  if (item.cloze && item.cloze.length) types.push('cloze', 'cloze');
  if (item.pairs && item.pairs.length >= 2) types.push('fact', 'fact', 'fact');
  if (item.gen && GEN[item.gen]) types.push('calc', 'calc', 'calc');
  if (item.rewrite && item.rewrite.length) types.push('rewrite', 'rewrite', 'rewrite');
  if (item.gen && GEN[item.gen] && item.f && all.filter(x => x.f).length >= 4) types.push('pick');   // alleen op verzoek (forceType): komt niet in 'alles door elkaar'
  const allowed = forceType ? types.filter(t => [].concat(forceType).includes(t)) : types.filter(t => t !== 'pick');
  const type = pick(allowed.length ? allowed : types);
  const others = shuffle(all.filter(x => x.id !== item.id && x.f));
  const mk = (right, wrongs) => {
    const seen = new Set([right]); const ws = [];
    for (const w of wrongs) if (!seen.has(w)) { seen.add(w); ws.push(w); }
    return shuffle([{ text: right, ok: true }, ...ws.slice(0, 3).map(text => ({ text, ok: false }))]);
  };
  if (type === 'fact') {   // feiten: [vraag, antwoord]-paren; fout = andere paren van hetzelfde item, daarna van andere items
    const pr = pick(item.pairs), rev = !!item.askRev && Math.random() < 0.5;
    const same = shuffle(item.pairs.filter(x => x !== pr)), other = shuffle(all.filter(x => x.id !== item.id).flatMap(x => x.pairs || []));
    const side = rev ? 'q' : 'a', pool = same.concat(other).map(x => x[side]).filter(t => t !== pr[side]);
    const prompt = rev ? item.askRev.replace('{x}', pr.a) : item.ask.replace('{x}', pr.q);
    return { type, item, prompt, sub: item.name, options: mk(rev ? pr.q : pr.a, pool), explain: `${pr.q}: ${pr.a}` };
  }
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
  if (type === 'pick') {   // welke formule heb je nodig? De formules staan wel bij de antwoorden, maar de opgave zegt niet welke.
    const g = GEN[item.gen](), SAME = [['par', 'par2']];
    const ok = x => x.id !== item.id && x.f && x.f !== item.f && !SAME.some(pr => pr.includes(x.id) && pr.includes(item.id));
    const wrongs = shuffle(all.filter(ok)).map(x => x.f);
    const options = mk(item.f, wrongs);
    const drop = shuffle(options.filter(o => !o.ok)).slice(0, 2).map(o => o.text);
    return { type: 'pick', item, prompt: g.q, ask: 'Welke formule heb je nodig om dit uit te rekenen?', tag: '🧭 Welke formule?', sub: '', mono: true, options, elim: drop,
      hints: ['Schrijf op wat er gegeven is en wat je zoekt. Welke formule verbindt precies die grootheden?', `Waar gaat het over: ${item.where}.`, `Het onderwerp is: ${item.name}.`, 'Twee foute antwoorden zijn weggehaald.'],
      explain: `${item.name}: ${item.f}. Uitwerking: ${g.how} = ${val(g.a, g.unit)}` };
  }
  const g = GEN[item.gen]();
  if (g.txt) {   // antwoord als tekst (binaire en hexadecimale getallen, 0/1)
    const right = String(g.a);
    return { type: 'calc', item, prompt: g.q, sub: item.name, options: mk(right, g.wrong.map(String)), explain: `${g.how} = ${right}`, calc: true };
  }
  const right = val(g.a, g.unit);
  const pad = [g.a * 2, g.a / 2, g.a * 10, g.a * 1.5, g.a / 10];
  return { type: 'calc', item, prompt: g.q, sub: item.name, options: mk(right, g.wrong.concat(pad).filter(Number.isFinite).map(w => val(w, g.unit))), explain: `${g.how} = ${right}`, calc: true };
}

// ---- formule bouwen ----------------------------------------------------------------
const SYM = /^[A-Za-zΑ-Ωα-ωµ]/;
/** 'P = U² / R' -> ['P','=','U','²','/','R']. Een getal direct voor letters ('2π') blijft één blokje. */
export function formulaTokens(f) {
  const re = /\s*(=|·|\/|\+|−|\(|\)|²|√|…|\d+(?:,\d+)?%?[A-Za-zΑ-Ωα-ωµ]*|[A-Za-zΑ-Ωα-ωµ][A-Za-zΑ-Ωα-ωµ₀-₉ᵢₐₑₒₓ]*(?:_[A-Za-z0-9]+)?)/y;
  const out = []; let m; re.lastIndex = 0;
  while (re.lastIndex < f.length && (m = re.exec(f))) out.push(m[1]);
  return re.lastIndex >= f.length ? out : null;
}
export const buildable = it => !!it.f && !/Σ|gevoeligheid/.test(it.f) && it.f.includes('=') && (formulaTokens(it.f) || []).length >= 3 && formulaTokens(it.f).length <= 16;

/** Gelijkwaardige schrijfwijzen tellen mee: a·b = b·a, termen in andere volgorde, a = b als b = a. */
function canonSide(t) {
  let p = 0;
  const isOp = o => t[p] === o;
  function expr() {
    const terms = []; let sign = '+';
    if (isOp('−')) { p++; sign = '−'; } else if (isOp('+')) p++;
    for (;;) {
      terms.push(sign + term());
      if (isOp('+')) { p++; sign = '+'; } else if (isOp('−')) { p++; sign = '−'; } else break;
    }
    return terms.sort().join('');
  }
  function term() {
    const nums = [factor()], dens = [];
    for (;;) {
      if (isOp('·')) { p++; nums.push(factor()); }
      else if (isOp('/')) { p++; dens.push(factor()); }
      else if (p < t.length && !['=', ')', '+', '−', '²', '·', '/'].includes(t[p])) nums.push(factor());   // impliciet vermenigvuldigen
      else break;
    }
    nums.sort(); dens.sort();
    return nums.join('·') + (dens.length ? '/' + dens.join('·') : '');
  }
  function factor() {
    let a;
    if (p >= t.length) throw new Error('syntax');
    if (isOp('(')) { p++; a = '(' + expr() + ')'; if (!isOp(')')) throw new Error('syntax'); p++; }
    else if (isOp('√')) { p++; a = '√' + factor(); }
    else if (['=', ')', '·', '/', '+', '−', '²'].includes(t[p])) throw new Error('syntax');
    else a = t[p++];
    while (isOp('²')) { p++; a += '²'; }
    return a;
  }
  const v = expr();
  if (p !== t.length) throw new Error('syntax');
  return v;
}
export function canonFormula(t) {
  const i = t.indexOf('=');
  if (i < 1 || i === t.length - 1 || t.indexOf('=', i + 1) !== -1) throw new Error('syntax');
  return [canonSide(t.slice(0, i)), canonSide(t.slice(i + 1))].sort().join('=');   // a = b en b = a zijn hetzelfde
}
export function sameFormula(a, b) {
  try { return canonFormula(a.slice()) === canonFormula(b.slice()); } catch { return a.join(' ') === b.join(' '); }
}

/** Een bouwopgave: losse blokjes (de juiste plus een paar afleiders) waar de formule van gemaakt moet worden. */
export function makeBuild(item, all) {
  const tokens = formulaTokens(item.f);
  const has = new Set(tokens);
  const pool = all.filter(x => x.id !== item.id && x.f).flatMap(x => formulaTokens(x.f) || []).filter(x => /^[A-Za-zΑ-Ωα-ωµ][₀-₉ᵢ]?$/.test(x) && x !== 'Σ' && !has.has(x));
  const extra = shuffle([...new Set(pool)]).slice(0, 2);
  const opx = has.has('+') ? '−' : '+';
  const tiles = shuffle([...tokens, ...extra, ...(has.has(opx) ? [] : [opx])]).map((t, i) => ({ id: i, t }));
  return { type: 'build', item, prompt: 'Bouw de formule', sub: '', build: { tokens, tiles, placed: [], locked: 0, tips: 0, wrong: 0 }, options: null,
    hints: [`Waar gaat het over: ${item.where}.`, 'Het eerste deel van de formule staat er nu voor je.', 'De uitwerking: de formule staat er nu.'],
    explain: `${item.name}: ${item.f}` };
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
