"use client";

import Link from "next/link";
import { ArrowRight, Award, BookOpen, BookText, Download, Sparkles, Star, Target, Zap } from "lucide-react";
import { DynamicIcon } from "@/components/ui/misc";
import { ACHIEVEMENTS } from "@/features/progress/rules";
import type { MessageKey } from "@/i18n";
import { AppNav } from "@/components/app-nav";
import { LinkButton } from "@/components/ui/button";
import { localizedChapters, tierLabel } from "@/features/curriculum/localize";
import { HeroDemo } from "@/features/landing/hero-demo";
import { ToolBadge } from "@/features/lab/agent-view";
import { TOOL_NAMES } from "@/engine";
import { StartButton } from "@/features/landing/start-button";
import { useT } from "@/i18n";

/** What IA Dev Learn does, told as a commit history (messages come from the dictionary). */
const LOG = [
  { hash: "e3f1a09", head: true },
  { hash: "9b2c4d1" },
  { hash: "51ad7e8" },
  { hash: "c08e2f3" },
  { hash: "7f9e011" },
  { hash: "0d4b6aa" },
];

const STEPS = ["discover", "watch", "try", "challenge", "celebrate"] as const;

const GAME = [
  ["xp", Zap, "var(--lane-0)"],
  ["stars", Star, "var(--lane-3)"],
  ["quests", Target, "var(--lane-1)"],
  ["badges", Award, "var(--lane-2)"],
] as const;

export function Landing() {
  const t = useT();
  const chapters = localizedChapters(t.locale);
  const log = t.list("landing.log");
  return (
    <>
      <AppNav />
      <main className="pb-24 md:pb-0">
        <div className="relative overflow-hidden">
          <div aria-hidden className="bg-dots pointer-events-none absolute inset-0 [mask-image:radial-gradient(ellipse_70%_60%_at_72%_40%,black,transparent)]" />
          <section className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pt-12 pb-20 lg:grid-cols-[1fr_1.12fr] lg:gap-14 lg:pt-20">
            <div>
              <h1 className="text-[2.6rem] leading-[1.03] font-semibold tracking-[-0.03em] text-balance sm:text-[3.5rem] xl:text-[3.9rem]">
                {t("landing.title1")} <span className="text-accent-fg">{t("landing.titleAccent")}</span>
                {t.locale === "fr" ? " " : " "}
                {t("landing.title2")}
              </h1>
              <p className="mt-6 max-w-[34rem] text-lg leading-relaxed text-fg-2">{t("landing.lead")}</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <StartButton />
                <LinkButton href="/playground" variant="secondary" size="lg">
                  {t("landing.openPlayground")}
                </LinkButton>
              </div>
              <p className="mt-4 text-sm text-fg-3">{t("landing.reassure")}</p>
              <div className="mt-10 border-t border-line pt-5">
                <p className="text-xs text-fg-3">{t.locale === "fr" ? "Couvre les outils que tu utiliseras au travail" : "Covers the tools you'll use at work"}</p>
                <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2.5 text-sm font-medium text-fg-2">
                  {(["claude", "codex", "antigravity", "gemini"] as const).map((tool) => (
                    <li key={tool} className="flex items-center gap-1.5">
                      <ToolBadge tool={tool} /> {TOOL_NAMES[tool]}
                    </li>
                  ))}
                  <li className="flex items-center gap-1.5">
                    <span className="grid size-5 place-items-center rounded-md bg-fg text-[9px] font-semibold text-bg">OR</span> Orca
                  </li>
                </ul>
              </div>
            </div>
            <HeroDemo />
          </section>
        </div>

        <section className="border-y border-line bg-surface">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 lg:grid-cols-[1fr_1.4fr]">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">{t("landing.whyTitle")}</h2>
              <p className="mt-2 text-fg-2">{t("landing.whyBody")}</p>
            </div>
            <ol className="font-mono text-[13px] leading-7" aria-label={t("landing.featuresLabel")}>
              {LOG.map((c, i) => (
                <li key={c.hash} className="flex gap-3">
                  <span className="relative flex w-3 shrink-0 justify-center" aria-hidden>
                    <span className={i === LOG.length - 1 ? "absolute top-0 h-3.5 w-px bg-line-strong" : "absolute inset-y-0 w-px bg-line-strong"} />
                    <span className="relative mt-[9px] size-2.5 rounded-full border-2 border-accent-mark bg-surface" />
                  </span>
                  <span className="shrink-0 text-warn">{c.hash}</span>
                  <span className="min-w-0">
                    {c.head && (
                      <span className="mr-2 text-fg-3">
                        (<span className="text-info">HEAD</span> -&gt; <span className="text-ok">main</span>)
                      </span>
                    )}
                    <span className="text-fg">{log[i]}</span>
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-12 px-4 py-16 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">{t("landing.stepsTitle")}</h2>
            <p className="mt-2 text-fg-2">{t("landing.stepsBody")}</p>
            <dl className="mt-6 divide-y divide-line border-y border-line">
              {STEPS.map((k) => (
                <div key={k} className="grid grid-cols-[7.5rem_1fr] gap-3 py-3 text-sm">
                  <dt className="font-mono text-accent-fg">{t(`steps.${k}`).toLowerCase()}</dt>
                  <dd className="text-fg-2">{t(`landing.steps.${k}`)}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">{t("landing.curriculumTitle")}</h2>
            <p className="mt-2 text-fg-2">{t("landing.curriculumBody")}</p>
            <ul className="mt-6 divide-y divide-line border-y border-line">
              {chapters.map((c) => (
                <li key={c.id} className="flex items-center gap-3 py-2.5 text-sm">
                  <span className="w-6 font-mono text-xs text-fg-3">{String(c.number).padStart(2, "0")}</span>
                  <span className="flex-1">{c.title}</span>
                  <span className="text-xs text-fg-3">{c.lessons.length ? (c.lessons.length > 1 ? t("landing.lessonsCount", { n: c.lessons.length }) : t("landing.lessonCount")) : t("common.comingSoon")}</span>
                  <span className="hidden w-24 text-right text-xs text-fg-3 sm:inline">{tierLabel(c.tier, t.locale)}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="border-y border-line bg-surface">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 lg:grid-cols-[1fr_1.4fr]">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight">{t("landing.gameTitle")}</h2>
              <ul className="mt-6 flex flex-wrap gap-2" aria-label={t("learn.badges")}>
                {ACHIEVEMENTS.slice(1, 9).map((a) => (
                  <li key={a.id} className="flex items-center gap-1.5 rounded-full border border-line bg-elevated py-1 pr-3 pl-1 text-xs font-medium shadow-[var(--shadow-card)]">
                    <span className="grid size-6 place-items-center rounded-full bg-warn-soft text-warn">
                      <DynamicIcon name={a.icon} className="size-3.5" />
                    </span>
                    {t(`badges.${a.id}.title` as MessageKey)}
                  </li>
                ))}
              </ul>
            </div>
            <dl className="divide-y divide-line border-y border-line">
              {GAME.map(([id, Icon, color]) => (
                <div key={id} className="grid grid-cols-[2rem_1fr] gap-x-3 py-4 sm:grid-cols-[2rem_9rem_1fr]">
                  <Icon className="mt-0.5 size-5" style={{ color }} aria-hidden />
                  <dt className="font-semibold">{t(`landing.game.${id}.title`)}</dt>
                  <dd className="col-start-2 text-sm text-fg-2 sm:col-start-3">{t(`landing.game.${id}.body`)}</dd>
                </div>
              ))}
            </dl>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-14" aria-labelledby="beyond">
          <h2 id="beyond" className="text-2xl font-semibold tracking-tight">
            {t.locale === "fr" ? "Apprends ici, puis passe aux vrais outils" : "Learn it here, then use the real tools"}
          </h2>
          <ul className="mt-6 grid gap-x-8 gap-y-2 md:grid-cols-2 lg:grid-cols-4">
            {(
              [
                ["/docs", BookOpen, t.locale === "fr" ? "Docs" : "Docs", t.locale === "fr" ? "Comment marche chaque partie de l'appli, des guides sur les règles, les skills, Codex, Orca, et des antisèches à imprimer." : "How every part of the app works, guides on rules, skills, Codex and Orca, and cheat sheets to print."],
                ["/setup", Download, t.locale === "fr" ? "Installer" : "Install", t.locale === "fr" ? "Les commandes à copier pour installer Claude Code, Codex, Gemini CLI, Antigravity et Orca sur macOS, Linux ou Windows." : "Copy-paste commands to install Claude Code, Codex, Gemini CLI, Antigravity and Orca on macOS, Linux or Windows."],
                ["/skills", Sparkles, t.locale === "fr" ? "Bibliothèque de skills" : "Skills hub", t.locale === "fr" ? "Des skills prêts à l'emploi : les règles Pelloux, kill-my-idea, les skills officiels d'Anthropic et ceux de la communauté." : "Ready-to-use skills: the Pelloux guidelines, kill-my-idea, Anthropic's official skills and community favourites."],
                ["/commands", BookText, t.locale === "fr" ? "Référence" : "Reference", t.locale === "fr" ? "Chaque commande et chaque fichier, avec un exemple qui tourne avant et après." : "Every command and file, each with a live before-and-after example."],
              ] as const
            ).map(([href, Icon, title, body]) => (
              <li key={href}>
                <Link href={href} className="group flex gap-3 border-t border-line py-4">
                  <Icon className="mt-0.5 size-5 shrink-0 text-accent-fg" aria-hidden />
                  <span>
                    <span className="flex items-center gap-1 font-semibold group-hover:text-accent-fg">
                      {title} <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
                    </span>
                    <span className="mt-1 block text-sm text-fg-2">{body}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="mx-auto max-w-6xl px-4 pt-14 pb-20">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">{t("landing.ctaTitle")}</h2>
              <p className="mt-1 max-w-xl text-sm text-fg-2">
                {t("landing.ctaBody")}
              </p>
            </div>
            <StartButton />
          </div>
          <footer className="mt-14 flex flex-wrap items-center justify-between gap-4 text-xs text-fg-3">
            <span>{t("landing.footer")}</span>
            <span className="flex gap-4">
              <Link href="/commands" className="hover:text-fg-2">
                {t("landing.footerCommands")}
              </Link>
              <Link href="/setup" className="hover:text-fg-2">
                {t("nav.setup")}
              </Link>
              <Link href="/docs" className="hover:text-fg-2">
                {t("nav.docs")}
              </Link>
              <Link href="/profile" className="hover:text-fg-2">
                {t("landing.footerSettings")}
              </Link>
            </span>
          </footer>
        </section>
      </main>
    </>
  );
}
