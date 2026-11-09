import fs from 'fs';
import path from 'path';
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const TEXT_DIR = path.join(process.cwd(), 'data', 'text');
const DB_FILE = path.join(process.cwd(), 'data', 'database.json');
const CLEANING_LOG = path.join(process.cwd(), 'docs', 'CLEANING.md');

// --- 1. TAXONOMY ---
const TAXONOMY: Record<string, string[]> = {
  "LCA": ["lca", "life cycle assessment", "life cycle analysis", "sima pro", "simapro", "gabi", "openlca"],
  "UI/UX": ["ui/ux", "user interface", "user experience", "figma", "adobe xd", "sketch", "wireframing", "prototyping", "user research"],
  "Frontend": ["react", "react.js", "next.js", "typescript", "javascript", "html", "css", "tailwind"],
  "Backend": ["node.js", "express", "python", "fastapi", "django", "sql", "postgresql"]
};

// --- 2. RULE-BASED PARSERS ---
function segmentSections(text: string) {
  const sections = { experience: "", education: "", skills: "", projects: "" };
  let currentSection = "summary";
  
  const lines = text.split(/\r?\n/);
  for (const line of lines) {
    const cleanLine = line.trim().toLowerCase();
    if (/^(experience|work history|employment|professional experience)$/.test(cleanLine)) currentSection = "experience";
    else if (/^(education|academic|academic qualifications)$/.test(cleanLine)) currentSection = "education";
    else if (/^(skills|technical skills|tools|core competencies)$/.test(cleanLine)) currentSection = "skills";
    else if (/^(projects|key projects|academic projects)$/.test(cleanLine)) currentSection = "projects";
    else {
      if (currentSection === "experience") sections.experience += line + "\n";
      if (currentSection === "education") sections.education += line + "\n";
      if (currentSection === "skills") sections.skills += line + "\n";
      if (currentSection === "projects") sections.projects += line + "\n";
    }
  }
  return sections;
}

function extractSkillsWithEvidence(text: string) {
  const foundSkills: { skill: string; evidence: string }[] = [];
  const sentences = text.split(/[.?!]\s+/);
  
  for (const [canonical, aliases] of Object.entries(TAXONOMY)) {
    for (const alias of aliases) {
      // Require word boundaries. For short tokens like 'R' or 'Go', require exact case match, otherwise case-insensitive.
      const flags = alias.length <= 2 ? 'g' : 'gi';
      const regex = new RegExp(`\\b${alias}\\b`, flags);
      
      for (const sentence of sentences) {
        if (regex.test(sentence)) {
          if (!foundSkills.some(s => s.skill === canonical)) {
            foundSkills.push({ skill: canonical, evidence: sentence.trim().replace(/\n/g, ' ') });
          }
        }
      }
    }
  }
  return foundSkills.map(s => s.skill);
}

function calculateExperienceYears(text: string): number | null {
  const dateRegex = /\b((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s*\d{2,4}|\d{4})\s*[-–to]+\s*((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s*\d{2,4}|\d{4}|Present|Current)\b/gi;
  const matches = [...text.matchAll(dateRegex)];
  
  if (matches.length === 0) {
    const fallback = text.match(/\b(\d+)\+?\s*years\b/i);
    return fallback ? parseInt(fallback[1], 10) : null;
  }

  const intervals: {start: number, end: number}[] = [];
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

  for (const match of matches) {
    try {
      const parseDate = (dStr: string) => {
        if (/present|current/i.test(dStr)) return currentYear * 12 + currentMonth;
        const yearMatch = dStr.match(/\d{4}/);
        const year = yearMatch ? parseInt(yearMatch[0], 10) : 2000;
        return year * 12; // Simplifying months for prototype
      };
      const start = parseDate(match[1]);
      const end = parseDate(match[2]);
      if (start <= end && end <= (currentYear * 12 + currentMonth)) {
        intervals.push({ start, end });
      }
    } catch (e) {}
  }

  if (intervals.length === 0) return null;

  // Merge overlapping intervals so concurrent jobs aren't double-counted
  intervals.sort((a, b) => a.start - b.start);
  let merged = [intervals[0]];
  for (let i = 1; i < intervals.length; i++) {
    const last = merged[merged.length - 1];
    const curr = intervals[i];
    if (curr.start <= last.end) {
      last.end = Math.max(last.end, curr.end);
    } else {
      merged.push(curr);
    }
  }

  const totalMonths = merged.reduce((sum, i) => sum + (i.end - i.start), 0);
  return parseFloat((totalMonths / 12).toFixed(1));
}

// --- 3. LLM FALLBACK & RECONCILIATION ---
const llmPrompt = `
Extract data from this resume. Output STRICT JSON matching this schema exactly. Do not use markdown backticks.
{
  "totalExperienceYears": number or null,
  "education": [{"degree": "...", "field": "...", "institution": "...", "year": "..."}],
  "projects": [{"name": "...", "text": "..."}],
  "certifications": ["..."]
}
`;

async function runPhase2() {
  const files = fs.readdirSync(TEXT_DIR).filter(f => f.endsWith('.txt'));
  const database: any[] = [];
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  let cleaningLog = `# Phase 2: AI Data Cleaning & Reconciliation Log\n\n| Candidate ID | Overrides Applied | Details |\n|---|---|---|\n`;

  console.log(`Starting deterministic + LLM extraction for ${files.length} resumes...`);

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const id = file.replace('.txt', '');
    const text = fs.readFileSync(path.join(TEXT_DIR, file), 'utf-8');
    const rawTextLength = text.length;

    // 1. Graceful Failure
    if (rawTextLength < 200 || text.includes('[SCANNED_IMAGE_OR_EMPTY]')) {
      database.push({ id, sourceFile: file, sourceUrl: `/resumes/${file}`, status: "unreadable", warnings: ["Under 200 characters or scanned PDF."], rawTextLength });
      console.log(`[${i + 1}] Skipped: ${id} (Unreadable)`);
      continue;
    }

    // 2. Rule-Based Pass
    const sections = segmentSections(text);
    const ruleSkills = extractSkillsWithEvidence(text);
    const ruleExp = calculateExperienceYears(sections.experience || text);
    const warnings: string[] = [];
    if (!sections.experience) warnings.push("No distinct experience section found.");

    // 3. LLM Pass
    let llmData: any = {};
    try {
      const result = await model.generateContent([llmPrompt, text.substring(0, 10000)]);
      const cleanJsonStr = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
      llmData = JSON.parse(cleanJsonStr);
    } catch (e) {
      warnings.push("LLM extraction failed, relying purely on rules.");
    }

    // 4. Diff & Reconcile
    let overrides = 0;
    let details = [];

    let finalExp = ruleExp;
    if (ruleExp === null && typeof llmData.totalExperienceYears === 'number') {
      finalExp = llmData.totalExperienceYears;
      overrides++;
      details.push("LLM provided missing experience years.");
    } else if (ruleExp !== null && typeof llmData.totalExperienceYears === 'number' && Math.abs(ruleExp - llmData.totalExperienceYears) > 2) {
      // Trust the deterministic math over the LLM hallucination
      details.push(`Overrode LLM Exp (${llmData.totalExperienceYears}) with Math (${ruleExp}).`);
      overrides++;
    }

    const finalRecord = {
      id,
      sourceFile: file,
      sourceUrl: `/resumes/${file}`,
      status: warnings.length > 0 ? "partial" : "ok",
      warnings,
      rawTextLength,
      skills: ruleSkills,
      experience: [], // Simplified for prototype scale
      totalExperienceYears: finalExp,
      education: llmData.education || [],
      projects: llmData.projects || [],
      certifications: llmData.certifications || []
    };

    database.push(finalRecord);
    cleaningLog += `| ${id} | ${overrides} | ${details.join(' ')} |\n`;
    console.log(`[${i + 1}/${files.length}] Extracted: ${id} | Status: ${finalRecord.status}`);
    
    await new Promise(res => setTimeout(res, 4000)); // Rate limit protection
  }

  fs.writeFileSync(DB_FILE, JSON.stringify(database, null, 2));
  fs.writeFileSync(CLEANING_LOG, cleaningLog);
  console.log(`\n✅ Saved database.json and generated docs/CLEANING.md evidence.`);
}

runPhase2();