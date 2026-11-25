"use client";

import type { ReactNode } from "react";

/** Inline Markdown: `code`, **bold**, *italic*, [links](url). Built as React nodes, never as HTML. */
function inline(text: string, key = 0): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(`[^`]+`)|(\*\*[^*]+\*\*)|(\*[^*\s][^*]*\*|_[^_\s][^_]*_)|(\[[^\]]+\]\([^)\s]+\))/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = key;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const s = m[0];
    if (m[1]) out.push(<code key={i++}>{s.slice(1, -1)}</code>);
    else if (m[2]) out.push(<strong key={i++}>{inline(s.slice(2, -2), i * 100)}</strong>);
    else if (m[3]) out.push(<em key={i++}>{inline(s.slice(1, -1), i * 100)}</em>);
    else {
      const [, label, href] = s.match(/^\[([^\]]+)\]\(([^)]+)\)$/)!;
      const safe = /^(https?:|mailto:|#|\.{0,2}\/)/.test(href) ? href : undefined;
      out.push(
        <a key={i++} href={safe} target="_blank" rel="noreferrer">
          {label}
        </a>,
      );
    }
    last = m.index + s.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function MarkdownPreview({ text }: { text: string }) {
  let lines = text.split("\n");
  const blocks: ReactNode[] = [];
  let k = 0;

  // Frontmatter (skills, workflows) shows as a small table of settings.
  if (lines[0] === "---") {
    const end = lines.indexOf("---", 1);
    if (end > 0) {
      const rows = lines.slice(1, end).map((l) => l.match(/^([\w-]+):\s*(.*)$/)).filter(Boolean) as RegExpMatchArray[];
      blocks.push(
        <dl key={k++} className="mb-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 rounded-lg border border-line bg-surface-2/60 px-3 py-2 text-[13px]">
          {rows.map((r) => [
            <dt key={r[1]} className="font-mono text-fg-3">
              {r[1]}
            </dt>,
            <dd key={r[1] + "v"} className="min-w-0 break-words">
              {r[2]}
            </dd>,
          ])}
        </dl>,
      );
      lines = lines.slice(end + 1);
    }
  }

  for (let i = 0; i < lines.length; ) {
    const line = lines[i];
    if (!line.trim()) {
      i++;
      continue;
    }
    const fence = line.match(/^```(\w*)/);
    if (fence) {
      const body: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith("```")) body.push(lines[i++]);
      i++;
      blocks.push(
        <pre key={k++}>
          <code>{body.join("\n")}</code>
        </pre>,
      );
      continue;
    }
    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      const Tag = (["h1", "h2", "h3", "h4", "h4", "h4"] as const)[h[1].length - 1];
      blocks.push(<Tag key={k++}>{inline(h[2])}</Tag>);
      i++;
      continue;
    }
    if (/^(-{3,}|\*{3,})$/.test(line.trim())) {
      blocks.push(<hr key={k++} />);
      i++;
      continue;
    }
    if (/^\s*([-*+]|\d+\.)\s+/.test(line)) {
      const ordered = /^\s*\d+\./.test(line);
      const items: string[] = [];
      while (i < lines.length && /^\s*([-*+]|\d+\.)\s+/.test(lines[i])) items.push(lines[i++].replace(/^\s*([-*+]|\d+\.)\s+/, ""));
      const List = ordered ? "ol" : "ul";
      blocks.push(
        <List key={k++}>
          {items.map((it, j) => {
            const task = it.match(/^\[([ xX])\]\s+(.*)$/);
            return (
              <li key={j} className={task ? "list-none -ml-5" : undefined}>
                {task ? (
                  <>
                    <input type="checkbox" checked={task[1] !== " "} readOnly className="mr-2 accent-[var(--accent)]" />
                    {inline(task[2])}
                  </>
                ) : (
                  inline(it)
                )}
              </li>
            );
          })}
        </List>,
      );
      continue;
    }
    if (line.startsWith(">")) {
      const q: string[] = [];
      while (i < lines.length && lines[i].startsWith(">")) q.push(lines[i++].replace(/^>\s?/, ""));
      blocks.push(<blockquote key={k++}>{inline(q.join(" "))}</blockquote>);
      continue;
    }
    const para: string[] = [];
    while (i < lines.length && lines[i].trim() && !/^(#{1,6}\s|```|\s*([-*+]|\d+\.)\s|>)/.test(lines[i])) para.push(lines[i++]);
    blocks.push(<p key={k++}>{inline(para.join(" "))}</p>);
  }

  return <div className="md-preview">{blocks.length ? blocks : <p className="text-fg-3">—</p>}</div>;
}
