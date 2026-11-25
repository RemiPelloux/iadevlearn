import { directivesIn, tx as L, type AgentRun, type World } from "@/engine";
import { cursorRuleMode } from "@/engine/rules";
import * as c from "../checks";
import { AGENTS_MD, P_DISCOUNT, P_EURO, shop } from "../scenario";
import type { LessonDef, Solution, StoryDef } from "../types";

const UI = { files: true, editor: true, run: true, orca: false };

// ───────────────────────────────────────────── Folder rules

/** A root CLAUDE.md that imports AGENTS.md, plus a rule that only matters for code in src/. */
const ROOT_WITH_SRC = `@AGENTS.md

## Code in src/
- Write code comments in French: the team that owns src/ reads French.
`;
const SRC_RULES = `# Rules for src/

- Write code comments in French: the team that owns src/ reads French.
`;
const README_PROMPT = `claude -p 'Update @README.md: add a "Getting started" section with the install and test commands'`;
const ROOT_SHORT = 'echo "@AGENTS.md" > CLAUDE.md';

const rootClean = (w: World) => c.fileExists(w, "CLAUDE.md") && !directivesIn(w.files["CLAUDE.md"]).includes("lang:fr") && c.rulesLoaded(w, "claude").some((r) => r.path === "AGENTS.md");
const claudeInSrc = (r: AgentRun) => r.tool === "claude" && r.rules.includes("src/CLAUDE.md") && r.followed.includes("lang:fr");
const codexInSrc = (r: AgentRun) => r.tool === "codex" && r.rules.includes("src/AGENTS.md") && r.followed.includes("lang:fr");

export const folderRules: LessonDef = {
  id: "folder-rules",
  chapterId: "rules",
  title: L("Rules for one folder", "Des règles pour un seul dossier"),
  tagline: L("Load the right rules, only where they matter", "Charger les bonnes règles, seulement là où elles comptent"),
  xp: 120,
  concepts: [L("folder rules", "règles de dossier"), L("nested AGENTS.md", "AGENTS.md imbriqué"), L("short root file", "fichier racine court")],
  commands: ["src/CLAUDE.md", "src/AGENTS.md", "cp"],
  ui: UI,
  setup: () => shop({ "AGENTS.md": AGENTS_MD, "CLAUDE.md": ROOT_WITH_SRC }),
  recap: [
    L("The root rules file is loaded in every conversation, so every line in it costs tokens on every request. Keep it to what's true for the whole project.", "Le fichier de règles racine est chargé à chaque conversation : chaque ligne coûte des tokens à chaque demande. Garde-y ce qui est vrai pour tout le projet."),
    L("A rules file inside a folder (src/CLAUDE.md for Claude Code) loads only when the agent reads or edits files in that folder.", "Un fichier de règles dans un dossier (src/CLAUDE.md pour Claude Code) ne se charge que quand l'agent lit ou modifie des fichiers de ce dossier."),
    L("Codex, Cursor and other AGENTS.md tools do the same with a nested AGENTS.md: the file closest to the code applies.", "Codex, Cursor et les autres outils AGENTS.md font pareil avec un AGENTS.md imbriqué : le fichier le plus proche du code s'applique."),
  ],
  steps: [
    {
      kind: "discover",
      title: L("Every line, every time", "Chaque ligne, à chaque fois"),
      body: [
        L("As a project grows, each part gets its own habits: the shop code, the tests, the docs. Put them all in the root rules file and every request carries all of them, even the ones that don't apply.", "Quand un projet grandit, chaque partie a ses habitudes : le code de la boutique, les tests, la doc. Mets-les toutes dans le fichier racine et chaque demande les transporte toutes, même celles qui ne servent pas."),
        L("Rules files can also live in a folder. Press Next to see when they load.", "Les fichiers de règles peuvent aussi vivre dans un dossier. Appuie sur Suivant pour voir quand ils se chargent."),
      ],
      scene: "story:folder-rules",
    },
    {
      kind: "try",
      title: L("Read the root rules", "Lis les règles racine"),
      body: L("CLAUDE.md imports AGENTS.md (the team's shared rules) and adds one rule of its own. Read it.", "CLAUDE.md importe AGENTS.md (les règles communes de l'équipe) et ajoute une règle à lui. Lis-le."),
      command: "cat CLAUDE.md",
      check: (_w, _s, ran) => ran.includes("cat"),
      success: L("The French-comments rule is only about code in src/. Yet it sits in the root file, loaded for everything.", "La règle des commentaires en français ne concerne que le code de src/. Pourtant elle est dans le fichier racine, chargé pour tout."),
    },
    {
      kind: "try",
      title: L("A request far from src/", "Une demande loin de src/"),
      body: L("Ask for a README change. Then open the Run tab and look at the context.", "Demande une modification du README. Puis ouvre l'onglet Run et regarde le contexte."),
      command: README_PROMPT,
      check: (w, s) => c.someRun(w, s, (r) => r.tool === "claude" && r.task === "readme" && r.rules.includes("CLAUDE.md")),
      success: L("CLAUDE.md came along with its rule about French comments, for a README with no code at all. Small here, but in a real project those lines add up on every request.", "CLAUDE.md est venu avec sa règle sur les commentaires en français, pour un README sans une ligne de code. Peu de chose ici, mais dans un vrai projet ces lignes s'additionnent à chaque demande."),
    },
    {
      kind: "try",
      title: L("Give src/ its own rules", "Donne ses règles à src/"),
      body: L("Create src/CLAUDE.md with the rule for that folder (use the button, or the Files panel).", "Crée src/CLAUDE.md avec la règle de ce dossier (avec le bouton, ou le panneau Fichiers)."),
      action: { label: L("Create src/CLAUDE.md", "Créer src/CLAUDE.md"), kind: "create-file", path: "src/CLAUDE.md", content: SRC_RULES },
      check: (w) => c.fileExists(w, "src/CLAUDE.md"),
      success: L("Claude Code will read it only when it works on a file in src/. Now the rule is in two places: time to clean the root file.", "Claude Code ne le lira que quand il travaille sur un fichier de src/. Maintenant la règle est à deux endroits : il est temps de nettoyer le fichier racine."),
    },
    {
      kind: "challenge",
      title: L("Challenge: the right rules in the right place", "Défi : les bonnes règles au bon endroit"),
      body: L("Make the root CLAUDE.md project-wide only, prove Claude Code still writes French comments in src/, then give Codex the same folder rule.", "Ne garde dans le CLAUDE.md racine que ce qui vaut pour tout le projet, prouve que Claude Code écrit toujours des commentaires en français dans src/, puis donne la même règle de dossier à Codex."),
      objectives: [
        {
          id: "root",
          label: L("The root CLAUDE.md only imports the shared rules", "Le CLAUDE.md racine importe seulement les règles communes"),
          check: rootClean,
          hints: [
            L("The French rule now lives in src/CLAUDE.md. The root file doesn't need it.", "La règle du français vit maintenant dans src/CLAUDE.md. Le fichier racine n'en a plus besoin."),
            L("Open CLAUDE.md in the editor and delete the “## Code in src/” section. Keep the @AGENTS.md line.", "Ouvre CLAUDE.md dans l'éditeur et supprime la section « ## Code in src/ ». Garde la ligne @AGENTS.md."),
            L(`Type: ${ROOT_SHORT}`, `Tape : ${ROOT_SHORT}`),
          ],
        },
        {
          id: "claude",
          label: L("Claude Code loads src/CLAUDE.md and writes French comments", "Claude Code charge src/CLAUDE.md et écrit des commentaires en français"),
          check: (w, s) => c.someRun(w, s, claudeInSrc),
          hints: [
            L("A folder rule loads when the agent reads or edits a file in that folder.", "Une règle de dossier se charge quand l'agent lit ou modifie un fichier de ce dossier."),
            L("Ask for a change in a file under src/, pointing at it with @.", "Demande un changement dans un fichier de src/, en le montrant avec @."),
            L(`Type: claude -p "${P_DISCOUNT}"`, `Tape : claude -p "${P_DISCOUNT}"`),
          ],
        },
        {
          id: "codex",
          label: L("Codex follows the same rule from src/AGENTS.md", "Codex suit la même règle depuis src/AGENTS.md"),
          check: (w, s) => c.someRun(w, s, codexInSrc),
          hints: [
            L("Codex doesn't read CLAUDE.md files. Its folder file is AGENTS.md.", "Codex ne lit pas les fichiers CLAUDE.md. Son fichier de dossier, c'est AGENTS.md."),
            L("Copy src/CLAUDE.md to src/AGENTS.md, then ask Codex for a change in src/.", "Copie src/CLAUDE.md vers src/AGENTS.md, puis demande à Codex un changement dans src/."),
            L(`Type: cp src/CLAUDE.md src/AGENTS.md, then: codex exec "${P_EURO}"`, `Tape : cp src/CLAUDE.md src/AGENTS.md, puis : codex exec "${P_EURO}"`),
          ],
        },
      ],
      feedback: (w, s) => {
        if (!c.fileExists(w, "CLAUDE.md") || !c.rulesLoaded(w, "claude").some((r) => r.path === "AGENTS.md")) return L("Keep a root CLAUDE.md with the @AGENTS.md line: the shared rules still apply everywhere.", "Garde un CLAUDE.md racine avec la ligne @AGENTS.md : les règles communes s'appliquent toujours partout.");
        if (!rootClean(w)) return L("The root CLAUDE.md still asks for French comments, so that rule loads for every request. Remove it from the root file.", "Le CLAUDE.md racine demande encore des commentaires en français : cette règle se charge à chaque demande. Retire-la du fichier racine.");
        if (!c.fileExists(w, "src/CLAUDE.md")) return L("src/CLAUDE.md is missing: create it again with the French-comments rule.", "src/CLAUDE.md a disparu : recrée-le avec la règle des commentaires en français.");
        const r = c.lastRunOf(w, s);
        if (!r) return null;
        if (r.tool === "claude" && !claudeInSrc(r) && !r.rules.includes("src/CLAUDE.md")) return L("That request didn't touch src/, so src/CLAUDE.md stayed closed. Point at a file in src/ with @.", "Cette demande ne touchait pas src/, alors src/CLAUDE.md est resté fermé. Montre un fichier de src/ avec @.");
        if (r.tool === "codex" && !codexInSrc(r)) {
          if (!c.fileExists(w, "src/AGENTS.md")) return L("Codex looks for AGENTS.md, not CLAUDE.md. Create src/AGENTS.md.", "Codex cherche AGENTS.md, pas CLAUDE.md. Crée src/AGENTS.md.");
          return L("That request didn't touch src/, so src/AGENTS.md stayed closed. Point at a file in src/ with @.", "Cette demande ne touchait pas src/, alors src/AGENTS.md est resté fermé. Montre un fichier de src/ avec @.");
        }
        return null;
      },
    },
    { kind: "celebrate" },
  ],
};

// ───────────────────────────────────────────── Cursor rules

const TESTS_RULE = `---
globs: tests/**/*.test.ts
alwaysApply: false
---

- Use describe and it from vitest.
- One test file per module: tests/<module>.test.ts.
`;
const ALWAYS_CMD = "printf -- '---\\nalwaysApply: true\\n---\\n\\n- TypeScript, no any.\\n' > .cursor/rules/style.mdc";
const REQUESTED_CMD = "printf -- '---\\ndescription: Formatting prices in euros\\n---\\n\\n- Keep the function name formatPrice.\\n' > .cursor/rules/prices.mdc";
const MANUAL_CMD = "printf -- '---\\ndescription:\\nglobs:\\nalwaysApply: false\\n---\\n\\n- Write code comments in French.\\n' > .cursor/rules/french.mdc";
const TOTAL_CURSOR = 'cursor-agent -p "Fix the total bug in @src/cart.ts"';
const REVIEW_CURSOR = 'cursor-agent -p "Review @src/cart.ts for bugs"';
const EURO_CURSOR = `cursor-agent -p "${P_EURO}"`;
const MANUAL_CURSOR = `cursor-agent -p "${P_DISCOUNT} Follow @french"`;

type Mode = "always" | "globs" | "requested" | "manual";
/** How a .cursor/rules file applies, from its frontmatter. */
const modeOf = (w: World, path: string): Mode | null => (/^\.cursor\/rules\/[^/]+\.mdc$/.test(path) && w.files[path] !== undefined ? cursorRuleMode(w.files[path]).mode : null);
const cursorUsed = (w: World, s: World, mode: Mode) => c.someRun(w, s, (r) => r.tool === "cursor" && r.rules.some((p) => modeOf(w, p) === mode));
const rulesOfMode = (w: World, mode: Mode) => Object.keys(w.files).filter((p) => modeOf(w, p) === mode);

export const cursorRules: LessonDef = {
  id: "cursor-rules",
  chapterId: "rules",
  title: L("Cursor's project rules", "Les règles de projet de Cursor"),
  tagline: L("Always, by file, by topic, or by hand", "Toujours, par fichier, par sujet, ou à la main"),
  xp: 140,
  concepts: [L(".cursor/rules", ".cursor/rules"), L("rule frontmatter", "en-tête de règle"), L("@rule mentions", "mentions @règle")],
  commands: ["cursor-agent -p", ".cursor/rules/*.mdc", "printf"],
  ui: UI,
  setup: () => shop({ "AGENTS.md": AGENTS_MD }),
  recap: [
    L("Cursor reads AGENTS.md like Codex does. For finer control it has project rules: .mdc files in .cursor/rules/, Markdown with a small frontmatter.", "Cursor lit AGENTS.md comme Codex. Pour un contrôle plus fin, il a des règles de projet : des fichiers .mdc dans .cursor/rules/, du Markdown avec un petit en-tête."),
    L("The frontmatter decides when a rule applies: alwaysApply: true (every request), globs (when matching files are involved), a description (when the request is about that topic), or none of these (only when you write @rule-name).", "L'en-tête décide quand une règle s'applique : alwaysApply: true (chaque demande), globs (quand des fichiers correspondants sont en jeu), une description (quand la demande porte sur ce sujet), ou rien de tout ça (seulement quand tu écris @nom-de-la-règle)."),
    L("Only “always” rules cost tokens on every request. The other three keep the context small until they're needed.", "Seules les règles « toujours » coûtent des tokens à chaque demande. Les trois autres gardent le contexte léger jusqu'à ce qu'on en ait besoin."),
  ],
  steps: [
    {
      kind: "discover",
      title: L("Four ways to apply a rule", "Quatre façons d'appliquer une règle"),
      body: [
        L("Cursor's agent (cursor-agent in the terminal) reads AGENTS.md, so your shared rules already work there.", "L'agent de Cursor (cursor-agent dans le terminal) lit AGENTS.md : tes règles communes marchent déjà."),
        L("It also reads project rules from .cursor/rules/. Each one says, in its frontmatter, when it should load. Press Next to meet the four kinds.", "Il lit aussi des règles de projet dans .cursor/rules/. Chacune dit, dans son en-tête, quand elle doit se charger. Appuie sur Suivant pour découvrir les quatre types."),
      ],
      scene: "story:cursor-rules",
    },
    {
      kind: "try",
      title: L("Cursor reads AGENTS.md", "Cursor lit AGENTS.md"),
      body: L("cursor-agent -p runs Cursor's agent once, without the interactive UI. Send a short request that doesn't mention tests.", "cursor-agent -p lance l'agent de Cursor une fois, sans l'interface interactive. Envoie une demande courte qui ne parle pas de tests."),
      command: TOTAL_CURSOR,
      check: (w, s) => c.someRun(w, s, (r) => r.tool === "cursor" && r.rules.includes("AGENTS.md") && c.ranTests(r, "pnpm")),
      success: L("pnpm test ran on its own: Cursor followed AGENTS.md. No extra file needed for shared rules.", "pnpm test s'est lancé tout seul : Cursor a suivi AGENTS.md. Aucun fichier en plus pour les règles communes."),
    },
    {
      kind: "try",
      title: L("A rule for test files", "Une règle pour les fichiers de test"),
      body: L("Some rules only matter for certain files. Create a rule with globs: it attaches itself when the agent touches a matching file.", "Certaines règles ne comptent que pour certains fichiers. Crée une règle avec globs : elle s'ajoute toute seule quand l'agent touche un fichier correspondant."),
      action: { label: L("Create .cursor/rules/tests.mdc", "Créer .cursor/rules/tests.mdc"), kind: "create-file", path: ".cursor/rules/tests.mdc", content: TESTS_RULE },
      check: (w) => c.fileExists(w, ".cursor/rules/tests.mdc"),
      success: L("globs: tests/**/*.test.ts means any .test.ts file in tests/, at any depth. The fix you just asked for only touched src/, so this rule would have stayed out.", "globs: tests/**/*.test.ts veut dire n'importe quel fichier .test.ts dans tests/, à n'importe quelle profondeur. La correction que tu viens de demander ne touchait que src/ : cette règle serait restée dehors."),
    },
    {
      kind: "try",
      title: L("Touch a test file", "Touche un fichier de test"),
      body: L("Now ask for tests, pointing at the existing test file for the style.", "Maintenant demande des tests, en montrant le fichier de test existant pour le style."),
      command: 'cursor-agent -p "Add tests for formatPrice, in the style of @tests/cart.test.ts"',
      check: (w, s) => c.someRun(w, s, (r) => r.tool === "cursor" && r.rules.includes(".cursor/rules/tests.mdc")),
      success: L("“rules: .cursor/rules/tests.mdc (matches the files)”: the agent read a test file, so the test rule joined the context.", "« rules: .cursor/rules/tests.mdc (correspond aux fichiers) » : l'agent a lu un fichier de test, donc la règle des tests a rejoint le contexte."),
    },
    {
      kind: "challenge",
      title: L("Challenge: the three other kinds", "Défi : les trois autres types"),
      body: L("Create one rule of each remaining kind in .cursor/rules/ (in the Files panel, or with the commands in the hints), and get cursor-agent to load each one.", "Crée une règle de chaque type restant dans .cursor/rules/ (dans le panneau Fichiers, ou avec les commandes des indices), et fais charger chacune par cursor-agent."),
      objectives: [
        {
          id: "always",
          label: L("An “always” rule loads with any request", "Une règle « toujours » se charge avec n'importe quelle demande"),
          check: (w, s) => cursorUsed(w, s, "always"),
          hints: [
            L("alwaysApply: true puts a rule in every request, like AGENTS.md.", "alwaysApply: true met une règle dans chaque demande, comme AGENTS.md."),
            L("Create .cursor/rules/style.mdc whose frontmatter is alwaysApply: true, then send any request with cursor-agent.", "Crée .cursor/rules/style.mdc avec alwaysApply: true dans l'en-tête, puis envoie n'importe quelle demande avec cursor-agent."),
            L(`Type: ${ALWAYS_CMD}, then: ${REVIEW_CURSOR}`, `Tape : ${ALWAYS_CMD}, puis : ${REVIEW_CURSOR}`),
          ],
        },
        {
          id: "requested",
          label: L("A rule with only a description loads when the request is about its topic", "Une règle avec seulement une description se charge quand la demande porte sur son sujet"),
          check: (w, s) => cursorUsed(w, s, "requested"),
          hints: [
            L("With a description and no globs, the agent decides from the description whether the rule is relevant.", "Avec une description et sans globs, l'agent décide d'après la description si la règle est utile."),
            L("Write a description about prices in euros, then ask for euro prices.", "Écris une description sur les prix en euros, puis demande des prix en euros."),
            L(`Type: ${REQUESTED_CMD}, then: ${EURO_CURSOR}`, `Tape : ${REQUESTED_CMD}, puis : ${EURO_CURSOR}`),
          ],
        },
        {
          id: "manual",
          label: L("A manual rule loads when you name it with @", "Une règle manuelle se charge quand tu la cites avec @"),
          check: (w, s) => cursorUsed(w, s, "manual"),
          hints: [
            L("No alwaysApply, no globs, no description: the rule waits until you ask for it.", "Ni alwaysApply, ni globs, ni description : la règle attend que tu la demandes."),
            L("Create .cursor/rules/french.mdc with an empty frontmatter, then write @french in your request.", "Crée .cursor/rules/french.mdc avec un en-tête vide, puis écris @french dans ta demande."),
            L(`Type: ${MANUAL_CMD}, then: ${MANUAL_CURSOR}`, `Tape : ${MANUAL_CMD}, puis : ${MANUAL_CURSOR}`),
          ],
        },
      ],
      feedback: (w, s) => {
        const r = c.lastRunOf(w, s);
        if (r && r.tool !== "cursor") return L("Only Cursor reads .cursor/rules/. Send the request with cursor-agent -p \"…\".", "Seul Cursor lit .cursor/rules/. Envoie la demande avec cursor-agent -p \"…\".");
        const requested = rulesOfMode(w, "requested");
        if (requested.length && !cursorUsed(w, s, "requested")) return L(`Your request must share words with the description in ${requested[0]}, or the agent leaves the rule out.`, `Ta demande doit partager des mots avec la description de ${requested[0]}, sinon l'agent laisse la règle de côté.`);
        const manual = rulesOfMode(w, "manual");
        if (manual.length && !cursorUsed(w, s, "manual")) {
          const name = manual[0].split("/").pop()!.replace(/\.mdc$/, "");
          return L(`A manual rule only loads when the request names it: add @${name}.`, `Une règle manuelle ne se charge que si la demande la cite : ajoute @${name}.`);
        }
        return null;
      },
    },
    {
      kind: "experiment",
      title: L("Explore", "Explore"),
      body: L("Open an interactive Cursor session, or compare with the editor command.", "Ouvre une session Cursor interactive, ou compare avec la commande de l'éditeur."),
      ideas: ["cursor-agent", "/exit", "cursor", "ls .cursor/rules"],
    },
    { kind: "celebrate" },
  ],
};

export const lessons: LessonDef[] = [folderRules, cursorRules];

export const solutions: Record<string, Solution> = {
  "folder-rules": [ROOT_SHORT, `claude -p "${P_DISCOUNT}"`, "cp src/CLAUDE.md src/AGENTS.md", `codex exec "${P_EURO}"`],
  "cursor-rules": [ALWAYS_CMD, REVIEW_CURSOR, REQUESTED_CMD, EURO_CURSOR, MANUAL_CMD, MANUAL_CURSOR],
};

export const stories: Record<string, StoryDef> = {
  "folder-rules": {
    intro: L("Two rules files: one at the root of the project, one inside src/. Watch when each one loads.", "Deux fichiers de règles : un à la racine du projet, un dans src/. Regarde quand chacun se charge."),
    steps: [
      {
        name: L("The root file", "Le fichier racine"),
        line: "CLAUDE.md          loaded in every conversation",
        note: L("Commands, conventions, no-go zones: what's true everywhere. Every line is paid for on every request.", "Commandes, conventions, zones interdites : ce qui est vrai partout. Chaque ligne se paie à chaque demande."),
        tone: "muted",
      },
      {
        name: L("A folder file", "Un fichier de dossier"),
        line: "src/CLAUDE.md      loaded when the agent works in src/",
        note: L("Habits for that folder only. Until the agent opens a file in src/, it costs nothing.", "Les habitudes de ce dossier seulement. Tant que l'agent n'ouvre pas de fichier dans src/, il ne coûte rien."),
        tone: "tool",
      },
      {
        name: L("A README change", "Une modification du README"),
        line: "● Update(README.md)",
        note: L("Nothing in src/ is touched, so src/CLAUDE.md stays closed.", "Rien n'est touché dans src/ : src/CLAUDE.md reste fermé."),
        tone: "tool",
      },
      {
        name: L("A change in src/", "Un changement dans src/"),
        line: "● Read(src/cart.ts)",
        note: L("The agent opens a file in src/...", "L'agent ouvre un fichier de src/..."),
        tone: "tool",
      },
      {
        name: L("The folder rule joins in", "La règle du dossier arrive"),
        line: "  ⎿  rules: src/CLAUDE.md (applies to this folder)",
        note: L("...and the folder's rules load with it. Right rules, right moment.", "...et les règles du dossier se chargent avec lui. Les bonnes règles, au bon moment."),
        tone: "ok",
      },
      {
        name: L("Same idea elsewhere", "Même idée ailleurs"),
        line: "src/AGENTS.md",
        note: L("Codex, Cursor and other AGENTS.md tools use a nested AGENTS.md: the closest file to the code wins. Gemini CLI also finds GEMINI.md files in subfolders.", "Codex, Cursor et les autres outils AGENTS.md utilisent un AGENTS.md imbriqué : le fichier le plus proche du code l'emporte. Gemini CLI trouve aussi les GEMINI.md des sous-dossiers."),
        tone: "muted",
      },
    ],
  },
  "cursor-rules": {
    intro: L("Four rules in .cursor/rules/. Same format, a different frontmatter, a different moment to load.", "Quatre règles dans .cursor/rules/. Même format, un en-tête différent, un moment différent pour se charger."),
    steps: [
      {
        name: L("Always", "Toujours"),
        line: "alwaysApply: true",
        note: L("Loaded in every request, like AGENTS.md. Keep these few and short.", "Chargée à chaque demande, comme AGENTS.md. Garde-les rares et courtes."),
        tone: "warn",
      },
      {
        name: L("By file", "Par fichier"),
        line: "globs: tests/**/*.test.ts",
        note: L("Attached when the agent works on a matching file. Perfect for “how we write tests”.", "Ajoutée quand l'agent travaille sur un fichier correspondant. Parfait pour « comment on écrit les tests »."),
        tone: "tool",
      },
      {
        name: L("By topic", "Par sujet"),
        line: "description: Formatting prices in euros",
        note: L("No globs: the agent reads the description and pulls the rule in when your request is about that.", "Pas de globs : l'agent lit la description et ajoute la règle quand ta demande en parle."),
        tone: "agent",
      },
      {
        name: L("By hand", "À la main"),
        line: "→ Add applyDiscount(totalCents, percent) to @src/cart.ts … Follow @french",
        note: L("Nothing in the frontmatter: the rule loads only when you mention it with @.", "Rien dans l'en-tête : la règle ne se charge que quand tu la cites avec @."),
        tone: "muted",
      },
      {
        name: L("What the agent says", "Ce que dit l'agent"),
        line: "  └ rules: .cursor/rules/french.mdc (mentioned with @)",
        note: L("Each run tells you which rules joined and why. Check it when a rule seems ignored.", "Chaque exécution te dit quelles règles se sont ajoutées et pourquoi. Regarde-le quand une règle semble ignorée."),
        tone: "ok",
      },
    ],
  },
};
