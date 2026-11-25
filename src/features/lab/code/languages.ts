import type { Extension } from "@codemirror/state";
import { StreamLanguage } from "@codemirror/language";
import { javascript } from "@codemirror/lang-javascript";
import { json } from "@codemirror/lang-json";
import { markdown } from "@codemirror/lang-markdown";
import { yaml } from "@codemirror/lang-yaml";
import { toml } from "@codemirror/legacy-modes/mode/toml";
import { shell } from "@codemirror/legacy-modes/mode/shell";

export type LangId = "typescript" | "javascript" | "json" | "markdown" | "yaml" | "toml" | "shell" | "text";

export interface LangInfo {
  id: LangId;
  /** Shown in the status bar, like VS Code's language mode. */
  label: string;
  /** Prettier parser, when Prettier can format this language. */
  parser?: "typescript" | "babel" | "json" | "markdown" | "yaml";
}

const LANGS: Record<LangId, LangInfo> = {
  typescript: { id: "typescript", label: "TypeScript", parser: "typescript" },
  javascript: { id: "javascript", label: "JavaScript", parser: "babel" },
  json: { id: "json", label: "JSON", parser: "json" },
  markdown: { id: "markdown", label: "Markdown", parser: "markdown" },
  yaml: { id: "yaml", label: "YAML", parser: "yaml" },
  toml: { id: "toml", label: "TOML" },
  shell: { id: "shell", label: "Shell" },
  text: { id: "text", label: "Plain text" },
};

export function langOf(path: string): LangInfo {
  const name = path.split("/").pop() ?? path;
  const ext = name.includes(".") ? name.split(".").pop()!.toLowerCase() : "";
  if (/^(tsx?|mts|cts)$/.test(ext)) return LANGS.typescript;
  if (/^(jsx?|mjs|cjs)$/.test(ext)) return LANGS.javascript;
  if (ext === "json" || name === ".prettierrc") return LANGS.json;
  if (/^(md|mdx|markdown)$/.test(ext)) return LANGS.markdown;
  if (/^ya?ml$/.test(ext)) return LANGS.yaml;
  if (ext === "toml") return LANGS.toml;
  if (/^(sh|bash|zsh)$/.test(ext) || /^\.(env|gitignore)/.test(name)) return LANGS.shell;
  return LANGS.text;
}

export function langExtension(id: LangId): Extension {
  switch (id) {
    case "typescript":
      return javascript({ typescript: true, jsx: true });
    case "javascript":
      return javascript({ jsx: true });
    case "json":
      return json();
    case "markdown":
      return markdown();
    case "yaml":
      return yaml();
    case "toml":
      return StreamLanguage.define(toml);
    case "shell":
      return StreamLanguage.define(shell);
    default:
      return [];
  }
}
