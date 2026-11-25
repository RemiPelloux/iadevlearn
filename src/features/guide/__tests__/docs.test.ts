import { describe, expect, it } from "vitest";
import { ALL_LESSON_DEFS } from "@/features/curriculum";
import { DOC_PAGES } from "../pages";

const ROUTES = new Set(["/", "/learn", "/playground", "/commands", "/docs", "/setup", "/skills", "/profile", "/welcome"]);
const ok = (href: string) => {
  const path = href.split("#")[0];
  if (ROUTES.has(path)) return true;
  if (path.startsWith("/docs/")) return DOC_PAGES.some((p) => `/docs/${p.slug}` === path);
  if (path.startsWith("/learn/")) return ALL_LESSON_DEFS.some((l) => `/learn/${l.id}` === path);
  return false;
};
const prose = (md: string) => md.replace(/```[\s\S]*?```/g, "").replace(/`[^`]*`/g, "");

describe("docs", () => {
  it("has unique slugs and both languages on every page", () => {
    expect(new Set(DOC_PAGES.map((p) => p.slug)).size).toBe(DOC_PAGES.length);
    for (const p of DOC_PAGES)
      for (const f of [p.title, p.lead, p.body]) {
        expect(f.en.trim(), p.slug).not.toBe("");
        expect(f.fr.trim(), p.slug).not.toBe("");
      }
  });

  it("only links to pages that exist", () => {
    for (const p of DOC_PAGES)
      for (const lang of ["en", "fr"] as const)
        for (const m of p.body[lang].matchAll(/\]\((\/[^)\s]*)\)/g)) expect(ok(m[1]), `${p.slug} (${lang}) → ${m[1]}`).toBe(true);
    for (const p of DOC_PAGES)
      for (const id of [p.lesson, ...(p.more ?? [])].filter(Boolean)) expect(ALL_LESSON_DEFS.some((l) => l.id === id), `${p.slug} → ${id}`).toBe(true);
  });

  it("uses plain punctuation: no em or en dashes in the prose", () => {
    for (const p of DOC_PAGES)
      for (const lang of ["en", "fr"] as const)
        for (const text of [p.title[lang], p.lead[lang], prose(p.body[lang])]) expect(text, `${p.slug} (${lang})`).not.toMatch(/[—–]/);
  });

  it("closes every code fence", () => {
    for (const p of DOC_PAGES) for (const lang of ["en", "fr"] as const) expect((p.body[lang].match(/^```/gm) ?? []).length % 2, p.slug).toBe(0);
  });
});
