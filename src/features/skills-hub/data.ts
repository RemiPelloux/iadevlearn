import { CATALOG, GROUP_SETUP } from "./catalog";
import { ORIGINAL_SKILLS } from "./originals";
import { PELLOUX_SKILL } from "./pelloux";
import type { HubSkill, SkillCategory, SkillGroup } from "./types";

const ORIGINAL_META: Record<string, { category: SkillCategory; en: string; fr: string }> = {
  "commit-message": { category: "git", en: "Writes a Conventional Commits message from the staged diff and asks before committing.", fr: "Écrit un message Conventional Commits à partir du diff indexé et demande avant de commiter." },
  "code-review": { category: "testing", en: "Reviews a diff for bugs, security, missing tests and conventions, then gives a verdict.", fr: "Relit un diff : bugs, sécurité, tests manquants et conventions, puis donne un verdict." },
  "write-tests": { category: "testing", en: "Adds focused unit tests in the project's existing style and runs them.", fr: "Ajoute des tests unitaires ciblés dans le style du projet et les lance." },
  "pr-description": { category: "git", en: "Writes a pull request title and description: why, what, how to test, risks.", fr: "Écrit le titre et la description d'une pull request : pourquoi, quoi, comment tester, risques." },
  "bug-repro": { category: "debugging", en: "Reproduces a bug with a failing test before fixing it, then proves the fix.", fr: "Reproduit un bug avec un test qui échoue avant de le corriger, puis prouve la correction." },
  changelog: { category: "writing", en: "Adds an Unreleased section to CHANGELOG.md, grouped by Added, Fixed and Changed.", fr: "Ajoute une section Unreleased à CHANGELOG.md, groupée en Added, Fixed et Changed." },
  docs: { category: "writing", en: "Keeps the README's getting-started commands complete and working.", fr: "Garde les commandes de démarrage du README complètes et à jour." },
};

const originals: HubSkill[] = Object.entries(ORIGINAL_SKILLS).map(([name, content]) => ({
  name,
  source: "IA Dev Learn",
  group: "originals",
  category: ORIGINAL_META[name].category,
  description: { en: ORIGINAL_META[name].en, fr: ORIGINAL_META[name].fr },
  license: "MIT",
  content,
  install: [],
  singleFile: true,
}));

const KMI = "RemiPelloux/kill-my-idea";
const KMI_INSTALL = ["/plugin marketplace add RemiPelloux/kill-my-idea", "/plugin install kill-my-idea@kill-my-idea"];
const kmi = (name: string, en: string, fr: string, category: SkillCategory = "business"): HubSkill => ({
  name,
  source: KMI,
  group: "pelloux",
  category,
  description: { en, fr },
  license: "MIT",
  url: `https://github.com/${KMI}/tree/main/skills/${name}`,
  raw: `https://raw.githubusercontent.com/${KMI}/main/skills/${name}/SKILL.md`,
  install: KMI_INSTALL,
  installNote: { en: "In Claude Code. One plugin installs all ten kill-my-idea skills, with their schemas and report templates.", fr: "Dans Claude Code. Un seul plugin installe les dix skills kill-my-idea, avec leurs schémas et modèles de rapport." },
  singleFile: false,
});

const pelloux: HubSkill[] = [
  {
    name: "pelloux-guidelines",
    source: KMI,
    group: "pelloux",
    category: "ai-dev",
    description: {
      en: "Remi Pelloux's coding discipline: simplest fix first, surgical changes, size limits, Conventional Commits, make, test, document.",
      fr: "La discipline de code de Remi Pelloux : la correction la plus simple d'abord, des changements chirurgicaux, des limites de taille, Conventional Commits, faire, tester, documenter.",
    },
    license: "MIT",
    url: `https://github.com/${KMI}/blob/main/skills/build/pelloux-guidelines.md`,
    content: PELLOUX_SKILL,
    install: [],
    singleFile: true,
  },
  kmi("kill", "Tries to kill a business idea with sourced research, then scores it out of 100 with a GO, PIVOT or NO-GO verdict.", "Essaie de tuer une idée de business avec des recherches sourcées, puis la note sur 100 avec un verdict GO, PIVOT ou NO-GO."),
  kmi("roast", "A funny, savage roast of a startup idea where every burn is backed by a sourced fact.", "Un roast drôle et sans pitié d'une idée de startup, où chaque pique s'appuie sur un fait sourcé."),
  kmi("deepdive", "Deep due diligence with parallel research tracks: market size, competitors, customer voice, pricing, regulation.", "Une due diligence approfondie en pistes de recherche parallèles : marché, concurrents, voix des clients, prix, réglementation."),
  kmi("fix", "Finds the smallest set of changes that would take an idea to GO, or says honestly that it can't.", "Trouve le plus petit ensemble de changements qui ferait passer une idée à GO, ou dit franchement que c'est impossible."),
  kmi("validate", "Turns the 7-day test into a kit (landing page, interview script, outreach) and re-scores from real results.", "Transforme le test de 7 jours en kit (page d'atterrissage, script d'entretien, prospection) et re-note à partir des vrais résultats."),
  kmi("build", "Writes a starter kit for a validated idea: README, PRD, architecture, user stories, sprints, business plan.", "Écrit un kit de démarrage pour une idée validée : README, PRD, architecture, user stories, sprints, business plan.", "planning"),
  kmi("compare", "Ranks every evaluated idea and recommends the one to focus on this week, with a dashboard.", "Classe toutes les idées évaluées et recommande celle sur laquelle se concentrer cette semaine, avec un tableau de bord."),
  kmi("check-tweet", "Fact-checks a viral make-money post: every claim, the maths, and what the author is selling.", "Vérifie un post viral pour gagner de l'argent : chaque affirmation, les calculs, et ce que l'auteur vend."),
  kmi("share", "Turns a verdict into a card image and post drafts written for Reddit, X, LinkedIn or Hacker News.", "Transforme un verdict en image de carte et en brouillons de posts écrits pour Reddit, X, LinkedIn ou Hacker News.", "writing"),
  kmi("nuke", "Runs every kill-my-idea step on one idea in a single command and ties it together in NUKE.md.", "Lance toutes les étapes kill-my-idea sur une idée en une commande et rassemble tout dans NUKE.md."),
];

export const HUB_SKILLS: HubSkill[] = [...originals, ...pelloux, ...CATALOG];

export const SKILL_GROUPS: Array<{ id: SkillGroup; title: { en: string; fr: string }; blurb: { en: string; fr: string }; setup?: string[] }> = [
  {
    id: "originals",
    title: { en: "Ready to paste", fr: "Prêts à coller" },
    blurb: {
      en: "Written for this course and free to copy. Each row has a one-line command that creates the skill folder and its SKILL.md in your project.",
      fr: "Écrits pour ce cours et libres de copie. Chaque ligne a une commande qui crée le dossier du skill et son SKILL.md dans ton projet.",
    },
  },
  {
    id: "pelloux",
    title: { en: "Remi Pelloux: guidelines and kill-my-idea", fr: "Remi Pelloux : guidelines et kill-my-idea" },
    blurb: {
      en: "The Pelloux coding guidelines as a standalone skill, and the ten kill-my-idea skills that test a business idea against real evidence.",
      fr: "Les règles de code Pelloux en skill autonome, et les dix skills kill-my-idea qui confrontent une idée de business à des preuves réelles.",
    },
    setup: KMI_INSTALL,
  },
  {
    id: "anthropic",
    title: { en: "Anthropic's official skills", fr: "Les skills officiels d'Anthropic" },
    blurb: GROUP_SETUP.anthropic.blurb,
    setup: GROUP_SETUP.anthropic.setup,
  },
  {
    id: "community",
    title: { en: "Community skills", fr: "Skills de la communauté" },
    blurb: GROUP_SETUP.community.blurb,
    setup: GROUP_SETUP.community.setup,
  },
];
