export type Loc = "work" | "listed";
export type SectionKey =
  | "education" | "skills" | "experience" | "summary" | "projects"
  | "tools" | "certifications" | "languages" | "awards" | "other";

export interface Warning { level: "error" | "warn" | "info"; code: string; message: string }

export interface Job {
  title: string; company: string; header: string;
  start: string | null; end: string | null; // ISO yyyy-mm
  months: number | null; monthsSource: "dates" | "duration" | "none";
  bullets: string[];
}
export interface EduEntry { degree: string; detail: string; level: number; score: string | null }
export interface Project { name: string; text: string }
export interface SkillHit { id: string; label: string; loc: Loc; snippet: string }

export interface Candidate {
  id: string; sourceFile: string; sourceUrl: string; uploaded?: boolean;
  headline: string;
  status: "ok" | "partial" | "unreadable";
  warnings: Warning[];
  cleaning: string[];           // clean-up actions applied to the raw text
  textLength: number;
  rawText: string;
  summary: string;
  listedSkills: string[];
  jobs: Job[];
  totalMonths: number;
  experienceNote: string;       // how years were derived
  education: EduEntry[];
  highestLevel: number;
  projects: Project[];
  certifications: string[];
  languages: string[];
  hits: SkillHit[];             // role-agnostic taxonomy hits with evidence
}

export interface Component { key: string; label: string; points: number; max: number; evidence: string[]; note?: string }
export interface RoleScore { role: RoleId; total: number; components: Component[]; relevantMonths: number }
export type RoleId = "lca" | "uiux";
export type Label = "LCA" | "UI/UX" | "Both" | "Neither / uncertain";
export interface Classification { label: Label; leaning: RoleId | null; reason: string }
export interface Scored extends Candidate {
  scores: Record<RoleId, RoleScore>;
  classification: Classification;
}
