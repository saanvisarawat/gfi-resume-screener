// File -> plain text. Used by the build script and the upload API.
import mammoth from "mammoth";

export async function fileToText(buf: Buffer, name: string): Promise<string> {
  const ext = name.toLowerCase().split(".").pop();
  if (ext === "docx") return (await mammoth.extractRawText({ buffer: buf })).value;
  if (ext === "txt" || ext === "md") return buf.toString("utf8");
  if (ext === "pdf") {
    const { extractText, getDocumentProxy } = await import("unpdf");
    const pdf = await getDocumentProxy(new Uint8Array(buf));
    const { text } = await extractText(pdf, { mergePages: true });
    return Array.isArray(text) ? text.join("\n") : text;
  }
  throw new Error(`Unsupported file type ".${ext}". Please upload a .docx, .pdf or .txt file.`);
}
