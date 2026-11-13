import type { RoleId } from "./types";
// Short, plain-language summaries of the two job descriptions (shown in the UI).
export const ROLE_INFO: Record<RoleId, { title: string; short: string; summary: string; must: string[]; nice: string[]; note: string }> = {
  lca: {
    title: "LCA Consultant", short: "LCA",
    summary: "Onsite in Chennai for a sustainability consultancy's client: collect and validate Life Cycle Inventory (LCI) data, build LCI models and run LCA studies in GaBi or SimaPro, document every assumption so work is audit-ready, gather operational and logistics data from client teams, and benchmark against public sources.",
    must: ["Life cycle assessment method", "GaBi / SimaPro (or other LCA software)", "Life cycle inventory (LCI)", "ISO 14040 / 14044", "3+ completed LCA projects", "Environmental degree preferred"],
    nice: ["EPD experience", "Carbon footprint / GHG", "ESG reporting", "Benchmarking", "Data validation", "Stakeholder management", "Logistics / operational data", "Business finance & accounting"],
    note: "JD1 asks for 2–3 years running LCA projects; the assignment sheet says 4–6. This prototype scores against the JD (24 months of LCA-relevant work = full marks). Not scored, for the reviewer to check: willingness to relocate to Chennai and travel, English fluency, 1-year minimum commitment.",
  },
  uiux: {
    title: "UI/UX Design Intern", short: "UI/UX",
    summary: "Remote, 0–1 year. First member of the design team at Growth For Impact ('LinkedIn for sustainability'): design the website and job board across devices, run user research on user psychology and behaviour, build high-fidelity Figma prototypes, and take part in design critiques.",
    must: ["Figma", "Prototyping", "Wireframing", "User research", "UI / UX design"],
    nice: ["Usability testing", "Design systems", "Human-centred design", "User psychology", "Responsive / cross-device design", "Visual identity & typography", "Design critique", "Portfolio"],
    note: "An internship: projects and skills count most, and experience needs only about 6 months of design work for full marks. Not scored, for the reviewer to judge: aesthetic sense, attention to detail and creative outlook (look at the portfolio or projects).",
  },
};
export const ROLE_IDS: RoleId[] = ["lca", "uiux"];
