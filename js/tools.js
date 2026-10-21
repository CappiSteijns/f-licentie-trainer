// Hulpmiddelen tijdens oefenen en examen: rekenmachine (naar het voorbeeld van de Casio fx-82NL) en kladblok.
// Geen eval: de invoer wordt door een eigen kleine parser berekend.

const $ = (tag, props = {}, ...kids) => {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (v == null || v === false) continue;
    if (k.startsWith('on')) e.addEventListener(k.slice(2), v); else if (k === 'class') e.className = v; else e.setAttribute(k, v === true ? '' : v);
  }
  for (const k of kids.flat()) if (k != null && k !== false) e.append(k.nodeType ? k : document.createTextNode(k));
  return e;
};

// ---------------------------------------------------------------- rekenen
const FUNCS = {
  sin: (x, d) => Math.sin(d ? x * Math.PI / 180 : x), cos: (x, d) => Math.cos(d ? x * Math.PI / 180 : x), tan: (x, d) => Math.tan(d ? x * Math.PI / 180 : x),
  asin: (x, d) => (d ? 180 / Math.PI : 1) * Math.asin(x), acos: (x, d) => (d ? 180 / Math.PI : 1) * Math.acos(x), atan: (x, d) => (d ? 180 / Math.PI : 1) * Math.atan(x),
  log: x => Math.log10(x), ln: x => Math.log(x), '√': x => Math.sqrt(x),
};

export function tokenize(src) {
  const t = []; let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (c === ' ') { i++; continue; }
    if (/[0-9.]/.test(c)) {
      let j = i; while (j < src.length && /[0-9.]/.test(src[j])) j++;
      if (src[j] === 'E' && /[-+]?[0-9]/.test(src.slice(j + 1, j + 3))) { j++; if (/[-+]/.test(src[j])) j++; while (j < src.length && /[0-9]/.test(src[j])) j++; }
      const v = Number(src.slice(i, j).replace('E', 'e')); if (!Number.isFinite(v)) throw new Error('syntax');
      t.push({ n: v }); i = j; continue;
    }
    if (src.startsWith('Ans', i)) { t.push({ ans: 1 }); i += 3; continue; }
    const f = Object.keys(FUNCS).sort((a, b) => b.length - a.length).find(k => src.startsWith(k + '(', i));
    if (f) { t.push({ f }); i += f.length; continue; }
    if (c === 'π') { t.push({ n: Math.PI }); i++; continue; }
    if (c === 'e' && src[i + 1] === '^') { t.push({ n: Math.E }); i++; continue; }
    if (src.startsWith('⁻¹', i)) { t.push({ op: 'inv' }); i += 2; continue; }
    if ('+-×÷^()²'.includes(c)) { t.push({ op: c }); i++; continue; }
    throw new Error('syntax');
  }
  return t;
}

export function evaluate(src, { deg = true, ans = 0 } = {}) {
  const t = tokenize(src); let p = 0;
  const peek = () => t[p], isOp = o => t[p] && t[p].op === o;
  const startsFactor = x => x && (x.n !== undefined || x.ans || x.f || x.op === '(');
  function expr() { let v = term(); for (;;) { if (isOp('+')) { p++; v += term(); } else if (isOp('-')) { p++; v -= term(); } else return v; } }
  function term() {
    let v = impl();
    for (;;) {
      if (isOp('×')) { p++; v *= impl(); } else if (isOp('÷')) { p++; const d = impl(); if (d === 0) throw new Error('math'); v /= d; } else return v;
    }
  }
  function impl() { let v = unary(); while (startsFactor(peek())) v *= unary(); return v; }   // 2π, 3(4+1): impliciet vermenigvuldigen
  function unary() { if (isOp('-')) { p++; return -unary(); } if (isOp('+')) { p++; return unary(); } return power(); }
  function power() { let b = postfix(); if (isOp('^')) { p++; b = Math.pow(b, unary()); } return b; }
  function postfix() {
    let v = primary();
    for (;;) { if (isOp('²')) { p++; v = v * v; } else if (isOp('inv')) { p++; if (v === 0) throw new Error('math'); v = 1 / v; } else return v; }
  }
  function primary() {
    const x = t[p++]; if (!x) throw new Error('syntax');
    if (x.n !== undefined) return x.n;
    if (x.ans) return ans;
    if (x.op === '(') { const v = expr(); if (isOp(')')) p++; return v; }
    if (x.f) { const v = expr(); if (isOp(')')) p++; const r = FUNCS[x.f](v, deg); if (!Number.isFinite(r)) throw new Error('math'); return r; }
    throw new Error('syntax');
  }
  const v = expr(); if (p < t.length) throw new Error('syntax');
  if (!Number.isFinite(v)) throw new Error('math');
  return v;
}

const PREFIX = { '-12': 'p', '-9': 'n', '-6': 'µ', '-3': 'm', 0: '', 3: 'k', 6: 'M', 9: 'G', 12: 'T' };
const comma = s => s.replace('.', ',');
const SUP = { '-': '⁻', 0: '⁰', 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸', 9: '⁹' };
const sup = n => String(n).split('').map(c => SUP[c]).join('');
/** Gewone weergave (10 cijfers); ver buiten het bereik wetenschappelijk. */
export function fmt(v) {
  if (v === 0) return '0';
  const a = Math.abs(v);
  if (a >= 1e10 || a < 1e-9) { const [m, e] = v.toExponential(9).split('e'); return comma(`${+m}×10${sup(+e)}`); }
  return comma(String(+v.toPrecision(10)));
}
/** Technische notatie (ENG): exponent een veelvoud van 3; shift verplaatst de komma (zoals de ENG-toets). */
export function fmtEng(v, shift = 0) {
  if (v === 0) return '0';
  let e = Math.floor(Math.log10(Math.abs(v)) / 3) * 3 + 3 * shift;
  const m = +(v / Math.pow(10, e)).toPrecision(10);
  const pre = PREFIX[e];
  return comma(`${m}×10${sup(e)}`) + (pre !== undefined && pre !== '' ? `  (${pre})` : '');
}

// ---------------------------------------------------------------- rekenmachine
function buildCalc(onClose) {
  let ex = '', res = '', ans = 0, deg = true, second = false, fresh = false, lastV = null, engShift = 0, err = false;
  const disp = $('div', { class: 'cx' }), out = $('div', { class: 'cr' }), mode = $('div', { class: 'cm' });
  const draw = () => {
    disp.textContent = ex.replace(/\./g, ',') || '0'; out.textContent = err ? 'Fout' : res; mode.textContent = `${deg ? 'DEG' : 'RAD'}${second ? ' · 2nd' : ''}`;
    disp.scrollLeft = disp.scrollWidth;
  };
  const ins = s => {
    if (err) { ex = ''; err = false; res = ''; }
    if (fresh) { ex = /^[+\-×÷^²]|^⁻¹/.test(s) ? 'Ans' : ''; res = ''; fresh = false; }
    ex += s; draw();
  };
  const equals = () => {
    if (!ex) return;
    try { lastV = evaluate(ex, { deg, ans }); ans = lastV; res = fmt(lastV); err = false; engShift = -1; } catch { err = true; lastV = null; }
    fresh = true; draw();
  };
  const press = k => {
    const f2 = { sin: 'asin', cos: 'acos', tan: 'atan' };
    switch (k) {
      case 'AC': ex = ''; res = ''; err = false; fresh = false; draw(); return;
      case 'DEL': if (fresh) { fresh = false; } ex = ex.replace(/(asin\(|acos\(|atan\(|sin\(|cos\(|tan\(|log\(|ln\(|√\(|Ans|10\^\(|e\^\(|⁻¹|.)$/u, ''); draw(); return;
      case '=': equals(); return;
      case '2nd': second = !second; draw(); render(); return;
      case 'DEG': deg = !deg; draw(); render(); return;
      case 'ENG': if (lastV != null) { engShift++; res = fmtEng(lastV, engShift - 0); fresh = true; draw(); } return;
      case 'sin': case 'cos': case 'tan': ins((second ? f2[k] : k) + '('); break;
      case 'log': ins(second ? '10^(' : 'log('); break;
      case 'ln': ins(second ? 'e^(' : 'ln('); break;
      case '√': ins('√('); break;
      case 'x²': ins('²'); break;
      case 'x⁻¹': ins('⁻¹'); break;
      case 'xʸ': ins('^'); break;
      case 'EXP': ins('E'); break;
      case ',': ins('.'); break;
      case 'Ans': ins('Ans'); break;
      default: ins(k);
    }
    if (second && ['sin', 'cos', 'tan', 'log', 'ln'].includes(k)) { second = false; draw(); render(); }
  };
  const rows = [['2nd', 'DEG', 'ENG', 'DEL', 'AC'], ['sin', 'cos', 'tan', 'log', 'ln'], ['x²', 'xʸ', '√', 'x⁻¹', 'π'], ['7', '8', '9', '(', ')'], ['4', '5', '6', '×', '÷'], ['1', '2', '3', '+', '-'], ['0', ',', 'EXP', 'Ans', '=']];
  const lbl = { '-': '−', sin: () => (second ? 'sin⁻¹' : 'sin'), cos: () => (second ? 'cos⁻¹' : 'cos'), tan: () => (second ? 'tan⁻¹' : 'tan'), log: () => (second ? '10ˣ' : 'log'), ln: () => (second ? 'eˣ' : 'ln') };
  const keys = $('div', { class: 'ck' });
  const render = () => keys.replaceChildren(...rows.flat().map(k => {
    const l = lbl[k]; const txt = typeof l === 'function' ? l() : (l || k);
    const cls = k === '=' ? 'eq' : /^[0-9,]$/.test(k) ? 'num' : ['AC', 'DEL'].includes(k) ? 'clr' : '';
    return $('button', { type: 'button', class: cls + (k === '2nd' && second ? ' on' : ''), onclick: () => press(k) }, txt);
  }));
  render(); draw();
  const panel = $('div', { class: 'tpanel calc', role: 'dialog', 'aria-label': 'Rekenmachine', tabindex: '-1' },
    $('div', { class: 'thead' }, $('b', {}, 'Rekenmachine'), mode, $('button', { type: 'button', class: 'ghost small', 'aria-label': 'Sluiten', onclick: onClose }, '✕')),
    $('div', { class: 'cdisp' }, disp, out), keys);
  panel.addEventListener('keydown', e => {
    const m = { Enter: '=', '=': '=', Backspace: 'DEL', Delete: 'AC', '*': '×', '/': '÷', '.': ',', ',': ',', '-': '-', '+': '+', '(': '(', ')': ')', '^': 'xʸ', e: 'EXP', E: 'EXP' };
    if (e.key === 'Escape') return onClose();
    const k = /^[0-9]$/.test(e.key) ? e.key : m[e.key];
    if (k) { e.preventDefault(); press(k); }
  });
  return panel;
}

// ---------------------------------------------------------------- kladblok
function buildPad(onClose) {
  const strokes = []; let cur = null, color = 'auto', size = 3, eraser = false;
  const cv = $('canvas', { class: 'pad-cv', 'aria-label': 'Kladblok: teken met je vinger of muis' });
  const ink = () => (color === 'auto' ? getComputedStyle(document.body).color : color);
  const draw = () => {
    const ctx = cv.getContext('2d'), r = devicePixelRatio || 1;
    ctx.setTransform(r, 0, 0, r, 0, 0); ctx.clearRect(0, 0, cv.width, cv.height); ctx.lineCap = ctx.lineJoin = 'round';
    for (const s of strokes) {
      ctx.globalCompositeOperation = s.er ? 'destination-out' : 'source-over'; ctx.strokeStyle = s.c; ctx.fillStyle = s.c; ctx.lineWidth = s.w;
      ctx.beginPath(); s.p.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      if (s.p.length === 1) { ctx.arc(s.p[0][0], s.p[0][1], s.w / 2, 0, 7); ctx.fill(); } else ctx.stroke();
    }
    ctx.globalCompositeOperation = 'source-over';
  };
  const fit = () => {
    const r = devicePixelRatio || 1, b = cv.getBoundingClientRect();
    if (!b.width) return; cv.width = Math.round(b.width * r); cv.height = Math.round(b.height * r); draw();
  };
  const pos = e => { const b = cv.getBoundingClientRect(); return [e.clientX - b.left, e.clientY - b.top]; };
  cv.addEventListener('pointerdown', e => { cv.setPointerCapture(e.pointerId); cur = { c: ink(), w: eraser ? size * 5 : size, er: eraser, p: [pos(e)] }; strokes.push(cur); draw(); });
  cv.addEventListener('pointermove', e => { if (!cur) return; cur.p.push(pos(e)); draw(); });
  const end = () => { cur = null; };
  cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
  new ResizeObserver(fit).observe(cv);
  const tool = (label, on, aria) => $('button', { type: 'button', class: 'ghost small', 'aria-label': aria || label, onclick: on }, label);
  const sw = (c, txt) => $('button', { type: 'button', class: 'sw', style: `background:${c === 'auto' ? 'var(--text)' : c}`, 'aria-label': txt, onclick: () => { color = c; eraser = false; sync(); } });
  const bPen = tool('✏️', () => { eraser = false; sync(); }, 'Pen'), bEr = tool('Gum', () => { eraser = true; sync(); });
  const sync = () => { bPen.classList.toggle('on', !eraser); bEr.classList.toggle('on', eraser); };
  sync();
  const panel = $('div', { class: 'tpanel pad', role: 'dialog', 'aria-label': 'Kladblok' },
    $('div', { class: 'thead' }, $('b', {}, 'Kladblok'),
      $('span', { class: 'tools' }, bPen, sw('auto', 'Wit/zwart'), sw('#4da3ff', 'Blauw'), sw('#f85149', 'Rood'), sw('#3fb950', 'Groen'), bEr,
        tool('↶', () => { strokes.pop(); draw(); }, 'Ongedaan maken'), tool('Wis', () => { strokes.length = 0; draw(); }, 'Alles wissen')),
      $('button', { type: 'button', class: 'ghost small', 'aria-label': 'Sluiten', onclick: onClose }, '✕')),
    cv);
  panel.fit = fit; panel.redraw = draw;
  return panel;
}

// ---------------------------------------------------------------- aanzetten
let calc, pad, fab, open = null;
function show(which) {
  open = open === which ? null : which;
  for (const [k, el] of [['calc', calc], ['pad', pad]]) el.hidden = open !== k;
  document.body.classList.toggle('tool-open', !!open);
  if (open === 'pad') { pad.fit(); } if (open === 'calc') calc.focus();
  fab.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.k === open));
}
export function initTools() {
  if (fab) return;
  calc = buildCalc(() => show('calc')); pad = buildPad(() => show('pad'));
  calc.hidden = pad.hidden = true;
  fab = $('div', { class: 'tfab', hidden: true },
    $('button', { type: 'button', 'data-k': 'calc', 'aria-label': 'Rekenmachine', title: 'Rekenmachine', onclick: () => show('calc') }, '🧮'),
    $('button', { type: 'button', 'data-k': 'pad', 'aria-label': 'Kladblok', title: 'Kladblok', onclick: () => show('pad') }, '✏️'));
  document.body.append(fab, calc, pad);
}
/** Knoppen tonen/verbergen; bij verbergen sluiten de panelen ook (de tekening blijft bewaard). */
export function setToolsVisible(on) {
  initTools(); fab.hidden = !on;
  if (!on && open) show(open);
  document.body.classList.toggle('has-tools', on);
}
