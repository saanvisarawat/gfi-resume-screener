"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ROLE_IDS, ROLE_INFO } from "@/lib/roles";
import type { Label, RoleId, Scored } from "@/lib/types";

type SortKey = "score" | "relevant" | "total";
type UploadResult = { candidate: Scored; ranks: Record<RoleId, number> | null; pileSize: number };

const CHIPS: Record<RoleId, string[]> = {
  lca: ["lca", "gabi", "simapro", "openlca", "lci", "epd", "footprint", "esg"],
  uiux: ["figma", "prototyping", "wireframing", "userresearch", "usability", "designsystem", "uidesign"],
};
const LABELS: (Label | "All")[] = ["All", "LCA", "UI/UX", "Both", "Neither / uncertain"];

const fmt = (m: number) => (m < 12 ? `${m} mo` : `${(m / 12).toFixed(1)} yrs`);
const badgeClass = (l: Label) => (l === "LCA" ? "b-lca" : l === "UI/UX" ? "b-ux" : l === "Both" ? "b-both" : "b-none");

export default function Screener({ candidates, builtAt }: { candidates: Scored[]; builtAt: string }) {
  const [role, setRole] = useState<RoleId>("lca");
  const [sort, setSort] = useState<SortKey>("score");
  const [cls, setCls] = useState<Label | "All">("All");
  const [minScore, setMinScore] = useState(0);
  const [q, setQ] = useState("");
  const [warnOnly, setWarnOnly] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [uploads, setUploads] = useState<UploadResult[]>([]);
  const [uploadError, setUploadError] = useState("");
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const all = useMemo(() => [...uploads.map(u => u.candidate), ...candidates], [uploads, candidates]);
  const readable = useMemo(() => all.filter(c => c.status !== "unreadable"), [all]);

  // Rank is computed over the whole pile (not the filtered view) so it never changes when filtering.
  const rankMaps = useMemo(() => {
    const out = { lca: new Map<string, number>(), uiux: new Map<string, number>() };
    for (const r of ROLE_IDS) {
      const s = [...readable].sort((a, b) => b.scores[r].total - a.scores[r].total);
      s.forEach((c, i) => out[r].set(c.id, i > 0 && s[i - 1].scores[r].total === c.scores[r].total ? out[r].get(s[i - 1].id)! : i + 1));
    }
    return out;
  }, [readable]);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return readable
      .filter(c => (cls === "All" || c.classification.label === cls) && c.scores[role].total >= minScore && (!warnOnly || c.warnings.some(w => w.level !== "info"))
        && (!needle || `${c.id} ${c.headline} ${c.hits.map(h => h.label).join(" ")}`.toLowerCase().includes(needle)))
      .sort((a, b) => {
        const ka = sort === "score" ? a.scores[role].total : sort === "relevant" ? a.scores[role].relevantMonths : a.totalMonths;
        const kb = sort === "score" ? b.scores[role].total : sort === "relevant" ? b.scores[role].relevantMonths : b.totalMonths;
        return kb - ka || b.scores[role].total - a.scores[role].total || a.id.localeCompare(b.id);
      });
  }, [readable, role, cls, minScore, q, warnOnly, sort]);

  const needsReview = all.filter(c => c.status !== "ok");
  const open = all.find(c => c.id === openId) ?? null;
  const counts = useMemo(() => {
    const m: Record<string, number> = {};
    for (const c of readable) m[c.classification.label] = (m[c.classification.label] ?? 0) + 1;
    return m;
  }, [readable]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpenId(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  async function onUpload(file: File | undefined) {
    if (!file) return;
    setUploadError(""); setBusy(true);
    try {
      if (file.size > 4 * 1024 * 1024) throw new Error("The file is larger than 4 MB. Please upload a smaller resume.");
      const fd = new FormData(); fd.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const body = await res.json().catch(() => ({ error: "The server returned an unexpected response." }));
      if (!res.ok) throw new Error(body.error ?? "Upload failed.");
      const r = body as UploadResult;
      r.candidate.id = `${r.candidate.id}#${uploads.length + 1}`;
      setUploads(u => [r, ...u]);
    } catch (e) { setUploadError((e as Error).message); }
    finally { setBusy(false); if (fileRef.current) fileRef.current.value = ""; }
  }

  const info = ROLE_INFO[role];
  return (
    <main className="page">
      <header className="top">
        <div>
          <h1>Resume Screener</h1>
          <p className="sub">{readable.length} readable resumes ranked against two roles · data built {builtAt} · <Link href="/methodology">How scoring works</Link></p>
        </div>
        <div className="stats" aria-label="Classification counts">
          {LABELS.slice(1).map(l => <span key={l} className={`badge ${badgeClass(l as Label)}`}>{l}: {counts[l] ?? 0}</span>)}
          <span className="badge b-warn">Needs review: {needsReview.length}</span>
        </div>
      </header>

      <section className="card upload" aria-labelledby="up-h">
        <h2 id="up-h">Test a new resume</h2>
        <p className="muted">Upload a .docx, .pdf or .txt (max 4 MB). It is parsed with the same rules as the pile, scored for both roles and ranked against all {readable.length - uploads.length} resumes. Uploads are not stored.</p>
        <label className="btn">
          {busy ? "Reading resume…" : "Choose resume"}
          <input ref={fileRef} type="file" accept=".docx,.pdf,.txt" hidden disabled={busy} onChange={e => onUpload(e.target.files?.[0])} />
        </label>
        {uploadError && <p role="alert" className="err">{uploadError}</p>}
        {uploads[0] && (() => { const u = uploads[0]; return (
          <div className="result" aria-live="polite">
            <strong>{u.candidate.sourceFile}</strong> → <span className={`badge ${badgeClass(u.candidate.classification.label)}`}>{u.candidate.classification.label}</span>
            {u.candidate.status === "unreadable" || !u.ranks ? <p className="err">{u.candidate.warnings[0]?.message}</p> : (
              <p>LCA score <b>{u.candidate.scores.lca.total}</b> (rank <b>#{u.ranks.lca}</b> of {u.pileSize + 1}) · UI/UX score <b>{u.candidate.scores.uiux.total}</b> (rank <b>#{u.ranks.uiux}</b> of {u.pileSize + 1})</p>)}
            <button className="link" onClick={() => setOpenId(u.candidate.id)}>Inspect extraction and score</button>
          </div>); })()}
      </section>

      <nav className="tabs" role="tablist" aria-label="Job profile">
        {ROLE_IDS.map(r => (
          <button key={r} role="tab" aria-selected={role === r} className={role === r ? "tab on" : "tab"} onClick={() => setRole(r)}>
            {ROLE_INFO[r].title}
          </button>
        ))}
      </nav>

      <section className="card jd">
        <p>{info.summary}</p>
        <div className="cols">
          <div><h3>Must-have signals</h3><ul>{info.must.map(x => <li key={x}>{x}</li>)}</ul></div>
          <div><h3>Nice to have</h3><ul>{info.nice.map(x => <li key={x}>{x}</li>)}</ul></div>
        </div>
        <p className="muted small">{info.note}</p>
      </section>

      <section className="controls" aria-label="Filters">
        <label>Sort by
          <select value={sort} onChange={e => setSort(e.target.value as SortKey)}>
            <option value="score">Match score</option>
            <option value="relevant">Relevant experience</option>
            <option value="total">Total experience</option>
          </select>
        </label>
        <label>Classification
          <select value={cls} onChange={e => setCls(e.target.value as Label | "All")}>{LABELS.map(l => <option key={l}>{l}</option>)}</select>
        </label>
        <label>Min score: {minScore}
          <input type="range" min={0} max={100} step={5} value={minScore} onChange={e => setMinScore(Number(e.target.value))} />
        </label>
        <label>Search
          <input type="search" placeholder="skill, title, id…" value={q} onChange={e => setQ(e.target.value)} />
        </label>
        <label className="check"><input type="checkbox" checked={warnOnly} onChange={e => setWarnOnly(e.target.checked)} /> Only with warnings</label>
      </section>

      <p className="muted" aria-live="polite">Showing {rows.length} of {readable.length} for {info.title}.</p>
      <div className="tablewrap">
        <table>
          <thead><tr><th>Rank</th><th>Candidate</th><th>{info.short} score</th><th>Classification</th><th>{info.short}-relevant exp.</th><th>Total exp.</th><th>Evidence</th><th></th></tr></thead>
          <tbody>
            {rows.map(c => {
              const chips = c.hits.filter(h => CHIPS[role].includes(h.id)).sort((a, b) => (a.loc === "work" ? 0 : 1) - (b.loc === "work" ? 0 : 1)).slice(0, 4);
              const s = c.scores[role].total;
              return (
                <tr key={c.id} className={c.uploaded ? "mine" : ""}>
                  <td className="rank">#{rankMaps[role].get(c.id)}</td>
                  <td><b>{c.id}</b>{c.uploaded && <span className="badge b-both"> your upload</span>}<div className="muted small">{c.headline || "—"}</div></td>
                  <td><div className="bar" role="img" aria-label={`${s} out of 100`}><i style={{ width: `${s}%` }} /></div><span className="num">{s}</span></td>
                  <td><span className={`badge ${badgeClass(c.classification.label)}`}>{c.classification.label}</span>{c.status === "partial" && <span className="badge b-warn" title="Extraction warnings">⚠</span>}</td>
                  <td>{fmt(c.scores[role].relevantMonths)}</td>
                  <td>{fmt(c.totalMonths)}</td>
                  <td>{chips.length ? chips.map(h => <span key={h.id} className={h.loc === "work" ? "chip" : "chip weak"} title={h.loc === "work" ? "Used in experience/projects" : "Listed only"}>{h.label}</span>) : <span className="muted small">none found</span>}</td>
                  <td><button className="btn small" onClick={() => setOpenId(c.id)}>Inspect</button></td>
                </tr>
              );
            })}
            {!rows.length && <tr><td colSpan={8} className="muted">No resumes match these filters.</td></tr>}
          </tbody>
        </table>
      </div>

      <section className="card review" aria-labelledby="rv-h">
        <h2 id="rv-h">Needs review ({needsReview.length})</h2>
        <p className="muted">Extraction problems are shown here so nothing is silently skipped. Unreadable files are not scored.</p>
        <ul className="rv">
          {needsReview.map(c => (
            <li key={c.id}>
              <button className="link" onClick={() => setOpenId(c.id)}><b>{c.id}</b></button> <span className={`badge ${c.status === "unreadable" ? "b-err" : "b-warn"}`}>{c.status}</span>
              <ul>{c.warnings.filter(w => w.level !== "info").map((w, i) => <li key={i}>{w.message}</li>)}</ul>
            </li>
          ))}
        </ul>
      </section>

      {open && <Drawer c={open} role={role} onClose={() => setOpenId(null)} ranks={{ lca: rankMaps.lca.get(open.id), uiux: rankMaps.uiux.get(open.id) }} total={readable.length} />}
    </main>
  );
}

function Drawer({ c, role, onClose, ranks, total }: { c: Scored; role: RoleId; onClose: () => void; ranks: Record<RoleId, number | undefined>; total: number }) {
  const order: RoleId[] = role === "lca" ? ["lca", "uiux"] : ["uiux", "lca"];
  return (
    <div className="overlay" onClick={onClose}>
      <aside className="drawer" role="dialog" aria-modal="true" aria-label={`Details for ${c.id}`} onClick={e => e.stopPropagation()}>
        <button className="close" onClick={onClose} aria-label="Close">×</button>
        <h2>{c.id}</h2>
        <p className="muted">{c.headline || "No headline found"}</p>
        <p><span className={`badge ${badgeClass(c.classification.label)}`}>{c.classification.label}</span> <span className={`badge ${c.status === "ok" ? "b-ok" : c.status === "partial" ? "b-warn" : "b-err"}`}>extraction: {c.status}</span></p>
        <p>{c.classification.reason}</p>
        {c.sourceUrl ? <p><a href={c.sourceUrl} target="_blank" rel="noreferrer">Open original resume ↗</a></p> : <p className="muted small">Uploaded file ({c.sourceFile}) is not stored.</p>}

        {c.warnings.length > 0 && <>
          <h3>What happened during extraction</h3>
          <ul className="warns">{c.warnings.map((w, i) => <li key={i} className={`w-${w.level}`}><b>{w.level}</b> {w.message}</li>)}</ul>
        </>}
        {c.cleaning.length > 0 && <p className="muted small">Text clean-up applied: {[...new Set(c.cleaning)].join("; ")}.</p>}

        {c.status !== "unreadable" && order.map(r => (
          <section key={r}>
            <h3>{ROLE_INFO[r].title}: {c.scores[r].total} / 100 {ranks[r] ? `(rank #${ranks[r]} of ${total})` : ""}</h3>
            <table className="mini"><tbody>
              {c.scores[r].components.map(k => (
                <tr key={k.key}>
                  <td><b>{k.label}</b>{k.note && <div className="muted small">{k.note}</div>}{k.evidence.length > 0 && <ul className="ev">{k.evidence.map((e, i) => <li key={i}>{e}</li>)}</ul>}</td>
                  <td className="pts">{k.points}<span className="muted"> / {k.max}</span></td>
                </tr>))}
            </tbody></table>
          </section>
        ))}

        {c.status !== "unreadable" && <>
          <h3>Extracted information</h3>
          <dl>
            <dt>Total experience</dt><dd>{fmt(c.totalMonths)} <span className="muted small">({c.experienceNote})</span></dd>
            <dt>Roles</dt><dd>{c.jobs.length ? <ul>{c.jobs.map((j, i) => <li key={i}>{j.title}{j.company && ` — ${j.company}`} <span className="muted small">{j.start ? `${j.start} → ${j.end}` : "dates unreadable"}{j.months != null ? `, ${fmt(j.months)}` : ""}</span></li>)}</ul> : "None found"}</dd>
            <dt>Education</dt><dd>{c.education.length ? <ul>{c.education.map((e, i) => <li key={i}>{e.degree}{e.detail && `, ${e.detail}`}{e.score && ` (${e.score})`}</li>)}</ul> : "None found"}</dd>
            <dt>Projects</dt><dd>{c.projects.length ? <ul>{c.projects.map((p, i) => <li key={i}>{p.name}</li>)}</ul> : "None found"}</dd>
            <dt>Listed skills</dt><dd>{c.listedSkills.length ? c.listedSkills.join(", ") : "None found"}</dd>
            <dt>Certifications</dt><dd>{c.certifications.length ? c.certifications.join("; ") : "None found"}</dd>
          </dl>
        </>}
        <details><summary>Show extracted text</summary><pre>{c.rawText || "(empty)"}</pre></details>
      </aside>
    </div>
  );
}
