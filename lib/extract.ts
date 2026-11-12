import { SKILLS, } from "./taxonomy";
import type { Candidate, EduEntry, Job, Loc, Project, SectionKey, SkillHit, Warning } from "./types";

const HEADINGS: Record<string, SectionKey> = {
  "education": "education", "academic qualifications": "education", "academics": "education", "qualifications": "education",
  "core skills": "skills", "skills": "skills", "technical skills": "skills", "key skills": "skills",
  "experience": "experience", "work experience": "experience", "professional experience": "experience",
  "work history": "experience", "employment history": "experience", "internships": "experience",
  "professional summary": "summary", "summary": "summary", "profile": "summary", "objective": "summary", "career objective": "summary",
  "projects / deliverables": "projects", "projects": "projects", "academic projects": "projects", "personal projects": "projects",
  "tools / technologies": "tools", "tools": "tools", "technologies": "tools",
  "certifications & licenses": "certifications", "certifications": "certifications", "licenses & certifications": "certifications", "courses": "certifications",
  "languages": "languages",
  "awards / honors": "awards", "awards": "awards", "achievements": "awards", "honors": "awards",
  "publications": "other", "interests": "other", "references": "other", "hobbies": "other",
};

const MON = "jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec";
const YR = "(?:19|20)\\d{2}";
// A date atom: 11/2025 | Jan 2025 | Sep '25 | Jan 26 | Jan (year borrowed from the other end) | 2025
const ATOM = `(?:\\d{1,2}\\/${YR}|\\b(?:${MON})[a-z]*\\.?,?(?:\\s*['’]?\\s*(?:${YR}|\\d{2}\\b))?|${YR})`;
const END = `(?:present|current|till date|now|ongoing|${ATOM})`;
const RANGE = new RegExp(`(${ATOM})\\s*(?:-|–|—|\\bto\\b)\\s*(${END})`, "i");
const DURATION = /(\d+(?:\.\d+)?)\s*\+?\s*(months?|mos?|years?|yrs?)\b/i;
const BULLET = /^[•\-\*▪●◦·]\s*/;
const NUMWORDS: Record<string, number> = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 };

export function cleanText(raw: string): { text: string; actions: string[] } {
  const actions: string[] = [];
  let t = raw;
  if (/&(?:amp|lt|gt|quot|#\d+);/.test(t)) { t = t.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"'); actions.push("Decoded HTML entities"); }
  if (/[​ ﻿]/.test(t)) { t = t.replace(/[​﻿]/g, "").replace(/ /g, " "); actions.push("Removed invisible / non-breaking spaces"); }
  if (/\r/.test(t)) t = t.replace(/\r\n?/g, "\n");
  const lines = t.split("\n").map(l => l.replace(/\s+$/g, "")).filter(l => l.trim().length);
  const nullTok = /\s+\b(?:null|undefined|NaN)\b\s*$/;
  const fixed = lines.map(l => { if (nullTok.test(l)) { actions.push(`Removed stray "${l.match(nullTok)![0].trim()}" token`); return l.replace(nullTok, ""); } return l; });
  return { text: fixed.join("\n"), actions };
}

const MONTHS = ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"];
interface Atom { y: number | null; m: number | null; present: boolean }
function parseAtom(str: string): Atom | null {
  const x = str.trim().toLowerCase();
  if (/^(present|current|till date|now|ongoing)$/.test(x)) return { y: null, m: null, present: true };
  let m = x.match(/^(\d{1,2})\/((?:19|20)\d{2})$/);
  if (m) return { y: Number(m[2]), m: Number(m[1]) - 1, present: false };
  m = x.match(new RegExp(`^(${MON})[a-z]*\\.?,?\\s*['’]?\\s*((?:19|20)\\d{2}|\\d{2})?$`));
  if (m) { const mi = MONTHS.indexOf(m[1] === "sept" ? "sep" : m[1]); const y = m[2] ? (m[2].length === 2 ? 2000 + Number(m[2]) : Number(m[2])) : null; return { y, m: mi, present: false }; }
  m = x.match(/^((?:19|20)\d{2})$/);
  if (m) return { y: Number(m[1]), m: null, present: false };
  return null;
}
function resolveRange(a: string, b: string, asOf: Date): [number, number] | null {
  const s = parseAtom(a), e = parseAtom(b); if (!s || !e) return null;
  const now = asOf.getFullYear() * 12 + asOf.getMonth();
  let endIdx: number;
  if (e.present) endIdx = now; else if (e.y == null) return null; else endIdx = e.y * 12 + (e.m ?? 11);
  let sy = s.y; if (sy == null) { if (e.y == null) return null; sy = e.y; if (s.m != null && e.m != null && s.m > e.m) sy -= 1; }
  const startIdx = sy * 12 + (s.m ?? 0);
  return endIdx >= startIdx ? [startIdx, Math.min(endIdx, now)] : null;
}
const iso = (n: number) => `${Math.floor(n / 12)}-${String((n % 12) + 1).padStart(2, "0")}`;

function splitSections(lines: string[]) {
  const sections: Record<string, string[]> = {};
  const preface: string[] = [];
  let cur: SectionKey | null = null;
  for (const l of lines) {
    const key = HEADINGS[l.trim().toLowerCase().replace(/[:\s]+$/, "")];
    if (key) { cur = key; sections[key] = sections[key] ?? []; continue; }
    (cur ? sections[cur] : preface).push(l);
  }
  return { preface, sections };
}

// PDFs often wrap a header such as "Role — Company  Aug 2019 -" / "Oct 2020" onto two lines. Glue those back together.
function joinWrapped(lines: string[]): string[] {
  const out: string[] = [];
  const dangling = new RegExp(`(?:[-–—]|\\bto|\\b(?:${MON})[a-z]*\\.?)\\s*$`, "i");
  const startsLikeDate = new RegExp(`^(?:${YR}|\\d{1,2}\\/|(?:${MON}|present|current)\\b)`, "i");
  for (const l of lines) {
    const prev = out[out.length - 1];
    if (prev !== undefined && !BULLET.test(prev) && !BULLET.test(l) && dangling.test(prev) && startsLikeDate.test(l.trim())) out[out.length - 1] = `${prev} ${l.trim()}`;
    else out.push(l);
  }
  return out;
}

function parseJobs(rawLines: string[], asOf: Date): Job[] {
  const lines = joinWrapped(rawLines);
  const jobs: Job[] = [];
  let cur: Job | null = null;
  for (const l of lines) {
    if (BULLET.test(l)) { cur?.bullets.push(l.replace(BULLET, "")); continue; }
    // A job header carries its date range / duration at the end (or start) of the line. A date in the middle of a
    // line is just text (this also protects PDFs, where long bullets wrap onto lines without a bullet mark).
    const edge = (m: RegExpMatchArray | null) => (m && (m.index === 0 || l.slice((m.index ?? 0) + m[0].length).replace(/[\s.,;:)\]]+/g, "") === "") ? m : null);
    const r = edge(l.match(RANGE)), d = r ? null : edge(l.match(DURATION));
    if (r || d || !cur) {
      let start: number | null = null, end: number | null = null, months: number | null = null;
      let src: Job["monthsSource"] = "none";
      let head = l;
      if (r) {
        const rr = resolveRange(r[1], r[2], asOf);
        if (rr) { [start, end] = rr; months = end - start + 1; src = "dates"; }
        head = l.replace(r[0], "");
      } else if (d) {
        months = Math.round(Number(d[1]) * (/^y/i.test(d[2]) ? 12 : 1)); src = "duration"; head = l.replace(d[0], "");
      }
      head = head.replace(/[\s|,–—-]+$/, "").trim();
      const parts = head.split(/\s+[—–]\s+|\s+-\s+/);
      cur = { title: parts[0]?.trim() || head, company: parts.slice(1).join(" — ").trim(), header: l.trim(),
        start: start != null ? iso(start) : null, end: end != null ? iso(end) : null, months, monthsSource: src, bullets: [] };
      jobs.push(cur);
    } else cur.bullets.push(l);
  }
  return jobs;
}

export function mergedMonths(jobs: Job[]): number {
  const iv = jobs.filter(j => j.start && j.end).map(j => {
    const [sy, sm] = j.start!.split("-").map(Number), [ey, em] = j.end!.split("-").map(Number);
    return [sy * 12 + sm - 1, ey * 12 + em - 1] as [number, number];
  }).sort((a, b) => a[0] - b[0]);
  let total = 0, curS = -1, curE = -2;
  for (const [s, e] of iv) {
    if (s > curE) { if (curE >= curS && curS >= 0) total += curE - curS + 1; curS = s; curE = e; }
    else curE = Math.max(curE, e);
  }
  if (curS >= 0) total += curE - curS + 1;
  return total + jobs.filter(j => j.monthsSource === "duration").reduce((a, j) => a + (j.months ?? 0), 0);
}

const DEGREE = /\b(?:ph\.?\s?d|doctorate|m\.?\s?tech|b\.?\s?tech|m\.?\s?des|b\.?\s?des|m\.?\s?sc|b\.?\s?sc|m\.?\s?b\.?\s?a|b\.?\s?e\b|m\.?\s?e\b|bachelor\w*|master\w*|post[\s-]?graduate|pg diploma|diploma|b\.?\s?a\b|m\.?\s?a\b|b\.?\s?com|higher secondary|class\s*(?:x|xii|10|12)|ssc|hsc|senior secondary|madhymik|secondary)\b/i;
const INSTITUTION = /\b(?:university|institute|college|school|academy|iit|nit|iiit|vidyalaya)\b/i;
function levelOf(s: string): number {
  if (/ph\.?\s?d|doctorate/i.test(s)) return 5;
  if (/\bm\.?\s?(tech|des|sc|b\.?a|e|a)\b|master|post[\s-]?graduate|pg diploma/i.test(s)) return 4;
  if (/\bb\.?\s?(tech|des|sc|e|a|com)\b|bachelor/i.test(s)) return 3;
  if (/diploma/i.test(s)) return 2;
  return 1;
}
function parseEducation(lines: string[]): EduEntry[] {
  const out: EduEntry[] = [];
  for (const l of lines) {
    const isScore = /^(?:cgpa|gpa|percentage|grade)|^\d{2,3}(?:\.\d+)?\s*%$/i.test(l.trim());
    if (isScore && out.length) { out[out.length - 1].score = l.trim(); continue; }
    const dm = l.match(DEGREE);
    if (dm && (!INSTITUTION.test(l) || (dm.index ?? 9) <= 2)) { out.push({ degree: l.trim(), detail: "", level: levelOf(l), score: null }); }
    else if (out.length && out[out.length - 1].detail.split(" · ").length < 2) out[out.length - 1].detail = (out[out.length - 1].detail ? out[out.length - 1].detail + " · " : "") + l.trim();
  }
  return out;
}

function parseProjects(lines: string[]): Project[] {
  const out: Project[] = [];
  for (const l of lines) {
    const bullet = BULLET.test(l);
    const desc = bullet || /[.!?]$/.test(l.trim());
    if (!desc || !out.length) out.push({ name: l.replace(BULLET, "").trim(), text: "" });
    else out[out.length - 1].text += (out[out.length - 1].text ? "\n" : "") + l.replace(BULLET, "");
  }
  return out;
}

const splitList = (s: string) => s.split(/[,;|]/).map(x => x.trim()).filter(Boolean);

function snippet(line: string, m: RegExpMatchArray): string {
  const i = m.index ?? 0; const a = Math.max(0, i - 60), b = Math.min(line.length, i + m[0].length + 80);
  return (a > 0 ? "…" : "") + line.slice(a, b).trim() + (b < line.length ? "…" : "");
}

export function extractCandidate(rawText: string, meta: { id: string; sourceFile: string; sourceUrl: string; uploaded?: boolean }, asOf = new Date()): Candidate {
  const { text, actions } = cleanText(rawText);
  const lines = text.split("\n");
  const warnings: Warning[] = [];
  const base = { ...meta, rawText: text, cleaning: actions, textLength: text.length };

  if (text.replace(/\s/g, "").length < 100) {
    warnings.push({ level: "error", code: "NO_TEXT", message: "No readable text was found. The file is empty, image-only or corrupted, so it could not be scored. Open the original file to review it manually." });
    return { ...base, headline: "", status: "unreadable", warnings, summary: "", listedSkills: [], jobs: [], totalMonths: 0, experienceNote: "No text", education: [], highestLevel: 0, projects: [], certifications: [], languages: [], hits: [] };
  }

  const { preface, sections } = splitSections(lines);
  const headline = preface[1] ?? preface[0] ?? "";
  const sec = (k: SectionKey) => sections[k] ?? [];

  // ---- experience
  const jobs = sec("experience").length ? parseJobs(sec("experience"), asOf) : [];
  let totalMonths = mergedMonths(jobs), experienceNote = "";
  const summary = sec("summary").join(" ");
  if (!sections.experience) {
    experienceNote = "No experience section";
    warnings.push({ level: "info", code: "NO_EXPERIENCE", message: "No Experience section found (likely a fresher). Experience is counted as 0 months." });
  } else if (jobs.every(j => j.monthsSource === "none")) {
    const claim = summary.match(/(\d+(?:\.\d+)?|one|two|three|four|five|six|seven|eight|nine|ten)\+?\s*years?/i);
    if (claim) { totalMonths = Math.round((NUMWORDS[claim[1].toLowerCase()] ?? Number(claim[1])) * 12); experienceNote = `Estimated from summary claim "${claim[0]}"`; }
    else experienceNote = "Experience listed but no dates could be read";
    warnings.push({ level: "warn", code: "NO_DATES", message: `Experience section found but no dates could be parsed. ${experienceNote}.` });
  } else {
    const ds = jobs.filter(j => j.monthsSource === "dates").length, du = jobs.filter(j => j.monthsSource === "duration").length;
    experienceNote = `Computed from ${ds} dated role(s)${du ? ` + ${du} stated duration(s)` : ""}; overlapping roles are merged`;
    const undated = jobs.filter(j => j.monthsSource === "none").length;
    if (undated) warnings.push({ level: "warn", code: "UNDATED_JOB", message: `${undated} role(s) had no readable dates and were not counted.` });
  }

  // ---- other sections
  const education = parseEducation(sec("education"));
  const projects = parseProjects(sec("projects"));
  const listedSkills = [...sec("skills"), ...sec("tools")].flatMap(l => splitList(l.replace(/^[^:]{1,30}:\s*/, "")));
  const certifications = sec("certifications").map(l => l.replace(BULLET, "").trim());
  const languages = sec("languages").flatMap(splitList);

  if (!sections.skills && !sections.tools) warnings.push({ level: "warn", code: "NO_SKILLS", message: "No skills section found; skills were inferred only from the rest of the text." });
  if (!sections.education) warnings.push({ level: "warn", code: "NO_EDU", message: "No education section found." });
  else if (!education.length) warnings.push({ level: "warn", code: "EDU_UNPARSED", message: "Education section found but no degree could be recognised." });

  // ---- text-quality checks (data corruption seen in the supplied files)
  if (/\bISO\b(?!\s*\d)/.test(text)) warnings.push({ level: "info", code: "ISO_NUMBER_MISSING", message: "An ISO standard is mentioned but its number is missing from the text (likely lost when the resume was anonymised), so ISO 14040/14044 cannot be confirmed." });
  const garbled = [...new Set(text.match(/\bCO(?=[a-z]{3})[a-z]+/g) ?? [])];
  if (garbled.length) warnings.push({ level: "warn", code: "GARBLED", message: `Possible garbled text (${garbled.slice(0, 3).map(g => `"${g}"`).join(", ")}): a symbol or number such as CO₂ appears to have been lost. Check the source file.` });
  if (/\bwith (?:over|more than)\s+(?!a\b|an\b|the\b|one\b|two\b|three\b|four\b|five\b|six\b|seven\b|eight\b|nine\b|ten\b|\d)[a-z]+/i.test(summary)) warnings.push({ level: "warn", code: "TRUNC_SUMMARY", message: "The summary looks truncated mid-sentence (for example \"with over …\" is not followed by a number of years)." });
  if (text.length < 500) warnings.push({ level: "warn", code: "SHORT", message: "Very little text was extracted; the score may under-represent this candidate." });

  // ---- taxonomy hits with evidence (work = experience/projects, listed = everything else)
  const segs: { loc: Loc; line: string }[] = [];
  for (const [k, ls] of Object.entries(sections)) for (const l of ls) segs.push({ loc: k === "experience" || k === "projects" ? "work" : "listed", line: l.replace(BULLET, "") });
  segs.push({ loc: "listed", line: headline });
  const hits: SkillHit[] = [];
  for (const s of SKILLS) {
    let best: SkillHit | null = null;
    for (const g of segs) {
      const m = g.line.match(s.re); if (!m) continue;
      if (!best || (g.loc === "work" && best.loc === "listed")) best = { id: s.id, label: s.label, loc: g.loc, snippet: snippet(g.line, m) };
      if (best.loc === "work") break;
    }
    if (best) hits.push(best);
  }

  const status: Candidate["status"] = warnings.some(w => w.level === "warn") ? "partial" : "ok";
  return { ...base, headline, status, warnings, summary, listedSkills, jobs, totalMonths, experienceNote, education,
    highestLevel: education.reduce((a, e) => Math.max(a, e.level), 0), projects, certifications, languages, hits };
}
