import { APP_PAGES } from "./content/app";
import { CHEAT_PAGES } from "./content/cheats";
import { GUIDE_PAGES } from "./content/guides";
import type { DocPage, DocSection } from "./types";

export const DOC_PAGES: DocPage[] = [...APP_PAGES, ...GUIDE_PAGES, ...CHEAT_PAGES];

export const DOC_SECTIONS: Array<{ id: DocSection; title: { en: string; fr: string }; blurb: { en: string; fr: string } }> = [
  {
    id: "app",
    title: { en: "Using IA Dev Learn", fr: "Utiliser IA Dev Learn" },
    blurb: { en: "Lessons, the terminal, the Agent view, the Playground and your data.", fr: "Les leçons, le terminal, la vue Agent, le bac à sable et tes données." },
  },
  {
    id: "guides",
    title: { en: "Guides", fr: "Guides" },
    blurb: { en: "Prompts, context, rules, skills, Codex, Antigravity, Orca and safety, each linked to its lesson.", fr: "Prompts, contexte, règles, skills, Codex, Antigravity, Orca et sécurité, chacun relié à sa leçon." },
  },
  {
    id: "cheats",
    title: { en: "Cheat sheets", fr: "Antisèches" },
    blurb: { en: "One-page summaries to print or keep open next to your terminal.", fr: "Des résumés d'une page à imprimer ou à garder à côté du terminal." },
  },
];

export const getDoc = (slug: string) => DOC_PAGES.find((p) => p.slug === slug) ?? null;

export function neighbours(slug: string) {
  const i = DOC_PAGES.findIndex((p) => p.slug === slug);
  return { prev: DOC_PAGES[i - 1] ?? null, next: DOC_PAGES[i + 1] ?? null };
}
