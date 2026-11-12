// OPTIONAL step. Asks Gemini to extract the same fields as the rules, then compares (lib/crosscheck.ts)
// and writes docs/LLM_CROSSCHECK.md. The app does not need this to run, and it never changes the scores.
//
//   1. put GEMINI_API_KEY=... in .env  (never commit it)
//   2. npm run crosscheck -- --models          lists the model names your key can use
//   3. set GEMINI_MODEL=<one of them> in .env, then:  npm run crosscheck
import "dotenv/config";
import fs from "fs";
import { GoogleGenAI, Type } from "@google/genai";
import { compare, summarise, type LlmExtract } from "../lib/crosscheck";
import type { Scored } from "../lib/types";

async function main() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) { console.error("GEMINI_API_KEY is missing. Add it to .env and run again."); process.exit(1); }
  const ai = new GoogleGenAI({ apiKey: key });

  if (process.argv.includes("--models")) {
    const pager = await ai.models.list();
    for await (const m of pager) console.log(m.name);
    return;
  }
  const model = process.env.GEMINI_MODEL;
  if (!model) { console.error("Set GEMINI_MODEL in .env (run `npm run crosscheck -- --models` to see valid names)."); process.exit(1); }

  const data = JSON.parse(fs.readFileSync("data/candidates.json", "utf8")) as { candidates: Scored[] };
  const todo = data.candidates.filter(c => c.status !== "unreadable");
  const ok: { id: string; findings: ReturnType<typeof compare> }[] = [];
  const failed: { id: string; error: string }[] = [];

  for (const [i, c] of todo.entries()) {
    try {
      const res = await ai.models.generateContent({
        model,
        contents: `Extract these fields from the resume. totalExperienceMonths = total months of paid work or internships (merge overlaps; treat "Present" as November 2026; null if unknown). degrees = every degree or diploma as written. skills = technical skills and tools as written. Use only what the resume says.\n\nRESUME:\n${c.rawText.slice(0, 12000)}`,
        config: {
          temperature: 0,
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              totalExperienceMonths: { type: Type.NUMBER, nullable: true },
              degrees: { type: Type.ARRAY, items: { type: Type.STRING } },
              skills: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ["totalExperienceMonths", "degrees", "skills"],
          },
        },
      });
      const parsed = JSON.parse(res.text ?? "") as LlmExtract;
      if (!Array.isArray(parsed.degrees) || !Array.isArray(parsed.skills)) throw new Error("Response did not match the schema");
      ok.push({ id: c.id, findings: compare(c, parsed) });
      console.log(`[${i + 1}/${todo.length}] ${c.id} ok`);
    } catch (e) {
      failed.push({ id: c.id, error: (e as Error).message.slice(0, 200) });
      console.log(`[${i + 1}/${todo.length}] ${c.id} FAILED: ${(e as Error).message.slice(0, 120)}`);
    }
    await new Promise(r => setTimeout(r, 1500)); // stay under free-tier rate limits
  }
  fs.writeFileSync("docs/LLM_CROSSCHECK.md", summarise(ok, failed, todo.length));
  console.log(`Wrote docs/LLM_CROSSCHECK.md (${ok.length} succeeded, ${failed.length} failed)`);
  if (failed.length === todo.length) { console.error("Every call failed, so no cross-check was performed. Fix the error above (model name? key?)."); process.exit(1); }
}
main();
