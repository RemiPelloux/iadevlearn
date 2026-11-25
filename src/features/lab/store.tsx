"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { createStore, useStore, type StoreApi } from "zustand";
import { execute, type ExecResult, type OutLine, type SimEvent, type ToolId, type World } from "@/engine";
import { useProgress } from "@/features/progress/store";

export interface TermEntry {
  id: number;
  input: string;
  lines: OutLine[];
  ok: boolean;
  explain?: string;
  /** The agent the input was typed to (null = the shell). */
  session: ToolId | null;
  branch: string | null;
  /** The agent session this command opened (renders the welcome box). */
  started?: ToolId;
  /** The agent run this input produced (renders its task list). */
  runId?: number;
}

export interface Snapshot {
  world: World;
  label: string;
}

export type SidePanel = "files" | "run";

export interface LabState {
  world: World;
  entries: TermEntry[];
  /** Time travel: every state the simulation passed through. */
  history: Snapshot[];
  cursor: number;
  /** Latest events, with a monotonically increasing key for animations. */
  events: SimEvent[];
  eventKey: number;
  inputHistory: string[];
  /** Run shown in the Run panel (null = latest). */
  selectedRun: number | null;
  openFile: string | null;
  /** Files open as editor tabs, in tab order. `openFile` is the active one (null = the agent view). */
  tabs: string[];
  /** Bumped when the UI should bring a panel to front (e.g. `edit file` opens the editor). */
  panelRequest: { tab: SidePanel; key: number };
  /** Called after every command (progress, lesson validation). */
  onResult?: (r: ExecResult, input: string) => void;

  run: (input: string) => ExecResult;
  /** UI-driven file edits (explorer/editor) go through the same canonical world. */
  writeFile: (path: string, content: string) => void;
  deleteFile: (path: string) => void;
  /** Deletes every file under a folder in one step (one history entry). */
  deleteFolder: (dir: string) => void;
  renameFile: (from: string, to: string) => void;
  reset: (world: World, label?: string) => void;
  travel: (index: number) => void;
  clearTerminal: () => void;
  selectRun: (id: number | null) => void;
  setOpenFile: (path: string | null) => void;
  closeTab: (path: string) => void;
}

let entryId = 1;

const withTab = (tabs: string[], path: string) => (tabs.includes(path) ? tabs : [...tabs, path].slice(-12));

const locale = () => {
  try {
    return useProgress.getState().settings.locale ?? "en";
  } catch {
    return "en";
  }
};

export function createLabStore(initial: World, onResult?: LabState["onResult"], restore?: { entries?: TermEntry[]; inputHistory?: string[] }) {
  // Keep entry ids unique when a saved transcript is restored.
  for (const e of restore?.entries ?? []) entryId = Math.max(entryId, e.id + 1);
  return createStore<LabState>()((set, get) => {
    const commitWorld = (world: World, label: string, events: SimEvent[]) => {
      const { history, cursor } = get();
      const nextHistory = [...history.slice(0, cursor + 1), { world, label }].slice(-200);
      set((s) => ({ world, history: nextHistory, cursor: nextHistory.length - 1, events, eventKey: s.eventKey + 1 }));
    };
    const edited = (world: World, label: string, paths: string[]) => {
      commitWorld(world, label, [{ type: "file-change", paths }]);
      get().onResult?.({ world: get().world, lines: [], events: [{ type: "file-change", paths }], ok: true, command: null }, "");
    };

    return {
      world: initial,
      entries: restore?.entries ?? [],
      history: [{ world: initial, label: "Start" }],
      cursor: 0,
      events: [],
      eventKey: 0,
      inputHistory: restore?.inputHistory ?? [],
      selectedRun: null,
      openFile: null,
      tabs: [],
      panelRequest: { tab: "files", key: 0 },
      onResult,

      run: (input) => {
        const before = get().world;
        const r = execute(before, input, { locale: locale() });
        const trimmed = input.trim();
        set((s) => ({ inputHistory: trimmed ? [...s.inputHistory.filter((h) => h !== trimmed), trimmed].slice(-100) : s.inputHistory }));
        const startEv = r.events.find((e) => e.type === "session-start");
        const promptEv = r.events.find((e) => e.type === "prompt");
        if (r.clear) set({ entries: [] });
        else
          set((s) => ({
            entries: [
              ...s.entries,
              {
                id: entryId++,
                input,
                lines: r.lines,
                ok: r.ok,
                explain: r.explain,
                session: before.session?.tool ?? null,
                branch: before.git.branch,
                started: startEv?.type === "session-start" ? startEv.tool : undefined,
                runId: promptEv?.type === "prompt" ? promptEv.run : undefined,
              },
            ].slice(-300),
          }));
        if (JSON.stringify(r.world) !== JSON.stringify(before)) commitWorld(r.world, trimmed, r.events);
        else if (r.events.length) set((s) => ({ events: r.events, eventKey: s.eventKey + 1 }));
        const open = r.events.find((e) => e.type === "open-file");
        if (open?.type === "open-file") set((s) => ({ openFile: open.path, tabs: withTab(s.tabs, open.path), panelRequest: { tab: "files", key: s.panelRequest.key + 1 } }));
        if (r.events.some((e) => e.type === "prompt")) set({ selectedRun: null });
        get().onResult?.(r, input);
        return r;
      },
      writeFile: (path, content) => {
        const w = get().world;
        if (w.files[path] === content) return;
        edited({ ...w, files: { ...w.files, [path]: content } }, `edit ${path}`, [path]);
      },
      deleteFile: (path) => {
        const w = get().world;
        const files = { ...w.files };
        delete files[path];
        get().closeTab(path);
        edited({ ...w, files }, `delete ${path}`, [path]);
      },
      deleteFolder: (dir) => {
        const w = get().world;
        const gone = Object.keys(w.files).filter((p) => p.startsWith(`${dir}/`));
        if (!gone.length) return;
        const files = { ...w.files };
        for (const p of gone) {
          delete files[p];
          get().closeTab(p);
        }
        edited({ ...w, files }, `delete ${dir}/`, gone);
      },
      renameFile: (from, to) => {
        const w = get().world;
        if (!(from in w.files) || to in w.files || !to.trim()) return;
        const files = { ...w.files, [to]: w.files[from] };
        delete files[from];
        set((s) => ({ openFile: s.openFile === from ? to : s.openFile, tabs: s.tabs.map((t) => (t === from ? to : t)) }));
        edited({ ...w, files }, `rename ${from}`, [from, to]);
      },
      reset: (world, label = "Reset") =>
        set((s) => ({ world, history: [{ world, label }], cursor: 0, entries: [], events: [], eventKey: s.eventKey + 1, selectedRun: null, openFile: null, tabs: [] })),
      travel: (index) => {
        const snap = get().history[index];
        if (!snap) return;
        set((s) => ({ world: snap.world, cursor: index, events: [], eventKey: s.eventKey + 1 }));
        get().onResult?.({ world: snap.world, lines: [], events: [], ok: true, command: null }, "");
      },
      clearTerminal: () => set({ entries: [] }),
      selectRun: (id) => set((s) => ({ selectedRun: id, panelRequest: { tab: "run", key: s.panelRequest.key + 1 } })),
      setOpenFile: (path) => set((s) => ({ openFile: path, tabs: path ? withTab(s.tabs, path) : s.tabs })),
      closeTab: (path) =>
        set((s) => {
          const i = s.tabs.indexOf(path);
          const tabs = s.tabs.filter((t) => t !== path);
          // Closing the active tab focuses its neighbour, like an IDE.
          const openFile = s.openFile === path ? (tabs[Math.min(i, tabs.length - 1)] ?? null) : s.openFile;
          return { tabs, openFile };
        }),
    };
  });
}

const LabContext = createContext<StoreApi<LabState> | null>(null);

export function LabProvider({ initial, onResult, children, store: external }: { initial?: World; onResult?: LabState["onResult"]; children: ReactNode; store?: StoreApi<LabState> }) {
  const [store] = useState(() => external ?? createLabStore(initial!, onResult));
  return <LabContext.Provider value={store}>{children}</LabContext.Provider>;
}

export function useLab<T>(selector: (s: LabState) => T): T {
  const store = useContext(LabContext);
  if (!store) throw new Error("useLab must be used inside <LabProvider>");
  return useStore(store, selector);
}

export function useLabApi(): StoreApi<LabState> {
  const store = useContext(LabContext);
  if (!store) throw new Error("useLabApi must be used inside <LabProvider>");
  return store;
}

/** Like useLabApi, but returns null outside a <LabProvider> (for views also used on static pages). */
export function useLabApiMaybe(): StoreApi<LabState> | null {
  return useContext(LabContext);
}
