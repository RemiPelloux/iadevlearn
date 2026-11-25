import type { LangInfo } from "./languages";

export type FormatResult = { ok: true; text: string } | { ok: false; error: string };

/**
 * Format with Prettier, loaded only when the learner first asks for it
 * (the parsers are large and most sessions never format).
 */
export async function formatCode(text: string, lang: LangInfo): Promise<FormatResult> {
  if (!lang.parser) return { ok: false, error: `Prettier can't format ${lang.label} files.` };
  try {
    const prettier = await import("prettier/standalone");
    const plugins = await (async () => {
      switch (lang.parser) {
        case "typescript":
          return [await import("prettier/plugins/typescript"), await import("prettier/plugins/estree")];
        case "babel":
        case "json":
          return [await import("prettier/plugins/babel"), await import("prettier/plugins/estree")];
        case "markdown":
          return [await import("prettier/plugins/markdown")];
        case "yaml":
          return [await import("prettier/plugins/yaml")];
      }
    })();
    const out = await prettier.format(text, { parser: lang.parser, plugins, printWidth: 100 });
    return { ok: true, text: out };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    // Prettier's syntax errors carry a code frame: the first line is what matters.
    return { ok: false, error: msg.split("\n")[0] };
  }
}
