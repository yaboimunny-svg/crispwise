# Improved parser: held-out results

**App tested:** `index.html` at commit `16dbdb8aa03801e73e82b9ba7792601b5ec698f2` (parser and filter changes only, on top of baseline `a438bd25`). `sw.js` cache bumped to `crispwise-v6`.

**Honest split:** tuning used only the 86 WildReceipt *train* receipts, using cached OCR and a replay harness (`tune_*` files). The 55 validation + test receipts, their OCR and their errors were not opened until the final run. The final run is the same frozen pipeline as the baseline, uncached, on all 141 receipts, with the same filters, labels and scorer.

## Headline (held out, 55 receipts, 380 priced food items)

Food items found: **81.3% (77.1–84.9)**, up from 81.1% (76.8–84.7). That is +0.2 points, well inside the margin of error, so call it no change. Made-up items: **53, down from 63** (0.96 per receipt, from 1.15). Date correct: **86.8%, up from 60.5%**. 55 receipts is a small sample; treat all of this as rough.

## What didn't improve (held out)
1. **Food found is flat** (81.1% → 81.3%). The fixes cut junk and fixed dates; they didn't find more real items on unseen receipts. The +1.8-point gain on train didn't carry over.
2. **Total correct unchanged at 60.0%.** None of the fixes targeted totals.
3. **Non-food still slips in:** 20.7% → 19.3% kept as food. Better, but still about 1 in 5.

## Held out (55: 19 validation + 36 test)

| Measure | Baseline PaddleOCR | Improved PaddleOCR | Baseline Tesseract | Improved Tesseract |
|---|---|---|---|---|
| Food items found (price ±1¢) | 81.1% (76.8–84.7) | 81.3% (77.1–84.9) | 73.4% (68.8–77.6) | 73.4% (68.8–77.6) |
| Strict: price + name | 74.5% (69.9–78.6) | 75.0% (70.4–79.1) | 69.7% (64.9–74.1) | 69.7% (64.9–74.1) |
| Found, made-up items counted against | 69.5% (65.1–73.6) | 71.4% (66.9–75.4) | 65.6% (61.0–70.0) | 66.1% (61.5–70.5) |
| Non-food correctly dropped | 79.5% (72.6–85.0) | 80.7% (74.0–86.1) | 88.8% (83.0–92.8) | 89.4% (83.7–93.3) |
| Date correct | 60.5% (44.7–74.4) | 86.8% (72.7–94.2) | 68.4% (52.5–80.9) | 76.3% (60.8–87.0) |
| Total correct | 60.0% (45.5–73.0) | 60.0% (45.5–73.0) | 53.3% (39.1–67.1) | 53.3% (39.1–67.1) |
| Made-up items (per receipt) | 63 (1.15) | 53 (0.96) | 45 (0.82) | 42 (0.76) |
| Non-food kept as food | 33 of 161 | 31 of 161 | 18 | 17 |
| Food wrongly dropped as non-food | 8 | 8 | n/a | n/a |
| Seconds per receipt (mean) | 6.9 | 7.1 | 3.3 | 3.3 |
| Tesseract fallback used | 7 | 7 | – | – |

## Train (86, tuned on, not a fair test)

| Measure | Baseline PaddleOCR | Improved PaddleOCR | Baseline Tesseract | Improved Tesseract |
|---|---|---|---|---|
| Food items found (price ±1¢) | 77.7% (73.2–81.5) | 79.5% (75.2–83.2) | 66.8% (61.9–71.3) | 67.3% (62.4–71.8) |
| Strict: price + name | 67.8% (63.0–72.3) | 69.4% (64.6–73.7) | 57.4% (52.4–62.2) | 57.7% (52.7–62.5) |
| Found, made-up items counted against | 66.9% (62.4–71.1) | 69.9% (65.4–74.0) | 57.4% (52.7–61.9) | 58.7% (54.1–63.2) |
| Non-food correctly dropped | 76.4% (69.3–82.3) | 82.0% (75.3–87.2) | 83.2% (76.7–88.2) | 88.2% (82.3–92.3) |
| Date correct | 68.5% (55.3–79.3) | 88.9% (77.8–94.8) | 70.4% (57.2–80.9) | 77.8% (65.1–86.8) |
| Total correct | 75.0% (63.9–83.6) | 75.0% (63.9–83.6) | 62.5% (51.0–72.8) | 62.5% (51.0–72.8) |
| Made-up items (per receipt) | 62 (0.72) | 53 (0.62) | 63 (0.73) | 56 (0.65) |
| Non-food kept as food | 38 of 161 | 29 of 161 | 27 | 19 |
| Food wrongly dropped as non-food | 18 | 18 | n/a | n/a |
| Seconds per receipt (mean) | 7.0 | 7.0 | 3.4 | 3.3 |
| Tesseract fallback used | 17 | 13 | – | – |

## Fixes, in order (each kept only if train food found went up or made-up items went down, without the other getting worse)

| Fix | Train result | Kept? |
|---|---|---|
| (a) Drop coupon / savings / tender / change / balance / card / cash / points / reg-price lines and misread TOTAL words (most of a line's words must be payment words) | found 77.7% → 77.7%, extras 62 → 53 | Yes |
| (a, first try) also drop any negative amount | found fell to 76.4% (refund lines the labels count as items; "TENDER" matched "TENDERLOIN") | No, replaced |
| (b) Dedupe repeated text + price | Not built: on train, nearly every repeated item+price was a genuine repeat matching the labelled count (4× tuna, 3× butter), so a dedupe rule would remove more real items than fake ones | No |
| (c) No item from a price whose row has no real word | found 77.7% → 77.1%, extras unchanged | No |
| (d) Common non-food words (clothing, motor oil, medicine, nappies, bakeware, gift card, lottery, bag fee, deposit, toiletries…) | non-food kept 37 → 28, found and extras unchanged, food wrongly dropped unchanged | Yes |
| (d) Stricter food-model veto (0.35 → 0.2 or 0.25) | found up to 79.7% but extras +2 | No |
| (e) Warehouse clubs: strip 5–7-digit leading item codes and KS/MM prefixes; let size-glued names ("NUTELA35.30F") count as words; masked card numbers (XXXX) are never items | found 77.7% → 79.5%, extras 53 → 53 | Yes |
| (e) Switch Costco/Sam's Club to Tesseract | Not built: on the only train Sam's Club receipt Tesseract found 0 items vs PaddleOCR's 3; there were no train Costco food receipts | No |
| (f) Dates: time glued to the date (7/21/1107:45), same separator throughout, skip promotion ranges, 21 NOV 26, NOV 21 26, day-first when £ / € / VAT / ABN / AUD / GBP / EUR appear (GST deliberately left out because Canadian receipts print it) | date 66.7% → 88.9%, found and extras unchanged | Yes |

All rules are general; none matches a specific receipt's text. The 7 receipts the parser was first tuned on were not tested.

## How it was run
Same as `RESULTS_wildreceipt.md`: headless Chromium 157 on Linux (2 vCPU Xeon 2.3 GHz), the app's own `ppRead` → `parseReceipt` → subtotal check → 3-pass Tesseract fallback, Tesseract via the 5.3.4 CLI. No crashes or timeouts. Per-receipt rows: `scans_paddle_wildreceipt_16dbdb8.csv`, `scans_tesseract_wildreceipt_16dbdb8.csv`. Raw OCR: `raw_ocr_wildreceipt_16dbdb8.jsonl`.
