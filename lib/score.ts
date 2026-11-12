import { SKILL_BY_ID, DESIGNER_HEADLINE, DESIGN_FIELD, DESIGN_TERMS, ENV_FIELD, ENV_TERMS } from "./taxonomy";
import type { Candidate, Classification, Component, Label, RoleId, RoleScore, Scored, SkillHit } from "./types";

// ------------------------------------------------------------------ config
export const CONFIG = {
  asOfNote: "Experience 'Present' = date the data was built",
  lca: {
    // JD1 says 2-3 years running LCA projects; the assignment sheet says 4-6. Edit here to change.
    targetMonths: 24,
    targetProjects: 3,
    listedCredit: 0.6, // a skill only listed in a skills list earns 60% of the credit
  },
  uiux: { targetProjects: 3, targetMonths: 6, listedCredit: 0.8 },
  // Chosen from the score distribution of the 47 resumes: UI/UX scores have a clear gap between 19 and 39,
  // LCA scores rise more gradually, so LCA needs a higher bar (see docs/METHODOLOGY.md).
  classify: { strong: { lca: 45, uiux: 35 }, weak: 25, gap: 12 },
};

type Item = { id: string; w: number; credit?: Record<string, number> | number };
const LCA_MUST: { key: string; label: string; w: number; ids: Record<string, number> }[] = [
  { key: "method", label: "Life cycle assessment method", w: 3, ids: { lca: 1 } },
  { key: "software", label: "LCA software (GaBi / SimaPro)", w: 3, ids: { gabi: 1, simapro: 1, openlca: 0.7, umberto: 0.7, ecoinvent: 0.5 } },
  { key: "inventory", label: "Life cycle inventory (LCI)", w: 2, ids: { lci: 1, ecoinvent: 0.5 } },
  { key: "iso", label: "ISO 14040/14044", w: 2, ids: { iso14040: 1 } },
];
const LCA_NICE: { id: string; w: number }[] = [
  { id: "epd", w: 2 }, { id: "footprint", w: 2 }, { id: "esg", w: 1 }, { id: "benchmark", w: 1 }, { id: "datawork", w: 1 }, { id: "stakeholder", w: 1 },
];
const UI_MUST: { id: string; w: number }[] = [
  { id: "figma", w: 3 }, { id: "prototyping", w: 2 }, { id: "wireframing", w: 2 }, { id: "userresearch", w: 2 }, { id: "uidesign", w: 2 },
];
const UI_NICE: { id: string; w: number }[] = [
  { id: "usability", w: 2 }, { id: "designsystem", w: 2 }, { id: "hcd", w: 1 }, { id: "persona", w: 1 }, { id: "accessibility", w: 1 }, { id: "psychology", w: 1 }, { id: "designtools", w: 1 }, { id: "frontend", w: 1 },
];

// ------------------------------------------------------------------ helpers
const r1 = (n: number) => Math.round(n * 10) / 10;
const clamp = (n: number, a = 0, b = 1) => Math.max(a, Math.min(b, n));
const hit = (c: Candidate, id: string) => c.hits.find(h => h.id === id);
const mult = (h: SkillHit, listed: number) => (h.loc === "work" ? 1 : listed);
const where = (h: SkillHit) => (h.loc === "work" ? "in experience/projects" : "listed only");
const ev = (h: SkillHit) => `${h.label} (${where(h)}): ${h.snippet}`;
const jobText = (j: Candidate["jobs"][number]) => [j.title, j.company, ...j.bullets].join(" \n ");
const LCA_RE = /\b(?:life[\s-]?cycle (?:assessment|analysis|inventory)|LCAs?|ga\s?bi|sima\s?pro|open\s?lca|EPDs?)\b/i;
const UI_RE = /\b(?:ui|ux|figma|prototyp\w*|wireframe\w*|user research|product design\w*|interface|visual design\w*)\b/i;

function relevantMonths(c: Candidate, re: RegExp): number {
  // months of roles whose title or bullets mention the role's core terms (roles with duration/dates only)
  return c.jobs.filter(j => re.test(jobText(j))).reduce((a, j) => a + (j.months ?? 0), 0);
}

function coverage(c: Candidate, items: { id: string; w: number }[], listed: number, max: number, label: string, key: string): Component {
  let got = 0, tot = 0; const evidence: string[] = [];
  const missing: string[] = [];
  for (const it of items) {
    tot += it.w; const h = hit(c, it.id);
    if (h) { got += it.w * mult(h, listed); evidence.push(ev(h)); } else missing.push(it.id);
  }
  return { key, label, points: r1(max * (tot ? got / tot : 0)), max, evidence, note: missing.length ? `Not found: ${missing.map(m => SKILL_BY_ID[m]?.label ?? m).join(", ")}` : undefined };
}

// ------------------------------------------------------------------ LCA
function scoreLCA(c: Candidate): RoleScore {
  const cfg = CONFIG.lca, comps: Component[] = [];
  // 1. must-have coverage (35)
  let got = 0, tot = 0; const ev1: string[] = []; const miss: string[] = [];
  for (const m of LCA_MUST) {
    tot += m.w; let best = 0, bestH: SkillHit | null = null;
    for (const [id, credit] of Object.entries(m.ids)) { const h = hit(c, id); if (h) { const v = credit * mult(h, cfg.listedCredit); if (v > best) { best = v; bestH = h; } } }
    // ISO numbers are stripped from the supplied resumes: an "ISO" mention on a line with LCA gets half credit.
    if (m.key === "iso" && best === 0) {
      const line = c.rawText.split("\n").find(l => /\bISO\b/.test(l) && LCA_RE.test(l));
      if (line) { best = 0.5; ev1.push(`ISO mentioned alongside LCA (standard number missing in text): ${line.trim().slice(0, 140)}`); }
    }
    got += m.w * best; if (bestH) ev1.push(ev(bestH)); else if (best === 0) miss.push(m.label);
  }
  comps.push({ key: "must", label: "Core LCA skills", points: r1(35 * got / tot), max: 35, evidence: ev1, note: miss.length ? `Not found: ${miss.join("; ")}` : undefined });
  // 2. nice-to-have (10)
  comps.push(coverage(c, LCA_NICE, cfg.listedCredit, 10, "Supporting skills (EPD, carbon footprint, ESG…)", "nice"));
  // 3. relevant experience (20)
  const rel = relevantMonths(c, LCA_RE);
  comps.push({ key: "exp", label: "LCA-relevant experience", points: r1(20 * clamp(rel / cfg.targetMonths)), max: 20,
    evidence: c.jobs.filter(j => LCA_RE.test(jobText(j))).map(j => `${j.title}${j.company ? " @ " + j.company : ""}: ${j.months ?? "?"} months`),
    note: `Target ${cfg.targetMonths} months of LCA work (JD1); candidate has ${rel}. Total experience of any kind: ${c.totalMonths} months.` });
  // 4. LCA studies (10)
  const studyRe = /\b(?:perform|conduct|prepar|complet|carri|develop|led|lead|model+|assess)\w*\b[^.]{0,90}\b(?:lcas?|life[\s-]?cycle (?:assessment|analysis))\b/i;
  const lines = [...c.jobs.flatMap(j => j.bullets), ...c.projects.flatMap(p => [p.name, ...p.text.split("\n")])];
  const done = lines.filter(l => studyRe.test(l) && !/^\s*working on/i.test(l));
  const ongoing = lines.filter(l => /^\s*working on/i.test(l) && /\blca\b|life[\s-]?cycle/i.test(l));
  const n = done.length + 0.5 * ongoing.length;
  comps.push({ key: "studies", label: "LCA studies / projects", points: r1(10 * clamp(n / cfg.targetProjects)), max: 10,
    evidence: [...done, ...ongoing].slice(0, 4).map(l => l.slice(0, 150)), note: `JD1 asks for 3+ completed LCA projects; ${done.length} completed and ${ongoing.length} ongoing found.` });
  // 5. domain (10)
  const envHits = ENV_TERMS.filter(([, re]) => re.test(c.rawText));
  comps.push({ key: "domain", label: "Environmental / sustainability domain", points: r1(10 * clamp(envHits.length / 6)), max: 10, evidence: [envHits.map(e => e[0]).join(", ")].filter(Boolean), note: "Counts distinct environmental themes across the resume (6 = full marks)." });
  // 6. education (15)
  const envEdu = c.education.filter(e => ENV_FIELD.test(e.degree + " " + e.detail) && e.level >= 3);
  const eduPts = envEdu.length ? 15 : c.highestLevel >= 3 ? 3 : c.highestLevel === 2 ? 1 : 0;
  comps.push({ key: "edu", label: "Education", points: eduPts, max: 15, evidence: c.education.filter(e => e.level >= 3).map(e => `${e.degree}${e.detail ? ", " + e.detail : ""}`), note: "JD1: bachelor's/master's, environmental field preferred. Environmental/energy/chemical-type degree = 15, any other bachelor's+ = 3." });
  const total = r1(comps.reduce((a, x) => a + x.points, 0));
  return { role: "lca", total, components: comps, relevantMonths: rel };
}

// ------------------------------------------------------------------ UI/UX
function scoreUIUX(c: Candidate): RoleScore {
  const cfg = CONFIG.uiux, comps: Component[] = [];
  comps.push(coverage(c, UI_MUST, cfg.listedCredit, 35, "Core design skills (Figma, prototyping, research…)", "must"));
  comps.push(coverage(c, UI_NICE, cfg.listedCredit, 10, "Supporting skills (usability, design systems…)", "nice"));
  const isDesigner = DESIGNER_HEADLINE.test(c.headline) || relevantMonths(c, UI_RE) > 0;
  const dp = c.projects.filter(p => isDesigner || DESIGN_TERMS.test(p.name + " " + p.text));
  comps.push({ key: "projects", label: "Design projects", points: r1(25 * clamp(dp.length / cfg.targetProjects)), max: 25, evidence: dp.slice(0, 4).map(p => p.name), note: `Counts project entries that read as design work (${cfg.targetProjects}+ = full marks). Every project counts for a candidate whose headline or roles are design-related; otherwise a project needs design vocabulary. ${dp.length} found.` });
  const rel = relevantMonths(c, UI_RE);
  comps.push({ key: "exp", label: "Design experience / internships", points: r1(10 * clamp(rel / cfg.targetMonths)), max: 10,
    evidence: c.jobs.filter(j => UI_RE.test(jobText(j))).map(j => `${j.title}${j.company ? " @ " + j.company : ""}: ${j.months ?? "?"} months`), note: "JD2 is an internship (0-1 year), so 6 months of design work = full marks." });
  const dEdu = c.education.filter(e => DESIGN_FIELD.test(e.degree + " " + e.detail) && e.level >= 3);
  comps.push({ key: "edu", label: "Education", points: (dEdu.length ? 7 : 0) + (c.highestLevel >= 3 ? 3 : 1), max: 10, evidence: c.education.filter(e => e.level >= 3).map(e => e.degree), note: "Design / HCI / computing field earns most of the points." });
  const port = hit(c, "portfolio"); const designCerts = c.certifications.filter(x => /\b(?:design|ux|ui|figma|user|hci|product)\b/i.test(x));
  comps.push({ key: "extras", label: "Portfolio & design learning", points: (port ? 6 : 0) + Math.min(4, designCerts.length * 2), max: 10, evidence: [port ? ev(port) : "", ...designCerts.slice(0, 3)].filter(Boolean), note: "Portfolio link/mention and design certifications." });
  const total = r1(comps.reduce((a, x) => a + x.points, 0));
  return { role: "uiux", total, components: comps, relevantMonths: rel };
}

// ------------------------------------------------------------------ classification
export function classify(c: Candidate, l: RoleScore, u: RoleScore): Classification {
  const { strong, weak, gap } = CONFIG.classify;
  if (c.status === "unreadable") return { label: "Neither / uncertain", leaning: null, reason: "No readable text, so no classification was attempted." };
  const sl = l.total >= strong.lca, su = u.total >= strong.uiux;
  const diff = r1(Math.abs(l.total - u.total)), hi = Math.max(l.total, u.total);
  const lead: RoleId = l.total >= u.total ? "lca" : "uiux";
  let label: Label, reason: string;
  if (sl && su && diff < gap) { label = "Both"; reason = `LCA ${l.total} (bar ${strong.lca}) and UI/UX ${u.total} (bar ${strong.uiux}) are both strong and within ${gap} points.`; }
  else if (sl && su) { label = lead === "lca" ? "LCA" : "UI/UX"; reason = `Both roles clear their bars, but ${label} leads by ${diff} points.`; }
  else if (sl) { label = "LCA"; reason = `LCA score ${l.total} clears the LCA bar of ${strong.lca}; UI/UX score is ${u.total}.`; }
  else if (su) { label = "UI/UX"; reason = `UI/UX score ${u.total} clears the UI/UX bar of ${strong.uiux}; LCA score is ${l.total}.`; }
  else if (hi < weak) { label = "Neither / uncertain"; reason = `Both scores are low (LCA ${l.total}, UI/UX ${u.total}); no clear fit for either role.`; }
  else { label = "Neither / uncertain"; reason = `Best score is ${hi} for ${lead === "lca" ? "LCA" : "UI/UX"}, which is above the weak cut-off (${weak}) but below that role's bar (${strong[lead]}): a possible but unconfirmed fit.`; }
  if (c.status === "partial") reason += " Extraction had warnings, so check the source resume.";
  return { label, leaning: hi >= weak ? lead : null, reason };
}

export function scoreCandidate(c: Candidate): Scored {
  if (c.status === "unreadable") {
    const z = (role: RoleId): RoleScore => ({ role, total: 0, components: [], relevantMonths: 0 });
    return { ...c, scores: { lca: z("lca"), uiux: z("uiux") }, classification: classify(c, z("lca"), z("uiux")) };
  }
  const l = scoreLCA(c), u = scoreUIUX(c);
  return { ...c, scores: { lca: l, uiux: u }, classification: classify(c, l, u) };
}

export function rankOf(pile: Scored[], role: RoleId, score: number): number {
  return 1 + pile.filter(p => p.status !== "unreadable" && p.scores[role].total > score).length;
}
