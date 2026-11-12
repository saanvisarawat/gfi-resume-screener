import fs from "fs";
import path from "path";
import { marked } from "marked";
import Link from "next/link";

export default function Methodology() {
  const md = fs.readFileSync(path.join(process.cwd(), "docs", "METHODOLOGY.md"), "utf8");
  const html = marked.parse(md, { async: false }) as string;
  return (
    <main className="doc">
      <Link href="/" className="back">← Back to results</Link>
      <article dangerouslySetInnerHTML={{ __html: html }} />
    </main>
  );
}
