"use client";

import "./code/editor.css";
import { clsx } from "clsx";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ArrowLeft, Check, CheckCircle2, ChevronRight, Code2, Eye, GitCompare, Loader2, Search, TriangleAlert, WandSparkles, WrapText } from "lucide-react";
import { checkSkill, hunks, lintRules, loadRules, listSkills, TOOL_NAMES, TOOLS, type World } from "@/engine";
import { useL, usePick } from "@/i18n";
import { CodeEditor, type CodeEditorHandle, type CursorInfo } from "./code/code-editor";
import { formatCode } from "./code/format";
import { langOf } from "./code/languages";
import { MarkdownPreview } from "./code/markdown-preview";
import { fileKind, fileState, KindIcon, StateBadge } from "./files-panel";
import { useLab } from "./store";

/** Which tools would load a rules file or see a skill: the point of where you put a file. */
function loadedBy(world: World, path: string) {
  const kind = fileKind(path);
  if (kind === "rules") return TOOLS.filter((tool) => loadRules(world.files, tool).some((r) => r.path === path));
  if (kind === "skill") return TOOLS.filter((tool) => listSkills(world.files, tool).some((s) => s.path === path));
  return [];
}

type View = "code" | "preview" | "diff";
type Notice = { kind: "ok" | "error" | "info"; text: string } | null;

const isMac = () => typeof navigator !== "undefined" && /Mac|iPhone|iPad/.test(navigator.platform);

export function Editor({ path, onBack }: { path: string; onBack?: () => void }) {
  const world = useLab((s) => s.world);
  const writeFile = useLab((s) => s.writeFile);
  const l = useL();
  const pick = usePick();
  const content = world.files[path] ?? "";
  const lang = langOf(path);
  const kind = fileKind(path);
  const isMd = lang.id === "markdown";
  const [draft, setDraft] = useState(content);
  const [pending, setPending] = useState(false);
  const [view, setView] = useState<View>("code");
  const [wrap, setWrap] = useState(isMd);
  const [cursor, setCursor] = useState<CursorInfo>({ line: 1, col: 1, selected: 0, lines: content.split("\n").length });
  const [formatting, setFormatting] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const editor = useRef<CodeEditorHandle>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync when the file changes underneath (agents, shell, explorer) unless the learner is mid-edit.
  const [seen, setSeen] = useState(content);
  if (content !== seen) {
    setSeen(content);
    if (!pending) setDraft(content);
  }

  const flash = (n: Notice, ms = 2200) => {
    setNotice(n);
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(null), ms);
  };

  const flush = (value: string) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
    setPending(false);
    writeFile(path, value);
  };
  const onChange = (value: string) => {
    setDraft(value);
    setPending(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => flush(value), 400);
  };
  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
      if (noticeTimer.current) clearTimeout(noticeTimer.current);
    },
    [],
  );

  const save = () => {
    flush(draft);
    flash({ kind: "ok", text: l("Saved", "Enregistré") }, 1400);
  };

  const format = async () => {
    if (!lang.parser) {
      flash({ kind: "info", text: l(`No formatter for ${lang.label} files`, `Pas de formateur pour les fichiers ${lang.label}`) });
      return;
    }
    setFormatting(true);
    const r = await formatCode(draft, lang);
    setFormatting(false);
    if (!r.ok) {
      flash({ kind: "error", text: l(`Can't format: ${r.error}`, `Formatage impossible : ${r.error}`) }, 5000);
      return;
    }
    if (r.text === draft) {
      flash({ kind: "ok", text: l("Already well formatted", "Déjà bien formaté") });
      return;
    }
    if (view !== "code") setView("code");
    // Through the editor so Ctrl+Z undoes the formatting.
    if (editor.current) editor.current.replaceAll(r.text);
    else onChange(r.text);
    flash({ kind: "ok", text: l("Formatted with Prettier", "Formaté avec Prettier") });
  };

  const state = fileState(world, path);
  const issues = kind === "rules" ? lintRules(draft).map((i) => pick(i.message)) : kind === "skill" ? checkSkill(path.split("/").at(-2) ?? "", draft).map((p) => pick(p.message)) : [];
  const tools = loadedBy(world, path);
  const mod = isMac() ? "⌘" : "Ctrl";
  const segments = (path.startsWith("~/") ? ["~", ...path.slice(2).split("/")] : ["project", ...path.split("/")]).filter(Boolean);
  const views: Array<{ id: View; label: string; icon: ReactNode; show: boolean }> = [
    { id: "code", label: l("Code", "Code"), icon: <Code2 className="size-3.5" />, show: true },
    { id: "preview", label: l("Preview", "Aperçu"), icon: <Eye className="size-3.5" />, show: isMd },
    { id: "diff", label: l("Changes", "Changements"), icon: <GitCompare className="size-3.5" />, show: !path.startsWith("~/") },
  ];

  return (
    <div className="flex h-full min-h-0 flex-col bg-[var(--editor-bg)]">
      {/* Breadcrumbs + actions */}
      <div className="flex min-h-10 shrink-0 flex-wrap items-center gap-x-2 gap-y-1 border-b border-line bg-surface px-2 py-1">
        {onBack && (
          <button onClick={onBack} className="rounded-md p-1 text-fg-3 hover:bg-surface-2 hover:text-fg pointer-coarse:p-2" aria-label={l("Back to files", "Retour aux fichiers")}>
            <ArrowLeft className="size-4" />
          </button>
        )}
        <nav aria-label={l("File path", "Chemin du fichier")} className="flex min-w-0 items-center gap-0.5 font-mono text-[12px] text-fg-3">
          {segments.map((seg, i) => {
            const last = i === segments.length - 1;
            return (
              <span key={i} className="flex min-w-0 items-center gap-0.5">
                {i > 0 && <ChevronRight className="size-3 shrink-0 opacity-60" aria-hidden />}
                {last && <KindIcon path={path} className="mr-1 size-3.5" />}
                <span className={clsx("truncate", last && "font-medium text-fg")}>{seg}</span>
              </span>
            );
          })}
          <span className="ml-1.5">
            <StateBadge state={state} />
          </span>
        </nav>

        <div className="ml-auto flex items-center gap-1">
          <div className="flex rounded-lg bg-surface-2 p-0.5 text-[11px]" role="tablist" aria-label={l("Editor view", "Vue de l'éditeur")}>
            {views
              .filter((v) => v.show)
              .map((v) => (
                <button
                  key={v.id}
                  role="tab"
                  aria-selected={view === v.id}
                  onClick={() => setView(v.id)}
                  className={clsx("flex items-center gap-1 rounded-md px-2 py-0.5 pointer-coarse:py-1.5", view === v.id ? "bg-elevated text-fg shadow-sm" : "text-fg-3 hover:text-fg")}
                >
                  {v.icon}
                  <span className="hidden sm:inline">{v.label}</span>
                </button>
              ))}
          </div>
          <ToolBtn label={l(`Find in file (${mod}+F)`, `Rechercher dans le fichier (${mod}+F)`)} onClick={() => (setView("code"), setTimeout(() => editor.current?.openSearch(), 0))}>
            <Search className="size-3.5" />
          </ToolBtn>
          <ToolBtn label={wrap ? l("Turn off word wrap", "Désactiver le retour à la ligne") : l("Wrap long lines", "Retour à la ligne automatique")} onClick={() => setWrap((w) => !w)} pressed={wrap}>
            <WrapText className="size-3.5" />
          </ToolBtn>
          <button
            onClick={format}
            disabled={formatting}
            title={l(`Format document (Shift+Alt+F)`, `Formater le document (Maj+Alt+F)`)}
            className="flex items-center gap-1.5 rounded-lg border border-line bg-elevated px-2 py-1 text-xs font-medium text-fg-2 hover:border-line-strong hover:text-fg disabled:opacity-60 pointer-coarse:py-2"
          >
            {formatting ? <Loader2 className="size-3.5 animate-spin" /> : <WandSparkles className="size-3.5 text-accent-fg" />}
            {l("Format", "Formater")}
          </button>
        </div>
      </div>

      {(kind === "rules" || kind === "skill") && (
        <div className={clsx("shrink-0 border-b border-line px-3 py-2 text-xs", issues.length ? "bg-warn-soft/50" : "bg-ok-soft/50")}>
          <p className="text-fg-2">
            {tools.length
              ? l(`${kind === "rules" ? "Loaded" : "Visible"} by: ${tools.map((t) => TOOL_NAMES[t]).join(", ")}`, `${kind === "rules" ? "Chargé" : "Visible"} par : ${tools.map((t) => TOOL_NAMES[t]).join(", ")}`)
              : l("No agent reads this file where it is.", "Aucun agent ne lit ce fichier à cet endroit.")}
          </p>
          {issues.length ? (
            <ul className="mt-1 space-y-0.5">
              {issues.map((m) => (
                <li key={m} className="flex gap-1.5 text-warn">
                  <TriangleAlert className="mt-0.5 size-3.5 shrink-0" /> <span className="text-fg">{m}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-1 flex items-center gap-1.5 text-ok">
              <CheckCircle2 className="size-3.5" /> {kind === "rules" ? l("Clear, specific rules.", "Des règles claires et précises.") : l("A valid skill.", "Un skill valide.")}
            </p>
          )}
        </div>
      )}

      <div className="relative min-h-0 flex-1">
        {view === "code" && (
          <CodeEditor
            ref={editor}
            value={draft}
            lang={lang.id}
            wrap={wrap}
            onChange={onChange}
            onCursor={setCursor}
            onSave={save}
            onFormat={format}
            onBlur={() => pending && flush(draft)}
            ariaLabel={l(`Edit ${path}`, `Modifier ${path}`)}
          />
        )}
        {view === "preview" && (
          <div className="scrollbar-thin h-full overflow-y-auto px-6 py-5">
            <div className="mx-auto max-w-[72ch]">
              <MarkdownPreview text={draft} />
            </div>
          </div>
        )}
        {view === "diff" && (
          <div className="scrollbar-thin h-full overflow-auto p-3">
            <DiffBlock title={l("Since the last commit", "Depuis le dernier commit")} from={world.git.head[path]} to={world.files[path]} empty={l("No changes since the last commit.", "Aucun changement depuis le dernier commit.")} />
          </div>
        )}
      </div>

      {/* Status bar, like an IDE */}
      <div className="flex h-7 shrink-0 items-center gap-3 overflow-hidden border-t border-line bg-surface px-3 font-mono text-[11px] text-fg-3" role="status">
        {notice ? (
          <span className={clsx("flex min-w-0 items-center gap-1 truncate font-sans", notice.kind === "error" ? "text-bad" : notice.kind === "ok" ? "text-ok" : "text-fg-2")}>
            {notice.kind === "ok" && <Check className="size-3.5 shrink-0" />}
            {notice.kind === "error" && <TriangleAlert className="size-3.5 shrink-0" />}
            <span className="truncate">{notice.text}</span>
          </span>
        ) : (
          <span className="hidden truncate font-sans md:inline">
            <kbd className="font-mono">{mod}+S</kbd> {l("save", "enregistrer")} · <kbd className="font-mono">Shift+Alt+F</kbd> {l("format", "formater")} · <kbd className="font-mono">{mod}+F</kbd> {l("find", "chercher")} ·{" "}
            <kbd className="font-mono">{mod}+/</kbd> {l("comment", "commenter")}
          </span>
        )}
        <span className="ml-auto flex shrink-0 items-center gap-3">
          <span>
            {l("Ln", "Ligne")} {cursor.line}, {l("Col", "Col")} {cursor.col}
            {cursor.selected > 0 && ` (${cursor.selected} ${l("selected", "sélectionnés")})`}
          </span>
          <span className="hidden sm:inline">{l("Spaces: 2", "Espaces : 2")}</span>
          <span className="hidden sm:inline">UTF-8</span>
          <span className="text-fg-2">{lang.label}</span>
          <span className={clsx("flex items-center gap-1 font-sans", pending ? "text-warn" : "text-ok")} title={pending ? l("Saving…", "Enregistrement…") : l("All changes saved", "Tout est enregistré")}>
            <span className={clsx("size-1.5 rounded-full", pending ? "bg-warn" : "bg-ok")} />
            <span className="hidden lg:inline">{pending ? l("Saving…", "Enregistrement…") : l("Saved", "Enregistré")}</span>
          </span>
        </span>
      </div>
    </div>
  );
}

function ToolBtn({ label, onClick, pressed, children }: { label: string; onClick: () => void; pressed?: boolean; children: ReactNode }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      aria-pressed={pressed}
      className={clsx("grid size-7 place-items-center rounded-md hover:bg-surface-2 hover:text-fg pointer-coarse:size-10", pressed ? "bg-accent-soft text-accent-fg" : "text-fg-3")}
    >
      {children}
    </button>
  );
}

export function DiffBlock({ title, from, to, empty }: { title: string; from?: string; to?: string; empty: string }) {
  const hs = from === to ? [] : hunks(from ?? "", to ?? "");
  return (
    <section>
      {title && (
        <h4 className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-fg-3">
          <GitCompare className="size-3.5" /> {title}
        </h4>
      )}
      {!hs.length ? (
        <p className="text-xs text-fg-3">{empty}</p>
      ) : (
        <div className="overflow-hidden rounded-md border border-line font-mono text-[12px] leading-5">
          {hs.map((h, i) => (
            <div key={i}>
              <div className="bg-surface-2 px-3 text-info">{h.header}</div>
              {h.lines.map((ln, j) => (
                <div key={j} className={clsx("px-3 whitespace-pre-wrap", ln.op === "add" ? "bg-ok-soft text-ok" : ln.op === "del" ? "bg-bad-soft text-bad" : "text-fg-2")}>
                  <span className="select-none">{ln.op === "add" ? "+ " : ln.op === "del" ? "− " : "  "}</span>
                  {ln.line}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
