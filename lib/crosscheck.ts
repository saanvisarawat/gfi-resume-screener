// Compares the rule-based extraction with an LLM's extraction of the same resume.
// The LLM NEVER overrides the rules. It only raises flags for a human to check, and every claim it makes
// must be grounded in the resume text, otherwise it is rejected as a hallucination.
import type { Candidate } from "./types";

export interface LlmExtract { totalExperienceMonths: number | null; degrees: string[]; skills: string[] }
export interface Finding { field: string; rules: string; llm: string; verdict: "agree" | "flag" | "rejected" | "suggestion"; reason: string }

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9+#./ ]+/g, " ").replace(/\s+/g, " ").trim();
const words = (s: string) => norm(s).split(" ").filter(w => w.length > 2);

export function groundedShare(claim: string, text: string): number {
  const w = words(claim); if (!w.length) return 0;
  const t = ` ${norm(text)} `;
  return w.filter(x => t.includes(x)).length / w.length;
}

export function compare(c: Candidate, l: LlmExtract, toleranceMonths = 6): Finding[] {
  const out: Finding[] = [];
  const text = c.rawText;
  // 1. total experience
  if (l.totalExperienceMonths == null) out.push({ field: "experience", rules: `${c.totalMonths} mo`, llm: "none", verdict: "suggestion", reason: "LLM gave no value; rules value kept." });
  else {
    const d = Math.abs(c.totalMonths - l.totalExperienceMonths);
    out.push({ field: "experience", rules: `${c.totalMonths} mo`, llm: `${l.totalExperienceMonths} mo`, verdict: d <= toleranceMonths ? "agree" : "flag",
      reason: d <= toleranceMonths ? `Within ${toleranceMonths} months.` : `Differ by ${d} months. Rules value kept (it is computed from dates); check the resume by hand.` });
  }
  // 2. degrees: each LLM degree must be grounded in the text
  for (const dg of l.degrees) {
    const g = groundedShare(dg, text);
    out.push({ field: "degree", rules: c.education.map(e => e.degree).join(" | ") || "none", llm: dg, verdict: g >= 0.6 ? "agree" : "rejected",
      reason: g >= 0.6 ? "Found in the resume text." : `Only ${Math.round(g * 100)}% of its words appear in the resume, so it is rejected as unsupported.` });
  }
  const ruleHigh = c.education.filter(e => e.level >= 3).length, llmCount = l.degrees.length;
  if (c.education.length && llmCount && ruleHigh !== llmCount && Math.abs(c.education.length - llmCount) > 1)
    out.push({ field: "degree count", rules: String(c.education.length), llm: String(llmCount), verdict: "flag", reason: "Different number of education entries; check for a missed or merged entry." });
  // 3. skills: grounded in the text? already known to the taxonomy?
  const known = new Set(c.hits.map(h => h.label.toLowerCase()));
  for (const sk of l.skills) {
    const present = norm(text).includes(norm(sk));
    if (!present) out.push({ field: "skill", rules: "-", llm: sk, verdict: "rejected", reason: "Not present in the resume text; rejected as unsupported." });
    else if (![...known].some(k => k.includes(norm(sk)) || norm(sk).includes(k))) out.push({ field: "skill", rules: "-", llm: sk, verdict: "suggestion", reason: "Present in the text but not in the taxonomy; a human may add it to lib/taxonomy.ts." });
  }
  return out;
}

export function summarise(all: { id: string; findings: Finding[] }[], failed: { id: string; error: string }[], total: number): string {
  const count = (v: Finding["verdict"]) => all.reduce((a, x) => a + x.findings.filter(f => f.verdict === v).length, 0);
  const lines = [
    "# LLM cross-check log", "",
    `Resumes sent to the LLM: ${total}. Succeeded: ${all.length}. Failed: ${failed.length}.`, "",
    `Agreements: ${count("agree")} · Flags for manual review: ${count("flag")} · Rejected as unsupported: ${count("rejected")} · Taxonomy suggestions: ${count("suggestion")}.`, "",
    "The LLM never overrides the rule-based result. Disagreements are flagged, and anything it claims that is not in the resume text is rejected.", "",
  ];
  if (failed.length) lines.push("## Failed calls", "", ...failed.map(f => `- ${f.id}: ${f.error}`), "");
  lines.push("## Findings that need a human (flags, rejections, suggestions)", "", "| Candidate | Field | Rules | LLM | Verdict | Reason |", "|---|---|---|---|---|---|");
  for (const x of all) for (const f of x.findings.filter(f => f.verdict !== "agree"))
    lines.push(`| ${x.id} | ${f.field} | ${f.rules.replace(/\|/g, "/")} | ${f.llm.replace(/\|/g, "/")} | ${f.verdict} | ${f.reason.replace(/\|/g, "/")} |`);
  return lines.join("\n") + "\n";
}
