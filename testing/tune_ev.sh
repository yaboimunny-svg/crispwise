#!/bin/bash
# usage: ./ev.sh NAME   (scores TRAIN only)
cd /home/claude/tune && mkdir -p runs/$1 && node eval.js runs/$1/raw.jsonl && IDS=train_ids.json RAW=runs/$1/raw.jsonl RES=runs/$1/res.json CSVDIR=runs/$1 python3 score.py >/dev/null && python3 -c "
import json;r=json.load(open('runs/$1/res.json'))
for p in ['paddle','tesseract']:
  a=r[p]['summary']['all'];print('$1',p,'found %.1f%%'%(a['food_found_pct'][0]*100),'strict %.1f'%(a['food_found_strict_pct'][0]*100),'extras',a['extras'],'nfKept',a['nonfood_priced']-round(a['nonfood_dropped_pct'][0]*a['nonfood_priced']),'foodDropped',a['food_dropped_as_nonfood'],'date %.1f'%(a['date_ok_pct'][0]*100),'total %.1f'%(a['total_ok_pct'][0]*100),'fb',a['fallback_used'])"
