import { NextResponse } from "next/server";
import { DATA } from "@/lib/data";
import { fileToText } from "@/lib/parse";
import { extractCandidate } from "@/lib/extract";
import { rankOf, scoreCandidate } from "@/lib/score";

const MAX_BYTES = 4 * 1024 * 1024; // Vercel serverless request bodies are limited to ~4.5 MB

export async function POST(req: Request) {
  let form: FormData;
  try { form = await req.formData(); } catch { return NextResponse.json({ error: "Could not read the upload. Please choose a file and try again." }, { status: 400 }); }
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "No file received." }, { status: 400 });
  if (file.size === 0) return NextResponse.json({ error: "The file is empty." }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "The file is larger than 4 MB. Please upload a smaller resume." }, { status: 413 });
  if (!/\.(docx|pdf|txt)$/i.test(file.name)) return NextResponse.json({ error: "Unsupported file type. Please upload a .docx, .pdf or .txt resume." }, { status: 415 });

  let text = "";
  try { text = await fileToText(Buffer.from(await file.arrayBuffer()), file.name); }
  catch (e) {
    return NextResponse.json({ error: `The file could not be read (${(e as Error).message}). It may be corrupted or password protected.` }, { status: 422 });
  }
  const id = `UPLOAD-${file.name.replace(/\.\w+$/, "").replace(/[^\w-]+/g, "_").slice(0, 24)}`;
  const cand = scoreCandidate(extractCandidate(text, { id, sourceFile: file.name, sourceUrl: "", uploaded: true }, new Date(DATA.builtAt)));
  const pile = DATA.candidates;
  const readable = pile.filter(p => p.status !== "unreadable").length;
  return NextResponse.json({
    candidate: cand,
    ranks: cand.status === "unreadable" ? null : { lca: rankOf(pile, "lca", cand.scores.lca.total), uiux: rankOf(pile, "uiux", cand.scores.uiux.total) },
    pileSize: readable,
  });
}
