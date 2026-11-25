"use client";

import { clsx } from "clsx";
import { useMemo, useState } from "react";
import { Check, ChevronDown, ClipboardCopy, Download, ExternalLink, Loader2, Search, Sparkles, X } from "lucide-react";
import { useL, useLocale } from "@/i18n";
import { HUB_SKILLS, SKILL_GROUPS } from "./data";
import type { HubSkill, SkillCategory } from "./types";

type Target = "claude" | "agents";

const CATEGORY_LABEL: Record<SkillCategory, { en: string; fr: string }> = {
  documents: { en: "Documents", fr: "Documents" },
  design: { en: "Design", fr: "Design" },
  frontend: { en: "Frontend", fr: "Frontend" },
  testing: { en: "Testing", fr: "Tests" },
  debugging: { en: "Debugging", fr: "Débogage" },
  planning: { en: "Planning", fr: "Planification" },
  git: { en: "Git", fr: "Git" },
  devops: { en: "DevOps", fr: "DevOps" },
  data: { en: "Data", fr: "Données" },
  security: { en: "Security", fr: "Sécurité" },
  writing: { en: "Writing", fr: "Écriture" },
  "ai-dev": { en: "AI dev", fr: "Dev IA" },
  productivity: { en: "Productivity", fr: "Productivité" },
  business: { en: "Business", fr: "Business" },
  other: { en: "Other", fr: "Autre" },
};

const dir = (target: Target, name: string) => (target === "claude" ? `.claude/skills/${name}` : `.agents/skills/${name}`);

/** One command that drops a single-file skill into the project. */
function fileInstall(s: HubSkill, target: Target) {
  if (!s.raw) return null;
  return `mkdir -p ${dir(target, s.name)} && curl -fsSL ${s.raw} -o ${dir(target, s.name)}/SKILL.md`;
}

function useCopy() {
  const [copied, setCopied] = useState<string | null>(null);
  const copy = async (key: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied((c) => (c === key ? null : c)), 1400);
    } catch {
      /* clipboard unavailable */
    }
  };
  return { copied, copy };
}

function Cmd({ text, id, copied, onCopy, label }: { text: string; id: string; copied: boolean; onCopy: (id: string, text: string) => void; label: string }) {
  return (
    <div className="terminal flex items-start gap-2 rounded-lg bg-term px-3 py-2">
      <code className="min-w-0 flex-1 font-mono text-[12px] break-all whitespace-pre-wrap text-[var(--t-text)]">{text}</code>
      <button onClick={() => onCopy(id, text)} className="flex shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 font-sans text-[11px] text-[var(--t-muted)] hover:bg-white/10 hover:text-white" aria-label={label}>
        {copied ? <Check className="size-3.5 text-[var(--t-green)]" /> : <ClipboardCopy className="size-3.5" />}
      </button>
    </div>
  );
}

function SkillRow({ s, target }: { s: HubSkill; target: Target }) {
  const l = useL();
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState<string | null>(s.content ?? null);
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const { copied, copy } = useCopy();
  const one = fileInstall(s, target);
  const embeddedInstall = s.content ? `mkdir -p ${dir(target, s.name)} && cat > ${dir(target, s.name)}/SKILL.md <<'EOF'\n${s.content.trimEnd()}\nEOF` : null;

  const load = async () => {
    if (text || !s.raw) return;
    setState("loading");
    try {
      const r = await fetch(s.raw);
      if (!r.ok) throw new Error(String(r.status));
      setText(await r.text());
      setState("idle");
    } catch {
      setState("error");
    }
  };
  const download = () => {
    if (!text) return;
    const url = URL.createObjectURL(new Blob([text], { type: "text/markdown" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "SKILL.md";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  return (
    <li className="border-b border-line py-3 last:border-b-0">
      <button
        onClick={() => {
          setOpen((o) => !o);
          if (!open) void load();
        }}
        aria-expanded={open}
        className="flex w-full items-start gap-3 text-left"
      >
        <Sparkles className="mt-1 size-4 shrink-0 text-[var(--lane-5)]" aria-hidden />
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className="font-mono text-sm font-semibold text-fg">{s.name}</span>
            <span className="text-xs text-fg-3">{s.source}</span>
            <span className="rounded bg-surface-2 px-1.5 text-[10px] font-medium text-fg-2">{CATEGORY_LABEL[s.category][locale]}</span>
            <span className={clsx("rounded px-1.5 text-[10px] font-medium", /mit|apache|bsd|cc0|isc/i.test(s.license) ? "bg-ok-soft text-ok" : "bg-warn-soft text-warn")}>{s.license}</span>
          </span>
          <span className="mt-0.5 block text-sm text-fg-2">{s.description[locale]}</span>
        </span>
        <ChevronDown className={clsx("mt-1 size-4 shrink-0 text-fg-3 transition-transform", open && "rotate-180")} />
      </button>
      {open && (
        <div className="mt-3 space-y-3 pl-7">
          {s.install.length > 0 && (
            <div>
              <p className="mb-1.5 text-xs font-semibold text-fg-2">{l("Install", "Installer")}</p>
              <div className="space-y-1.5">
                {s.install.map((c, i) => (
                  <Cmd key={i} text={c} id={`i${i}`} copied={copied === `i${i}`} onCopy={copy} label={l("Copy command", "Copier la commande")} />
                ))}
              </div>
              {s.installNote && <p className="mt-1.5 text-xs text-fg-3">{s.installNote[locale]}</p>}
            </div>
          )}
          {(embeddedInstall || (one && s.singleFile)) && (
            <div>
              <p className="mb-1.5 text-xs font-semibold text-fg-2">
                {target === "claude" ? l("Add it to this project (Claude Code)", "L'ajouter à ce projet (Claude Code)") : l("Add it to this project (Codex, Antigravity)", "L'ajouter à ce projet (Codex, Antigravity)")}
              </p>
              <Cmd text={embeddedInstall ?? one!} id="file" copied={copied === "file"} onCopy={copy} label={l("Copy command", "Copier la commande")} />
            </div>
          )}
          {!s.singleFile && !embeddedInstall && (
            <p className="text-xs text-fg-3">{l("This skill comes with other files (scripts, templates), so install the whole thing with the command above rather than copying SKILL.md alone.", "Ce skill a d'autres fichiers (scripts, modèles) : installe-le en entier avec la commande ci-dessus plutôt que de copier SKILL.md seul.")}</p>
          )}
          <div className="flex flex-wrap gap-2">
            {text && (
              <>
                <button onClick={() => copy("md", text)} className="flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1 text-xs font-medium hover:border-line-strong">
                  {copied === "md" ? <Check className="size-3.5 text-ok" /> : <ClipboardCopy className="size-3.5" />} {l("Copy SKILL.md", "Copier SKILL.md")}
                </button>
                <button onClick={download} className="flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1 text-xs font-medium hover:border-line-strong">
                  <Download className="size-3.5" /> {l("Download SKILL.md", "Télécharger SKILL.md")}
                </button>
              </>
            )}
            {s.url && (
              <a href={s.url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 rounded-lg border border-line px-2.5 py-1 text-xs font-medium hover:border-line-strong">
                <ExternalLink className="size-3.5" /> {l("Source on GitHub", "Source sur GitHub")}
              </a>
            )}
          </div>
          {state === "loading" && (
            <p className="flex items-center gap-1.5 text-xs text-fg-3">
              <Loader2 className="size-3.5 animate-spin" /> {l("Loading SKILL.md from GitHub…", "Chargement de SKILL.md depuis GitHub…")}
            </p>
          )}
          {state === "error" && <p className="text-xs text-bad">{l("Couldn't load SKILL.md. Open the source on GitHub instead.", "Impossible de charger SKILL.md. Ouvre plutôt la source sur GitHub.")}</p>}
          {text && (
            <pre className="scrollbar-thin max-h-80 overflow-auto rounded-lg border border-line bg-surface p-3 font-mono text-[12px] leading-relaxed whitespace-pre-wrap text-fg-2">{text}</pre>
          )}
        </div>
      )}
    </li>
  );
}

export function SkillsHub() {
  const l = useL();
  const locale = useLocale();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<SkillCategory | "all">("all");
  const [target, setTarget] = useState<Target>("claude");
  const cats = useMemo(() => [...new Set(HUB_SKILLS.map((s) => s.category))].sort(), []);
  const needle = q.trim().toLowerCase();
  const visible = HUB_SKILLS.filter((s) => (cat === "all" || s.category === cat) && (!needle || `${s.name} ${s.source} ${s.description.en} ${s.description.fr}`.toLowerCase().includes(needle)));

  return (
    <div className="mx-auto max-w-5xl px-4 pt-10 pb-28 lg:pb-16">
      <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">{l("Skills hub", "Bibliothèque de skills")}</h1>
      <p className="mt-3 max-w-[64ch] text-lg leading-relaxed text-fg-2">
        {l(
          `${HUB_SKILLS.length} ready-to-use skills: ones written for this course, Remi Pelloux's coding guidelines and kill-my-idea, Anthropic's official skills, and popular community collections. Open one to see its install command or its whole SKILL.md.`,
          `${HUB_SKILLS.length} skills prêts à l'emploi : ceux écrits pour ce cours, les règles de code de Remi Pelloux et kill-my-idea, les skills officiels d'Anthropic, et des collections populaires de la communauté. Ouvre-en un pour voir sa commande d'installation ou tout son SKILL.md.`,
        )}
      </p>

      <div className="sticky top-14 z-10 -mx-4 mt-6 space-y-3 border-b border-line bg-bg/90 px-4 py-3 backdrop-blur">
        <div className="flex flex-wrap items-center gap-2">
          <label className="relative min-w-56 flex-1">
            <Search className="pointer-events-none absolute top-2.5 left-3 size-4 text-fg-3" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={l("Search skills, e.g. pdf, tests, review", "Chercher un skill, ex. pdf, tests, review")} aria-label={l("Search skills", "Chercher un skill")} className="w-full rounded-lg border border-line bg-surface py-2 pr-8 pl-9 text-sm outline-none focus:border-accent" />
            {q && (
              <button onClick={() => setQ("")} className="absolute top-2 right-2 rounded p-0.5 text-fg-3 hover:text-fg" aria-label={l("Clear search", "Effacer la recherche")}>
                <X className="size-4" />
              </button>
            )}
          </label>
          <div className="flex rounded-lg bg-surface-2 p-1 text-xs" role="radiogroup" aria-label={l("Install for", "Installer pour")}>
            {(
              [
                ["claude", "Claude Code"],
                ["agents", "Codex · Antigravity"],
              ] as const
            ).map(([v, label]) => (
              <button key={v} role="radio" aria-checked={target === v} onClick={() => setTarget(v)} className={clsx("rounded-md px-2.5 py-1 font-medium", target === v ? "bg-elevated text-fg shadow-sm" : "text-fg-3 hover:text-fg")}>
                {label}
              </button>
            ))}
          </div>
        </div>
        <div className="scrollbar-thin flex gap-1.5 overflow-x-auto pb-0.5" role="radiogroup" aria-label={l("Category", "Catégorie")}>
          {(["all", ...cats] as const).map((c) => (
            <button key={c} role="radio" aria-checked={cat === c} onClick={() => setCat(c)} className={clsx("shrink-0 rounded-full border px-2.5 py-0.5 text-xs font-medium", cat === c ? "border-accent/50 bg-accent-soft text-accent-fg" : "border-line text-fg-2 hover:border-line-strong")}>
              {c === "all" ? l("All", "Tous") : CATEGORY_LABEL[c][locale]}
            </button>
          ))}
        </div>
      </div>

      {SKILL_GROUPS.map((g) => {
        const items = visible.filter((s) => s.group === g.id);
        if (!items.length) return null;
        return (
          <section key={g.id} className="mt-10" aria-labelledby={`g-${g.id}`}>
            <h2 id={`g-${g.id}`} className="text-xl font-semibold tracking-tight">
              {g.title[locale]} <span className="text-sm font-normal text-fg-3">{items.length}</span>
            </h2>
            <p className="mt-1 max-w-[70ch] text-sm text-fg-2">{g.blurb[locale]}</p>
            {g.setup && <div className="mt-3 max-w-2xl space-y-1.5">{g.setup.map((c) => <SetupCmd key={c} text={c} />)}</div>}
            <ul className="mt-3 rounded-xl border border-line bg-elevated px-4 shadow-[var(--shadow-card)]">
              {items.map((s) => (
                <SkillRow key={`${s.source}/${s.name}`} s={s} target={target} />
              ))}
            </ul>
          </section>
        );
      })}
      {!visible.length && <p className="mt-10 text-sm text-fg-3">{l("No skill matches. Try another word or category.", "Aucun skill ne correspond. Essaie un autre mot ou une autre catégorie.")}</p>}

      <p className="mt-12 rounded-lg border border-line bg-surface p-4 text-sm text-fg-2">
        {l(
          "Skills from other authors keep their own licence, shown on each row. Read a skill before you install it: it's instructions your agent will follow, and some come with scripts it can run.",
          "Les skills d'autres auteurs gardent leur propre licence, affichée sur chaque ligne. Lis un skill avant de l'installer : ce sont des instructions que ton agent suivra, et certains contiennent des scripts qu'il peut lancer.",
        )}
      </p>
    </div>
  );
}

function SetupCmd({ text }: { text: string }) {
  const l = useL();
  const { copied, copy } = useCopy();
  return <Cmd text={text} id="s" copied={copied === "s"} onCopy={copy} label={l("Copy command", "Copier la commande")} />;
}
