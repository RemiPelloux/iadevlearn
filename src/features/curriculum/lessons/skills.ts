import { checkSkill, tx as L, type Txt, type World } from "@/engine";
import * as c from "../checks";
import { CHANGELOG_SKILL, P_TOTAL, README_SKILL, shop, SKILL_SKELETON } from "../scenario";
import type { LessonDef } from "../types";

const UI = { files: true, editor: true, run: true, orca: false };

export const whatIsSkill: LessonDef = {
  id: "what-is-a-skill",
  chapterId: "skills",
  title: L("What is a skill?", "C'est quoi, un skill ?"),
  tagline: L("Know-how the agent loads only when it needs it", "Un savoir-faire que l'agent charge seulement quand il en a besoin"),
  xp: 120,
  concepts: [L("skill", "skill"), L("SKILL.md", "SKILL.md"), L("progressive disclosure", "divulgation progressive")],
  commands: [".claude/skills/<name>/SKILL.md", "/skills"],
  ui: UI,
  setup: () => shop({ ".claude/skills/changelog/SKILL.md": CHANGELOG_SKILL }),
  recap: [
    L("A skill is a folder with a SKILL.md: a name, a description saying when to use it, and step-by-step instructions.", "Un skill est un dossier avec un SKILL.md : un nom, une description qui dit quand l'utiliser, et des instructions étape par étape."),
    L("The agent only sees each skill's name and description. It loads the full instructions when your request matches — so 50 skills cost almost nothing.", "L'agent ne voit que le nom et la description de chaque skill. Il charge les instructions complètes quand ta demande correspond — 50 skills ne coûtent donc presque rien."),
    L("Rules = what's always true. Skills = how to do a specific job, on demand.", "Règles = ce qui est toujours vrai. Skills = comment faire un travail précis, à la demande."),
  ],
  steps: [
    {
      kind: "discover",
      title: L("A recipe book, not a backpack", "Un livre de recettes, pas un sac à dos"),
      body: [
        L("Rules are loaded in every conversation, so they must stay short. But what about the 30-step release procedure, or how your team writes changelogs?", "Les règles sont chargées à chaque conversation, elles doivent donc rester courtes. Mais que faire de la procédure de release en 30 étapes, ou de la façon dont ton équipe écrit les changelogs ?"),
        L("Skills solve this with progressive disclosure: the agent keeps a table of contents (names + descriptions) and opens a skill only when it's relevant. Try it below.", "Les skills règlent ça par divulgation progressive : l'agent garde une table des matières (noms + descriptions) et n'ouvre un skill que s'il est utile. Essaie ci-dessous."),
      ],
      scene: "progressive-disclosure",
    },
    {
      kind: "discover",
      title: L("Anatomy of a skill", "Anatomie d'un skill"),
      body: [
        L("A skill is a folder named after it, containing SKILL.md. Its frontmatter (between the --- lines) has a name and a description. The body is the instructions. You can add scripts or reference files next to it.", "Un skill est un dossier qui porte son nom et contient SKILL.md. Son en-tête (entre les lignes ---) a un nom et une description. Le corps, ce sont les instructions. Tu peux ajouter des scripts ou des fichiers de référence à côté."),
        L("The same format works in Claude Code (.claude/skills/), Codex and Antigravity (.agents/skills/) and more and more tools.", "Le même format marche dans Claude Code (.claude/skills/), Codex et Antigravity (.agents/skills/) et de plus en plus d'outils."),
      ],
      scene: "skill-anatomy",
    },
    {
      kind: "try",
      title: L("Read the skill", "Lis le skill"),
      body: L("This project ships a changelog skill. Read it: notice the description says when to use it.", "Ce projet contient un skill changelog. Lis-le : remarque que la description dit quand l'utiliser."),
      command: "cat .claude/skills/changelog/SKILL.md",
      check: (_w, _s, ran) => ran.includes("cat"),
      success: L("Name, “Use when…” description, numbered steps. That's all a skill needs.", "Un nom, une description « Use when… », des étapes numérotées. C'est tout ce qu'il faut à un skill."),
    },
    {
      kind: "try",
      title: L("Trigger it with a short request", "Déclenche-le avec une demande courte"),
      body: L("Ask for a changelog update in just a few words. The skill fills in everything your prompt doesn't say.", "Demande une mise à jour du changelog en quelques mots. Le skill complète tout ce que ton prompt ne dit pas."),
      command: 'claude -p "Update the changelog"',
      check: (w, s) => c.someRun(w, s, (r) => r.skill === "changelog" && r.outcome === "done"),
      success: L("“Skill(changelog)”: the agent matched your request with the description, loaded the full SKILL.md and followed its format. A 3-word prompt, a perfect result.", "« Skill(changelog) » : l'agent a rapproché ta demande de la description, chargé tout le SKILL.md et suivi son format. Un prompt de 3 mots, un résultat parfait."),
    },
    {
      kind: "try",
      title: L("…and only when it's relevant", "…et seulement quand c'est utile"),
      body: L("Now ask for something unrelated and look at the context panel.", "Maintenant demande autre chose et regarde le panneau de contexte."),
      command: `claude -p "${P_TOTAL}"`,
      check: (w, s) => c.someRun(w, s, (r) => r.task === "fix-total" && !r.skill),
      success: L("The skill stayed closed: only its one-line description took space in the context.", "Le skill est resté fermé : seule sa description d'une ligne a pris de la place dans le contexte."),
    },
    {
      kind: "experiment",
      title: L("Explore", "Explore"),
      body: L("List skills from inside a session, or invoke one by name with a slash.", "Liste les skills depuis une session, ou appelle-en un par son nom avec une barre oblique."),
      ideas: ["claude", "/skills", "/changelog", "/exit", "tree"],
    },
    { kind: "celebrate" },
  ],
};

export const writeSkill: LessonDef = {
  id: "write-skill",
  chapterId: "skills",
  title: L("Forge your own skill", "Forge ton propre skill"),
  tagline: L("Write it once, use it in every agent", "Écris-le une fois, utilise-le dans chaque agent"),
  xp: 200,
  boss: true,
  concepts: [L("frontmatter", "en-tête (frontmatter)"), L("trigger description", "description déclencheuse"), L("portable skills", "skills portables")],
  commands: [".claude/skills/", ".agents/skills/", "cp"],
  ui: UI,
  setup: () => shop(),
  recap: [
    L("The description is the trigger: say what the skill does AND when to use it (“Use when…”).", "La description, c'est le déclencheur : dis ce que fait le skill ET quand l'utiliser (« Use when… »)."),
    L("The name is lowercase-with-hyphens and matches the folder.", "Le nom s'écrit en-minuscules-avec-tirets et correspond au dossier."),
    L("Skills are portable: copy the folder to .agents/skills/ and Codex and Antigravity can use it too.", "Les skills sont portables : copie le dossier dans .agents/skills/ et Codex et Antigravity peuvent l'utiliser aussi."),
  ],
  steps: [
    {
      kind: "try",
      title: L("Create the skill file", "Crée le fichier du skill"),
      body: L("You'll write a docs skill that teaches agents how your team documents projects. Start with a skeleton (button) — or create .claude/skills/docs/SKILL.md yourself.", "Tu vas écrire un skill docs qui apprend aux agents comment ton équipe documente ses projets. Commence par un squelette (bouton) — ou crée toi-même .claude/skills/docs/SKILL.md."),
      action: { label: L("Create .claude/skills/docs/SKILL.md", "Créer .claude/skills/docs/SKILL.md"), kind: "create-file", path: ".claude/skills/docs/SKILL.md", content: SKILL_SKELETON },
      check: (w) => Object.keys(w.files).some((p) => /^\.claude\/skills\/[^/]+\/SKILL\.md$/.test(p)),
      success: L("The file exists, but the skill is broken: run /skills in a session or look at the guide to see why.", "Le fichier existe, mais le skill est cassé : lance /skills dans une session ou regarde le guide pour savoir pourquoi."),
    },
    {
      kind: "challenge",
      title: L("Boss: a skill every agent can use", "Boss : un skill utilisable par tous les agents"),
      body: L("Finish the skill so that a short request like “Update the README” makes Claude Code add a “Getting started” section to the README — then make Codex use the very same skill.", "Termine le skill pour qu'une demande courte comme « Update the README » fasse ajouter une section « Getting started » au README par Claude Code — puis fais utiliser exactement le même skill par Codex."),
      objectives: [
        {
          id: "valid",
          label: L("A valid skill in .claude/skills/ (name, “Use when…” description, steps)", "Un skill valide dans .claude/skills/ (nom, description « Use when… », étapes)"),
          check: (w) => c.validSkills(w, "claude").length > 0,
          hints: [
            L("Open SKILL.md in the editor. The guide below lists what's missing.", "Ouvre SKILL.md dans l'éditeur. Le guide ci-dessous liste ce qui manque."),
            L("Replace TODO with what the skill does and when to use it, then add a numbered list of steps.", "Remplace TODO par ce que fait le skill et quand l'utiliser, puis ajoute une liste numérotée d'étapes."),
            L("Paste this into SKILL.md:\n" + README_SKILL, "Colle ceci dans SKILL.md :\n" + README_SKILL),
          ],
        },
        {
          id: "claude",
          label: L("Claude Code uses it for a short request (≤ 6 words, without naming the skill)", "Claude Code l'utilise pour une demande courte (≤ 6 mots, sans nommer le skill)"),
          check: (w, s) => c.someRun(w, s, (r) => r.tool === "claude" && !!r.skill && r.task === "readme" && r.outcome === "done" && r.report.words <= 6 && !r.prompt.toLowerCase().includes(r.skill)),
          hints: [
            L("The agent matches your words with the skill's description.", "L'agent rapproche tes mots de la description du skill."),
            L("Make sure the description uses the words people would say: README, document, update, getting started.", "Assure-toi que la description emploie les mots qu'on dirait : README, document, update, getting started."),
            L('Type: claude -p "Update the README"', 'Tape : claude -p "Update the README"'),
          ],
        },
        {
          id: "codex",
          label: L("Codex uses the same skill from .agents/skills/", "Codex utilise le même skill depuis .agents/skills/"),
          check: (w, s) => c.validSkills(w, "codex").length > 0 && c.someRun(w, s, (r) => r.tool === "codex" && !!r.skill && r.task === "readme"),
          hints: [
            L("Codex looks for skills in .agents/skills/, not .claude/skills/.", "Codex cherche les skills dans .agents/skills/, pas dans .claude/skills/."),
            L("Copy SKILL.md into .agents/skills/<name>/ with cp, then ask Codex.", "Copie SKILL.md dans .agents/skills/<nom>/ avec cp, puis demande à Codex."),
            L('Type: cp .claude/skills/docs/SKILL.md .agents/skills/docs/SKILL.md — then: codex exec "Update the README"', 'Tape : cp .claude/skills/docs/SKILL.md .agents/skills/docs/SKILL.md — puis : codex exec "Update the README"'),
          ],
        },
      ],
      feedback: (w) => {
        const skill = Object.keys(w.files).find((p) => /^\.claude\/skills\/[^/]+\/SKILL\.md$/.test(p));
        if (!skill) return L("Create a SKILL.md inside .claude/skills/<name>/ first.", "Crée d'abord un SKILL.md dans .claude/skills/<nom>/.");
        const problems = c.validSkills(w, "claude").length ? [] : (listProblems(w, skill) ?? []);
        return problems[0] ?? null;
      },
    },
    { kind: "celebrate" },
  ],
};

function listProblems(w: World, path: string): Txt[] | null {
  const folder = path.split("/")[2];
  return checkSkill(folder, w.files[path] ?? "").map((p) => p.message);
}
