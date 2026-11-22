# 9-photo receipt test (2026-11-22)

Run in the real app (PaddleOCR in the browser, branch show-all-ocr-lines, final build 0837887246).
Pass bar: at least 85% of food items found with the right name and price.
The `.txt` files are the OCR text the app read for each photo, used for offline re-checks.

| # | Receipt | Food items right | Result |
|---|---------|------------------|--------|
| 1 | Walmart Winnipeg | 15 / 16 | pass (94%) - one unreadable line "GIUTCPEPPERD" missed |
| 2 | Walmart Edmonton | 5 / 5 | pass - all free ($0.00) items |
| 3 | Metro Toronto | 13 / 13 | pass |
| 4 | FreshCo Toronto | 11 / 11 | pass |
| 5 | Superstore (26/11/09) | 7 / 7 | pass - date now read as Nov 9, 2026 |
| 6 | Superstore Don Mills | 11 / 11 | pass |
| 7 | No Frills Edmonton | 11 / 11 | pass |
| 8 | Superstore Harvest Hills | 18 / 18 | pass - photo cut off before the total; some names still messy |
| 9 | Walmart Quebec (French) | 2 / 2 | pass |
| | **All** | **93 / 94 (99%)** | |

Caveat: the parser was fixed while looking at these same nine receipts, so this is not an
independent accuracy figure. A fresh set of receipts is needed for an honest number.

Regression check: 141 cached receipts (offline, same parser). No real food item was lost;
removed lines were coupons, tax, change-due and savings lines; several missed items are now found.
