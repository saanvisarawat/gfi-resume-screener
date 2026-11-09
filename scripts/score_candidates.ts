import fs from 'fs';
import path from 'path';
import { ROLE_CONFIGS } from '../config/roles';

const DB_PATH = path.join(process.cwd(), 'data', 'database.json');
const SCORED_DB_PATH = path.join(process.cwd(), 'data', 'scored_candidates.json');

type ExplanationRecord = { component: string; points: number; max: number; evidence: string };

function evaluateRole(candidate: any, roleKey: 'LCA' | 'UIUX'): { score: number; explanations: ExplanationRecord[] } {
  const config = ROLE_CONFIGS[roleKey];
  const explanations: ExplanationRecord[] = [];
  let totalScore = 0;

  const candidateSkills = (candidate.skills || []).map((s: string) => s.toLowerCase());
  
  // 1. Must-Have Skills
  const matchedMustHaves = config.mustHave.filter(skill => candidateSkills.includes(skill));
  // Assuming matching 4 key skills demonstrates full proficiency for max points
  const mhPoints = Math.min(config.weights.mustHave, (matchedMustHaves.length / 4) * config.weights.mustHave);
  totalScore += mhPoints;
  explanations.push({
    component: "Must-Have Skills",
    points: Math.round(mhPoints),
    max: config.weights.mustHave,
    evidence: matchedMustHaves.length > 0 
      ? `Matched ${matchedMustHaves.length} core skills: ${matchedMustHaves.join(', ')}.` 
      : "No must-have skills detected."
  });

  // 2. Nice-To-Have Skills
  const matchedNice = config.niceToHave.filter(skill => candidateSkills.includes(skill));
  const nthPoints = Math.min(config.weights.niceToHave, (matchedNice.length / 3) * config.weights.niceToHave);
  totalScore += nthPoints;
  explanations.push({
    component: "Nice-To-Have Skills",
    points: Math.round(nthPoints),
    max: config.weights.niceToHave,
    evidence: matchedNice.length > 0 ? `Matched secondary skills: ${matchedNice.join(', ')}.` : "No nice-to-have skills detected."
  });

  // 3. Relevant Experience (Domain Match)
  // Proxying by checking if titleKeywords exist in the raw project/skill data for the prototype
  const domainHits = config.titleKeywords.filter(kw => 
    JSON.stringify(candidate).toLowerCase().includes(kw)
  );
  const relExpPoints = Math.min(config.weights.relExp, (domainHits.length / 2) * config.weights.relExp);
  totalScore += relExpPoints;
  explanations.push({
    component: "Domain Relevance",
    points: Math.round(relExpPoints),
    max: config.weights.relExp,
    evidence: domainHits.length > 0 ? `Found relevant domain keywords: ${domainHits.join(', ')}.` : "Lacking strong domain presence."
  });

  // 4. Years of Experience Curve
  let yrsPoints = 0;
  const exp = candidate.totalExperienceYears || 0;
  let expEvidence = "";
  
  if (roleKey === 'LCA') {
    if (exp >= 4 && exp <= 6) {
      yrsPoints = config.weights.yearsExp;
      expEvidence = `Perfect match: ${exp} years falls entirely within the 4-6 target band.`;
    } else if (exp < 4) {
      yrsPoints = (exp / 4) * config.weights.yearsExp;
      expEvidence = `Under target: ${exp} years yields partial credit.`;
    } else {
      yrsPoints = Math.max(0, config.weights.yearsExp - ((exp - 6) * 2)); // Mild penalty over 6
      expEvidence = `Overqualified: ${exp} years incurs a mild penalty.`;
    }
  } else {
    // UI/UX Internship
    yrsPoints = config.weights.yearsExp; 
    expEvidence = `Internship profile: Experience duration (${exp} yrs) is not penalized.`;
  }
  totalScore += yrsPoints;
  explanations.push({ component: "Experience Years", points: Math.round(yrsPoints), max: config.weights.yearsExp, evidence: expEvidence });

  // 5. Projects Relevance
  const projCount = (candidate.projects || []).length;
  // Assuming 2-3 projects maxes out the score depending on the role's weight
  const projPoints = Math.min(config.weights.projects, (projCount / 2) * config.weights.projects);
  totalScore += projPoints;
  explanations.push({
    component: "Projects",
    points: Math.round(projPoints),
    max: config.weights.projects,
    evidence: projCount > 0 ? `Extracted ${projCount} relevant projects.` : "No distinct projects extracted."
  });

  // 6. Education
  const eduStr = JSON.stringify(candidate.education || []).toLowerCase();
  const eduMatches = config.education.filter(e => eduStr.includes(e));
  const eduPoints = eduMatches.length > 0 ? config.weights.education : (config.weights.education * 0.5); // 50% for having some degree, 100% for domain match
  totalScore += eduPoints;
  explanations.push({
    component: "Education",
    points: Math.round(eduPoints),
    max: config.weights.education,
    evidence: eduMatches.length > 0 ? `Matched preferred education markers: ${eduMatches[0]}.` : "General or unspecified education background."
  });

  return { score: Math.round(totalScore), explanations };
}

function classifyCandidate(lcaScore: number, uiuxScore: number, status: string) {
  if (status === "unreadable") return "Uncertain (Unreadable)";
  
  const threshold = 50;
  const margin = 15;

  if (lcaScore < 35 && uiuxScore < 35) return "Neither";
  if (lcaScore >= threshold && uiuxScore >= threshold && Math.abs(lcaScore - uiuxScore) < margin) return "Both";
  if (lcaScore >= threshold && (lcaScore - uiuxScore) >= margin) return "LCA";
  if (uiuxScore >= threshold && (uiuxScore - lcaScore) >= margin) return "UI/UX";
  
  return "Uncertain (Ambiguous Scores)";
}

function runPhase3() {
  const candidates = JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'));

  const scoredCandidates = candidates.map((c: any) => {
    const lcaEval = evaluateRole(c, 'LCA');
    const uiuxEval = evaluateRole(c, 'UIUX');
    
    return {
      ...c,
      classification: classifyCandidate(lcaEval.score, uiuxEval.score, c.status),
      scores: { LCA: lcaEval.score, UIUX: uiuxEval.score },
      explanations: { LCA: lcaEval.explanations, UIUX: uiuxEval.explanations }
    };
  });

  scoredCandidates.sort((a: any, b: any) => Math.max(b.scores.LCA, b.scores.UIUX) - Math.max(a.scores.LCA, a.scores.UIUX));
  fs.writeFileSync(SCORED_DB_PATH, JSON.stringify(scoredCandidates, null, 2));
  console.log(`✅ Applied config-driven scoring and strict classification to ${scoredCandidates.length} resumes.`);
}

runPhase3();