// Sanity tests for the extractor and scorer. Run:  npm test
// They check facts that were verified by reading the resumes by hand, plus invariants that must always hold.
import fs from "fs";
import path from "path";
import { extractCandidate, mergedMonths, cleanText } from "../lib/extract";
import { scoreCandidate, rankOf } from "../lib/score";
import { AS_OF } from "./build-data";
import type { Scored } from "../lib/types";
import { compare, groundedShare } from "../lib/crosscheck";

let failed = 0, passed = 0;
function check(name: string, ok: boolean, detail = "") { if (ok) passed++; else { failed++; console.log(`FAIL  ${name} ${detail}`); } }
const asOf = new Date(AS_OF);
const mk = (text: string) => scoreCandidate(extractCandidate(text, { id: "T", sourceFile: "t.txt", sourceUrl: "" }, asOf));
const jobsOf = (text: string) => extractCandidate(`X\nHead\nExperience\n${text}\nCore Skills\n${"filler words ".repeat(20)}`, { id: "T", sourceFile: "t", sourceUrl: "" }, asOf).jobs;

// ---- date formats seen in the real resumes
const J = (h: string) => jobsOf(`${h}\n• did things`)[0];
const fmt = (h: string) => { const j = J(h); return `${j.start}>${j.end}:${j.months}`; };
check("Month YYYY - Month YYYY", fmt("Analyst — Acme   Jan 2020 - Mar 2021") === "2020-01>2021-03:15");
check("MM/YYYY – MM/YYYY", fmt("Consultant — Accurec GmbH   11/2025 – 01/2026") === "2025-11>2026-01:3");
check("Mon – Month YYYY (year borrowed)", fmt("Teaching Assistant — IIT   Jan – April 2026") === "2026-01>2026-04:4");
check("Mon ’YY – Mon ’YY", fmt("Product Designer — Lemmino   Sep ’25 – Dec ’25") === "2025-09>2025-12:4");
check("Mon YY - Month YY", fmt("UI/UX Intern — Crypto   Jan 26 - April 26") === "2026-01>2026-04:4");
check("YYYY–YYYY", fmt("Engineer — Foo   2019–2021") === "2019-01>2021-12:36");
check("Present uses fixed as-of date (Nov 2026)", fmt("Engineer — Foo   July 2025 – Present") === "2025-07>2026-11:17");
check("Duration only", J("UX Design Intern — Habitat   8 Months").months === 8 && J("UX Design Intern — Habitat   8 Months").monthsSource === "duration");
check("Ongoing without start is NOT counted", J("ESG Professional — PwC   Ongoing").months === null);
check("Reversed range is rejected, not negative", J("Engineer — Foo   2022 - 2019").months === null);

// ---- headers wrapped across two lines (typical of PDFs)
const wrapped = jobsOf("Teaching Assistant — NIT Aug 2019 -\nOct 2020\n• a\nTrainee — CLRI May\n2019 - Jul 2019\n• b");
check("Wrapped header 'Aug 2019 -' + 'Oct 2020'", wrapped[0]?.months === 15 && wrapped.length === 2, JSON.stringify(wrapped.map(j => j.months)));
check("Wrapped header 'May' + '2019 - Jul 2019'", wrapped[1]?.months === 3);
// ---- a date inside a bullet sentence must not create a job
check("Dates inside prose do not create jobs", jobsOf("Engineer — Foo   Jan 2020 - Dec 2020\n• Delivered the 2019 - 2021 roadmap\nand shipped it in 2020").length === 1);

// ---- truncated summary detection
const trunc = (sm: string) => mk(`ZZ\nAnalyst\nProfessional Summary\n${sm}\nExperience\nAnalyst — Acme   Jan 2022 - Dec 2022\n• did things\nCore Skills\n${"filler words ".repeat(20)}`).warnings.some(w => w.code === "TRUNC_SUMMARY");
check("Truncated summary flagged", trunc("Sustainability Consultant with over ainability and carbon accounting."));
check("Normal summaries not flagged", !trunc("Consultant with over 5 years in ESG") && !trunc("Analyst with over a decade in sustainability") && !trunc("Engineer with sustainability focus"));

// ---- overlap merging
const j2 = jobsOf("A — X   Jan 2020 - Dec 2020\n• a\nB — Y   Jun 2020 - Jun 2021\n• b");
check("Overlapping roles merge (18 months, not 25)", mergedMonths(j2) === 18, String(mergedMonths(j2)));
// ---- cleaning
const cl = cleanText("Fish &amp; Chips\nUI/UX Design Collaboration — Nyx UI   null");
check("HTML entity decoded", cl.text.startsWith("Fish & Chips"));
check("Stray 'null' removed", !/null/.test(cl.text) && cl.actions.some(a => a.includes("null")));

// ---- edge cases that must not crash
check("Empty text -> unreadable", mk("").status === "unreadable");
check("Tiny text -> unreadable", mk("hello").status === "unreadable");
const fresher = mk("ZZ\nUI/UX Designer\nEducation\nBachelor of Technology (B.Tech)\nX Institute, 2022 – 2026\nCore Skills\nPlatforms: Figma\nProjects / Deliverables\nApp redesign\nRedesigned onboarding flows in Figma.\n" + "filler text ".repeat(30));
check("Fresher: education years are not experience", fresher.totalMonths === 0, String(fresher.totalMonths));

// ---- LLM cross-check logic (pure functions; the Gemini call itself is not tested here)
const base = mk("ZZ\nAnalyst\nExperience\nAnalyst — Acme   Jan 2022 - Dec 2022\n• Ran GaBi models of packaging\nEducation\nB.Tech in Environmental Engineering\nX University, 2018 - 2022\nCore Skills\nPlatforms: GaBi, Excel\n" + "filler words ".repeat(20));
const f1 = compare(base, { totalExperienceMonths: 12, degrees: ["B.Tech in Environmental Engineering"], skills: ["GaBi"] });
check("crosscheck: matching LLM output -> no flags", f1.every(f => f.verdict === "agree"), JSON.stringify(f1.filter(f => f.verdict !== "agree")));
const f2 = compare(base, { totalExperienceMonths: 60, degrees: ["PhD in Astrophysics, MIT"], skills: ["SimaPro", "Excel"] });
check("crosscheck: experience mismatch flagged, rules kept", f2.some(f => f.field === "experience" && f.verdict === "flag"));
check("crosscheck: invented degree rejected", f2.some(f => f.field === "degree" && f.verdict === "rejected"));
check("crosscheck: invented skill rejected", f2.some(f => f.field === "skill" && f.llm === "SimaPro" && f.verdict === "rejected"));
check("crosscheck: grounded share works", groundedShare("Bachelor of Technology", "B.Tech in X") < 0.6 && groundedShare("Environmental Engineering", "B.Tech in Environmental Engineering") === 1);

// ---- the real corpus
const dataPath = path.join("data", "candidates.json");
const data = JSON.parse(fs.readFileSync(dataPath, "utf8")) as { candidates: Scored[] };
const cs = data.candidates, by = (id: string) => cs.find(c => c.id === id)!;
check("47 resumes", cs.length === 47, String(cs.length));
check("ids unique", new Set(cs.map(c => c.id)).size === cs.length);
check("source files unique", new Set(cs.map(c => c.sourceFile)).size === cs.length);
check("no 'anonymized_' prefix left in ids", cs.every(c => !c.id.startsWith("anonymized_")));
check("exactly one unreadable", cs.filter(c => c.status === "unreadable").length === 1 && by("resume-0327")?.status === "unreadable");
check("every source file exists in public/resumes", cs.every(c => fs.existsSync(path.join("public", "resumes", c.sourceFile))));
for (const c of cs.filter(c => c.status !== "unreadable")) {
  for (const r of ["lca", "uiux"] as const) {
    const s = c.scores[r];
    const sum = Math.round(s.components.reduce((a, k) => a + k.points, 0) * 10) / 10;
    check(`${c.id}/${r}: total equals sum of parts`, Math.abs(sum - s.total) < 0.11, `${sum} vs ${s.total}`);
    check(`${c.id}/${r}: 0 <= score <= 100`, s.total >= 0 && s.total <= 100);
    check(`${c.id}/${r}: parts within max`, s.components.every(k => k.points >= 0 && k.points <= k.max + 1e-9));
    check(`${c.id}/${r}: every scored part explains itself`, s.components.every(k => k.points === 0 || k.evidence.length > 0));
  }
}
// facts checked by hand against the resume text
check("PW-4228 total experience ~75 months", Math.abs(by("PW-4228").totalMonths - 75) <= 1, String(by("PW-4228").totalMonths));
check("MS-4442 has four dated roles (MM/YYYY parsed)", by("MS-4442").jobs.filter(j => j.monthsSource === "dates").length === 4);
check("CM-0412 (fresher) has 0 months", by("CM-0412").totalMonths === 0);
check("AY-0440 has 8 months (duration only)", by("AY-0440").totalMonths === 8);
check("AA-4144 has 21 months", by("AA-4144").totalMonths === 21, String(by("AA-4144").totalMonths));
check("SRK-4455 (Associate LCA Consultant) is LCA", by("SRK-4455").classification.label === "LCA");
check("HM-4257 (LCA Analyst) is LCA", by("HM-4257").classification.label === "LCA");
check("DVJ-0268 (UI/UX Designer) is UI/UX", by("DVJ-0268").classification.label === "UI/UX");
check("Non-designer 'UI-4506' id does not earn UI/UX points", by("UI-4506").scores.uiux.total < 10, String(by("UI-4506").scores.uiux.total));
check("Finance manager PS-4387 is not a design match", by("PS-4387").scores.uiux.total < 10, String(by("PS-4387").scores.uiux.total));
// rank helper
const top = cs.filter(c => c.status !== "unreadable").sort((a, b) => b.scores.lca.total - a.scores.lca.total)[0];
check("rankOf gives #1 to a score equal to the top", rankOf(cs, "lca", top.scores.lca.total) === 1);
check("rankOf gives last place to 0", rankOf(cs, "lca", 0) === cs.filter(c => c.status !== "unreadable" && c.scores.lca.total > 0).length + 1);
// every readable resume extracted something
check("every readable resume has an experience, project or skills section", cs.filter(c => c.status !== "unreadable").every(c => c.jobs.length || c.projects.length || c.listedSkills.length));

console.log(`${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
