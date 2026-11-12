# Methodology

This prototype reads resumes, pulls out job-related facts, scores every resume against two roles, and shows the evidence behind each score so a person can check it. It never makes the hiring decision: it ranks, explains and flags.

**Roles** (from the two job descriptions): **JD1** is an LCA Consultant (onsite, Chennai). **JD2** is a UI/UX Design Intern (remote, 0–1 year).

## 1. Pipeline

1. **Read the file.** `.docx` with `mammoth`, `.pdf` with `unpdf`, `.txt` as is. Empty or image-only files are not guessed at: they are marked *unreadable* and listed under "Needs review".
2. **Clean the text.** Decode HTML entities, remove invisible characters, remove stray `null`/`undefined` tokens that appear where a date was lost. Every action is recorded (`docs/CLEANING.md`).
3. **Split into sections** by heading (Experience, Education, Core Skills, Tools / Technologies, Projects / Deliverables, Certifications, Professional Summary, Awards, Languages). Headings are matched in a lower-cased, punctuation-insensitive way, with common synonyms.
4. **Extract**
   - *Roles:* title, company and dates from each experience header.
   - *Experience length:* dates are converted to months, overlapping roles are merged (so concurrent jobs are not double-counted), and "Present" means the fixed build date (2026-11-09) so results never drift. Supported formats: `Jan 2020 – Mar 2021`, `11/2025 – 01/2026`, `Jan – April 2026`, `Sep ’25 – Dec ’25`, `Jan 26 – April 26`, `2019–2021`, durations such as `8 Months`. A role with no readable start date (for example "Ongoing") is **not counted** and is flagged. Education dates are never counted as experience.
   - *Education:* degree lines, institution, CGPA/percentage.
   - *Projects, certifications, languages, listed skills.*
   - *Skills with evidence:* a taxonomy (`lib/taxonomy.ts`) of about 28 skills is searched in the text. For each skill the matching sentence is stored, and whether it was found in **experience/projects** ("used") or only in a **skills/summary/certificate list** ("listed").
5. **Score** both roles (below). 6. **Classify** and **rank** each role separately. 7. **Explain**: every score is a list of components, each with points, a maximum, a note and the evidence text.

## 2. Scoring (each role is out of 100)

A skill found in experience/projects earns full credit. A skill that is only *listed* earns 60% of the credit for LCA and 80% for UI/UX (listing Figma is normal for a designer; listing "LCA" without doing any is weaker evidence).

**LCA Consultant**

| Component | Max | How |
|---|---|---|
| Core LCA skills | 35 | Weighted coverage of: LCA method (3), LCA software (3; GaBi/SimaPro 100%, openLCA/Umberto 70%, ecoinvent 50%), life cycle inventory (2), ISO 14040/14044 (2) |
| Supporting skills | 10 | EPD, carbon footprint/GHG, ESG reporting, benchmarking, data validation, stakeholder management |
| LCA-relevant experience | 20 | Months in roles whose title or bullets mention LCA work, against a 24-month target (JD1: 2–3 years). Unrelated years do not count |
| LCA studies | 10 | Bullets/projects that describe a completed LCA (3+ = full marks, JD1 asks for 3). Ongoing work counts half |
| Environmental domain | 10 | Distinct environmental themes found in the resume (6 = full marks) |
| Education | 15 | 15 for an environmental/energy/chemical/related bachelor's or higher, 3 for any other bachelor's or higher |

**UI/UX Design Intern**

| Component | Max | How |
|---|---|---|
| Core design skills | 35 | Figma (3), prototyping (2), wireframing (2), user research (2), UI/UX design (2) |
| Supporting skills | 10 | Usability testing, design systems, human-centred design, personas/journeys, accessibility, user psychology, other design tools, HTML/CSS |
| Design projects | 25 | Projects that read as design work (3+ = full marks). Every project counts for a candidate whose headline or roles are design-related; otherwise a project needs design vocabulary (so "Design Thinking" in an MBA project does not count) |
| Design experience | 10 | Design-related months against 6 months (an internship) |
| Education | 10 | Design/HCI/computing field = 7, any bachelor's+ = 3 |
| Portfolio and learning | 10 | Portfolio link (Behance, Dribbble, a URL) = 6; design certificates = 2 each, up to 4 |

## 3. Classification

Rules (thresholds in `CONFIG.classify`, `lib/score.ts`):

- **LCA** if the LCA score is at least 45 and the UI/UX score is below 35.
- **UI/UX** if the UI/UX score is at least 35 and the LCA score is below 45.
- **Both** if both clear their bars and are within 12 points of each other. If both clear their bars but one leads by 12 or more points, that role wins.
- **Neither / uncertain** otherwise (including best score below 25, or an unreadable file). The reason is written in plain words on each candidate.

*How the thresholds were chosen.* They were set after looking at the score distribution of the 47 resumes, not before. UI/UX scores have a clear gap: non-designers score 19 or less and designers 39 or more, so the UI/UX bar sits at 35. LCA scores rise gradually (37.6, 43.2, 49.3, 54, …), so the LCA bar is higher, at 45, to demand more than a skills-list mention. Result on this data: 12 LCA, 24 UI/UX, 0 Both, 10 Neither/uncertain, 1 unreadable. No resume qualifies as *Both*; this is a finding of the data, not a rule that forbids it.

## 4. Ranking

Each role has its own ranking, by score (highest first). Reviewers can also sort by relevant or total experience, filter by classification, minimum score, keyword, and "only with warnings". Rank is computed over the whole pile, so it does not change when you filter. Equal scores share a rank. An uploaded resume goes through the same code and is ranked against all readable resumes (it is not stored).

## 5. What the data looked like (and what was done about it)

See `docs/DATA_AUDIT.md` (generated). In short: 47 `.docx` files on a consistent single-column template; one file is empty; initials are not unique (AA ×3, PW ×2, SS ×2), so IDs combine initials with the end of the file's timestamp. Problems found and handled:

- **ISO standard numbers are missing** in 15 resumes (text reads "ISO :2015" or "ISO  and ISO  verification"); no resume contains "14040" or "14044". ISO 14040/14044 therefore cannot be confirmed from text, so an "ISO" mention on the same line as LCA earns half credit and each affected resume carries an info note.
- **Garbled text:** one resume has "COration" / "COive" where "CO₂ …" was lost; flagged.
- **A stray `null`** where a date should be (one resume): removed, and because the date is gone the resume is flagged as having no readable dates.
- **A truncated summary** (one resume, where "with over …" is cut off before the number of years); flagged.
- **Date formats** beyond `Month YYYY`: handled and covered by tests (`npm test`).
- **One empty file:** marked unreadable, shown under "Needs review", never scored.

## 6. Where AI was used, and how its output was checked

- **Writing the code:** an AI assistant (Claude) helped draft and debug the extractor, scorer and web app. All code was run against the 47 resumes. `npm test` runs 400+ checks, including date formats and facts verified by reading the resumes by hand. Defects found this way were fixed (for example: dates ignoring months, education dates counted as experience, a candidate's own ID matching the keyword "ui", and "Design Thinking" in an MBA counted as design work).
- **At run time there is no AI.** Extraction and scoring are deterministic rules, so the same resume always gets the same result and every number can be traced to evidence.
- **Optional LLM cross-check** (`npm run crosscheck`, Gemini): the model extracts the same fields and the results are compared with the rules. The model **never overrides** the rules: disagreements are flagged, and any skill or degree that is not in the resume text is rejected as unsupported. Results are in `docs/LLM_CROSSCHECK.md`. *[Fill in: how many calls succeeded, how many flags and rejections you reviewed, and what you changed. If you did not run it, delete this bullet.]*
- An earlier attempt used an LLM to fill education, projects and certifications, but every call failed, so none of its output was used.

## 7. Validation

`docs/VALIDATION.md` compares each classification with the resume's own job title (an automatic check, and not fully independent because the title is a small scoring input) and has a column for manual checks. *[Fill in: how many resumes you read by hand, and how many classifications you agreed with.]*

## 8. Limitations

- **Keyword matching.** A skill described in other words (for example "carbon accounting" with no mention of LCA) is not matched. Synonyms are limited to the taxonomy.
- **Evidence strength is approximate.** "Used" versus "listed" is judged from the section, not from the meaning of the sentence.
- **JD mismatch.** JD1 says 2–3 years; the assignment sheet says 4–6. The prototype follows the JD; change `CONFIG.lca.targetMonths` to follow the sheet.
- **Missing ISO numbers** limit the ISO 14040/14044 check (see above).
- **No OCR.** Scanned PDFs and images are flagged, not read. Text boxes in Word files are not parsed.
- **Small sample.** Thresholds were tuned on 47 resumes; on a larger pile they should be re-checked.
- **Fairness.** Rankings reflect keywords and structure, not potential. Resumes are anonymised, and the tool should only help reviewers prioritise; people must make the decision.
