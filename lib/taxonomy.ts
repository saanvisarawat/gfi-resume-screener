// Skill taxonomy. Every pattern is searched in the resume text; the matching
// sentence is kept as evidence. Edit this file to change what counts as a skill.
export interface SkillDef { id: string; label: string; re: RegExp }
const S = (id: string, label: string, re: RegExp): SkillDef => ({ id, label, re });

export const SKILLS: SkillDef[] = [
  // ---- LCA role (JD1) ----
  S("lca", "Life Cycle Assessment", /\b(?:life[\s-]?cycle (?:assessment|analysis|analyses|inventory)|LCAs?)\b/i),
  S("gabi", "GaBi", /\bga\s?bi\b/i),
  S("simapro", "SimaPro", /\bsima\s?pro\b/i),
  S("openlca", "openLCA", /\bopen\s?lca\b/i),
  S("ecoinvent", "ecoinvent / LCI database", /\b(?:ecoinvent|ELCD)\b/i),
  S("umberto", "Umberto", /\bumberto\b/i),
  S("lci", "Life Cycle Inventory", /\b(?:life[\s-]?cycle inventory|LCI)\b/i),
  S("iso14040", "ISO 14040/14044", /\bISO\s*[-:]?\s*1404[04]\b/i),
  S("epd", "EPD", /\b(?:EPDs?|environmental product declarations?)\b/i),
  S("footprint", "Carbon footprint / GHG", /\b(?:carbon (?:footprint|accounting)|GHG|greenhouse gas|scope [123])\b/i),
  S("esg", "ESG / sustainability reporting", /\b(?:ESG|BRSR|sustainability report\w*|CSRD)\b/i),
  S("benchmark", "Benchmarking", /\bbenchmark\w*/i),
  S("datawork", "Data collection / validation", /\bdata (?:validation|quality|collection|compilation|analysis|analytics)\b/i),
  S("stakeholder", "Stakeholder / client management", /\b(?:stakeholders?|client (?:management|engagement|communication|contact))\b/i),
  // ---- UI/UX role (JD2) ----
  S("figma", "Figma", /\bfigma\b/i),
  S("prototyping", "Prototyping", /\bprototyp\w*/i),
  S("wireframing", "Wireframing", /\bwire[\s-]?fram\w*/i),
  S("userresearch", "User research", /\b(?:user|ux|usability|design) research\b|\buser interviews?\b|\binterviews?\b.*\busers?\b/i),
  S("uidesign", "UI / UX design", /\b(?:UI\s*\/\s*UX|UX\s*\/\s*UI|UI design\w*|UX design\w*|product design\w*|interface design\w*|visual design\w*|interaction design\w*)\b/i),
  S("usability", "Usability testing", /\busability (?:test\w*|feedback|stud\w*)\b/i),
  S("designsystem", "Design systems", /\bdesign systems?\b/i),
  S("hcd", "Human / user-centred design", /\b(?:user|human)[\s-]cent(?:e)?red\b|\bdesign thinking\b/i),
  S("persona", "Personas / journey maps", /\b(?:personas?|journey map\w*|user (?:flows?|journeys?)|information architecture|\bIA\b)\b/i),
  S("accessibility", "Accessibility", /\b(?:accessib\w+|WCAG)\b/i),
  S("psychology", "User psychology", /\b(?:user|behaviou?ral|cognitive) psychology\b|\bpsychology\b/i),
  S("designtools", "Other design tools", /\b(?:adobe xd|sketch|framer|invision|maze|miro|figjam|uizard|canva|photoshop|illustrator)\b/i),
  S("frontend", "HTML / CSS", /\b(?:html|css)\b/i),
  S("portfolio", "Portfolio link", /\b(?:behance|dribbble)\b|\bportfolio (?:site|website|link|url)\b|\bportfolio:|https?:\/\/|\bwww\./i),
];
export const SKILL_BY_ID = Object.fromEntries(SKILLS.map(s => [s.id, s]));

// Broad environmental / sustainability vocabulary for the "domain" signal.
export const ENV_TERMS: [string, RegExp][] = [
  ["environment", /\benvironment\w*/i], ["sustainability", /\bsustainab\w*/i],
  ["carbon / GHG", /\b(?:carbon|GHG|greenhouse)\b/i], ["emissions", /\bemission\w*/i],
  ["climate", /\bclimate\b/i], ["waste", /\bwaste\w*/i], ["water", /\b(?:water|effluent|wastewater)\b/i],
  ["energy", /\b(?:energy|renewable|solar)\b/i], ["ESG", /\bESG\b/], ["pollution / air quality", /\b(?:pollution|air quality)\b/i],
];
export const ENV_FIELD = /\b(?:environment\w*|sustainab\w*|energy|chemical|civil|climate|ecolog\w*|earth|forestry|agricultur\w*|green|geo\w*|biotech\w*|process)\b/i;
export const DESIGN_FIELD = /\b(?:design|b\.?des|m\.?des|hci|human[\s-]computer|ux|ui|multimedia|animation|visual|communication|computer science|information technology|software|fine arts)\b/i;
// Strict design vocabulary: a project only counts as design work if it uses these words,
// or the candidate is clearly a designer (see score.ts). "Design thinking" alone does not count.
export const DESIGN_TERMS = /\b(?:redesign\w*|UI|UX|figma|prototyp\w*|wireframe\w*|case study|mock-?ups?|user (?:flows?|journeys?|research)|interface design)\b/i;
export const DESIGNER_HEADLINE = /\b(?:UI|UX|designer|design)\b/i;
