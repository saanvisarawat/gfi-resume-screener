# AI Use Log

To maintain full transparency and ownership of this pipeline, I utilized Generative AI strictly as a collaborative pair-programmer to accelerate boilerplate tasks. All critical business logic, data cleaning, mathematical weighting, and architectural decisions were driven and verified by my own manual testing.

| Pipeline Stage | AI Contribution (The Manual Labor) | My Contribution (Engineering, QA & Validation) |
|---|---|---|
| **Data Ingestion & Text Dumping** | Generated standard Node.js `fs` file-reading loops and basic regex patterns for text extraction. | I manually audited the raw `.docx` text, discovered the `anonymized_` duplicate file bug, and wrote the custom overrides to handle Word table-layout stripping and bad text encodings. |
| **Semantic Extraction (Gemini)** | Scaffolded the `@google/genai` API call syntax and drafted the initial TypeScript interface for the JSON response. | The initial AI prompt silently failed on edge cases. I enforced strict JSON schema validation, implemented error boundaries to catch API timeouts, and wrote the rule-based fallback parser for missing sections. |
| **Scoring Engine & Math** | Drafted the empty configuration objects and basic array-filtering loops. | I mathematically defined the classification thresholds (≥ 50 baseline, 15-point margin), mapped the exact JD terminology (SimaPro, Figma, ISO 14040) into the taxonomy, and fixed the AI's fundamentally flawed date-math logic. |
| **Next.js HR Dashboard** | Generated baseline Tailwind CSS layout components and standard React boilerplate. | I architected the state management, built the JSON database sorting/filtering, and ensured the exact semantic evidence strings were dynamically piped to the UI without crashing on unreadable resumes. |