#!/usr/bin/env python3
"""Haalt de cursusopgaven (meerkeuze, met uitwerking) uit de theorie-pdf's en zet ze als `exercises`
in data/theorie/hoofdstuk-N.json. Gebruik: python tools/build_exercises.py"""
import json, re, subprocess
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
PDFS = {4: 'THEORIE_HS4_20260502.pdf', 5: 'THEORIE_HS5_20260526.pdf', 6: 'THEORIE_HS6_20260619.pdf'}
FOOT = re.compile(r'^\s*(©.*|VRZA-cursus.*|\d+|\d+-\d+)\s*$')

def pages(pdf):
    t = subprocess.run(['pdftotext', '-layout', str(pdf), '-'], capture_output=True, text=True).stdout
    return t.split('\f')

PUA = {'\uf057': 'Ω', '\uf06d': 'µ'}
def clean(t): return ''.join(PUA.get(c, c) for c in t)

def parse(ch, pdf):
    pg = pages(pdf)
    # lijst van (paginanr, regel)
    lines = [(i + 1, l) for i, p in enumerate(pg) for l in p.split('\n')]
    H = re.compile(rf'^\s*{ch}\.\d+\.\d+\s+(Uitwerking van )?Opgave {ch}-(\d+)\s*$')
    heads = [(k, bool(m.group(1)), int(m.group(2))) for k, (_, l) in enumerate(lines) if (m := H.match(l))]
    def block(idx):
        k = heads[idx][0]; end = heads[idx + 1][0] if idx + 1 < len(heads) else len(lines)
        body = [(p, l) for p, l in lines[k + 1:end] if not FOOT.match(l) and l.strip()]
        pgs = sorted({lines[k][0]} | {p for p, _ in body})
        return body, pgs
    ops, sols = {}, {}
    for i, (k, sol, n) in enumerate(heads):
        (sols if sol else ops)[n] = block(i)
    out = []
    for n in sorted(ops):
        body, pgs = ops[n]
        txt = [l.rstrip() for _, l in body]
        a = next((i for i, l in enumerate(txt) if re.match(r'^\s*A\.\s', l)), None)
        q = ' '.join(l.strip() for l in (txt[:a] if a is not None else txt))
        opts = []
        if a is not None:
            for l in txt[a:]:
                m = re.match(r'^\s*([A-D])\.\s*(.*)$', l)
                if m: opts.append({'id': m.group(1), 'text': m.group(2).strip()})
                elif opts: opts[-1]['text'] += ' ' + l.strip()
        sbody, spgs = sols.get(n, ([], []))
        stxt = [l.rstrip() for _, l in sbody]
        u = next((i for i, l in enumerate(stxt) if l.strip().startswith('Uitwerking')), None)
        expl = ' '.join(l.strip() for l in stxt[u + 1:]) if u is not None else ''
        full = ' '.join(stxt).split('Opmerking')[0]
        full = full.split('Meer opgaven')[0]
        hits = [(m.start(), m.group(1)) for m in re.finditer(r'[Aa]ntwoord\s+([A-D])\b', full)] + \
               [(m.start(), m.group(1)) for m in re.finditer(r'(?:goede|juiste)\s+antwoord\s+is\s+([A-D])\b', full, re.I)]
        ans = [max(hits)[1]] if hits else []
        if not ans: print('   GEEN antwoord', ch, n, full[-150:])
        out.append({'id': f'o{ch}-{n}', 'n': n, 'q': clean(q), 'options': [{'id': o['id'], 'text': clean(o['text'])} for o in opts], 'answer': ans[-1] if ans else None,
                    'explain': clean(expl), 'pages': [f'p{p:03d}' for p in pgs], 'spages': [f'p{p:03d}' for p in spgs]})
    return out

for ch, name in PDFS.items():
    ex = parse(ch, ROOT / 'bronnen' / name)
    f = ROOT / 'data' / 'theorie' / f'hoofdstuk-{ch}.json'
    d = json.loads(f.read_text(encoding='utf-8'))
    img = ROOT / 'img' / 'theorie' / f'hs{ch}'
    for e in ex:
        e['pages'] = [p for p in e['pages'] if (img / f'{p}.webp').exists()]
        e['spages'] = [p for p in e['spages'] if (img / f'{p}.webp').exists()]
        bad = (len(e['options']) != 4 or not e['answer'])
        print(ch, e['id'], 'LET OP' if bad else 'ok', e['answer'], e['pages'], e['spages'], '|', e['q'][:60])
    d['exercises'] = ex
    f.write_text(json.dumps(d, ensure_ascii=False, indent=1), encoding='utf-8')
