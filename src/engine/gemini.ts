import type { FileMap } from "./types";

/**
 * Gemini CLI custom commands: `.gemini/commands/<name>.toml` (project) or
 * `~/.gemini/commands/<name>.toml` (yours). A subfolder makes a namespace:
 * `.gemini/commands/git/commit.toml` is `/git:commit`.
 */
export const GEMINI_COMMAND_DIRS = [".gemini/commands", "~/.gemini/commands"];

export interface GeminiCommand {
  name: string;
  path: string;
  description: string;
  prompt: string;
  error?: string;
}

/** The two TOML keys custom commands use: `description` and `prompt` (one line or a """ block). */
export function parseCommandToml(text: string): { description: string; prompt: string; error?: string } {
  const desc = text.match(/^\s*description\s*=\s*(?:"([^"\n]*)"|'([^'\n]*)')/m);
  const block = text.match(/^\s*prompt\s*=\s*("""|''')([\s\S]*?)\1/m);
  const line = text.match(/^\s*prompt\s*=\s*(?:"([^"\n]*)"|'([^'\n]*)')\s*$/m);
  const prompt = block ? block[2].replace(/^\n/, "").trimEnd() : line ? (line[1] ?? line[2] ?? "") : "";
  return {
    description: desc ? (desc[1] ?? desc[2] ?? "") : "",
    prompt,
    error: prompt ? undefined : "missing prompt = \"…\"",
  };
}

export function listGeminiCommands(files: FileMap): GeminiCommand[] {
  const out: GeminiCommand[] = [];
  for (const dir of GEMINI_COMMAND_DIRS)
    for (const path of Object.keys(files).sort()) {
      const m = path.startsWith(dir + "/") ? path.slice(dir.length + 1).match(/^(.+)\.toml$/) : null;
      if (!m) continue;
      const name = m[1].replace(/\//g, ":");
      // Project commands override your personal ones with the same name.
      if (out.some((c) => c.name === name)) continue;
      out.push({ name, path, ...parseCommandToml(files[path]) });
    }
  return out;
}

/** The prompt a custom command sends: `{{args}}` is replaced, otherwise the arguments are appended. */
export function expandCommand(cmd: GeminiCommand, args: string): string {
  if (cmd.prompt.includes("{{args}}")) return cmd.prompt.replace(/\{\{args\}\}/g, args).trim();
  return args ? `${cmd.prompt}\n\n${args}` : cmd.prompt;
}

export const GEMINI_MEMORY_FILE = "~/.gemini/GEMINI.md";
const MEMORY_HEADING = "## Gemini Added Memories";

/** `/memory add <fact>`: Gemini CLI saves it in your global GEMINI.md, under its own heading. */
export function addMemory(files: FileMap, fact: string): FileMap {
  const cur = files[GEMINI_MEMORY_FILE] ?? "";
  const line = `- ${fact.trim()}`;
  if (cur.includes(MEMORY_HEADING)) return { ...files, [GEMINI_MEMORY_FILE]: cur.replace(/\n*$/, "\n") + line + "\n" };
  return { ...files, [GEMINI_MEMORY_FILE]: (cur ? cur.replace(/\n*$/, "\n\n") : "") + `${MEMORY_HEADING}\n${line}\n` };
}
