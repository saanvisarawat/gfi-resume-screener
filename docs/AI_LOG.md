# Phase 1: Dataset Audit & AI Hygiene Log

## 1. Initial Corpus Observations (47 Resumes Audited)
- **File Formats**: All 47 supplied files in the initial batch are '.docx' documents.
- **Readability / Scanned Files**: 46 readable, 1 flagged as 'status: unreadable'.
- **Two-Column / Table Layouts**: 0 resumes use Word table structures ('<table>') for multi-column alignment, which causes standard text parsers to interleave sidebars with main experience blocks if not segmented carefully.
- **Anonymization & ID Collisions**: Candidate names are redacted across the dataset. Crucially, candidate initials are NOT unique: 'AA' appears 3 times, 'SS' appears twice, 'PW' appears twice, and 'resume_1793685080327' has no initials. All candidates must be indexed by their full 'INITIALS_TIMESTAMP' ID.
- **Date Normalization Required**: Resumes mix 'Present', 'Current', 'Till Date', 'Month YYYY', 'MM/YYYY', and 'YYYY-YYYY' ranges. Total experience calculation must parse date ranges deterministically rather than relying on raw LLM guesses.

## 2. Detailed Resume Audit Table (All 47 Files)

| Candidate ID | Type | Extraction Status | Layout | Detected Headings & Date Formats |
| :--- | :--- | :--- | :--- | :--- |
| AA_1793682784144 | DOCX | Readable (4062 chars) | Single-column | Experience, Education (Active (present/current), Month YYYY) |
| AA_1793685080195 | DOCX | Readable (1752 chars) | Single-column | Experience, Education (Month YYYY, YYYY-YYYY) |
| AA_1793685080402 | DOCX | Readable (2454 chars) | Single-column | Experience, Education (Active (present), Month YYYY, YYYY-YYYY) |
| AK_1793682784184 | DOCX | Readable (4590 chars) | Single-column | Experience, Education (Active (present), Month YYYY, YYYY-YYYY) |
| AL_1793685080183 | DOCX | Readable (2540 chars) | Single-column | Experience, Education (Active (present), Month YYYY, YYYY-YYYY) |
| AN_1793685080356 | DOCX | Readable (1824 chars) | Single-column | Experience, Education (Active (present), Month YYYY, YYYY-YYYY) |
| APS_1793685080222 | DOCX | Readable (3080 chars) | Single-column | Experience, Education (Month YYYY) |
| AR_1793685080207 | DOCX | Readable (2359 chars) | Single-column | Experience, Education (YYYY-YYYY) |
| AS_1793685080379 | DOCX | Readable (3262 chars) | Single-column | Experience, Education (YYYY-YYYY) |
| AY_1793685080440 | DOCX | Readable (1746 chars) | Single-column | Experience, Education (YYYY-YYYY) |
| BA_1793682784206 | DOCX | Readable (2688 chars) | Single-column | Experience, Education (Active (present), Month YYYY, YYYY-YYYY) |
| BS_1793685080461 | DOCX | Readable (1769 chars) | Single-column | Experience, Education (Active (present), Month YYYY) |
| CG_1793685080278 | DOCX | Readable (2929 chars) | Single-column | Experience, Education (Month YYYY) |
| CM_1793685080412 | DOCX | Readable (2177 chars) | Single-column | Education (YYYY-YYYY) |
| DP_1793685080247 | DOCX | Readable (2355 chars) | Single-column | Experience, Education (Active (present), Month YYYY) |
| DS_1793685080257 | DOCX | Readable (2420 chars) | Single-column | Experience, Education (Month YYYY) |
| DVJ_1793685080268 | DOCX | Readable (2414 chars) | Single-column | Experience, Education (Month YYYY, YYYY-YYYY) |
| FK_1793685080451 | DOCX | Readable (1883 chars) | Single-column | Experience, Education (Active (present), Month YYYY) |
| FT_1793685080301 | DOCX | Readable (2876 chars) | Single-column | Experience, Education (Month YYYY, YYYY-YYYY) |
| HD_1793682784275 | DOCX | Readable (5072 chars) | Single-column | Experience, Education (Active (present), Month YYYY, YYYY-YYYY) |
| HM_1793682784257 | DOCX | Readable (3799 chars) | Single-column | Experience, Education (Active (present), Month YYYY, YYYY-YYYY) |
| KA_1793682784307 | DOCX | Readable (2153 chars) | Single-column | Experience, Education (Active (present), Month YYYY) |
| KN_1793685080310 | DOCX | Readable (640 chars) | Single-column | Education (Unstructured / Missing) |
| MI_1793685080235 | DOCX | Readable (2072 chars) | Single-column | Experience, Education (Month YYYY, YYYY-YYYY) |
| MM_1793685080338 | DOCX | Readable (2492 chars) | Single-column | Experience, Education (Month YYYY) |
| MS_1793682784442 | DOCX | Readable (4316 chars) | Single-column | Experience, Education (MM/YYYY) |
| NA_1793682784346 | DOCX | Readable (2541 chars) | Single-column | Experience, Education (Month YYYY) |
| NF_1793685080347 | DOCX | Readable (1690 chars) | Single-column | Experience, Education (Month YYYY, YYYY-YYYY) |
| NP_1793682784325 | DOCX | Readable (3417 chars) | Single-column | Experience, Education (Active (current), Month YYYY, MM/YYYY) |
| N_1793685080389 | DOCX | Readable (1921 chars) | Single-column | Experience, Education (Active (present), Month YYYY, YYYY-YYYY) |
| PD_1793682784400 | DOCX | Readable (2744 chars) | Single-column | Experience, Education (Active (present), Month YYYY, YYYY-YYYY) |
| PKG_1793682784369 | DOCX | Readable (2787 chars) | Single-column | Experience, Education (Month YYYY) |
| PL_1793685080319 | DOCX | Readable (2134 chars) | Single-column | Experience, Education (Month YYYY, YYYY-YYYY) |
| PS_1793682784387 | DOCX | Readable (2941 chars) | Single-column | Experience, Education (Active (present), Month YYYY, YYYY-YYYY) |
| PV_1793685080171 | DOCX | Readable (1509 chars) | Single-column | Experience, Education (Month YYYY, YYYY-YYYY) |
| PW_1793682784228 | DOCX | Readable (5610 chars) | Single-column | Experience, Education (Active (present), Month YYYY) |
| PW_1793685080367 | DOCX | Readable (2211 chars) | Single-column | Experience, Education (Active (present), Month YYYY, YYYY-YYYY) |
| resume_1793685080327 | DOCX | status: unreadable | Single-column | N/A (N/A) |
| RR_1793682784428 | DOCX | Readable (2743 chars) | Single-column | Experience, Education (Active (present), Month YYYY, YYYY-YYYY) |
| RS_1793682784414 | DOCX | Readable (4437 chars) | Single-column | Experience, Education (Active (present), Month YYYY) |
| SRK_1793682784455 | DOCX | Readable (2929 chars) | Single-column | Experience, Education (Active (present), Month YYYY) |
| SS_1793682784470 | DOCX | Readable (3521 chars) | Single-column | Experience, Education (Active (present), Month YYYY, YYYY-YYYY) |
| SS_1793682784484 | DOCX | Readable (2589 chars) | Single-column | Experience, Education (Active (ongoing), Month YYYY, YYYY-YYYY) |
| TM_1793682784495 | DOCX | Readable (2998 chars) | Single-column | Experience, Education (Active (present), Month YYYY) |
| UI_1793682784506 | DOCX | Readable (2690 chars) | Single-column | Experience, Education (Active (present), Month YYYY) |
| VG_1793682784531 | DOCX | Readable (4546 chars) | Single-column | Experience, Education (Month YYYY) |
| VM_1793682784520 | DOCX | Readable (2674 chars) | Single-column | Experience, Education (Active (present), Month YYYY) |
