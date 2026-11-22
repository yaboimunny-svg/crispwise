# Crispwise reader test: real grocery receipts (WildReceipt)

**App tested:** `index.html` at commit `a438bd25b0a458835990a8915c1c42f2fbafa0cf` (GitHub main, "Fix receipt parser: cents-only prices, G tax mark, Superstore items", 2026-11-21). Frozen; no parser rules, dictionaries or thresholds changed during the test. OCR models: `ocr/det.onnx`, `ocr/rec-1.onnx`, `ocr/rec-2.onnx` and `ocr/food-nb.json` from the same commit.

**Sample:** 141 real photographed receipts (86 train, 19 validation, 36 test) out of 1,739 in podbilabs/wildreceipt-donut. 765 food items with a printed price, 322 non-food items with a printed price. **This is under the 300-receipt target, so treat the numbers as rough.** The filters were not loosened to reach 300.

## Headline

PaddleOCR (the app's real path) found **79.3% (95% CI 76.3–82.1)** of food items (price within 1 cent). Resampling whole receipts instead of items gives 73.1–84.8%. With made-up items counted against it: 68.2% (95% CI 65.1–71.2).

## Weakest areas

1. **Made-up items:** 125 extra items on 141 receipts (0.89 per receipt): duplicated lines, wrong prices, coupons and payment lines.
2. **Non-food kept as food:** 22.0% of non-food items ended up in the fridge (71 of 322), worse than Tesseract-only (14.0%). It also dropped 26 real food items as non-food (3.4%).
3. **Date and total:** date right on 65.2% (95% CI 55.1–74.2) of receipts with a labelled date; total right on 69.2% (95% CI 60.4–76.9).

## PaddleOCR vs Tesseract-only (same 141 receipts)

| Measure | PaddleOCR (app) | Tesseract only |
|---|---|---|
| Food items found (price ±1¢) | 79.3% (95% CI 76.3–82.1) | 70.1% (95% CI 66.7–73.2) |
| Strict: price + name similarity ≥0.6 | 71.1% (95% CI 67.8–74.2) | 63.5% (95% CI 60.1–66.9) |
| Found, with made-up items counted against | 68.2% (95% CI 65.1–71.2) | 61.4% (95% CI 58.1–64.6) |
| Non-food correctly dropped | 78.0% (95% CI 73.1–82.1) | 86.0% (95% CI 81.8–89.4) |
| Food wrongly dropped as non-food | 3.4% (95% CI 2.3–4.9) | n/a (the merged Tesseract result keeps no removed list) |
| Date correct | 65.2% (95% CI 55.1–74.2) | 69.6% (95% CI 59.5–78.0) |
| Total correct | 69.2% (95% CI 60.4–76.9) | 59.0% (95% CI 49.9–67.5) |
| Made-up items | 125 (0.89/receipt) | 108 (0.77/receipt) |
| Seconds per receipt (mean / median) | 7.0 / 6.3 | 3.3 / 3.0 |
| Crashes / timeouts | 0 | 0 |

PaddleOCR fell back to Tesseract (items didn't add up to the subtotal) on 24 of 141 receipts.

## By dataset split (food items found)

| Split | Receipts | Food items | PaddleOCR | Tesseract |
|---|---|---|---|---|
| train | 86 | 385 | 77.7% | 66.8% |
| val | 19 | 116 | 74.1% | 54.3% |
| test | 36 | 264 | 84.1% | 81.8% |

## By store (food items found)

| Store | Receipts | Food items | PaddleOCR | Tesseract | Date ok (P) | Total ok (P) |
|---|---|---|---|---|---|---|
| Walmart | 39 | 139 | 79% | 76% | 74% | 82% |
| Target | 22 | 45 | 82% | 60% | 95% | 95% |
| Safeway | 9 | 24 | 67% | 50% | 0% | 0% |
| Costco | 6 | 38 | 47% | 76% | 100% | 20% |
| Tesco | 6 | 64 | 81% | 75% | 0% | 100% |
| Aldi | 5 | 72 | 79% | 72% | 0% | 80% |
| Trader Joe's | 5 | 43 | 95% | 81% | 100% | 67% |
| Kroger | 4 | 35 | 91% | 63% | – | 0% |
| Morrisons | 4 | 28 | 89% | 79% | 100% | 0% |
| Meijer | 3 | 3 | 100% | 100% | 67% | 67% |
| Publix | 3 | 27 | 63% | 30% | – | 100% |
| Sam's Club | 3 | 20 | 30% | 5% | 67% | 67% |
| Al Manama Hypermarket | 2 | 54 | 93% | 100% | 50% | 100% |
| Albertsons | 2 | 4 | 100% | 100% | 50% | 50% |
| Asda | 2 | 11 | 55% | 55% | 100% | 100% |
| Foodtown | 2 | 24 | 58% | 25% | 0% | 100% |
| Giant | 2 | 4 | 100% | 100% | 0% | 0% |
| Northgate Market | 2 | 4 | 100% | 50% | 100% | 100% |
| Sainsbury's | 2 | 3 | 100% | 100% | 0% | 0% |
| Stop & Shop | 2 | 4 | 25% | 0% | 50% | 50% |
| Waitrose | 2 | 26 | 100% | 96% | 0% | 100% |
| Whole Foods | 2 | 5 | 100% | 0% | – | 100% |
| Woolworths | 2 | 6 | 50% | 67% | 0% | 100% |
| 99 Ranch Market | 1 | 1 | 100% | 0% | 100% | 100% |
| Co-op Food | 1 | 8 | 75% | 62% | 100% | 0% |
| Coles | 1 | 19 | 100% | 84% | 0% | 0% |
| Crest Foods | 1 | 13 | 85% | 85% | 100% | 100% |
| Food Lion | 1 | 10 | 70% | 30% | 0% | 0% |
| Hannaford | 1 | 10 | 90% | 80% | – | 0% |
| Lidl | 1 | 2 | 100% | 100% | 0% | 100% |
| Metro | 1 | 0 | – | – | 0% | 0% |
| No Frills | 1 | 6 | 83% | 100% | – | 100% |
| ShopRite | 1 | 13 | 100% | 92% | 100% | 0% |

## 10 most common errors (PaddleOCR path)

| Error | Count |
|---|---|
| made-up item: other line | 98 |
| price read by OCR but not paired into an item | 93 |
| non-food kept as food | 71 |
| food found by price, name garbled | 63 |
| price not read by OCR | 39 |
| food wrongly dropped as non-food | 26 |
| total not read | 25 |
| date not read | 24 |
| made-up item: no price | 15 |
| made-up item: total/tax/payment/discount line | 12 |

## Filters (written before any result, never changed)

- **Store filter:** 72 supermarket-chain name patterns matched against `Store_name_value`, in all three splits (see `wildreceipt_filters.json`). 146 of 1,739 receipts matched: 86 train, 19 validation, 41 test.
- **English filter:** dropped 5 receipts whose items are not in English: Carrefour, DIA, Mercadona (Spanish), Netto (German), IGA (French).
- **Kept stores:** Walmart 39, Target 22, Safeway 9, Costco 6, Tesco 6, Aldi 5, Trader Joe's 5, Kroger 4, Morrisons 4, Meijer 3, Publix 3, Sam's Club 3, and 1–2 each from 21 more chains.
- **Name-pattern matches that aren't really grocery stores, kept because the rule was frozen:** "PIZZA HUT TESCO KAJANG" and "WOOLWORTHS CAFE". The dataset also holds a few duplicate photos of the same receipt (e.g. Safeway 4378 / fe14e6e6, Sam's Club 3600 / a7804eb2), kept as-is.

## How it was run

- Hugging Face is blocked in the test workspace, so the images (the full files from the dataset repo's train/, val/ and test/ folders, not the datasets-server previews) were downloaded through the user's Chrome. Each receipt was then run through the frozen `index.html` in headless Chromium, using the app's own functions: `ppRead` → `parseReceipt` (with the food model) → the subtotal check from `recognizePasses` → the 3-pass Tesseract fallback when items don't add up.
- The fallback and the Tesseract-only run use the app's own `prepReceipt` and `PASSES` images, read by the tesseract 5.3.4 CLI with `--psm 6`, the same as the earlier `testing/run.js`. The live app uses Tesseract.js in the browser, so its Tesseract results can differ slightly.
- Item/price ground truth comes from the WildReceipt word labels (Theivaprakasham/wildreceipt), each item name paired with the price box on the same row. Food / non-food / fee / unclear labels were set by hand from item names only, before any app output was seen (`wildreceipt_item_labels.csv`). 82 food items with no printed price (e.g. weighed produce) can't be matched on price and are left out of the food score.
- **Timings:** headless Chromium 157 on Linux, 2 vCPU Intel Xeon @ 2.30 GHz, 7 GB RAM, ONNX Runtime Web (single-threaded WASM), two receipts at a time. A phone will be slower.
- No retries: a crash, timeout or empty result counts as 0 found. There were none.
