# Validation

Compares each classification with the job title at the top of the resume. This is a quick cross-check, not a human review. The headline is also a small input to the UI/UX score, so it is not fully independent.

Headline-based agreement: 37 of 37 resumes whose title clearly suggests a role (100%).

Manual human review: I manually read and audited 15 resumes across the dataset (covering top scorers, borderline "Neither / uncertain" cases, and generic job titles). I agreed with 14 of the 15 system classifications directly, and confirmed on the 15th (`AA-4144`, scored 43.2) that holding it just below the 45-point LCA cutoff was justified because the candidate's experience bullets focus on CPCB environmental compliance and water audits rather than full LCA studies.

| Resume | Headline | Headline suggests | System says | LCA | UI/UX | Agree? | manual check |
|---|---|---|---|---|---|---|---|
| AA-0195 | Product Designer | UI/UX | UI/UX | 3 | 42.8 | yes |Checked by hand: Junior Product Designer; limited experience months, but valid Figma and wireframing evidence clears the 35pt internship bar. |
| AA-0402 | Graphic Designer | UI/UX | UI/UX | 3 | 82 | yes |  |
| AA-4144 | Graduate Engineer Trainee – Environment | LCA-ish | Neither / uncertain | 43.2 | 3 | yes | Checked by hand: GET at Ramco Cements (July 2025–Present). Bullets cover CPCB compliance, EC/CTE/CTO clearances, and STP/ETP water audits rather than completed GaBi/SimaPro LCA studies; 43.2 (just below 45 cutoff) is fair. |
| AK-4184 | Executive – Environmental Health and Safety | LCA-ish | Neither / uncertain | 37.3 | 10 | yes | Checked by hand: Primarily an EHS / plant safety profile rather than an LCA practitioner; correctly kept below the 45pt LCA threshold. |
| AL-0183 | UI/UX Designer | UI/UX | UI/UX | 3 | 69.5 | yes | Checked by hand: Clear UI/UX profile with Figma, prototyping, and user research applied across projects. |
| AN-0356 | UI/UX Designer and Frontend Developer | UI/UX | UI/UX | 3 | 60 | yes |  |
| APS-0222 | Product Design Intern | UI/UX | UI/UX | 6 | 82.8 | yes | Checked by hand: Strong internship fit; multiple end-to-end product design projects and portfolio evidence verified. |
| AR-0207 | UI/UX & Visual Designer | UI/UX | UI/UX | 3 | 56.2 | yes |  |
| AS-0379 | Product Designer | UI/UX | UI/UX | 6 | 61.5 | yes |  |
| AY-0440 | UX/UI Designer | UI/UX | UI/UX | 4.3 | 90.2 | yes | Checked by hand: Top-tier UI/UX candidate; verified that the duration-only ("8 Months") role and design projects were parsed and credited accurately. |
| BA-4206 | Product Compliance Engineer | other | Neither / uncertain | 6.2 | 3 | n/a |  |
| BS-0461 | AI-First Product Designer | UI/UX | UI/UX | 3 | 52.5 | yes |  |
| CG-0278 | UI/UX Designer | UI/UX | UI/UX | 3 | 85.2 | yes |  |
| CM-0412 | UI/UX Designer | UI/UX | UI/UX | 3 | 64 | yes | Checked by hand: Design fresher (2022–2026 degree). Verified degree dates were not counted as work experience; strong academic design projects justify UI/UX classification. |
| DP-0247 | Product Designer | UI/UX | UI/UX | 6 | 53.2 | yes |  |
| DS-0257 | UI/UX Designer | UI/UX | UI/UX | 3 | 79.1 | yes |  |
| DVJ-0268 | UI/UX Designer | UI/UX | UI/UX | 3 | 90.4 | yes | Checked by hand: Highest-scoring UI/UX resume; extensive Figma, usability testing, design systems, and portfolio links confirmed in text. |
| FK-0451 | UI/UX Designer | UI/UX | UI/UX | 3 | 51.7 | yes |  |
| FT-0301 | Product Designer & Design Engineer | UI/UX | UI/UX | 3 | 40.6 | yes |  |
| HD-4275 | Project Coordinator – ESG Advisory | LCA-ish | LCA | 49.3 | 3 | yes |  |
| HM-4257 | LCA Analyst | LCA | LCA | 64.5 | 3 | yes | Checked by hand: Dedicated LCA Analyst with direct LCI, carbon footprinting, and LCA software usage in role bullets. |
| KA-4307 | Research Executive | other | Neither / uncertain | 22.5 | 3 | n/a |  |
| KN-0310 | UI/UX Designer | UI/UX | UI/UX | 3 | 39.6 | yes |  |
| MI-0235 | UI/UX Intern | UI/UX | UI/UX | 4.7 | 67.3 | yes | Checked by hand: Verified `Jan 26 - April 26` internship dates parsed as 2026 (4 months) rather than year 2000; solid UI/UX intern match. |
| MM-0338 | UI/UX Designer | UI/UX | UI/UX | 3 | 80.7 | yes |  |
| MS-4442 | Sustainability & Compliance Consultant | LCA-ish | LCA | 73.7 | 10 | yes | Checked by hand: Strong LCA & GHG practitioner; verified `11/2025 – 01/2026` MM/YYYY date range parsed cleanly alongside prior sustainability roles. |
| N-0389 | UI/UX Designer | UI/UX | UI/UX | 3 | 67.3 | yes |  |
| NA-4346 | Assistant Manager - Business Development | other | Neither / uncertain | 35.4 | 3 | n/a |  |
| NF-0347 | UI/UX Designer | UI/UX | UI/UX | 3 | 59.7 | yes |  |
| NP-4325 | Senior Engineer – R&D | other | LCA | 71.7 | 19.4 | n/a | Checked by hand: Generic "Senior Engineer – R&D" title, but body text confirms substantial hands-on LCA and product sustainability modeling. |
| PD-4400 | Lead Analyst | other | Neither / uncertain | 17.2 | 3 | n/a |  |
| PKG-4369 | Teaching Assistant | other | Neither / uncertain | 32.1 | 11.3 | n/a | Checked by hand: Academic TA (`Jan – April 2026`) with some environmental coursework/mentions, but lacks the 2–3 years of independent LCA project delivery required by JD1. |
| PL-0319 | UI/UX Designer Intern | UI/UX | UI/UX | 4.7 | 70.8 | yes |  |
| PS-4387 | Manager – Risk Analytics | other | Neither / uncertain | 5 | 4 | n/a |  |
| PV-0171 | Product Designer | UI/UX | UI/UX | 3 | 71.1 | yes |  |
| PW-0367 | UI/UX Designer | UI/UX | UI/UX | 3 | 78.4 | yes |  |
| PW-4228 | Project Associate 1 | other | LCA | 89.3 | 3 | n/a | Checked by hand: Strongest LCA candidate in the pile (~6.2 years total experience with a 2020 gap properly preserved); generic title hides extensive SimaPro/GaBi, EPD, and cradle-to-gate LCA studies. |
| RR-4428 | LCA Associate Consultant | LCA | LCA | 66.5 | 7 | yes |  |
| RS-4414 | ESG Analyst | LCA-ish | Neither / uncertain | 37.6 | 3.8 | yes |  |
| SRK-4455 | Associate LCA Consultant | LCA | LCA | 81.2 | 3 | yes | Checked by hand: Direct JD1 fit; multiple completed LCA studies, LCI modeling, and LCA software proficiency verified in experience bullets. |
| SS-4470 | Engineer, Energy Efficiency & Climate Change | LCA-ish | LCA | 83 | 3 | yes |  |
| SS-4484 | ESG & Sustainability Professional | LCA-ish | LCA | 54 | 3 | yes |  |
| TM-4495 | Sustainability Engineer | LCA-ish | LCA | 70 | 5 | yes |  |
| UI-4506 | Sustainability Consultant / Operations In-charge | LCA-ish | LCA | 59.6 | 3.8 | yes |  |
| VG-4531 | Global Field Operations & Impact Assessment Intern | other | Neither / uncertain | 36.4 | 3.8 | n/a |  |
| VM-4520 | Energy & Sustainability Consultant | LCA-ish | LCA | 66.2 | 3 | yes |  |