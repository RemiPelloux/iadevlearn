"use client";

import { clsx } from "clsx";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type KeyboardEvent } from "react";
import { AArrowDown, AArrowUp, ClipboardCopy, CornerDownLeft, Eraser, Lightbulb, Maximize2, Minimize2, Play, TextCursorInput } from "lucide-react";
import { SESSION_PROMPT, TOOL_NAMES, type ToolId, type World } from "@/engine";
import { explainTokens } from "@/features/docs/commands";
import { useProgress } from "@/features/progress/store";
import { useL, useT, type T } from "@/i18n";
import { complete, highlight, type Completion } from "./completion";
import { useLab, type TermEntry } from "./store";
import { findRun, Reveal, RichLine, SessionBanner, splitBanner, StatusLine, TaskList, TOOL_TINT, UserTurn } from "./terminal-tui";


export interface TerminalProps {
  mode: "assisted" | "real";
  /** Command suggested by the current lesson step (assisted mode). */
  suggestion?: string | null;
  className?: string;
  onModeChange?: (m: "assisted" | "real") => void;
  autoFocus?: boolean;
  compact?: boolean;
  /** The lesson waits for a command: the input line is highlighted. */
  awaitInput?: boolean;
  /** The terminal fills the main area. */
  maximized?: boolean;
  onToggleMaximize?: () => void;
}

const FONT_KEY = "iadl-term-font";
const readFont = () => {
  try {
    const n = Number(localStorage.getItem(FONT_KEY));
    return n >= 11 && n <= 20 ? n : 14;
  } catch {
    return 14;
  }
};
const subscribeFont = (cb: () => void) => {
  window.addEventListener(FONT_KEY, cb);
  return () => window.removeEventListener(FONT_KEY, cb);
};

export function Terminal({ mode, suggestion, className, onModeChange, autoFocus, compact, awaitInput, maximized, onToggleMaximize }: TerminalProps) {
  const entries = useLab((s) => s.entries);
  const world = useLab((s) => s.world);
  const run = useLab((s) => s.run);
  const inputHistory = useLab((s) => s.inputHistory);
  const clearTerminal = useLab((s) => s.clearTerminal);
  const [value, setValue] = useState("");
  const [histIdx, setHistIdx] = useState<number | null>(null);
  const [selIdx, setSelIdx] = useState(0);
  const [showMenu, setShowMenu] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);
  const t = useT();
  const l = useL();
  const locale = t.locale;
  const font = useSyncExternalStore(subscribeFont, readFont, () => 14);
  const changeFont = (d: number) => {
    try {
      localStorage.setItem(FONT_KEY, String(Math.min(20, Math.max(11, font + d))));
    } catch {
      /* storage unavailable */
    }
    window.dispatchEvent(new Event(FONT_KEY));
  };
  // Entries that exist when the terminal mounts (a restored transcript) appear at once; new replies reveal line by line.
  const [freshFrom] = useState(() => entries.reduce((m, e) => Math.max(m, e.id), 0));

  const completions = useMemo(() => (value ? complete(value, world, locale).slice(0, 6) : []), [value, world, locale]);
  const ghost = useMemo(() => {
    if (!value) return "";
    if (suggestion && suggestion.startsWith(value) && mode === "assisted") return suggestion.slice(value.length);
    const c = completions[0];
    return c && c.value.startsWith(value) ? c.value.slice(value.length) : "";
  }, [value, completions, suggestion, mode]);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }, [entries.length]);

  const branch = world.git.branch;
  const session = world.session?.tool ?? null;

  const submit = (cmd = value) => {
    if (!cmd.trim()) return;
    run(cmd);
    setValue("");
    setHistIdx(null);
    setShowMenu(false);
    inputRef.current?.focus();
  };

  const accept = (c: Completion) => {
    setValue(c.value);
    setShowMenu(false);
    setSelIdx(0);
    inputRef.current?.focus();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (showMenu && completions[selIdx] && completions.length > 1) accept(completions[selIdx]);
      else submit();
    } else if (e.key === "Tab") {
      e.preventDefault();
      if (completions.length > 1 && !ghost) setShowMenu(true);
      else if (ghost) setValue(value + ghost);
      else if (completions[0]) accept(completions[0]);
    } else if (e.key === "ArrowRight" && ghost && inputRef.current?.selectionStart === value.length) {
      e.preventDefault();
      setValue(value + ghost);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      if (showMenu) return setSelIdx((i) => Math.max(0, i - 1));
      if (!inputHistory.length) return;
      const i = histIdx === null ? inputHistory.length - 1 : Math.max(0, histIdx - 1);
      setHistIdx(i);
      setValue(inputHistory[i]);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (showMenu) return setSelIdx((i) => Math.min(completions.length - 1, i + 1));
      if (histIdx === null) return;
      const i = histIdx + 1;
      if (i >= inputHistory.length) {
        setHistIdx(null);
        setValue("");
      } else {
        setHistIdx(i);
        setValue(inputHistory[i]);
      }
    } else if (e.key === "Escape") setShowMenu(false);
    else if (e.key === "l" && e.ctrlKey) {
      e.preventDefault();
      clearTerminal();
    } else if (e.key === "c" && e.ctrlKey && !window.getSelection()?.toString()) {
      e.preventDefault();
      setValue("");
    }
  };

  const copyOutput = async () => {
    const text = entries.map((en) => `$ ${en.input}\n${en.lines.map((l) => l.text).join("\n")}`).join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <div className={clsx("terminal flex h-full min-h-0 flex-col overflow-hidden bg-term font-mono leading-[1.6]", className)} style={{ fontSize: compact ? 13 : font }}>
      <div className="flex h-9 shrink-0 items-center gap-2 border-b border-white/5 px-3 font-mono text-xs text-[var(--t-muted)]">
        <span className="truncate">
          {session ? TOOL_NAMES[session] : "bash"} — ~/project <span className="font-sans text-[var(--t-muted)]">{t("lab.terminal.simulated")}</span>
          {session && <span className="ml-2 font-sans text-[var(--t-orange)]">{t("lab.terminal.inSession", { tool: TOOL_NAMES[session] })}</span>}
        </span>
        <div className="ml-auto flex items-center gap-1">
          {onModeChange && (
            <div className="mr-1 flex rounded-lg bg-white/5 p-0.5 font-sans" role="radiogroup" aria-label={t("lab.terminal.modeLabel")}>
              {(["assisted", "real"] as const).map((m) => (
                <button
                  key={m}
                  role="radio"
                  aria-checked={mode === m}
                  onClick={() => onModeChange(m)}
                  className={clsx("rounded-md px-2 py-0.5 text-[11px] transition-colors pointer-coarse:py-2", mode === m ? "bg-white/10 text-white" : "hover:text-white")}
                >
                  {m === "assisted" ? t("lab.terminal.assisted") : t("lab.terminal.real")}
                </button>
              ))}
            </div>
          )}
          {!compact && (
            <>
              <button onClick={() => changeFont(-1)} disabled={font <= 11} className="rounded-md p-1 hover:bg-white/5 hover:text-white disabled:opacity-40" aria-label={l("Smaller text", "Texte plus petit")} title={l("Smaller text", "Texte plus petit")}>
                <AArrowDown className="size-3.5" />
              </button>
              <button onClick={() => changeFont(1)} disabled={font >= 20} className="rounded-md p-1 hover:bg-white/5 hover:text-white disabled:opacity-40" aria-label={l("Bigger text", "Texte plus grand")} title={l("Bigger text", "Texte plus grand")}>
                <AArrowUp className="size-3.5" />
              </button>
            </>
          )}
          <button onClick={copyOutput} className="rounded-md p-1 hover:bg-white/5 hover:text-white pointer-coarse:p-2.5" aria-label={t("lab.terminal.copyAria")} title={t("lab.terminal.copyTitle")}>
            <ClipboardCopy className="size-3.5" />
          </button>
          <button onClick={clearTerminal} className="rounded-md p-1 hover:bg-white/5 hover:text-white pointer-coarse:p-2.5" aria-label={t("lab.terminal.clearAria")} title={t("lab.terminal.clearTitle")}>
            <Eraser className="size-3.5" />
          </button>
          {onToggleMaximize && (
            <button
              onClick={onToggleMaximize}
              className="rounded-md p-1 hover:bg-white/5 hover:text-white pointer-coarse:p-2.5"
              aria-label={maximized ? l("Restore terminal size", "Rétablir la taille du terminal") : l("Maximize terminal", "Agrandir le terminal")}
              title={maximized ? l("Restore terminal size", "Rétablir la taille du terminal") : l("Maximize terminal", "Agrandir le terminal")}
              aria-pressed={!!maximized}
            >
              {maximized ? <Minimize2 className="size-3.5" /> : <Maximize2 className="size-3.5" />}
            </button>
          )}
          {copied && <span className="font-sans text-[11px] text-[var(--t-green)]">{t("lab.terminal.copied")}</span>}
        </div>
      </div>

      <div
        ref={scrollRef}
        className="scrollbar-thin min-h-0 flex-1 overflow-y-auto px-3 py-2"
        onClick={() => {
          if (!window.getSelection()?.toString()) inputRef.current?.focus();
        }}
        role="log"
        aria-live="polite"
        aria-label={t("lab.terminal.outputLabel")}
      >
        {!entries.length && (
          <p className="text-[var(--t-muted)]">
            {mode === "assisted" ? t("lab.terminal.emptyAssisted") : t("lab.terminal.emptyReal")}
          </p>
        )}
        {entries.map((e) => (
          <Entry key={e.id} entry={e} plainWords={t("lab.terminal.plainWords")} explain={e.explain} world={world} fresh={e.id > freshFrom} />
        ))}
      </div>

      {mode === "assisted" && suggestion && (
        <AssistBar suggestion={suggestion} onRun={() => submit(suggestion)} onInsert={() => { setValue(suggestion); inputRef.current?.focus(); }} compact={compact} t={t} />
      )}

      <div className="relative shrink-0 border-t border-white/5 px-3 py-2.5">
        <AnimatePresence>
          {showMenu && completions.length > 1 && (
            <motion.ul
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12 }}
              className="absolute bottom-full left-3 z-10 mb-1 w-72 overflow-hidden rounded-md border border-white/10 bg-[#2a2721] py-1 shadow-xl"
              role="listbox"
            >
              {completions.map((c, i) => (
                <li
                  key={c.value}
                  role="option"
                  aria-selected={i === selIdx}
                  onMouseDown={(ev) => {
                    ev.preventDefault();
                    accept(c);
                  }}
                  className={clsx("flex cursor-pointer items-center justify-between gap-3 px-3 py-1", i === selIdx && "bg-white/10")}
                >
                  <span className="text-white">{c.label}</span>
                  {c.detail && <span className="truncate font-sans text-[11px] text-[var(--t-muted)]">{c.detail}</span>}
                </li>
              ))}
            </motion.ul>
          )}
        </AnimatePresence>
        <label
          className={clsx("flex items-center gap-2 rounded-md", session && "rounded-lg border px-2.5 py-1.5 focus-within:bg-white/[0.03]")}
          style={session ? { borderColor: `${TOOL_TINT[session]}99` } : undefined}
          data-nudge={!!awaitInput && !value}
        >
          <span className="sr-only">{t("lab.terminal.command")}</span>
          <Prompt branch={branch} session={session} />
          <div className="relative min-w-0 flex-1">
            <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden whitespace-pre">
              {(session ? [{ text: value, cls: value.startsWith("/") ? "text-[var(--t-cyan)]" : "text-white" }] : highlight(value)).map((t, i) => (
                <span key={i} className={t.cls}>
                  {t.text}
                </span>
              ))}
              <span className="text-[var(--t-muted)] opacity-60">{ghost}</span>
            </div>
            <input
              ref={inputRef}
              value={value}
              autoFocus={autoFocus}
              onChange={(e) => {
                setValue(e.target.value);
                setHistIdx(null);
                setSelIdx(0);
                setShowMenu(false);
              }}
              onKeyDown={onKeyDown}
              onBlur={() => setTimeout(() => setShowMenu(false), 100)}
              spellCheck={false}
              autoCapitalize="off"
              autoComplete="off"
              autoCorrect="off"
              enterKeyHint="go"
              style={session ? { outline: "none" } : undefined}
              aria-describedby="term-help"
              className="w-full bg-transparent text-transparent caret-[var(--t-orange)] outline-none selection:bg-accent/40"
            />
          </div>
          <button
            onClick={() => submit()}
            className="grid size-7 place-items-center rounded-lg bg-white/5 text-[var(--t-muted)] hover:bg-white/10 hover:text-white sm:hidden"
            aria-label={t("lab.terminal.runCommand")}
          >
            <CornerDownLeft className="size-3.5" />
          </button>
        </label>
        {session && !compact && <StatusLine world={world} tool={session} />}
        <p id="term-help" className="sr-only">
          {t("lab.terminal.help")}
        </p>
        {ghost && !compact && (
          <p className="pointer-events-none mt-1 hidden font-sans text-[11px] text-[var(--t-muted)] sm:block">
            <kbd className="rounded bg-white/5 px-1">Tab</kbd> {t("lab.terminal.toComplete")}
          </p>
        )}
      </div>
    </div>
  );
}

/** The prompt shows the learner's name, like a real shell shows the user. */
function Prompt({ branch, session }: { branch: string | null; session?: ToolId | null }) {
  const name = useProgress((s) => s.name);
  const user =
    name
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[^\w]+/g, "")
      .slice(0, 16) || "you";
  if (session)
    return (
      <span className="shrink-0 select-none">
        <span className="text-[var(--t-orange)]">{session}</span>
        <span className="text-[var(--t-muted)]"> {SESSION_PROMPT[session]}</span>
      </span>
    );
  return (
    <span className="shrink-0 select-none">
      <span className="text-[var(--t-green)]">{user}</span>
      <span className="text-[var(--t-muted)]">:</span>
      <span className="text-[var(--t-blue)]">~/project</span>
      {branch && <span className="text-[var(--t-orange)]"> ({branch})</span>}
      <span className="text-[var(--t-muted)]"> $</span>
    </span>
  );
}

function Entry({ entry, plainWords, explain, world, fresh }: { entry: TermEntry; plainWords: string; explain?: string; world: World; fresh: boolean }) {
  const tool = entry.session ?? entry.started ?? null;
  const run = findRun(world, entry.runId);
  const [banner, body] = entry.started ? splitBanner(entry.lines) : [[], entry.lines];
  const highlighted = (entry.session ? [{ text: entry.input, cls: "text-white" }] : highlight(entry.input)).map((t, i) => (
    <span key={i} className={t.cls}>
      {t.text}
    </span>
  ));
  return (
    <div className="mb-3">
      {entry.session ? (
        <UserTurn tool={entry.session} input={entry.input} prompt={<Prompt branch={entry.branch} session={entry.session} />} />
      ) : (
        <div className="flex flex-wrap gap-x-2">
          <Prompt branch={entry.branch} session={null} />
          <span>{highlighted}</span>
        </div>
      )}
      {entry.started && banner.length > 0 && <SessionBanner tool={entry.started} lines={banner} />}
      {body.map((l, i) => (
        <Reveal key={i} i={i} fresh={fresh}>
          <RichLine line={l} tool={tool} first={l.kind === "agent" && body[i - 1]?.kind !== "agent"} />
        </Reveal>
      ))}
      {run && (
        <Reveal i={body.length} fresh={fresh}>
          <TaskList run={run} />
        </Reveal>
      )}
      {explain && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-1.5 flex gap-2 rounded-lg border border-[var(--t-yellow)]/20 bg-[var(--t-yellow)]/[0.07] px-3 py-2 font-sans text-[0.95em] leading-snug text-[var(--t-yellow)]"
        >
          <Lightbulb className="mt-0.5 size-4 shrink-0" aria-hidden />
          <span>
            <span className="font-semibold">{plainWords}</span>
            {explain}
          </span>
        </motion.div>
      )}
    </div>
  );
}

function AssistBar({ suggestion, onRun, onInsert, compact, t }: { suggestion: string; onRun: () => void; onInsert: () => void; compact?: boolean; t: T }) {
  const tokens = explainTokens(suggestion, t.locale);
  const tone: Record<string, string> = {
    program: "text-[var(--t-orange)]",
    command: "text-[var(--t-green)]",
    flag: "text-[var(--t-yellow)]",
    value: "text-[var(--t-magenta)]",
    operator: "text-[var(--t-muted)]",
    prompt: "text-[var(--t-magenta)]",
  };
  return (
    <div className="shrink-0 border-t border-white/5 bg-white/[0.02] px-3 py-2">
      <div className="flex items-center gap-2">
        <span className="shrink-0 text-[var(--t-orange)]" aria-hidden>›</span>
        <span className="font-sans text-[11px] text-[var(--t-muted)] ">{t("lab.terminal.suggested")}</span>
        <code className="min-w-0 truncate text-white">{suggestion}</code>
        <div className="ml-auto flex shrink-0 gap-1 font-sans">
          <button onClick={onInsert} className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-[var(--t-muted)] hover:bg-white/5 hover:text-white" title={t("lab.terminal.insertTitle")}>
            <TextCursorInput className="size-3.5" /> <span className="hidden sm:inline">{t("lab.terminal.insert")}</span>
          </button>
          <button onClick={onRun} className="flex items-center gap-1 rounded-lg bg-[var(--accent)] px-2.5 py-1 text-xs font-medium text-white hover:brightness-110">
            <Play className="size-3 fill-current" /> {t("lab.terminal.run")}
          </button>
        </div>
      </div>
      {!compact && (
        <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 pl-5 font-sans text-[11px]">
          {tokens.map((tok, i) => (
            <span key={i} className="text-[var(--t-muted)]">
              <code className={clsx("font-mono", tone[tok.kind])}>{tok.text.length > 24 ? tok.text.slice(0, 22) + "…" : tok.text}</code> {tok.meaning}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
