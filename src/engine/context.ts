import type { ExecResult, LineKind, Locale, OutLine, SimEvent, World } from "./types";

/** Bilingual text. The simulator speaks the learner's language; tool names and code stay as they are. */
export type Txt = { en: string; fr: string };
export const tx = (en: string, fr: string): Txt => ({ en, fr });

/** Thrown to stop a command with an error message. */
export class CommandError extends Error {
  constructor(
    public lines: Array<string | Txt>,
    public explain?: Txt,
  ) {
    super(lines.map((l) => (typeof l === "string" ? l : l.en)).join("\n"));
  }
}

export function fail(message: string | Txt | Array<string | Txt>, explain?: Txt): never {
  throw new CommandError(Array.isArray(message) ? message : [message], explain);
}

/** Mutable execution context for a single command over a cloned world. */
export class Ctx {
  lines: OutLine[] = [];
  events: SimEvent[] = [];
  explain?: string;
  clear = false;
  ok = true;

  constructor(
    public world: World,
    public locale: Locale = "en",
  ) {}

  t(text: string | Txt): string {
    return typeof text === "string" ? text : text[this.locale];
  }

  out(text: string | Txt | Array<string | Txt>, kind: LineKind = "out") {
    const all = Array.isArray(text) ? text : [text];
    for (const item of all) for (const line of this.t(item).split("\n")) this.lines.push({ text: line, kind });
  }

  emit(e: SimEvent) {
    this.events.push(e);
  }

  /** Non-fatal failure (exit code 1) that still keeps state changes. */
  error(text: string | Txt, explain?: Txt) {
    this.out(text, "error");
    this.ok = false;
    if (explain) this.explain = this.t(explain);
  }

  result(command: string | null): ExecResult {
    return { world: this.world, lines: this.lines, events: this.events, ok: this.ok, command, explain: this.explain, clear: this.clear };
  }
}
