import type { Txt } from "@/engine";
import type { Locale } from "@/i18n/locale";
import { ALL_LESSON_DEFS, CHAPTER_DEFS, TIER_LABEL } from "./index";
import type { Chapter, ChapterDef, Lesson, LessonDef, Tier } from "./types";

const isTxt = (v: unknown): v is Txt => !!v && typeof v === "object" && !Array.isArray(v) && Object.keys(v).length === 2 && "en" in v && "fr" in v;

/** Replace every { en, fr } pair by the learner's language. Functions are kept; `feedback` results are translated too. */
function resolve(value: unknown, locale: Locale, key = ""): unknown {
  if (isTxt(value)) return value[locale];
  if (typeof value === "function") {
    if (key !== "feedback") return value;
    const fn = value as (...a: unknown[]) => unknown;
    return (...args: unknown[]) => resolve(fn(...args), locale);
  }
  if (Array.isArray(value)) return value.map((v) => resolve(v, locale));
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, resolve(v, locale, k)]));
  return value;
}

export const pick = (t: Txt, locale: Locale) => t[locale];

const lessonCache = new Map<string, Lesson>();

export function localizeLesson(def: LessonDef, locale: Locale): Lesson {
  const key = `${locale}:${def.id}`;
  const hit = lessonCache.get(key);
  if (hit) return hit;
  const out = resolve(def, locale) as Lesson;
  lessonCache.set(key, out);
  return out;
}

const chapterCache = new Map<Locale, Chapter[]>();

export function localizedChapters(locale: Locale): Chapter[] {
  const hit = chapterCache.get(locale);
  if (hit) return hit;
  const out = CHAPTER_DEFS.map((c: ChapterDef) => ({
    ...c,
    title: c.title[locale],
    description: c.description[locale],
    upcoming: c.upcoming.map((u) => u[locale]),
    lessons: c.lessons.map((l) => localizeLesson(l, locale)),
  }));
  chapterCache.set(locale, out);
  return out;
}

export const localizedLessons = (locale: Locale) => ALL_LESSON_DEFS.map((l) => localizeLesson(l, locale));

export function tierLabel(tier: Tier, locale: Locale) {
  return TIER_LABEL[tier][locale];
}
