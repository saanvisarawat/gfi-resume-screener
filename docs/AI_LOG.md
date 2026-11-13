# AI Use Log

To maintain full transparency and ownership of this pipeline, I utilized Generative AI strictly as a collaborative pair-programmer to accelerate boilerplate tasks. All critical business logic, data cleaning, mathematical weighting, and architectural decisions were driven and verified by my own manual testing.

| Pipeline Stage | AI Contribution (The Manual Labor) | My Contribution (Engineering, QA & Validation) |
|---|---|---|
| **Data Ingestion & Text Dumping** | Generated standard Node.js `fs` file-reading loops and basic regex patterns for text extraction. | I manually audited the raw `.docx` text, discovered the `anonymized_` duplicate file bug, and wrote the custom overrides to handle Word table-layout stripping and bad text encodings. |
| **Semantic Extraction** | Drafted an initial LLM-based extraction script using Gemini. | The AI extraction failed across the dataset. Rather than trying to patch it, I abandoned the LLM approach entirely and built a strict, deterministic rule-based text extractor myself using a custom taxonomy. |
| **Scoring Engine & Math** | Drafted the empty configuration objects and basic array-filtering loops. | I mathematically defined the classification thresholds based on the actual score distribution (LCA ≥ 45, UI/UX ≥ 35, 12-point margin), mapped the exact JD terminology into the taxonomy, and fixed the AI's fundamentally flawed date-math logic. |
| **Next.js HR Dashboard** | Generated standard React boilerplate components. | I architected the state management, built the JSON database sorting/filtering, and styled the UI using plain CSS (`globals.css`), ensuring evidence strings were dynamically piped without crashing on unreadable resumes. |