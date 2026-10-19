#!/usr/bin/env python3
"""Controlelijst: toont per vraag het gedetecteerde antwoord naast de slotzin van de uitwerking.
Gebruik: python tools/check_answers.py 4      (voor data/hoofdstuk-4.json)
Wijkt iets af? Zet het juiste antwoord in tools/answer_overrides.json en draai extract_vrza.py opnieuw."""
import json, re, sys
from pathlib import Path
chap = sys.argv[1] if len(sys.argv) > 1 else '3'
data = json.loads((Path(__file__).resolve().parent.parent / 'data' / f'hoofdstuk-{chap}.json').read_text(encoding='utf-8'))
for e in data:
    t = re.sub(r'\s+', ' ', e['explanation'])
    cut = re.split(r'\bOpmerking|\bLet op\b', t)[0]
    hits = list(re.finditer(r'[Aa]ntwoord\s+[ABCD]\b[^.]{0,40}', cut))
    tail = hits[-1].group(0) if hits else cut[-70:]
    opt = next((o['text'] for o in e['options'] if o['id'] == e['answer']), '?')
    print(f"{e['id']:>9}  {e['answer']}  ({opt[:28]:<28})  …{tail}")
