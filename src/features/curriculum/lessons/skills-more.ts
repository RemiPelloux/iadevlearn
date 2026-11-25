import { tx as L, type AgentRun, type World } from "@/engine";
import * as c from "../checks";
import { AGENTS_MD, CHANGELOG_SKILL, shop } from "../scenario";
import type { LessonDef, Solution, StoryDef } from "../types";

const UI = { files: true, editor: true, run: true, orca: false };

const MONEY_SKILL = `---
name: money
description: Format prices and currencies. Use when the user asks about euros, currencies or price formats.
---

1. Read reference.md for the format of each currency.
2. Keep the function name formatPrice; never rename it.
3. Add a test, then run scripts/check.sh.
`;
const MONEY_REFERENCE = `# Price formats

| Currency | Example    | Notes                              |
| -------- | ---------- | ---------------------------------- |
| EUR      | "12,50 €"  | comma for decimals, space before € |
| USD      | "$12.50"   | dot for decimals, $ first          |
| GBP      | "£12.50"   | dot for decimals, £ first          |

Prices are stored as integers in cents: 1250 means 12.50.
`;
const MONEY_CHECK = `#!/bin/sh
# Fails if a file formats a price by hand instead of calling formatPrice.
grep -rn "toFixed(2)" src --include=*.ts | grep -v "src/price.ts" && exit 1
echo "✓ every price goes through formatPrice"
`;

const DIR = ".claude/skills/changelog/";
const REF_CMD = `echo "Good: Count item quantities in total(). Bad: fixed stuff. Each entry starts with a verb and names what changed." > ${DIR}reference.md`;
const SCRIPT_CMD = `echo 'echo "✓ CHANGELOG.md starts with ## [Unreleased]"' > ${DIR}scripts/check.sh`;
const POINT_CMD = `echo "5. Follow the examples in reference.md, then run scripts/check.sh." >> ${DIR}SKILL.md`;
const RUN_CMD = 'claude -p "Update the changelog"';
const MAX_LINES = 15;

const changelogRun = (r: AgentRun) => r.tool === "claude" && r.skill === "changelog";
const loadedDoc = (r: AgentRun) => changelogRun(r) && r.context.some((x) => x.kind === "skill" && x.label.startsWith(DIR) && x.label.endsWith("(on demand)"));
const ranScript = (r: AgentRun) => changelogRun(r) && r.commands.some((cmd) => cmd.includes(`${DIR}scripts/`));
const skillLines = (w: World) => (w.files[`${DIR}SKILL.md`] ?? "").trimEnd().split("\n").length;
const shortAndValid = (w: World) => c.validSkills(w, "claude").some((s) => s.name === "changelog") && skillLines(w) <= MAX_LINES;

export const skillResources: LessonDef = {
  id: "skill-resources",
  chapterId: "skills",
  title: L("Skills with files and scripts", "Des skills avec fichiers et scripts"),
  tagline: L("A short SKILL.md that knows where to look", "Un SKILL.md court qui sait où chercher"),
  xp: 140,
  concepts: [L("reference files", "fichiers de référence"), L("skill scripts", "scripts de skill"), L("loaded on demand", "chargé à la demande")],
  commands: ["reference.md", "scripts/check.sh", "ls"],
  ui: UI,
  setup: () =>
    shop({
      "AGENTS.md": AGENTS_MD,
      "CLAUDE.md": "@AGENTS.md\n",
      ".claude/skills/money/SKILL.md": MONEY_SKILL,
      ".claude/skills/money/reference.md": MONEY_REFERENCE,
      ".claude/skills/money/scripts/check.sh": MONEY_CHECK,
      ".claude/skills/changelog/SKILL.md": CHANGELOG_SKILL,
    }),
  recap: [
    L("A skill is a folder. SKILL.md holds the steps; long details go in files next to it (like reference.md) that SKILL.md names.", "Un skill est un dossier. SKILL.md contient les étapes ; les longs détails vont dans des fichiers à côté (comme reference.md) que SKILL.md cite."),
    L("Reference files are read only when the skill runs and needs them, so they cost nothing the rest of the time.", "Les fichiers de référence ne sont lus que quand le skill tourne et en a besoin : le reste du temps, ils ne coûtent rien."),
    L("Scripts in scripts/ are run, not read: only what they print enters the context. Use them for checks that must be done the same way every time.", "Les scripts de scripts/ sont lancés, pas lus : seul ce qu'ils affichent entre dans le contexte. Utilise-les pour les vérifications à faire toujours de la même façon."),
  ],
  steps: [
    {
      kind: "discover",
      title: L("Three layers, three moments", "Trois couches, trois moments"),
      body: [
        L("A skill loads in layers. At startup the agent only knows its name and description. When your request matches, it reads SKILL.md. And SKILL.md can point further: to a reference file it opens only if needed, or a script it runs without reading.", "Un skill se charge par couches. Au démarrage, l'agent ne connaît que son nom et sa description. Quand ta demande correspond, il lit SKILL.md. Et SKILL.md peut renvoyer plus loin : vers un fichier de référence qu'il n'ouvre que si besoin, ou un script qu'il lance sans le lire."),
        L("Press Next to follow one request through the money skill.", "Appuie sur Suivant pour suivre une demande à travers le skill money."),
      ],
      scene: "story:skill-resources",
    },
    {
      kind: "try",
      title: L("Look inside a skill", "Regarde dans un skill"),
      body: L("This project has two skills, money and changelog. List what's in the money skill's folder.", "Ce projet a deux skills, money et changelog. Liste ce qu'il y a dans le dossier du skill money."),
      command: "ls .claude/skills/money",
      check: (_w, _s, ran) => ran.includes("ls"),
      success: L("SKILL.md, plus reference.md and a scripts/ folder (with check.sh inside). The changelog skill only has its SKILL.md, for now.", "SKILL.md, plus reference.md et un dossier scripts/ (avec check.sh dedans). Le skill changelog n'a que son SKILL.md, pour l'instant."),
    },
    {
      kind: "try",
      title: L("Read the short part", "Lis la partie courte"),
      body: L("Read the money skill's SKILL.md. Notice it doesn't contain the formats: it says where to find them.", "Lis le SKILL.md du skill money. Remarque qu'il ne contient pas les formats : il dit où les trouver."),
      command: "cat .claude/skills/money/SKILL.md",
      check: (_w, _s, ran) => ran.includes("cat"),
      success: L("Three steps. The table of formats is in reference.md, the check is in scripts/check.sh. SKILL.md just names them.", "Trois étapes. Le tableau des formats est dans reference.md, la vérification dans scripts/check.sh. SKILL.md se contente de les citer."),
    },
    {
      kind: "try",
      title: L("Use it", "Utilise-le"),
      body: L("A short request about euros. Watch the order: the skill, then reference.md, then the script.", "Une demande courte sur les euros. Regarde l'ordre : le skill, puis reference.md, puis le script."),
      command: 'claude -p "Show prices in euros"',
      check: (w, s) => c.someRun(w, s, (r) => r.skill === "money" && r.context.some((x) => x.label.includes("money/reference.md")) && r.commands.some((cmd) => cmd.includes("money/scripts/check.sh"))),
      success: L("reference.md was loaded only now, because the skill needed it. The script ran, and only its one-line result entered the context, not its code. Check both in the Run tab.", "reference.md n'a été chargé que maintenant, parce que le skill en avait besoin. Le script a tourné, et seule sa ligne de résultat est entrée dans le contexte, pas son code. Vérifie les deux dans l'onglet Run."),
    },
    {
      kind: "challenge",
      title: L("Challenge: give the changelog skill some backup", "Défi : renforce le skill changelog"),
      body: L("Add a reference file and a check script to the changelog skill, name them in its SKILL.md, then use the skill. Keep SKILL.md short: details belong in reference.md.", "Ajoute un fichier de référence et un script de vérification au skill changelog, cite-les dans son SKILL.md, puis utilise le skill. Garde SKILL.md court : les détails vont dans reference.md."),
      objectives: [
        {
          id: "reference",
          label: L("The changelog skill reads a reference file on demand", "Le skill changelog lit un fichier de référence à la demande"),
          check: (w, s) => c.someRun(w, s, loadedDoc),
          hints: [
            L("A file next to SKILL.md is only read if SKILL.md names it.", "Un fichier à côté de SKILL.md n'est lu que si SKILL.md le cite."),
            L(`Create ${DIR}reference.md with examples, add a step to SKILL.md that mentions reference.md, then ask for a changelog update.`, `Crée ${DIR}reference.md avec des exemples, ajoute à SKILL.md une étape qui cite reference.md, puis demande une mise à jour du changelog.`),
            L(`Type: ${REF_CMD}, then: ${POINT_CMD}, then: ${RUN_CMD}`, `Tape : ${REF_CMD}, puis : ${POINT_CMD}, puis : ${RUN_CMD}`),
          ],
        },
        {
          id: "script",
          label: L("…and runs a script from its scripts/ folder", "…et lance un script de son dossier scripts/"),
          check: (w, s) => c.someRun(w, s, ranScript),
          hints: [
            L("A script does a check the same way every time. The agent runs it and only reads what it prints.", "Un script fait une vérification toujours de la même façon. L'agent le lance et ne lit que ce qu'il affiche."),
            L(`Create ${DIR}scripts/check.sh that echoes a result, and make sure SKILL.md mentions scripts/check.sh.`, `Crée ${DIR}scripts/check.sh qui affiche un résultat avec echo, et vérifie que SKILL.md cite scripts/check.sh.`),
            L(`Type: ${SCRIPT_CMD}, then: ${POINT_CMD}, then: ${RUN_CMD}`, `Tape : ${SCRIPT_CMD}, puis : ${POINT_CMD}, puis : ${RUN_CMD}`),
          ],
        },
        {
          id: "short",
          label: L(`SKILL.md stays valid and short (${MAX_LINES} lines or fewer)`, `SKILL.md reste valide et court (${MAX_LINES} lignes maximum)`),
          check: shortAndValid,
          hints: [
            L("SKILL.md is read in full every time the skill runs. Keep it to the steps.", "SKILL.md est lu en entier à chaque fois que le skill tourne. Garde-y les étapes."),
            L("Don't paste examples into SKILL.md: one line pointing at reference.md and scripts/check.sh is enough.", "Ne colle pas les exemples dans SKILL.md : une ligne qui renvoie vers reference.md et scripts/check.sh suffit."),
            L(`Add only this line: ${POINT_CMD}`, `Ajoute seulement cette ligne : ${POINT_CMD}`),
          ],
        },
      ],
      feedback: (w, s) => {
        const skill = w.files[`${DIR}SKILL.md`];
        if (skill === undefined) return L(`${DIR}SKILL.md is gone. The skill needs it.`, `${DIR}SKILL.md a disparu. Le skill en a besoin.`);
        if (!shortAndValid(w)) return skillLines(w) > MAX_LINES ? L(`SKILL.md has ${skillLines(w)} lines. Move the details into reference.md.`, `SKILL.md fait ${skillLines(w)} lignes. Déplace les détails dans reference.md.`) : L("SKILL.md is no longer a valid skill: check its frontmatter (name and description).", "SKILL.md n'est plus un skill valide : vérifie son en-tête (name et description).");
        const body = skill.replace(/^---[\s\S]*?\n---\s*\n?/, "");
        const extra = Object.keys(w.files).filter((p) => p.startsWith(DIR) && p !== `${DIR}SKILL.md`);
        const unnamed = extra.find((p) => !body.includes(p.slice(DIR.length)));
        if (unnamed) return L(`SKILL.md doesn't mention ${unnamed.slice(DIR.length)}, so the agent won't know it exists. Name it in a step.`, `SKILL.md ne cite pas ${unnamed.slice(DIR.length)} : l'agent ne saura pas qu'il existe. Cite-le dans une étape.`);
        if (c.someRun(w, s, loadedDoc) && c.someRun(w, s, ranScript)) return null;
        const r = c.lastRunOf(w, s);
        if (r && !changelogRun(r)) return L(`The changelog skill didn't run. Ask for a changelog update: ${RUN_CMD}`, `Le skill changelog n'a pas tourné. Demande une mise à jour du changelog : ${RUN_CMD}`);
        return null;
      },
    },
    {
      kind: "experiment",
      title: L("Explore", "Explore"),
      body: L("Read the reference and the script, or see the skills from inside a session.", "Lis la référence et le script, ou regarde les skills depuis une session."),
      ideas: ["cat .claude/skills/money/reference.md", "cat .claude/skills/money/scripts/check.sh", "claude", "/skills", "/exit"],
    },
    { kind: "celebrate" },
  ],
};

export const lessons: LessonDef[] = [skillResources];

export const solutions: Record<string, Solution> = {
  "skill-resources": [REF_CMD, SCRIPT_CMD, POINT_CMD, RUN_CMD],
};

export const stories: Record<string, StoryDef> = {
  "skill-resources": {
    prompt: L("Show prices in euros", "Show prices in euros"),
    intro: L("One short request, and the money skill opens up one layer at a time.", "Une demande courte, et le skill money s'ouvre une couche à la fois."),
    steps: [
      {
        name: L("At startup: the index", "Au démarrage : l'index"),
        line: "skills: money, changelog",
        note: L("Only names and descriptions are loaded. A few dozen tokens for both skills.", "Seuls les noms et descriptions sont chargés. Quelques dizaines de tokens pour les deux skills."),
        tone: "muted",
      },
      {
        name: L("The request matches", "La demande correspond"),
        line: "● Skill(money)",
        note: L("“euros” matches the description, so the agent reads SKILL.md: three short steps.", "« euros » correspond à la description : l'agent lit SKILL.md, trois étapes courtes."),
        tone: "tool",
      },
      {
        name: L("Details, on demand", "Les détails, à la demande"),
        line: "● Read(.claude/skills/money/reference.md)",
        note: L("Step 1 says to read reference.md, so the table of formats loads now, and only now.", "L'étape 1 dit de lire reference.md : le tableau des formats se charge maintenant, et seulement maintenant."),
        tone: "tool",
      },
      {
        name: L("Run, don't read", "Lancer, pas lire"),
        line: "● Bash(bash .claude/skills/money/scripts/check.sh)",
        note: L("The script's code never enters the context. The agent just runs it.", "Le code du script n'entre jamais dans le contexte. L'agent se contente de le lancer."),
        tone: "tool",
      },
      {
        name: L("Only the result", "Seulement le résultat"),
        line: "  ⎿  ✓ every price goes through formatPrice",
        note: L("One line of output, a handful of tokens. The same check, done the same way, every time.", "Une ligne de sortie, quelques tokens. La même vérification, faite de la même façon, à chaque fois."),
        tone: "ok",
      },
    ],
  },
};
