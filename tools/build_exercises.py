#!/usr/bin/env python3
"""Haalt de cursusopgaven (meerkeuze, met uitwerking) uit de theorie-pdf's en zet ze als `exercises`
in data/theorie/hoofdstuk-N.json. Gebruik: python tools/build_exercises.py"""
import json, re, subprocess
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
PDFS = {4: 'THEORIE_HS4_20260502.pdf', 5: 'THEORIE_HS5_20260526.pdf', 6: 'THEORIE_HS6_20260619.pdf', 17: 'THEORIE_HS17_20260407.pdf', 18: 'THEORIE_HS18_20250330.pdf'}
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
    H = re.compile(rf'^\s*{ch}\.\d+\.\d+\s+(Uitwerking van |Antwoord bij )?Opgave {ch}-(\d+)\s*$')
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
        def qopts(txt):
            a = next((i for i, l in enumerate(txt) if re.match(r'^\s*A\.\s', l)), None)
            q = ' '.join(l.strip() for l in (txt[:a] if a is not None else txt))
            opts = []
            if a is not None:
                for l in txt[a:]:
                    if re.match(r'^\s*(Uitwerking|Antwoord)\b', l): break
                    m = re.match(r'^\s*([A-D])\.\s*(.*)$', l)
                    if m: opts.append({'id': m.group(1), 'text': m.group(2).strip()})
                    elif opts: opts[-1]['text'] += ' ' + l.strip()
            return q, opts
        q0, opts0 = qopts([l.rstrip() for _, l in body])
        sbody, spgs = sols.get(n, ([], []))
        stxt = [l.rstrip() for _, l in sbody]
        q, opts = qopts(stxt)                      # vraag en antwoorden zoals bij de uitwerking (volgorde kan afwijken van de opgave!)
        same = [o['text'] for o in opts] == [o['text'] for o in opts0]
        if not same: print('   volgorde antwoorden verschilt', ch, n)
        if not opts: q, opts = q0, opts0
        u = next((i for i, l in enumerate(stxt) if l.strip().startswith('Uitwerking')), None)
        expl = ' '.join(l.strip() for l in stxt[u + 1:]) if u is not None else ' '.join(l.strip() for l in stxt[next((i for i, l in enumerate(stxt) if re.match(r'^\s*Antwoord', l)), len(stxt)):])
        full = ' '.join(stxt).split('Opmerking')[0]
        full = full.split('Meer opgaven')[0]
        L = r'([A-D])'
        ans = []
        for pat in (rf'Antwoord\s+{L}\s+is\s+(?:het\s+)?(?:juist|goed|de\s+juiste|de\s+goede)', rf'(?:goede|juiste)\s+antwoord\s+is\s+{L}\b', rf'(?:Dat|Dit)\s+(?:is|wordt)\s+antwoord\s+{L}\b', rf'antwoord\s+{L}\s+(?:het\s+juiste|goed\b|dus|is\s+daarom)'):
            ans = [m.group(1) for m in re.finditer(pat, full, re.I)][:1]
            if ans: break
        if not ans:
            hits = [(m.start(), m.group(1)) for m in re.finditer(r'[Aa]ntwoord\s+([A-D])\b', full)]
            ans = [max(hits)[1]] if hits else []
        if not ans: print('   GEEN antwoord', ch, n, full[-150:])
        out.append({'id': f'o{ch}-{n}', 'n': n, 'q': clean(q), 'options': [{'id': o['id'], 'text': clean(o['text'])} for o in opts], 'answer': ans[-1] if ans else None,
                    'explain': clean(expl), 'pages': [f'p{p:03d}' for p in pgs] if same or not sbody else [], 'spages': [f'p{p:03d}' for p in spgs]})
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
