# Round 2 (branch round2, built on main 16dbdb8)

## New held-out set: none found
Frozen filters (store regex, 72 chains; English rule) written in wildreceipt_filters.json, applied unchanged.
- SROIE test split (darentang/sroie, 347 receipts): 0 match the frozen store regex (Malaysian shops). Also date/total labels only, no items.
- Voxel51/scanned_receipts (713): a copy of SROIE. Same result.
- CORD v2: Indonesian restaurant receipts. Fails the grocery and English filters.
- User-supplied receipts: none supplied (the 7 tuning receipts are excluded by rule).
So the only held-out numbers are on the 55 WildReceipt held-out receipts that were already used to judge 16dbdb8. **They are rough, not a clean test.**

## Changes (tuned on the 86 train receipts only)
1. findTotal: also reads BALANCE / BAL / AMOUNT DUE lines, misread TOTOL/TOT0L, ".00" amounts, an amount on the line under TOTAL; skips savings, coupons, change, item counts.
2. Non-food: second list of long stems matched inside glued names (towel, tissue, curtain, paint, floss, skirt, wipes, detergent, Rx#, gasoline, ...); bleach rule skips UNBLEACHED.
3. Tax-rate lines (TAX plus a %) are not items.
4. Warehouse-club lines: inside a mostly-letter word, 0/1/5/6/8 read as O/I/S/G/B; longer leading code junk stripped.

## Train (86), PaddleOCR: 16dbdb8 -> round2
food found 79.5% -> 80.0%, made-up items 53 -> 53, non-food kept 29 -> 26, food wrongly dropped 18 -> 18, date 88.9% -> 88.9%, total 75.0% -> 84.7%.
Tesseract: found 67.3% -> 67.5%, made-up 56 -> 56, non-food kept 19 -> 18, total 62.5% -> 70.8%.

## Rough held-out (55, burned), same scorer, 95% Wilson CIs
| | baseline a438bd2 | 16dbdb8 | round2 |
|---|---|---|---|
| Paddle food found | 81.1% (76.8-84.7) | 81.3% (77.1-84.9) | 82.9% (78.8-86.3) |
| Paddle made-up items | 63 | 53 | 50 |
| Paddle non-food kept (of 161) | 33 | 31 | 30 (18.6%, 13.4-25.4) |
| Paddle food wrongly dropped | 8 | 8 | 8 |
| Paddle date | 60.5% | 86.8% (72.7-94.2) | 86.8% (72.7-94.2) |
| Paddle total | 60.0% | 60.0% (45.5-73.0) | 75.6% (61.3-85.8) |
| Paddle secs (median) | 5.4 | 5.6 | 6.3 |
| Tesseract food found | 73.4% | 73.4% (68.8-77.6) | 73.4% (68.8-77.6) |
| Tesseract made-up items | 45 | 42 | 42 |
| Tesseract non-food kept | - | 17 | 16 |
| Tesseract total | 53.3% | 53.3% | 62.2% (47.6-74.9) |
| Tesseract date | 68.4% | 76.3% | 76.3% |
| Tesseract secs (median) | 2.9 | 3.1 | 3.3 |

Push decision: branch, not main. The push rule needs a NEW held-out set and none exists.
