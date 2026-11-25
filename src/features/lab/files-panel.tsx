"use client";

import { clsx } from "clsx";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { BookOpenCheck, Check, FilePlus2, FileText, Home, Pencil, Settings2, Sparkles, Trash2, Workflow, X } from "lucide-react";
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

export function FilesPanel({ onOpen }: { onOpen?: (path: string) => void }) {
  const world = useLab((s) => s.world);
  const writeFile = useLab((s) => s.writeFile);
  const deleteFile = useLab((s) => s.deleteFile);
  const renameFile = useLab((s) => s.renameFile);
  const openFile = useLab((s) => s.openFile);
  const setOpenFile = useLab((s) => s.setOpenFile);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameTo, setRenameTo] = useState("");
  const l = useL();

  const all = Object.keys(world.files).sort((a, b) => {
    const da = a.startsWith(".") || a.includes("/") ? 0 : 1;
    const db = b.startsWith(".") || b.includes("/") ? 0 : 1;
    return da - db || a.localeCompare(b);
  });
  const project = all.filter((p) => !p.startsWith("~/"));
  const home = all.filter((p) => p.startsWith("~/"));
  const changed = project.filter((p) => fileState(world, p) !== "clean").length;

  const open = (p: string) => {
    setOpenFile(p);
    onOpen?.(p);
  };

  const create = () => {
    const name = newName.trim().replace(/^\.\//, "");
    if (name && !(name in world.files)) {
      writeFile(name, "");
      open(name);
    }
    setCreating(false);
    setNewName("");
  };

  const row = (p: string) => {
    const st = fileState(world, p);
    const shown = p.startsWith("~/") ? p.slice(2) : p;
    const slash = shown.lastIndexOf("/");
    return (
      <motion.li
        key={p}
        layout
        initial={{ opacity: 0, x: -6 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -6 }}
        className={clsx("group flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm", openFile === p ? "bg-accent-soft" : "hover:bg-surface-2")}
      >
        {renaming === p ? (
          <form
            className="flex flex-1 items-center gap-1"
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
          <button className="flex min-w-0 flex-1 items-center gap-2 text-left" onClick={() => open(p)}>
            <KindIcon path={p} />
            <span className="truncate font-mono text-[13px]">
              {slash >= 0 && <span className="text-fg-3">{shown.slice(0, slash + 1)}</span>}
              {shown.slice(slash + 1)}
            </span>
          </button>
        )}
        <StateBadge state={st} />
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

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center justify-between gap-2 px-3 pt-3 pb-2">
        <div>
          <p className="text-xs font-semibold text-fg-3">~/project</p>
          <p className="text-[11px] text-fg-3">{changed ? l(`${changed} changed since the last commit`, `${changed} modifiés depuis le dernier commit`) : l("Everything committed", "Tout est commité")}</p>
        </div>
        <button onClick={() => setCreating(true)} className="flex items-center gap-1.5 rounded-lg border border-line px-2 py-1 text-xs text-fg-2 hover:border-line-strong hover:text-fg">
          <FilePlus2 className="size-3.5" /> {l("New file", "Nouveau fichier")}
        </button>
      </div>
      <ul className="scrollbar-thin min-h-0 flex-1 overflow-y-auto px-2 pb-3" aria-label={l("Files", "Fichiers")}>
        <AnimatePresence initial={false}>
          {creating && (
            <motion.li initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="px-1 py-1">
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
                  onBlur={() => !newName && setCreating(false)}
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
          {project.map(row)}
          {home.length > 0 && (
            <motion.li key="~home" layout className="mt-3 flex items-center gap-1.5 px-2 pb-1 text-[11px] font-semibold text-fg-3">
              <Home className="size-3.5" /> {l("Your home folder (~)", "Ton dossier perso (~)")}
            </motion.li>
          )}
          {home.map(row)}
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
