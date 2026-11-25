#!/usr/bin/env python3
"""Haalt stellingvragen (stelling/bewering 1 en 2, of schakeling/kabel 1 en 2) uit de vragenbank en
schrijft data/stellingen.json: per vraag de afzonderlijke beweringen met hun waarheidswaarde.
Gebruik: python tools/build_stellingen.py"""
import json, glob, re
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
D1 = r'(?<!\d)1(?!\d)'; D2 = r'(?<!\d)2(?!\d)'

def classify(o):
    t = o.lower()
    if re.search(r'\bg[eé]{1,2}n\b|\bnoch\b', t): return 'none'
    if re.search(r'beide|zowel|' + D1 + r'\s*(?:en|\+|&)\s*(?:\w+\s+)?' + D2, t): return 'both'
    a, b = re.search(D1, t), re.search(D2, t)
    if a and not b: return 'only1'
    if b and not a: return 'only2'
    return None

TAILQ = r'\s*(Wat is juist|Wat is er juist|Welke(?: van de (?:twee )?[a-z]+)? is juist|Juist is|Wat klopt|Welke bewering is juist|Welke uitspraak is juist)\s*[:?.]?\s*$'

def parse(q):
    t = q['question']
    cl = {o['id']: classify(o['text']) for o in q['options']}
    if sorted(v or '' for v in cl.values()) != ['both', 'none', 'only1', 'only2']: return None
    r = cl[q['answer']]
    t1, t2 = r in ('only1', 'both'), r in ('only2', 'both')
    m = re.split(r'(?:Stelling|Bewering|Uitspraak)\s*[12]\s*[:.]?\s*', t, flags=re.I)
    if len(m) == 3:
        s1 = re.sub(TAILQ, '', m[1].strip(), flags=re.I).strip(); s2 = re.sub(TAILQ, '', m[2].strip(), flags=re.I).strip()
        if not s1 or not s2: return None
        return dict(kind='stelling', pre=m[0].strip(), items=[dict(t=s1, ok=t1), dict(t=s2, ok=t2)])
    m = re.split(r'(?:^|\s)([12])\.\s+', t)
    if len(m) == 5 and m[1] == '1' and m[3] == '2':
        s1 = re.sub(TAILQ, '', m[2].strip(), flags=re.I).strip(); s2 = re.sub(TAILQ, '', m[4].strip(), flags=re.I).strip()
        return dict(kind='stelling', pre=m[0].strip(), items=[dict(t=s1, ok=t1), dict(t=s2, ok=t2)])
    # figuurvraag: "… schakeling 1 / schakeling 2"
    lab = {}
    for o in q['options']:
        c = cl[o['id']]
        if c in ('only1', 'only2'):
            x = re.sub(r'(?i)^\s*(alleen|uitsluitend|slechts|enkel|bij|in|met|op|zowel)\s+', '', o['text'].strip().rstrip('.'))
            x = re.sub(r'(?i)^(alleen|uitsluitend|bij|in|met|op)\s+', '', x)
            x = ('Schakeling ' + x) if re.fullmatch(r'\d', x) else x
            lab[c] = x[:1].upper() + x[1:]
    if len(lab) == 2 and re.search(D1, lab['only1']) and re.search(D2, lab['only2']) and q.get('qFull'):
        return dict(kind='fig', pre=t, items=[dict(t=lab['only1'], ok=t1), dict(t=lab['only2'], ok=t2)])
    return None

out = {}
for p in glob.glob(str(ROOT / 'data/hoofdstuk-*.json')):
    for q in json.load(open(p)):
        r = parse(q)
        if r: out[q['id']] = r
json.dump(out, open(ROOT / 'data/stellingen.json', 'w'), ensure_ascii=False, indent=1)
from collections import Counter
print(len(out), sorted(Counter(int(i.split('-')[0][2:]) for i in out).items()))
for i, r in out.items(): print(i, r['kind'], [x['ok'] for x in r['items']], '|', r['pre'][:60], '|', r['items'][0]['t'][:55], '|', r['items'][1]['t'][:55])
