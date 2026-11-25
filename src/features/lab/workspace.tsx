"use client";

import { clsx } from "clsx";
import { motion } from "motion/react";
import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { BookOpen, Bot, Files, ListChecks, SquareTerminal, X } from "lucide-react";
import { useT } from "@/i18n";
import { AgentView } from "./agent-view";
import { Editor } from "./editor";
import { fileState, FilesPanel, KindIcon } from "./files-panel";
import { RunPanel } from "./run-panel";
import { useLab, type SidePanel } from "./store";
import { Terminal } from "./terminal";

function useMedia(query: string, fallback: boolean) {
  return useSyncExternalStore(
    (cb) => {
      const m = window.matchMedia(query);
      m.addEventListener("change", cb);
      return () => m.removeEventListener("change", cb);
    },
    () => window.matchMedia(query).matches,
    () => fallback,
  );
}

function usePersistentNumber(key: string, initial: number | (() => number)) {
  const [v, setV] = useState(() => {
    const init = typeof initial === "function" ? initial : () => initial;
    if (typeof window === "undefined") return init();
    try {
      const s = Number(localStorage.getItem(key));
      return s > 0 ? s : init();
    } catch {
      return init();
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, String(v));
    } catch {
      /* storage unavailable */
    }
  }, [key, v]);
  return [v, setV] as const;
}

export interface WorkspaceUi {
  files: boolean;
  editor: boolean;
  run: boolean;
  orca: boolean;
}

type SideTab = "guide" | SidePanel;

export function Workspace({
  ui,
  guide,
  terminalMode,
  onTerminalModeChange,
  suggestion,
  awaitInput,
  mobileHeader,
}: {
  ui: WorkspaceUi;
  guide?: ReactNode;
  terminalMode: "assisted" | "real";
  onTerminalModeChange?: (m: "assisted" | "real") => void;
  suggestion?: string | null;
  /** Highlight the input line: the step is waiting for a command. */
  awaitInput?: boolean;
  mobileHeader?: ReactNode;
}) {
  const t = useT();
  const isDesktop = useMedia("(min-width: 1100px)", true);
  const isTablet = useMedia("(min-width: 768px)", true);
  const world = useLab((s) => s.world);
  const events = useLab((s) => s.events);
  const eventKey = useLab((s) => s.eventKey);
  const openFile = useLab((s) => s.openFile);
  const setOpenFile = useLab((s) => s.setOpenFile);
  const tabsOpen = useLab((s) => s.tabs);
  const closeTab = useLab((s) => s.closeTab);
  const [sideTab, setSideTab] = useState<SideTab>(guide && !isDesktop ? "guide" : "files");
  const [mobileTab, setMobileTab] = useState<"guide" | "agent" | "terminal" | "files">(guide ? "guide" : "terminal");
  // The terminal is where the work happens: it starts at about half the screen.
  const [termH, setTermH] = usePersistentNumber("iadl-term-h2", () => (typeof window === "undefined" ? 420 : Math.round(Math.max(340, window.innerHeight * 0.48))));
  const [termMax, setTermMax] = useState(false);
  const maxTermH = () => (typeof window === "undefined" ? 900 : window.innerHeight - 160);
  const [sideW, setSideW] = usePersistentNumber("iadl-side-w", 360);

  // A request from the simulation (e.g. `edit CLAUDE.md`, clicking a run) brings the relevant panel forward.
  const panelRequest = useLab((s) => s.panelRequest);
  const [seenRequest, setSeenRequest] = useState(panelRequest.key);
  if (panelRequest.key !== seenRequest) {
    setSeenRequest(panelRequest.key);
    setSideTab(panelRequest.tab);
    if (!isTablet) setMobileTab("files");
  }

  // A new prompt shows its details in the Run tab.
  const runCount = world.runs.length;
  const lastRuns = useRef(runCount);
  useEffect(() => {
    if (runCount > lastRuns.current && ui.run && sideTab !== "guide" && !openFile) setSideTab("run");
    lastRuns.current = runCount;
  }, [runCount, ui.run, sideTab, openFile]);

  const openInEditor = (p: string) => {
    setOpenFile(p);
    setSideTab("files");
  };

  const agentView = <AgentView world={world} events={events} eventKey={eventKey} orca={ui.orca} />;
  const terminal = (compact?: boolean) => (
    <Terminal
      mode={terminalMode}
      onModeChange={onTerminalModeChange}
      suggestion={suggestion}
      compact={compact}
      awaitInput={awaitInput}
      maximized={compact ? undefined : termMax}
      onToggleMaximize={compact ? undefined : () => setTermMax((m) => !m)}
    />
  );
  const editing = ui.editor && openFile && openFile in world.files ? openFile : null;
  // Desktop and tablet open files as tabs in the main area, like an IDE; phones open them full screen in the Files tab.
  const filesOrEditor =
    !isTablet && editing ? <Editor key={editing} path={editing} onBack={() => setOpenFile(null)} /> : <FilesPanel onOpen={(p) => (ui.editor ? setOpenFile(p) : setOpenFile(null))} />;

  const tabs: Array<{ id: SideTab; label: string; icon: ReactNode; show: boolean }> = [
    { id: "guide", label: t("lab.workspace.guide"), icon: <BookOpen className="size-3.5" />, show: !!guide && !isDesktop },
    { id: "files", label: t("lab.workspace.files"), icon: <Files className="size-3.5" />, show: ui.files },
    { id: "run", label: t("lab.workspace.run"), icon: <ListChecks className="size-3.5" />, show: ui.run },
  ];
  const activeSide = tabs.find((tab) => tab.id === sideTab && tab.show) ? sideTab : (tabs.find((tab) => tab.show)?.id ?? "files");

  const sidePanel = (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 gap-1 border-b border-line px-2 pt-2" role="tablist" aria-label={t("lab.workspace.panels")}>
        {tabs
          .filter((tab) => tab.show)
          .map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeSide === tab.id}
              onClick={() => setSideTab(tab.id)}
              className={clsx("relative flex items-center gap-1.5 rounded-t-lg px-2.5 pt-1.5 pb-2 text-xs font-medium transition-colors", activeSide === tab.id ? "text-fg" : "text-fg-3 hover:text-fg-2")}
            >
              {tab.icon}
              {tab.label}
              {activeSide === tab.id && <motion.span layoutId="side-tab" className="absolute inset-x-1 -bottom-px h-0.5 rounded-full bg-accent" />}
            </button>
          ))}
      </div>
      <div className="min-h-0 flex-1" role="tabpanel">
        {activeSide === "guide" && guide}
        {activeSide === "files" && filesOrEditor}
        {activeSide === "run" && <RunPanel onOpenFile={openInEditor} />}
      </div>
    </div>
  );

  const fileTabs = tabsOpen.filter((p) => p in world.files);
  const center = (
    <div className="flex h-full min-h-0 flex-col">
      {!termMax && (
        <>
          {ui.editor && fileTabs.length > 0 && <EditorTabs tabs={fileTabs} active={editing} onSelect={setOpenFile} onClose={closeTab} />}
          <div className="relative min-h-0 flex-1 overflow-hidden">{editing ? <Editor key={editing} path={editing} /> : agentView}</div>
          <ResizeHandle
            orientation="horizontal"
            onDrag={(d) => setTermH((h) => Math.min(maxTermH(), Math.max(180, h + d)))}
            onDoubleClick={() => setTermMax(true)}
          />
        </>
      )}
      <div style={termMax ? undefined : { height: termH }} className={termMax ? "min-h-0 flex-1" : "shrink-0"}>
        {terminal()}
      </div>
    </div>
  );

  if (isDesktop) {
    return (
      <div className="flex h-full min-h-0">
        {guide && <aside className="scrollbar-thin w-[min(380px,30vw)] shrink-0 overflow-y-auto border-r border-line bg-surface">{guide}</aside>}
        <main className="min-w-0 flex-1">{center}</main>
        <ResizeHandle orientation="vertical" onDrag={(d) => setSideW((w) => Math.min(620, Math.max(280, w + d)))} />
        <aside style={{ width: sideW }} className="shrink-0 border-l border-line bg-surface">
          {sidePanel}
        </aside>
      </div>
    );
  }
  if (isTablet) {
    return (
      <div className="flex h-full min-h-0">
        <main className="min-w-0 flex-1">{center}</main>
        <aside className="w-[340px] shrink-0 border-l border-line bg-surface">{sidePanel}</aside>
      </div>
    );
  }

  // Mobile: a focused, tabbed workspace rather than a shrunken desktop.
  const mobileTabs = [
    { id: "guide" as const, label: t("lab.workspace.guide"), icon: BookOpen, show: !!guide },
    { id: "agent" as const, label: t("lab.workspace.agent"), icon: Bot, show: true },
    { id: "terminal" as const, label: t("lab.workspace.terminal"), icon: SquareTerminal, show: true },
    { id: "files" as const, label: ui.files ? t("lab.workspace.files") : t("lab.workspace.details"), icon: Files, show: true },
  ].filter((tab) => tab.show);
  return (
    <div className="flex h-full min-h-0 flex-col">
      {mobileHeader}
      <div className="relative min-h-0 flex-1">
        {mobileTab === "guide" && <div className="scrollbar-thin h-full overflow-y-auto">{guide}</div>}
        {mobileTab === "agent" && agentView}
        {mobileTab === "terminal" && (
          <div className="flex h-full flex-col">
            <div className="h-32 shrink-0 border-b border-line">
              <AgentView world={world} events={events} eventKey={eventKey} compact orca={ui.orca} />
            </div>
            <div className="min-h-0 flex-1">{terminal(true)}</div>
          </div>
        )}
        {mobileTab === "files" && sidePanel}
      </div>
      <nav className="grid shrink-0 border-t border-line bg-surface pb-[env(safe-area-inset-bottom)]" style={{ gridTemplateColumns: `repeat(${mobileTabs.length}, 1fr)` }} aria-label={t("lab.workspace.nav")}>
        {mobileTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setMobileTab(tab.id)}
            aria-current={mobileTab === tab.id}
            className={clsx("flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-medium", mobileTab === tab.id ? "text-accent-fg" : "text-fg-3")}
          >
            <tab.icon className="size-5" />
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
}

/** IDE-style tabs: the agent view is always first, open files follow. */
function EditorTabs({ tabs, active, onSelect, onClose }: { tabs: string[]; active: string | null; onSelect: (p: string | null) => void; onClose: (p: string) => void }) {
  const world = useLab((s) => s.world);
  const t = useT();
  const base = (p: string) => p.split("/").pop() ?? p;
  const tabCls = (on: boolean) =>
    clsx(
      "group relative flex h-full shrink-0 items-center gap-1.5 border-r border-line pr-1.5 pl-3 text-[12.5px] transition-colors",
      on ? "bg-[var(--editor-bg)] text-fg" : "text-fg-3 hover:bg-surface-2/60 hover:text-fg-2",
    );
  return (
    <div className="scrollbar-thin flex h-9 shrink-0 items-stretch overflow-x-auto border-b border-line bg-[var(--editor-tabbar)]" role="tablist" aria-label={t("lab.workspace.panels")}>
      <button role="tab" aria-selected={!active} onClick={() => onSelect(null)} className={clsx(tabCls(!active), "pr-3")}>
        <Bot className="size-3.5 text-accent-fg" aria-hidden />
        {t("lab.workspace.agent")}
        {!active && <span className="absolute inset-x-0 top-0 h-0.5 bg-accent" />}
      </button>
      {tabs.map((p) => {
        const on = active === p;
        const dup = tabs.filter((q) => base(q) === base(p)).length > 1;
        const st = fileState(world, p);
        return (
          <div
            key={p}
            role="tab"
            aria-selected={on}
            tabIndex={0}
            title={p}
            onClick={() => onSelect(p)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") onSelect(p);
              if (e.key === "Delete") onClose(p);
            }}
            onAuxClick={(e) => e.button === 1 && onClose(p)}
            className={tabCls(on)}
          >
            <KindIcon path={p} className="size-3.5" />
            <span className={clsx("font-mono", st === "modified" && "text-warn", st === "new" && "text-ok")}>{base(p)}</span>
            {dup && <span className="font-mono text-[11px] text-fg-3">{p.split("/").slice(-2, -1)[0] ?? ""}</span>}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onClose(p);
              }}
              aria-label={`Close ${p}`}
              className={clsx("ml-0.5 grid size-5 place-items-center rounded hover:bg-surface-2 hover:text-fg pointer-coarse:size-8", on ? "opacity-100" : "opacity-0 group-hover:opacity-100 focus-visible:opacity-100")}
            >
              <X className="size-3.5" />
            </button>
            {on && <span className="absolute inset-x-0 top-0 h-0.5 bg-accent" />}
          </div>
        );
      })}
    </div>
  );
}

function ResizeHandle({ orientation, onDrag, onDoubleClick }: { orientation: "horizontal" | "vertical"; onDrag: (delta: number) => void; onDoubleClick?: () => void }) {
  const last = useRef<number | null>(null);
  const horizontal = orientation === "horizontal";
  const t = useT();
  return (
    <div
      role="separator"
      aria-orientation={horizontal ? "horizontal" : "vertical"}
      tabIndex={0}
      aria-label={horizontal ? t("lab.workspace.resizeTerminal") : t("lab.workspace.resizeSide")}
      onKeyDown={(e) => {
        if (e.key === (horizontal ? "ArrowUp" : "ArrowLeft")) onDrag(20);
        if (e.key === (horizontal ? "ArrowDown" : "ArrowRight")) onDrag(-20);
      }}
      onPointerDown={(e) => {
        (e.currentTarget as Element).setPointerCapture(e.pointerId);
        last.current = horizontal ? e.clientY : e.clientX;
      }}
      onPointerMove={(e) => {
        if (last.current === null) return;
        const pos = horizontal ? e.clientY : e.clientX;
        onDrag(last.current - pos);
        last.current = pos;
      }}
      onPointerUp={() => (last.current = null)}
      onDoubleClick={onDoubleClick}
      className={clsx(
        "group relative z-[3] shrink-0 bg-line transition-colors hover:bg-accent focus-visible:bg-accent",
        horizontal ? "h-1 cursor-row-resize bg-line/70" : "w-px cursor-col-resize",
      )}
    >
      <span className={clsx("absolute", horizontal ? "inset-x-0 -top-1.5 -bottom-1.5" : "inset-y-0 -left-1.5 -right-1.5")} />
    </div>
  );
}
