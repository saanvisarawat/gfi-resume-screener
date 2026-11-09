export const ROLE_CONFIGS = {
  LCA: {
    mustHave: ["lca", "life cycle assessment", "iso 14040", "iso 14044", "simapro", "gabi", "openlca", "carbon footprint", "environmental impact"],
    niceToHave: ["sustainability", "scope 3", "ghg", "environmental engineering", "data analysis", "python"],
    titleKeywords: ["lca", "life cycle", "environmental", "sustainability", "carbon"],
    experience: { min: 4, max: 6, weight: 20 },
    education: ["environmental", "engineering", "sustainability", "science", "b.tech", "m.tech", "m.sc"],
    weights: { mustHave: 35, niceToHave: 10, relExp: 20, yearsExp: 20, projects: 5, education: 10 }
  },
  UIUX: {
    mustHave: ["figma", "wireframing", "prototyping", "user research", "usability testing", "ui/ux", "user interface", "user experience"],
    niceToHave: ["adobe xd", "sketch", "invision", "html", "css", "interaction design", "user flows"],
    titleKeywords: ["ui", "ux", "design", "product designer", "user experience"],
    experience: { min: 0, max: 2, weight: 0 }, 
    education: ["design", "b.des", "m.des", "hci", "computer science", "arts"],
    weights: { mustHave: 30, niceToHave: 10, relExp: 10, yearsExp: 0, projects: 30, education: 20 }
  }
};