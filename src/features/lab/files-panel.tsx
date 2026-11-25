"use client";

import { clsx } from "clsx";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { BookOpenCheck, Check, ChevronRight, ChevronsDownUp, ChevronsUpDown, FilePlus2, FileText, Folder, FolderOpen, Home, Pencil, Settings2, Sparkles, Trash2, Workflow, X } from "lucide-react";
import { isRulesPath, type World } from "@/engine";
import { useL } from "@/i18n";
import { useLab } from "./store";

export type FileKind = "rules" | "skill" | "workflow" | "config" | "file";
export type FileState = "new" | "modified" | "clean";

export function fileKind(path: string): FileKind {
  if (isRulesPath(path)) return "rules";
  if (/\/SKILL\.md$/.test(path)) return "skill";
  if (/^\.agents?\/workflows\//.test(path)) return "workflow";
  if (/config\.toml$|settings\.json$/.test(path)) return "config";
  return "file";
}

export function fileState(world: World, path: string): FileState {
  if (path.startsWith("~/")) return "clean";
  const head = world.git.head[path];
  if (head === undefined) return "new";
  return head === world.files[path] ? "clean" : "modified";
}

const KIND_ICON: Record<FileKind, { icon: typeof FileText; color: string }> = {
  rules: { icon: BookOpenCheck, color: "var(--lane-0)" },
  skill: { icon: Sparkles, color: "var(--lane-5)" },
  workflow: { icon: Workflow, color: "var(--lane-4)" },
  config: { icon: Settings2, color: "var(--lane-3)" },
  file: { icon: FileText, color: "var(--text-3)" },
};

export function KindIcon({ path, className }: { path: string; className?: string }) {
  const k = KIND_ICON[fileKind(path)];
  return <k.icon className={clsx("size-4 shrink-0", className)} style={{ color: k.color }} aria-hidden />;
}

export function StateBadge({ state }: { state: FileState }) {
  const l = useL();
  if (state === "clean") return null;
  return (
    <span
      className={clsx("inline-flex shrink-0 rounded-md px-1.5 py-px font-mono text-[11px] font-semibold", state === "new" ? "bg-ok-soft text-ok" : "bg-warn-soft text-warn")}
      title={state === "new" ? l("New since the last commit", "Nouveau depuis le dernier commit") : l("Changed since the last commit", "Modifié depuis le dernier commit")}
    >
      {state === "new" ? "N" : "M"}
    </span>
  );
}

interface Dir {
  dirs: Map<string, Dir>;
  files: string[];
}

type Row =
  | { type: "dir"; path: string; name: string; depth: number; open: boolean; state: FileState; count: number }
  | { type: "file"; path: string; name: string; depth: number };

/** Turns flat paths ("src/cart.ts") into a folder tree. `prefix` is stripped first ("~/" for the home folder). */
function buildTree(paths: string[], prefix: string): Dir {
  const root: Dir = { dirs: new Map(), files: [] };
  for (const p of paths) {
    const parts = p.slice(prefix.length).split("/");
    let d = root;
    for (const part of parts.slice(0, -1)) {
      let next = d.dirs.get(part);
      if (!next) d.dirs.set(part, (next = { dirs: new Map(), files: [] }));
      d = next;
    }
    d.files.push(p);
  }
  return root;
}

function allFiles(d: Dir): string[] {
  return [...d.files, ...[...d.dirs.values()].flatMap(allFiles)];
}

/** Folders roll up their files: modified wins over new, like an IDE. */
function dirState(world: World, d: Dir): FileState {
  const states = allFiles(d).map((p) => fileState(world, p));
  return states.includes("modified") ? "modified" : states.includes("new") ? "new" : "clean";
}

/** Visible rows, depth first: folders before files, each sorted by name. */
function flatten(world: World, d: Dir, base: string, depth: number, collapsed: Set<string>, out: Row[] = []): Row[] {
  for (const [name, child] of [...d.dirs].sort(([a], [b]) => a.localeCompare(b))) {
    const path = base + name;
    const open = !collapsed.has(path);
    out.push({ type: "dir", path, name, depth, open, state: dirState(world, child), count: allFiles(child).length });
    if (open) flatten(world, child, `${path}/`, depth + 1, collapsed, out);
  }
  for (const f of [...d.files].sort((a, b) => a.localeCompare(b))) out.push({ type: "file", path: f, name: f.slice(f.lastIndexOf("/") + 1), depth });
  return out;
}

/** "src/a/b.ts" → ["src", "src/a"]: the folders that contain a file. */
const parentsOf = (p: string) => {
  const parts = p.split("/");
  return parts.slice(0, -1).map((_, i) => parts.slice(0, i + 1).join("/"));
};

export function FilesPanel({ onOpen }: { onOpen?: (path: string) => void }) {
  const world = useLab((s) => s.world);
  const writeFile = useLab((s) => s.writeFile);
  const deleteFile = useLab((s) => s.deleteFile);
  const deleteFolder = useLab((s) => s.deleteFolder);
  const renameFile = useLab((s) => s.renameFile);
  const openFile = useLab((s) => s.openFile);
  const setOpenFile = useLab((s) => s.setOpenFile);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameTo, setRenameTo] = useState("");
  const [collapsed, setCollapsed] = useState<Set<string>>(() => new Set());
  const l = useL();

  // Opening a file from elsewhere (terminal `edit`, Run panel) reveals it in the tree.
  const [revealed, setRevealed] = useState<string | null>(null);
  if (openFile !== revealed) {
    setRevealed(openFile);
    if (openFile && parentsOf(openFile).some((d) => collapsed.has(d))) {
      const next = new Set(collapsed);
      for (const d of parentsOf(openFile)) next.delete(d);
      setCollapsed(next);
    }
  }

  const paths = Object.keys(world.files);
  const project = paths.filter((p) => !p.startsWith("~/"));
  const home = paths.filter((p) => p.startsWith("~/"));
  const changed = project.filter((p) => fileState(world, p) !== "clean").length;
  const projectRows = flatten(world, buildTree(project, ""), "", 0, collapsed);
  const homeRows = flatten(world, buildTree(home, "~/"), "~/", 0, collapsed);
  const folders = new Set([...projectRows, ...homeRows].filter((r) => r.type === "dir").map((r) => r.path));
  const anyOpen = [...folders].some((d) => !collapsed.has(d));

  const toggle = (dir: string, open?: boolean) =>
    setCollapsed((c) => {
      const next = new Set(c);
      if (open ?? next.has(dir)) next.delete(dir);
      else next.add(dir);
      return next;
    });
  const collapseAll = () => {
    if (anyOpen) {
      const all = new Set<string>();
      for (const p of paths) for (const d of parentsOf(p)) all.add(d);
      setCollapsed(all);
    } else setCollapsed(new Set());
  };

  const open = (p: string) => {
    setOpenFile(p);
    onOpen?.(p);
  };

  const startCreate = (dir = "") => {
    setCreating(true);
    setNewName(dir ? `${dir}/` : "");
    if (dir) toggle(dir, true);
  };

  const create = () => {
    const name = newName.trim().replace(/^\.\//, "");
    if (name && !name.endsWith("/") && !(name in world.files)) {
      writeFile(name, "");
      open(name);
    }
    setCreating(false);
    setNewName("");
  };

  const indent = (depth: number) =>
    Array.from({ length: depth }, (_, i) => <span key={i} aria-hidden className="relative h-full w-3.5 shrink-0 self-stretch before:absolute before:inset-y-[-6px] before:left-[7px] before:w-px before:bg-line" />);

  const rowCls = (on: boolean) =>
    clsx("group flex items-center gap-1 rounded-md pr-1 pl-1.5 text-sm", on ? "bg-accent-soft" : "hover:bg-surface-2");

  const dirRow = (r: Extract<Row, { type: "dir" }>) => {
    const Icon = r.open ? FolderOpen : Folder;
    return (
      <motion.li key={`d:${r.path}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={rowCls(false)} role="none">
        {indent(r.depth)}
        <button
          role="treeitem"
          aria-expanded={r.open}
          aria-selected={false}
          aria-level={r.depth + 1}
          className="flex min-w-0 flex-1 items-center gap-1.5 py-1 text-left"
          onClick={() => toggle(r.path)}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight") toggle(r.path, true);
            if (e.key === "ArrowLeft") toggle(r.path, false);
          }}
          title={r.path}
        >
          <ChevronRight className={clsx("size-3.5 shrink-0 text-fg-3 transition-transform", r.open && "rotate-90")} aria-hidden />
          <Icon className="size-4 shrink-0 text-fg-3" aria-hidden />
          <span className={clsx("truncate font-mono text-[13px]", r.state === "modified" && "text-warn", r.state === "new" && "text-ok")}>{r.name}</span>
          {!r.open && <span className="shrink-0 font-mono text-[11px] text-fg-3">{r.count}</span>}
        </button>
        {r.state !== "clean" && <span aria-hidden className={clsx("size-1.5 shrink-0 rounded-full", r.state === "new" ? "bg-ok" : "bg-warn")} />}
        <span className="flex shrink-0 items-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
          <RowBtn label={l(`New file in ${r.path}`, `Nouveau fichier dans ${r.path}`)} onClick={() => startCreate(r.path)}>
            <FilePlus2 className="size-3.5" />
          </RowBtn>
          <RowBtn
            label={l(`Delete folder ${r.path}`, `Supprimer le dossier ${r.path}`)}
            onClick={() => {
              if (window.confirm(l(`Delete ${r.path}/ and its ${r.count} file(s)?`, `Supprimer ${r.path}/ et ses ${r.count} fichier(s) ?`))) deleteFolder(r.path);
            }}
          >
            <Trash2 className="size-3.5" />
          </RowBtn>
        </span>
      </motion.li>
    );
  };

  const fileRow = (r: Extract<Row, { type: "file" }>) => {
    const p = r.path;
    return (
      <motion.li key={p} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -6 }} className={rowCls(openFile === p)} role="none">
        {indent(r.depth)}
        {/* Files line up with folder names: a chevron-wide spacer. */}
        <span aria-hidden className="w-3.5 shrink-0" />
        {renaming === p ? (
          <form
            className="flex flex-1 items-center gap-1 py-0.5"
            onSubmit={(e) => {
              e.preventDefault();
              renameFile(p, renameTo.trim());
              setRenaming(null);
            }}
          >
            <input
              autoFocus
              value={renameTo}
              onChange={(e) => setRenameTo(e.target.value.replace(/\s/g, ""))}
              onKeyDown={(e) => e.key === "Escape" && setRenaming(null)}
              className="min-w-0 flex-1 rounded-md border border-accent/60 bg-surface-2 px-1.5 py-0.5 font-mono text-xs outline-none"
              aria-label={l(`Rename ${p}`, `Renommer ${p}`)}
            />
            <button type="button" onClick={() => setRenaming(null)} aria-label={l("Cancel rename", "Annuler")} className="text-fg-3">
              <X className="size-3.5" />
            </button>
          </form>
        ) : (
          <button
            role="treeitem"
            aria-level={r.depth + 1}
            aria-selected={openFile === p}
            className="flex min-w-0 flex-1 items-center gap-1.5 py-1 text-left"
            onClick={() => open(p)}
            onKeyDown={(e) => e.key === "F2" && (setRenaming(p), setRenameTo(p))}
            title={p}
          >
            <KindIcon path={p} />
            <span className="truncate font-mono text-[13px]">{r.name}</span>
          </button>
        )}
        <StateBadge state={fileState(world, p)} />
        <span className="flex shrink-0 items-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
          <RowBtn
            label={l(`Rename ${p}`, `Renommer ${p}`)}
            onClick={() => {
              setRenaming(p);
              setRenameTo(p);
            }}
          >
            <Pencil className="size-3.5" />
          </RowBtn>
          <RowBtn label={l(`Delete ${p}`, `Supprimer ${p}`)} onClick={() => deleteFile(p)}>
            <Trash2 className="size-3.5" />
          </RowBtn>
        </span>
      </motion.li>
    );
  };

  const row = (r: Row) => (r.type === "dir" ? dirRow(r) : fileRow(r));

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between gap-2 px-3 pt-3 pb-2">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-fg-3">~/project</p>
          <p className="text-[11px] text-fg-3">{changed ? l(`${changed} changed since the last commit`, `${changed} modifiés depuis le dernier commit`) : l("Everything committed", "Tout est commité")}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          {folders.size > 0 && (
            <RowBtn label={anyOpen ? l("Collapse all folders", "Replier tous les dossiers") : l("Expand all folders", "Déplier tous les dossiers")} onClick={collapseAll}>
              {anyOpen ? <ChevronsDownUp className="size-3.5" /> : <ChevronsUpDown className="size-3.5" />}
            </RowBtn>
          )}
          <button onClick={() => startCreate()} className="flex items-center gap-1.5 rounded-lg border border-line px-2 py-1 text-xs text-fg-2 hover:border-line-strong hover:text-fg">
            <FilePlus2 className="size-3.5" /> {l("New file", "Nouveau fichier")}
          </button>
        </div>
      </div>
      <ul className="scrollbar-thin min-h-0 flex-1 overflow-y-auto px-2 pb-3" role="tree" aria-label={l("Files", "Fichiers")}>
        <AnimatePresence initial={false}>
          {creating && (
            <motion.li key="~new" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="px-1 py-1" role="none">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  create();
                }}
                className="flex items-center gap-1"
              >
                <input
                  autoFocus
                  value={newName}
                  onChange={(e) => setNewName(e.target.value.replace(/\s/g, ""))}
                  onBlur={() => (!newName || newName.endsWith("/")) && setCreating(false)}
                  onKeyDown={(e) => e.key === "Escape" && setCreating(false)}
                  placeholder={l("e.g. .claude/skills/demo/SKILL.md", "ex. .claude/skills/demo/SKILL.md")}
                  className="min-w-0 flex-1 rounded-lg border border-accent/60 bg-surface-2 px-2 py-1 font-mono text-xs outline-none"
                  aria-label={l("New file name", "Nom du nouveau fichier")}
                />
                <button type="submit" className="rounded-lg bg-accent px-2 py-1 text-xs text-white" aria-label={l("Create file", "Créer le fichier")}>
                  <Check className="size-3.5" />
                </button>
              </form>
            </motion.li>
          )}
          {projectRows.map(row)}
          {homeRows.length > 0 && (
            <motion.li key="~home" className="mt-3 flex items-center gap-1.5 px-2 pb-1 text-[11px] font-semibold text-fg-3" role="none">
              <Home className="size-3.5" /> {l("Your home folder (~)", "Ton dossier perso (~)")}
            </motion.li>
          )}
          {homeRows.map(row)}
        </AnimatePresence>
      </ul>
      <details className="border-t border-line px-3 py-2 text-[11px] text-fg-3">
        <summary className="cursor-pointer select-none hover:text-fg-2">{l("What do the icons mean?", "Que veulent dire les icônes ?")}</summary>
        <ul className="mt-2 space-y-1.5">
          {(
            [
              ["CLAUDE.md", l("Rules: loaded at the start of every session", "Règles : chargées au début de chaque session")],
              [".claude/skills/x/SKILL.md", l("Skill: loaded only when relevant", "Skill : chargé seulement quand c'est utile")],
              [".agents/workflows/x.md", l("Workflow: run with /name in Antigravity", "Workflow : lancé avec /nom dans Antigravity")],
              ["~/.codex/config.toml", l("Tool settings", "Réglages d'un outil")],
            ] as const
          ).map(([p, text]) => (
            <li key={p} className="flex items-start gap-2">
              <KindIcon path={p} className="size-3.5" />
              <span>{text}</span>
            </li>
          ))}
          <li className="flex items-start gap-2">
            <StateBadge state="new" /> <StateBadge state="modified" />
            <span>{l("New / modified since the last commit", "Nouveau / modifié depuis le dernier commit")}</span>
          </li>
        </ul>
      </details>
    </div>
  );
}

function RowBtn({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} aria-label={label} title={label} className="grid size-6 place-items-center rounded-md text-fg-3 hover:bg-elevated hover:text-fg pointer-coarse:size-10">
      {children}
    </button>
  );
}
