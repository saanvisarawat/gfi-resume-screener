# AI use log

Keep this honest and short: one line each time you used AI, what it produced, and what you checked or changed. Edit the rows to match what really happened.

| Step | What AI helped with | What I checked or changed |
|---|---|---|
| Data audit | Drafted the first dump/audit scripts | Opened resumes myself; found duplicates, empty file, and the text problems listed in `docs/DATA_AUDIT.md` |
| Extractor | Drafted the section splitter, date parser and skill matcher | Ran it on all 47 files; fixed date formats, merged overlaps, stopped education dates counting as experience |
| Scoring | Suggested weights and component structure | Compared against the JDs; chose thresholds from the score distribution |
| Gemini extraction (first attempt) | Wrote the call | Every call failed, so none of its output was used; replaced by the optional cross-check |
| Web app | Drafted the Next.js UI and upload route | Tested in a browser, tested uploads (docx, pdf, txt, corrupt, oversized, scanned) |
| Review | Reviewed my code and logs | Fixed the issues it found |
