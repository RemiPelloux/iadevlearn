import { tx as L } from "@/engine";
import * as c from "../checks";
import { AGENTS_MD, BAD_RULES, P_TOTAL, shop } from "../scenario";
import type { LessonDef } from "../types";

const UI = { files: true, editor: true, run: true, orca: false };
const SHORT_TOTAL = "Fix the total bug in @src/cart.ts";

export const whatAreRules: LessonDef = {
  id: "what-are-rules",
  chapterId: "rules",
  title: L("What are rules?", "C'est quoi, les règles ?"),
  tagline: L("Tell your agent once, not every time", "Dis-le une fois à ton agent, pas à chaque fois"),
  xp: 110,
  concepts: [L("rules file", "fichier de règles"), L("CLAUDE.md", "CLAUDE.md"), L("/init", "/init")],
  commands: ["/init", "CLAUDE.md"],
  ui: UI,
  setup: () => shop(),
  recap: [
    L("Agents start every session with a blank memory. Rules files fix that: they're loaded at the start of every conversation.", "Les agents commencent chaque session la mémoire vide. Les fichiers de règles règlent ça : ils sont chargés au début de chaque conversation."),
    L("Claude Code reads CLAUDE.md, Codex reads AGENTS.md, Gemini CLI reads GEMINI.md. /init writes a first version for you.", "Claude Code lit CLAUDE.md, Codex lit AGENTS.md, Gemini CLI lit GEMINI.md. /init en écrit une première version pour toi."),
    L("Put in rules what you'd repeat in every prompt: commands, conventions, what never to do.", "Mets dans les règles ce que tu répéterais dans chaque prompt : commandes, conventions, ce qu'il ne faut jamais faire."),
  ],
  steps: [
    {
      kind: "discover",
      title: L("An agent with amnesia", "Un agent amnésique"),
      body: [
        L("Each new session, the agent knows nothing about your project: not your package manager, not your conventions, not the mistake it made yesterday.", "À chaque nouvelle session, l'agent ne sait rien de ton projet : ni ton gestionnaire de paquets, ni tes conventions, ni l'erreur qu'il a faite hier."),
        L("A rules file is a note the agent reads every time it starts. Open a few sessions below, with and without one.", "Un fichier de règles, c'est une note que l'agent lit à chaque démarrage. Ouvre quelques sessions ci-dessous, avec et sans."),
      ],
      scene: "rules-memory",
    },
    {
      kind: "try",
      title: L("Spot the problem", "Repère le problème"),
      body: L("Ask for a fix and to run the tests. Watch which command the agent uses to test.", "Demande une correction et le lancement des tests. Regarde quelle commande l'agent utilise pour tester."),
      command: `claude -p "${P_TOTAL}"`,
      check: (w, s) => c.someRun(w, s, (r) => c.ranTests(r, "npm")),
      success: L("It ran npm — but this project uses pnpm (see package.json). It even created a package-lock.json, a second lock file that will confuse your team. Nobody told it!", "Il a lancé npm — mais ce projet utilise pnpm (voir package.json). Il a même créé un package-lock.json, un second fichier de verrouillage qui va embrouiller ton équipe. Personne ne lui a dit !"),
    },
    {
      kind: "try",
      title: L("Open a session", "Ouvre une session"),
      body: L("Let's write the rules. Start Claude Code.", "Écrivons les règles. Lance Claude Code."),
      command: "claude",
      check: (w) => c.inSession(w, "claude"),
      success: L("Look at the banner: “No rules file found”. Let's fix that.", "Regarde la bannière : « Aucun fichier de règles ». Réglons ça."),
    },
    {
      kind: "try",
      title: L("Let the agent write a first draft", "Laisse l'agent écrire un premier jet"),
      body: L("/init asks the agent to study the project and write CLAUDE.md: commands, structure, conventions.", "/init demande à l'agent d'étudier le projet et d'écrire CLAUDE.md : commandes, structure, conventions."),
      command: "/init",
      check: (w) => c.fileExists(w, "CLAUDE.md"),
      success: L("CLAUDE.md now exists — open it in the Files panel. The agent found pnpm in package.json and wrote it down. Always review this draft: you know things it doesn't.", "CLAUDE.md existe maintenant — ouvre-le dans le panneau Fichiers. L'agent a trouvé pnpm dans package.json et l'a noté. Relis toujours ce brouillon : tu sais des choses qu'il ignore."),
    },
    {
      kind: "try",
      title: L("Add a rule of your own", "Ajoute ta propre règle"),
      body: L("Rules are just Markdown you edit. Add one that saves you from repeating “and run the tests” in every prompt (use the button, or edit CLAUDE.md yourself).", "Les règles, c'est juste du Markdown que tu modifies. Ajoute-en une qui t'évite de répéter « et lance les tests » à chaque prompt (avec le bouton, ou en modifiant CLAUDE.md toi-même)."),
      action: {
        label: L("Add “run pnpm test after every change”", "Ajouter « lancer pnpm test après chaque changement »"),
        kind: "edit-file",
        path: "CLAUDE.md",
        content:
          "# Tiny Shop\n\nA small TypeScript shop used to practise AI-assisted development.\n\n## Commands\n- Install: `pnpm install`\n- Test: `pnpm test` (run it after every change)\n\n## Structure\n- `src/cart.ts`: cart logic (addItem, total)\n- `src/price.ts`: price formatting\n- `tests/`: Vitest tests, one file per module\n\n## Conventions\n- Prices are integers in cents.\n",
      },
      check: (w) => c.directivesFor(w, "claude").includes("tests"),
      success: L("Now every session starts knowing: use pnpm, run the tests after a change.", "Désormais chaque session démarre en sachant : utiliser pnpm, lancer les tests après un changement."),
    },
    {
      kind: "challenge",
      title: L("Challenge: the agent follows your rules", "Défi : l'agent suit tes règles"),
      body: L("Clean up the mess and prove the rules work: delete the stray package-lock.json, then send a short prompt — without mentioning tests or pnpm — and check the agent tests with pnpm on its own.", "Nettoie les dégâts et prouve que les règles marchent : supprime le package-lock.json en trop, puis envoie un prompt court — sans parler de tests ni de pnpm — et vérifie que l'agent teste avec pnpm tout seul."),
      objectives: [
        {
          id: "lock",
          label: L("package-lock.json is deleted", "package-lock.json est supprimé"),
          check: (w) => !c.fileExists(w, "package-lock.json"),
          hints: [L("A shell command removes files.", "Une commande shell supprime les fichiers."), L("In a Claude Code session, ! runs a shell command. Or /exit first.", "Dans une session Claude Code, ! lance une commande shell. Ou fais /exit d'abord."), L("Type: !rm package-lock.json", "Tape : !rm package-lock.json")],
        },
        {
          id: "pnpm",
          label: L("A short prompt makes the agent run pnpm test", "Un prompt court fait lancer pnpm test à l'agent"),
          check: (w, s) => c.someRun(w, s, (r) => r.tool === "claude" && c.ranTests(r, "pnpm") && !r.report.checks.verify),
          hints: [
            L("The rules should do the work, not the prompt.", "Ce sont les règles qui doivent faire le travail, pas le prompt."),
            L("Send a request that doesn't mention tests: the “run pnpm test after every change” rule kicks in.", "Envoie une demande qui ne parle pas de tests : la règle « lancer pnpm test après chaque changement » s'applique."),
            L(`Type: ${SHORT_TOTAL}`, `Tape : ${SHORT_TOTAL}`),
          ],
        },
      ],
      feedback: (w, s) => {
        const r = c.lastRunOf(w, s);
        if (r && r.report.checks.verify && c.ranTests(r)) return L("That worked, but your prompt asked for tests. Try one that doesn't — let the rules do it.", "Ça marche, mais ton prompt demandait des tests. Essaie sans — laisse les règles s'en charger.");
        return null;
      },
    },
    { kind: "celebrate" },
  ],
};

export const oneRulebook: LessonDef = {
  id: "one-rulebook",
  chapterId: "rules",
  title: L("One rulebook for every agent", "Un seul règlement pour tous les agents"),
  tagline: L("AGENTS.md, CLAUDE.md, GEMINI.md… and @imports", "AGENTS.md, CLAUDE.md, GEMINI.md… et les @imports"),
  xp: 120,
  concepts: [L("AGENTS.md", "AGENTS.md"), L("@imports", "@imports"), L("global vs project rules", "règles globales ou de projet")],
  commands: ["AGENTS.md", "@AGENTS.md", "codex exec"],
  ui: UI,
  setup: () => shop({ "AGENTS.md": AGENTS_MD }),
  recap: [
    L("AGENTS.md is an open format read by Codex, Antigravity, Cursor and many other tools.", "AGENTS.md est un format ouvert lu par Codex, Antigravity, Cursor et beaucoup d'autres outils."),
    L("Claude Code reads CLAUDE.md and Gemini CLI reads GEMINI.md, but both can import another file with a line like @AGENTS.md.", "Claude Code lit CLAUDE.md et Gemini CLI lit GEMINI.md, mais les deux peuvent importer un autre fichier avec une ligne comme @AGENTS.md."),
    L("Global rules (~/.claude/CLAUDE.md, ~/.codex/AGENTS.md…) hold your personal habits; project rules hold the team's.", "Les règles globales (~/.claude/CLAUDE.md, ~/.codex/AGENTS.md…) contiennent tes habitudes ; celles du projet, celles de l'équipe."),
  ],
  steps: [
    {
      kind: "discover",
      title: L("Every tool has its own file", "Chaque outil a son fichier"),
      body: [
        L("Rules live in different places depending on the tool, and at two levels: global (your home folder, for all your projects) and project (committed with the code, shared with the team).", "Les règles vivent à des endroits différents selon l'outil, et à deux niveaux : global (ton dossier perso, pour tous tes projets) et projet (commité avec le code, partagé avec l'équipe)."),
        L("Pick a tool below to see which files it reads, in order.", "Choisis un outil ci-dessous pour voir quels fichiers il lit, dans l'ordre."),
      ],
      scene: "rules-layers",
    },
    {
      kind: "discover",
      title: L("Write once, share everywhere", "Écrire une fois, partager partout"),
      body: [
        L("Teams often use several agents. Maintaining three copies of the same rules means three copies that drift apart.", "Les équipes utilisent souvent plusieurs agents. Maintenir trois copies des mêmes règles, c'est trois copies qui divergent."),
        L("The trick: write AGENTS.md once, and make CLAUDE.md and GEMINI.md import it with a single @AGENTS.md line.", "L'astuce : écrire AGENTS.md une fois, et faire importer ce fichier par CLAUDE.md et GEMINI.md avec une seule ligne @AGENTS.md."),
      ],
      scene: "one-rulebook",
    },
    {
      kind: "try",
      title: L("Codex reads AGENTS.md", "Codex lit AGENTS.md"),
      body: L("This project already has an AGENTS.md (open it!). codex exec runs Codex once, without the interactive UI.", "Ce projet a déjà un AGENTS.md (ouvre-le !). codex exec lance Codex une fois, sans l'interface interactive."),
      command: `codex exec "${SHORT_TOTAL}"`,
      check: (w, s) => c.someRun(w, s, (r) => r.tool === "codex" && c.ranTests(r, "pnpm")),
      success: L("Codex used pnpm and ran the tests on its own: AGENTS.md told it to.", "Codex a utilisé pnpm et lancé les tests tout seul : AGENTS.md le lui a dit."),
    },
    {
      kind: "try",
      title: L("Claude Code doesn't", "Claude Code, non"),
      body: L("Same request, other agent.", "Même demande, autre agent."),
      command: `claude -p "${SHORT_TOTAL}"`,
      check: (w, s) => c.someRun(w, s, (r) => r.tool === "claude"),
      success: L("No tests, no pnpm: Claude Code looks for CLAUDE.md, not AGENTS.md. Let's connect them.", "Pas de tests, pas de pnpm : Claude Code cherche CLAUDE.md, pas AGENTS.md. Relions-les."),
    },
    {
      kind: "try",
      title: L("Import AGENTS.md", "Importe AGENTS.md"),
      body: L("Create CLAUDE.md containing one line that imports AGENTS.md. You can still add Claude-specific rules below it later.", "Crée CLAUDE.md avec une ligne qui importe AGENTS.md. Tu pourras ajouter des règles propres à Claude en dessous plus tard."),
      command: 'echo "@AGENTS.md" > CLAUDE.md',
      check: (w) => c.rulesLoaded(w, "claude").some((r) => r.path === "AGENTS.md"),
      success: L("Claude Code now loads CLAUDE.md, which pulls in AGENTS.md. One source of truth.", "Claude Code charge maintenant CLAUDE.md, qui embarque AGENTS.md. Une seule source de vérité."),
    },
    {
      kind: "challenge",
      title: L("Challenge: everyone on the same page", "Défi : tout le monde sur la même longueur d'onde"),
      body: L("Make Claude Code, Gemini CLI and Antigravity all follow AGENTS.md. Prove it: each one must run pnpm test after a short request that doesn't mention tests.", "Fais suivre AGENTS.md à Claude Code, Gemini CLI et Antigravity. Prouve-le : chacun doit lancer pnpm test après une demande courte qui ne parle pas de tests."),
      objectives: [
        {
          id: "claude",
          label: L("Claude Code runs pnpm test on its own", "Claude Code lance pnpm test tout seul"),
          check: (w, s) => c.someRun(w, s, (r) => r.tool === "claude" && c.ranTests(r, "pnpm") && !r.report.checks.verify),
          hints: [L("CLAUDE.md imports AGENTS.md now.", "CLAUDE.md importe AGENTS.md maintenant."), L("Send a short request to Claude Code.", "Envoie une demande courte à Claude Code."), L(`Type: claude -p "${SHORT_TOTAL}"`, `Tape : claude -p "${SHORT_TOTAL}"`)],
        },
        {
          id: "gemini",
          label: L("Gemini CLI runs pnpm test on its own", "Gemini CLI lance pnpm test tout seul"),
          check: (w, s) => c.someRun(w, s, (r) => r.tool === "gemini" && c.ranTests(r, "pnpm") && !r.report.checks.verify),
          hints: [L("Gemini CLI reads GEMINI.md, which can import files too.", "Gemini CLI lit GEMINI.md, qui peut aussi importer des fichiers."), L('Create GEMINI.md with the line @AGENTS.md, then ask gemini -p "…".', 'Crée GEMINI.md avec la ligne @AGENTS.md, puis demande gemini -p "…".'), L(`Type: echo "@AGENTS.md" > GEMINI.md — then: gemini -p "${SHORT_TOTAL}"`, `Tape : echo "@AGENTS.md" > GEMINI.md — puis : gemini -p "${SHORT_TOTAL}"`)],
        },
        {
          id: "antigravity",
          label: L("Antigravity runs pnpm test on its own", "Antigravity lance pnpm test tout seul"),
          check: (w, s) => c.someRun(w, s, (r) => r.tool === "antigravity" && c.ranTests(r, "pnpm") && !r.report.checks.verify),
          hints: [L("Antigravity reads AGENTS.md directly.", "Antigravity lit AGENTS.md directement."), L("Open antigravity and send the short request.", "Ouvre antigravity et envoie la demande courte."), L(`Type: antigravity — then: ${SHORT_TOTAL}`, `Tape : antigravity — puis : ${SHORT_TOTAL}`)],
        },
      ],
    },
    { kind: "celebrate" },
  ],
};

export const goodRules: LessonDef = {
  id: "good-rules",
  chapterId: "rules",
  title: L("Writing rules that work", "Écrire des règles qui marchent"),
  tagline: L("Specific, short, no contradictions", "Précises, courtes, sans contradiction"),
  xp: 130,
  concepts: [L("specific rules", "règles précises"), L("contradictions", "contradictions"), L("rules budget", "budget de règles")],
  commands: ["CLAUDE.md"],
  ui: UI,
  setup: () => shop({ "CLAUDE.md": BAD_RULES }),
  recap: [
    L("Good rules are concrete and checkable: “Run `pnpm test` after every change”, not “write clean code”.", "Une bonne règle est concrète et vérifiable : « Lance `pnpm test` après chaque changement », pas « écris du code propre »."),
    L("Contradictions make the agent pick one at random. Re-read your rules like a newcomer would.", "Les contradictions font choisir l'agent au hasard. Relis tes règles comme le ferait un nouveau venu."),
    L("Rules are loaded in every conversation: keep them short and move long procedures into skills.", "Les règles sont chargées à chaque conversation : garde-les courtes et mets les longues procédures dans des skills."),
  ],
  steps: [
    {
      kind: "discover",
      title: L("Not all rules are equal", "Toutes les règles ne se valent pas"),
      body: [
        L("“Follow best practices” feels useful but changes nothing: the agent already tries. What changes behavior is what it can't guess: your commands, your conventions, your no-go zones.", "« Suis les bonnes pratiques » semble utile mais ne change rien : l'agent essaie déjà. Ce qui change son comportement, c'est ce qu'il ne peut pas deviner : tes commandes, tes conventions, tes zones interdites."),
        L("Toggle the rules below and watch the linter react.", "Active et désactive les règles ci-dessous et regarde l'analyseur réagir."),
      ],
      scene: "rules-lint",
    },
    {
      kind: "try",
      title: L("Read the current rules", "Lis les règles actuelles"),
      body: L("Someone wrote this CLAUDE.md in a hurry. Read it.", "Quelqu'un a écrit ce CLAUDE.md à la va-vite. Lis-le."),
      command: "cat CLAUDE.md",
      check: (_w, _s, ran) => ran.includes("cat"),
      success: L("Vague wishes, shouting, and… npm AND pnpm. Which one will the agent use? Let's find out.", "Des vœux vagues, des majuscules, et… npm ET pnpm. Lequel l'agent va-t-il utiliser ? Voyons ça."),
    },
    {
      kind: "challenge",
      title: L("Challenge: fix the rulebook", "Défi : répare le règlement"),
      body: L("Rewrite CLAUDE.md in the editor (Files → CLAUDE.md) until the checks below pass, then prove the agent follows it. The guide shows what's still wrong.", "Réécris CLAUDE.md dans l'éditeur (Fichiers → CLAUDE.md) jusqu'à ce que les contrôles passent, puis prouve que l'agent le suit. Le guide montre ce qui ne va pas encore."),
      objectives: [
        {
          id: "vague",
          label: L("No vague wishes or shouting", "Plus de vœux vagues ni de majuscules"),
          check: (w) => !c.lint(w, "CLAUDE.md").some((i) => i.id === "vague" || i.id === "shouting"),
          hints: [L("Delete lines that any agent would “follow” anyway.", "Supprime les lignes que n'importe quel agent « suivrait » de toute façon."), L("Remove “clean code”, “best practices”, “high quality” and most IMPORTANT/ALWAYS.", "Retire « clean code », « best practices », « high quality » et la plupart des IMPORTANT/ALWAYS."), L("Replace the whole file with a short Markdown file: a title, ## Commands, ## Conventions.", "Remplace tout le fichier par un Markdown court : un titre, ## Commands, ## Conventions.")],
        },
        {
          id: "contradiction",
          label: L("One package manager: pnpm", "Un seul gestionnaire de paquets : pnpm"),
          check: (w) => !c.lint(w, "CLAUDE.md").some((i) => i.id === "contradiction") && c.directivesFor(w, "claude").includes("pm:pnpm"),
          hints: [L("The project's package.json says pnpm.", "Le package.json du projet indique pnpm."), L("Delete “Use npm for everything.”", "Supprime « Use npm for everything. »"), L("Keep only: - Install: `pnpm install`", "Garde seulement : - Install: `pnpm install`")],
        },
        {
          id: "commands",
          label: L("Commands for install and test, with a rule to run tests", "Les commandes d'installation et de test, avec une règle pour lancer les tests"),
          check: (w) => !c.lint(w, "CLAUDE.md").some((i) => i.id === "no-commands") && c.directivesFor(w, "claude").includes("tests"),
          hints: [L("Agents need the exact commands.", "Les agents ont besoin des commandes exactes."), L("Write the commands in backticks, and say when to run the tests.", "Écris les commandes entre backticks, et dis quand lancer les tests."), L("Add: - Test: `pnpm test` (run it after every change)", "Ajoute : - Test: `pnpm test` (run it after every change)")],
        },
        {
          id: "proof",
          label: L("The agent runs pnpm test after a short request", "L'agent lance pnpm test après une demande courte"),
          check: (w, s) => c.someRun(w, s, (r) => r.tool === "claude" && c.ranTests(r, "pnpm") && !r.report.checks.verify),
          hints: [L("Rules only matter if the agent applies them.", "Les règles ne comptent que si l'agent les applique."), L("Send a request that doesn't mention tests.", "Envoie une demande qui ne parle pas de tests."), L(`Type: claude -p "${SHORT_TOTAL}"`, `Tape : claude -p "${SHORT_TOTAL}"`)],
        },
      ],
      feedback: (w) => {
        const issue = c.lint(w, "CLAUDE.md")[0];
        return issue ? issue.message : null;
      },
    },
    { kind: "celebrate" },
  ],
};
