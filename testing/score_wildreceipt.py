"""Scores raw.jsonl against the frozen labels. Rules (from the brief):
- food item found = a kept app item whose price is within 1 cent of its labelled price, each labelled item used once
- strict = found AND normalised name similarity >= 0.6 (letters only, difflib ratio)
- non-food: dropped (not kept) = correct, kept = mistake
- food wrongly dropped = a food item the app filed under non-food (name similarity >= 0.6 to a removed line) and did not keep
- labelled items with no printed price can't be matched on price: excluded and counted
- fees/deposits and 'unclear' items are not scored, but a kept line matching them is not counted as a made-up extra
- a crashed / timed-out / empty run counts as 0 found
"""
import json, csv, re, difflib, math, random, statistics as st
from collections import Counter, defaultdict
GT = json.load(open('gt_all.json')); F = json.load(open('filters.frozen.json')); KEPT = F['kept']
LAB = defaultdict(list)
for r in csv.DictReader(open('item_labels.csv')): LAB[r['receipt']].append(r)
RAW = {}
for l in open('raw.jsonl'):
    r = json.loads(l); RAW[r['id']] = r

def money(s):
    s = str(s or '').replace(' ', '')
    m = re.findall(r'(\d{1,3}(?:[.,]\d{3})*|\d*)[.,](\d{2})(?!\d)', s)
    if not m: return None
    a, c = m[-1]; return float((re.sub(r'[.,]', '', a) or '0') + '.' + c)
def letters(s): return re.sub(r'[^A-Z]', '', str(s).upper())
def nsim(a, b):
    a, b = letters(a), letters(b)
    if not a or not b: return 0.0
    return difflib.SequenceMatcher(None, a, b).ratio()
def name_of(raw):  # the app's raw line minus prices, codes and tax flags
    return re.sub(r'\$?\d+[.,:]\d{2}\b|\b\d{4,}\b|\b[A-Z]{1,2}\b\s*$', ' ', str(raw))
MON = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC']
def valid(y, m, d):
    import datetime
    try: datetime.date(y, m, d); return True
    except Exception: return False
def gt_dates(s):
    s = str(s or '').upper(); out = set()
    for m in re.finditer(r'(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})', s):
        if valid(int(m[1]), int(m[2]), int(m[3])): out.add((int(m[1]), int(m[2]), int(m[3])))
    for m in re.finditer(r'(\d{1,2})[-/. ]*([A-Z]{3})[A-Z]*[-/. ,]*(\d{2,4})', s):
        if m[2] in MON:
            y = int(m[3]); y = y+2000 if y < 100 else y
            if valid(y, MON.index(m[2])+1, int(m[1])): out.add((y, MON.index(m[2])+1, int(m[1])))
    for m in re.finditer(r'([A-Z]{3})[A-Z]*[-/. ]*(\d{1,2})[-/. ,]+(\d{2,4})', s):
        if m[1] in MON:
            y = int(m[3]); y = y+2000 if y < 100 else y
            if valid(y, MON.index(m[1])+1, int(m[2])): out.add((y, MON.index(m[1])+1, int(m[2])))
    for m in re.finditer(r'(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})', s):
        y = int(m[3]); y = y+2000 if y < 100 else y
        if valid(y, int(m[1]), int(m[2])): out.add((y, int(m[1]), int(m[2])))
        if valid(y, int(m[2]), int(m[1])): out.add((y, int(m[2]), int(m[1])))
    return out
KEYWORD = re.compile(r'TOTAL|SUBTOTAL|TAX|HST|GST|VAT|BALANCE|CHANGE|CASH|TEND|VISA|MASTER|DEBIT|CREDIT|CARD|ROUND|DISC|SAV|COUPON|DEPOSIT|ITEMS|QTY|AUTH|APPROV|PAID|DUE', re.I)

def score(path):
    per = []; errs = Counter(); ex_samples = defaultdict(list)
    for rid in sorted(KEPT):
        g = GT[rid]; labs = LAB.get(rid, []); r = RAW.get(rid)
        res = r.get(path) if r else None
        ok = bool(res and res.get('ok'))
        out = (res or {}).get('result') or {'items': [], 'nonFood': [], 'date': None, 'total': None}
        kept = [dict(it, used=False) for it in out['items']]
        text = ((res or {}).get('text') or '') + '\n' + ((res or {}).get('fallback_text') or '')
        row = dict(id=rid, split=g['split'], store=KEPT[rid], ok=ok, error=(res or {}).get('error') if not ok else None,
                   secs=(res or {}).get('secs'), used_fallback=(res or {}).get('used_fallback'))
        food = [x for x in labs if x['kind'] == 'food']; nonf = [x for x in labs if x['kind'] == 'nonfood']; other = [x for x in labs if x['kind'] in ('fee', 'unclear')]
        fp = [x for x in food if money(x['price']) is not None]; nfp = [x for x in nonf if money(x['price']) is not None]
        row.update(labelled_items=len(labs), food_items=len(food), food_priced=len(fp), nonfood_items=len(nonf), nonfood_priced=len(nfp), food_no_price=len(food)-len(fp))
        def take(price):
            for it in kept:
                if not it['used'] and it['price'] is not None and abs(it['price']-price) < .0101: it['used'] = True; return it
            return None
        found = strict = dropped_as_nonfood = 0
        for x in fp:
            p = money(x['price']); it = take(p) if ok else None
            if it:
                found += 1
                if nsim(x['name'], name_of(it['raw'])) >= .6: strict += 1
                else: errs['food found by price, name garbled'] += 1
            else:
                if ok and any(nsim(x['name'], name_of(n)) >= .6 for n in out['nonFood']):
                    dropped_as_nonfood += 1; errs['food wrongly dropped as non-food'] += 1
                elif not ok: errs['run failed (counted as missed)'] += 1
                else:
                    ps = '%.2f' % p
                    if ps in text.replace(',', '.'): errs['price read by OCR but not paired into an item'] += 1
                    else: errs['price not read by OCR'] += 1
        nf_kept = 0
        for x in nfp:
            it = take(money(x['price'])) if ok else None
            if it: nf_kept += 1; errs['non-food kept as food'] += 1
        for x in other:
            if money(x['price']) is not None and ok: take(money(x['price']))
        # a kept line that is a real labelled item with no printed price (e.g. weighed produce) is not made up: match by name
        for x in labs:
            if money(x['price']) is None and ok:
                for it in kept:
                    if not it['used'] and nsim(x['name'], name_of(it['raw'])) >= .6: it['used'] = True; break
        extras = [it for it in kept if not it['used']]
        for it in extras:
            t = 'made-up item: total/tax/payment/discount line' if KEYWORD.search(str(it['raw'])) else ('made-up item: no price' if it['price'] is None else 'made-up item: other line')
            errs[t] += 1; ex_samples[t].append(it['raw'])
        dopt = gt_dates(g.get('Date_value'))
        date_ok = None
        if dopt:
            ad = tuple(map(int, out['date'].split('-'))) if out.get('date') else None
            date_ok = ad in dopt
            if not date_ok: errs['date not read' if ad is None else 'date read wrong'] += 1
        gtot = money(g.get('Total_value'))
        total_ok = None
        if gtot is not None:
            total_ok = out.get('total') is not None and abs(float(out['total'])-gtot) < .0101
            if not total_ok: errs['total not read' if out.get('total') is None else 'total read wrong'] += 1
        row.update(found=found, found_strict=strict, missed=len(fp)-found, extras=len(extras), food_dropped_as_nonfood=dropped_as_nonfood,
                   nonfood_dropped=len(nfp)-nf_kept, nonfood_kept=nf_kept, date_ok=date_ok, total_ok=total_ok,
                   extra_examples=' | '.join(str(e['raw']) for e in extras[:3]))
        per.append(row)
    return per, errs, ex_samples

def wilson(k, n, z=1.96):
    if n == 0: return (0, 0, 0)
    p = k/n; d = 1+z*z/n; c = (p+z*z/(2*n))/d; h = z*math.sqrt(p*(1-p)/n+z*z/(4*n*n))/d
    return (p, c-h, c+h)
def boot(rows, num, den, B=4000, seed=7):
    rnd = random.Random(seed); vals = []
    for _ in range(B):
        s = [rows[rnd.randrange(len(rows))] for _ in rows]; D = sum(den(r) for r in s)
        if D: vals.append(sum(num(r) for r in s)/D)
    if not vals: return (None, None)
    vals.sort(); return vals[int(.025*len(vals))], vals[int(.975*len(vals))]
def summary(per):
    S = lambda k: sum(r[k] or 0 for r in per)
    fp = S('food_priced'); fnd = S('found'); strict = S('found_strict')
    nfp = S('nonfood_priced'); nfd = S('nonfood_dropped')
    dates = [r['date_ok'] for r in per if r['date_ok'] is not None]; tots = [r['total_ok'] for r in per if r['total_ok'] is not None]
    ex = S('extras')
    out = {'receipts': len(per), 'failed_runs': sum(1 for r in per if not r['ok']),
           'food_priced': fp, 'food_no_price': S('food_no_price'), 'food_found': fnd,
           'food_found_pct': wilson(fnd, fp), 'food_found_receipt_boot': boot(per, lambda r: r['found'], lambda r: r['food_priced']),
           'food_found_strict_pct': wilson(strict, fp),
           'food_found_with_extras_pct': wilson(fnd, fp+ex), 'extras': ex, 'extras_per_receipt': ex/len(per),
           'nonfood_priced': nfp, 'nonfood_dropped_pct': wilson(nfd, nfp), 'food_dropped_as_nonfood': S('food_dropped_as_nonfood'),
           'food_dropped_as_nonfood_pct': wilson(S('food_dropped_as_nonfood'), fp),
           'date_ok_pct': wilson(sum(dates), len(dates)), 'total_ok_pct': wilson(sum(tots), len(tots)),
           'secs_mean': st.mean(r['secs'] for r in per if r['secs'] is not None), 'secs_median': st.median(r['secs'] for r in per if r['secs'] is not None),
           'fallback_used': sum(1 for r in per if r.get('used_fallback'))}
    return out
if __name__ == '__main__':
    res = {}
    for path in ['paddle', 'tesseract']:
        per, errs, ex = score(path)
        groups = {'all': per}
        for k in ['split', 'store']:
            for v in sorted(set(r[k] for r in per)): groups[f'{k}:{v}'] = [r for r in per if r[k] == v]
        res[path] = {'summary': {k: summary(v) for k, v in groups.items()}, 'errors': errs.most_common(), 'extra_examples': {k: v[:8] for k, v in ex.items()}}
        with open(f'scans_{path}_wildreceipt.csv', 'w', newline='') as f:
            w = csv.DictWriter(f, fieldnames=list(per[0])); w.writeheader(); w.writerows(per)
    json.dump(res, open('results.json', 'w'), indent=1, default=str)
    for p in res:
        a = res[p]['summary']['all']; print('==', p, json.dumps(a, default=lambda x: round(x, 4) if isinstance(x, float) else x))
        print('   errors', res[p]['errors'][:12])
