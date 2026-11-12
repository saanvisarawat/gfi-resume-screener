// Writes docs/VALIDATION.md: compares the classification with a quick independent signal (the resume's own
// job-title headline), and leaves a column for YOUR manual check. Headline agreement is NOT a substitute for
// reading resumes: fill in the last column for at least 10-15 resumes before you submit.
import fs from "fs";
import type { Scored } from "../lib/types";

const data = JSON.parse(fs.readFileSync("data/candidates.json", "utf8")) as { candidates: Scored[] };
const rows = data.candidates.filter(c => c.status !== "unreadable");
const expected = (h: string) => (/\b(?:UI|UX|designer|design)\b/i.test(h) ? "UI/UX" : /\b(?:LCA|life cycle)\b/i.test(h) ? "LCA" : /sustainab|environment|ESG|energy|climate|carbon/i.test(h) ? "LCA-ish" : "other");
const agree = (e: string, l: string) => (e === "UI/UX" ? l === "UI/UX" : e === "LCA" ? l === "LCA" : e === "LCA-ish" ? l === "LCA" || l === "Neither / uncertain" : l !== "UI/UX" && l !== "LCA" || true);

const lines = ["# Validation", "",
  "Compares each classification with the job title at the top of the resume. This is a quick cross-check, not a human review. The headline is also a small input to the UI/UX score, so it is not fully independent.", "",
  "| Resume | Headline | Headline suggests | System says | LCA | UI/UX | Agree? | Your manual check |", "|---|---|---|---|---|---|---|---|"];
let n = 0, a = 0; const dis: string[] = [];
for (const c of rows.sort((x, y) => x.id.localeCompare(y.id))) {
  const e = expected(c.headline), l = c.classification.label;
  const ok = e === "other" ? true : agree(e, l);
  if (e !== "other") { n++; if (ok) a++; else dis.push(`${c.id} (${c.headline}) -> ${l}`); }
  lines.push(`| ${c.id} | ${c.headline.replace(/\|/g, "/")} | ${e} | ${l} | ${c.scores.lca.total} | ${c.scores.uiux.total} | ${e === "other" ? "n/a" : ok ? "yes" : "NO"} |  |`);
}
lines.splice(4, 0, `Headline-based agreement: ${a} of ${n} resumes whose title clearly suggests a role (${n ? Math.round((100 * a) / n) : 0}%).`, "",
  dis.length ? `Disagreements to explain: ${dis.join("; ")}.` : "No disagreements.", "");
fs.writeFileSync("docs/VALIDATION.md", lines.join("\n") + "\n");
console.log(`Headline agreement ${a}/${n}. Disagreements: ${dis.length ? dis.join("; ") : "none"}`);
