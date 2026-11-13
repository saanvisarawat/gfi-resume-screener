# Resume Screener (LCA Consultant and UI/UX Design Intern)

Reads resumes, extracts job-related information, classifies each one (LCA, UI/UX, both, or neither/uncertain), ranks them separately for each role, and shows the evidence behind every score. You can upload a new resume and see where it would rank.

Live demo: [https://gfiresumescreener.vercel.app/](https://gfiresumescreener.vercel.app/) · Method: [`docs/METHODOLOGY.md`](docs/METHODOLOGY.md) (also at `/methodology` in the app)
## Run it

```bash
npm install
npm run data      # reads data/raw, writes data/candidates.json, public/resumes, docs/CLEANING.md, docs/DATA_AUDIT.md
npm test          # 400+ checks
npm run dev       # http://localhost:3000
```

`npm run data` must be re-run (and the result committed) whenever you change `lib/` or add resumes in `data/raw`.

## Where things are

| Path | What |
|---|---|
| `lib/extract.ts` | text cleaning, sections, dates, education, projects, skills with evidence |
| `lib/taxonomy.ts` | the skill list (edit this to change what counts as a skill) |
| `lib/score.ts` | weights, thresholds (`CONFIG`), scoring, classification |
| `app/api/upload/route.ts` | upload, parse, score, rank |
| `app/Screener.tsx` | the interface |
| `scripts/` | `build-data`, `selftest`, `validate`, optional `crosscheck-llm` |
| `docs/` | methodology, data audit, cleaning log, validation, AI log |

## Limits

See "Limitations" in the methodology. Short version: keyword based, no OCR, thresholds tuned on 47 resumes.
