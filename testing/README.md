# Scanner test kit (CEN100 Group 2)

315 simulated Canadian grocery receipts (fictional stores, real-style layouts), photo-damaged 7 ways
(clean, crumpled, shadow, tilted, blurry, faded, low light), read by Crispwise's own scan code.

- `gen.py` — makes the receipts + exact ground truth (`python3 gen.py set 315 2026`)
- `app.js` — the app's parse/clean-up/date code (identical to index.html, comments aside)
- `run.js` — Tesseract 3-pass run (what the claude.ai link uses); `run2.js` — PaddleOCR run (GitHub app; not run yet)
- `scans.csv` — the test log, one row per scan; `ground_truth.json` — what each receipt actually says
- `real_receipts_template.csv` — fill one row per item for real receipt photos

Results dashboard: https://claude.ai/artifact/5tGbdFfV5LBZeAUugaFxCt
