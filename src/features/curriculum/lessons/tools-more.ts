import { tx as L, type World } from "@/engine";
import * as c from "../checks";
import { AGENTS_MD, ISSUE_42, P_DISCOUNT, P_EURO, P_TOTAL, shop } from "../scenario";
import type { LessonDef, Solution, StoryDef } from "../types";

const UI = { files: true, editor: true, run: true, orca: false };

// ───────────────────────────────────────────── Gemini CLI in depth

/** Project rules for Gemini CLI: commands only, so the tests are NOT run unless someone asks. */
const GEMINI_MD = `# Tiny Shop

## Commands
- Install: \`pnpm install\`
- Test: \`pnpm test\`

## Code style
- TypeScript, no \`any\`.
- Prices are integers in cents.
`;

/** A nested GEMINI.md: rules for the tests/ folder only. */
const TESTS_GEMINI_MD = `# Tests
- Use vitest: describe / it / expect.
- Name each test for the behavior it checks.
`;

const MEMORY_FACT = "Make small, focused changes";
const SHORT_FIX = "Fix the total bug in @src/cart.ts";
const FIX_TOML = `description = "Fix a bug, with a test"
prompt = """
Fix this bug: {{args}}.
Change only the code, never the existing tests.
Add a test that shows the bug is gone, then run the tests and make sure they all pass.
"""
`;
const FIX_PRINTF = `!printf 'description = "Fix a bug, with a test"\\nprompt = "Fix this bug: {{args}}. Change only the code, never the existing tests. Add a test, then run the tests and make sure they all pass."\\n' > .gemini/commands/fix.toml`;
const FIX_INPUT = "/fix @src/cart.ts total ignores quantity";

const COMMAND_FILE = /^(?:~\/)?\.gemini\/commands\/.+\.toml$/;

/** The prompt template of each custom command file (project or personal). */
function commandTemplates(w: World): Array<{ path: string; prompt: string }> {
  const out: Array<{ path: string; prompt: string }> = [];
  for (const [path, text] of Object.entries(w.files)) {
    if (!COMMAND_FILE.test(path)) continue;
    const block = text.match(/^\s*prompt\s*=\s*("""|''')([\s\S]*?)\1/m);
    const line = text.match(/^\s*prompt\s*=\s*(?:"([^"\n]*)"|'([^'\n]*)')\s*$/m);
    const prompt = block ? block[2].trim() : line ? (line[1] ?? line[2] ?? "").trim() : "";
    if (prompt) out.push({ path, prompt });
  }
  return out;
}

/** The words the learner typed after /name, if this run's prompt came from a {{args}} template. */
function argsFromTemplate(runPrompt: string, template: string): string | null {
  if (!template.includes("{{args}}")) return null;
  const [before, ...rest] = template.split("{{args}}");
  const after = rest.join("{{args}}");
  const p = runPrompt.trim();
  if (before.trim().length + after.trim().length < 20) return null;
  if (!p.startsWith(before.trim()) || !p.endsWith(after.trim())) return null;
  return p.slice(before.trim().length, p.length - after.trim().length).trim();
}

/** A Gemini run sent through a custom command with a short input, done, with the tests run. */
const commandRunDone = (w: World, s: World) =>
  c.someRun(w, s, (r) => {
    if (r.tool !== "gemini" || r.outcome !== "done" || !c.ranTests(r)) return false;
    return commandTemplates(w).some((t) => {
      const args = argsFromTemplate(r.prompt, t.prompt);
      return args !== null && args.split(/\s+/).filter(Boolean).length <= 8;
    });
  });

export const geminiCli: LessonDef = {
  id: "gemini-cli",
  chapterId: "tools",
  title: L("Gemini CLI in depth", "Gemini CLI en profondeur"),
  tagline: L("Layered memory and your own slash commands", "Une mémoire en couches et tes propres commandes slash"),
  xp: 140,
  concepts: [L("GEMINI.md layers", "couches de GEMINI.md"), L("/memory", "/memory"), L("custom commands", "commandes perso")],
  commands: ["gemini", "/memory add", "/memory show", ".gemini/commands/*.toml"],
  ui: UI,
  setup: () => shop({ "GEMINI.md": GEMINI_MD, "tests/GEMINI.md": TESTS_GEMINI_MD }),
  recap: [
    L("Gemini CLI stacks its GEMINI.md files: ~/.gemini/GEMINI.md for you (every project), GEMINI.md for the project, and nested ones for a folder. /memory show prints them all.", "Gemini CLI empile ses fichiers GEMINI.md : ~/.gemini/GEMINI.md pour toi (tous les projets), GEMINI.md pour le projet, et des fichiers imbriqués pour un dossier. /memory show les affiche tous."),
    L("/memory add saves a fact in your personal GEMINI.md, so every future session knows it. A custom command in .gemini/commands/<name>.toml turns a short input into a complete prompt, with {{args}} where your words go.", "/memory add enregistre un fait dans ton GEMINI.md perso, et toutes les sessions suivantes le connaissent. Une commande perso dans .gemini/commands/<nom>.toml transforme une saisie courte en prompt complet, avec {{args}} à la place de tes mots."),
    L("Since June 18, 2026, personal Google accounts (free, AI Pro, Ultra) use the Antigravity CLI, agy, and Gemini CLI serves organizations on Code Assist Standard or Enterprise and paid API or Vertex keys. The ideas carry over: agy -p runs one request, agy -i opens a session, and agy reads ~/.gemini/GEMINI.md too.", "Depuis le 18 juin 2026, les comptes Google perso (gratuit, AI Pro, Ultra) utilisent l'Antigravity CLI, agy, et Gemini CLI sert les organisations en Code Assist Standard ou Enterprise et les clés API ou Vertex payantes. Les idées restent valables : agy -p lance une demande, agy -i ouvre une session, et agy lit aussi ~/.gemini/GEMINI.md."),
  ],
  steps: [
    {
      kind: "discover",
      title: L("Three layers of memory, one shortcut", "Trois couches de mémoire, un raccourci"),
      body: [
        L("Gemini CLI reads GEMINI.md files from general to specific: yours, the project's, then one per folder. You can add to your own from inside a session, and you can save prompts you type often as your own slash commands.", "Gemini CLI lit ses fichiers GEMINI.md du plus général au plus précis : le tien, celui du projet, puis un par dossier. Tu peux enrichir le tien depuis une session, et enregistrer les prompts que tu tapes souvent comme tes propres commandes slash."),
        L("Good to know first: since June 18, 2026, if you use a personal Google account (free, Google AI Pro or Ultra), your terminal agent is the Antigravity CLI, agy. Gemini CLI is now for organizations on Gemini Code Assist Standard or Enterprise, and for paid Gemini API or Vertex AI keys. The ideas in this lesson carry over: agy -p \"…\" runs one request and prints the answer, agy -i \"…\" opens a session with a first request, and agy reads your personal ~/.gemini/GEMINI.md too. For reusable instructions, agy uses skills (Antigravity's workflows are deprecated in favor of skills). To install it: curl -fsSL https://antigravity.google/cli/install.sh | bash on macOS or Linux, irm https://antigravity.google/cli/install.ps1 | iex in PowerShell.", "Bon à savoir d'abord : depuis le 18 juin 2026, si tu utilises un compte Google perso (gratuit, Google AI Pro ou Ultra), ton agent en terminal est l'Antigravity CLI, agy. Gemini CLI sert désormais les organisations en Gemini Code Assist Standard ou Enterprise, et les clés payantes Gemini API ou Vertex AI. Les idées de cette leçon restent valables : agy -p \"…\" lance une demande et affiche la réponse, agy -i \"…\" ouvre une session avec une première demande, et agy lit aussi ton ~/.gemini/GEMINI.md perso. Pour les instructions réutilisables, agy utilise des skills (les workflows d'Antigravity sont dépréciés au profit des skills). Pour l'installer : curl -fsSL https://antigravity.google/cli/install.sh | bash sur macOS ou Linux, irm https://antigravity.google/cli/install.ps1 | iex dans PowerShell."),
        L("Press Next to follow one session.", "Appuie sur Suivant pour suivre une session."),
      ],
      scene: "story:gemini-cli",
    },
    {
      kind: "try",
      title: L("Start Gemini CLI", "Lance Gemini CLI"),
      body: L("Open a session and read the banner: it lists the rules files it loaded.", "Ouvre une session et lis la bannière : elle liste les fichiers de règles chargés."),
      command: "gemini",
      check: (w) => c.inSession(w, "gemini"),
      success: L("GEMINI.md and tests/GEMINI.md are both loaded. Gemini CLI scans the subfolders up front, so folder rules are there from the start.", "GEMINI.md et tests/GEMINI.md sont chargés tous les deux. Gemini CLI parcourt les sous-dossiers dès le départ, donc les règles de dossier sont là dès le début."),
    },
    {
      kind: "try",
      title: L("Teach it something about you", "Apprends-lui quelque chose sur toi"),
      body: L("You like small, focused changes in every project. Instead of repeating it, save it once.", "Tu aimes les changements petits et ciblés, dans tous tes projets. Au lieu de le répéter, enregistre-le une fois."),
      command: `/memory add "${MEMORY_FACT}"`,
      check: (w) => c.fileHas(w, "~/.gemini/GEMINI.md", /small, focused changes/i),
      success: L("Saved in ~/.gemini/GEMINI.md, under “Gemini Added Memories”. It lives in your home folder, not in the project: your teammates won't get it, and every project you open will.", "Enregistré dans ~/.gemini/GEMINI.md, sous « Gemini Added Memories ». Il vit dans ton dossier perso, pas dans le projet : tes collègues ne l'auront pas, et tous les projets que tu ouvres l'auront."),
    },
    {
      kind: "try",
      title: L("See every layer", "Vois toutes les couches"),
      body: L("Ask Gemini what it actually knows right now.", "Demande à Gemini ce qu'il sait vraiment, là, maintenant."),
      command: "/memory show",
      check: (_w, _s, ran) => ran.includes("/memory show"),
      success: L("Three files, from general to specific: yours (~/.gemini/GEMINI.md), the project's (GEMINI.md), the tests folder's (tests/GEMINI.md). When two disagree, the more specific one wins.", "Trois fichiers, du plus général au plus précis : le tien (~/.gemini/GEMINI.md), celui du projet (GEMINI.md), celui du dossier tests (tests/GEMINI.md). Quand deux se contredisent, le plus précis gagne."),
    },
    {
      kind: "try",
      title: L("The short prompt problem", "Le problème du prompt court"),
      body: L("Short prompts are tempting. Send this one and watch what's missing.", "Les prompts courts sont tentants. Envoie celui-ci et regarde ce qui manque."),
      command: SHORT_FIX,
      check: (w, s) => c.someRun(w, s, (r) => r.tool === "gemini" && r.task === "fix-total"),
      success: L("Fixed, and it followed your memory (small changes). But look at the yellow line: no test, and the tests never ran, because nobody asked. You could type the long version every time, or teach Gemini a shortcut.", "Corrigé, et il a suivi ta mémoire (petits changements). Mais regarde la ligne jaune : aucun test, et les tests n'ont jamais tourné, parce que personne ne l'a demandé. Tu pourrais taper la version longue à chaque fois, ou apprendre un raccourci à Gemini."),
    },
    {
      kind: "challenge",
      title: L("Challenge: your own /fix", "Défi : ton propre /fix"),
      body: L(
        "Create a custom command in .gemini/commands/ (for example fix.toml) whose prompt puts your words where {{args}} is, and says everything a good fix needs: change the code, add a test, run the tests. Then use it with a short input (8 words or fewer) so Gemini finishes the job and runs the tests. You can create the file in the Files panel, or from the session with ! in front of a shell command.",
        "Crée une commande perso dans .gemini/commands/ (par exemple fix.toml) dont le prompt place tes mots à l'endroit de {{args}}, et dit tout ce qu'une bonne correction demande : modifier le code, ajouter un test, lancer les tests. Puis utilise-la avec une saisie courte (8 mots maximum) pour que Gemini termine le travail et lance les tests. Tu peux créer le fichier dans le panneau Fichiers, ou depuis la session avec ! devant une commande shell.",
      ),
      objectives: [
        {
          id: "command",
          label: L("A .gemini/commands/*.toml file with {{args}} in its prompt", "Un fichier .gemini/commands/*.toml avec {{args}} dans son prompt"),
          check: (w) => commandTemplates(w).some((t) => t.prompt.includes("{{args}}")),
          hints: [
            L("A custom command is a TOML file: its name becomes the slash command, and its prompt key holds the text Gemini receives.", "Une commande perso est un fichier TOML : son nom devient la commande slash, et sa clé prompt contient le texte que Gemini reçoit."),
            L('Two keys: description = "…" and prompt = "…". Put {{args}} in the prompt where your short input should go.', 'Deux clés : description = "…" et prompt = "…". Mets {{args}} dans le prompt, là où ta saisie courte doit aller.'),
            L(`Type: ${FIX_PRINTF}`, `Tape : ${FIX_PRINTF}`),
          ],
        },
        {
          id: "used",
          label: L("Used with a short input: Gemini finishes and runs the tests", "Utilisée avec une saisie courte : Gemini termine et lance les tests"),
          check: commandRunDone,
          hints: [
            L("Type the command's name with a slash, then a few words: Gemini swaps them into {{args}}.", "Tape le nom de la commande avec un slash, puis quelques mots : Gemini les met à la place de {{args}}."),
            L("Point at the file with @ in your input so the agent knows where to look.", "Désigne le fichier avec @ dans ta saisie pour que l'agent sache où regarder."),
            L(`Type: ${FIX_INPUT}`, `Tape : ${FIX_INPUT}`),
          ],
        },
      ],
      feedback: (w, s) => {
        const templates = commandTemplates(w);
        const badFile = Object.entries(w.files).find(([p, t]) => COMMAND_FILE.test(p) && !/^\s*prompt\s*=/m.test(t));
        if (badFile) return L(`${badFile[0]} has no prompt = line: Gemini can't use it. Add prompt = "…{{args}}…".`, `${badFile[0]} n'a pas de ligne prompt = : Gemini ne peut pas l'utiliser. Ajoute prompt = "…{{args}}…".`);
        if (templates.length && !templates.some((t) => t.prompt.includes("{{args}}")))
          return L("Your command has no {{args}}: Gemini just appends your words at the end. Put {{args}} in the middle of the prompt, so your short input lands in a complete sentence.", "Ta commande n'a pas de {{args}} : Gemini ajoute simplement tes mots à la fin. Mets {{args}} au milieu du prompt, pour que ta saisie courte tombe dans une phrase complète.");
        if (Object.keys(w.files).some((p) => /^commands\/.+\.toml$|^gemini\/commands\//.test(p)))
          return L("Gemini CLI looks in .gemini/commands/ (with the dot). Move your file there.", "Gemini CLI regarde dans .gemini/commands/ (avec le point). Déplace ton fichier là.");
        const last = c.lastRunOf(w, s);
        if (last?.tool === "gemini" && last.outcome !== "done" && templates.length && !commandRunDone(w, s))
          return L("That run still had to guess. Make the prompt in your TOML file say how to check the work: add a test and run the tests.", "Cette exécution a encore dû deviner. Fais dire au prompt de ton fichier TOML comment vérifier le travail : ajouter un test et lancer les tests.");
        return null;
      },
    },
    {
      kind: "experiment",
      title: L("Experiment", "Expérimente"),
      body: L("A command in a subfolder gets a namespace: .gemini/commands/git/commit.toml becomes /git:commit. Personal commands live in ~/.gemini/commands/ and follow you to every project. Leave the session and try agy -p: the Antigravity CLI loads the same ~/.gemini/GEMINI.md, so your memory follows you there too.", "Une commande dans un sous-dossier reçoit un espace de noms : .gemini/commands/git/commit.toml devient /git:commit. Les commandes perso vivent dans ~/.gemini/commands/ et te suivent dans tous les projets. Quitte la session et essaie agy -p : l'Antigravity CLI charge le même ~/.gemini/GEMINI.md, donc ta mémoire te suit là aussi."),
      ideas: ["/help", "/fix @src/price.ts prices show cents", "/memory show", "!cat ~/.gemini/GEMINI.md", "/exit", 'agy -p "Fix the total bug in @src/cart.ts"'],
    },
    { kind: "celebrate" },
  ],
};

// ───────────────────────────────────────────── Cursor's terminal agent

const INJECTED = "Fix the bug described in @issues/42.md";
const FRENCH_RULE = 'echo "- Write code comments in French." >> AGENTS.md';

export const cursorAgent: LessonDef = {
  id: "cursor-agent",
  chapterId: "tools",
  title: L("Cursor's agent in the terminal", "L'agent de Cursor dans le terminal"),
  tagline: L("Same rulebook, one more teammate", "Le même règlement, un coéquipier de plus"),
  xp: 120,
  concepts: [L("cursor-agent", "cursor-agent"), L("headless mode (-p)", "mode sans interface (-p)"), L("one AGENTS.md for every agent", "un seul AGENTS.md pour tous les agents")],
  commands: ["cursor-agent", "cursor-agent -p", "--force", "AGENTS.md"],
  ui: UI,
  setup: () => shop({ "AGENTS.md": AGENTS_MD }),
  recap: [
    L("cursor-agent is Cursor's agent without the editor: type cursor-agent for a session, or cursor-agent -p \"…\" to run one request and exit (handy in scripts).", "cursor-agent, c'est l'agent de Cursor sans l'éditeur : tape cursor-agent pour une session, ou cursor-agent -p \"…\" pour une seule demande puis sortie (pratique dans des scripts)."),
    L("It reads AGENTS.md, the same file as Codex: write your project rules once and every agent on the team follows them. Cursor-only rules go in .cursor/rules/.", "Il lit AGENTS.md, le même fichier que Codex : écris tes règles de projet une fois et chaque agent de l'équipe les suit. Les règles propres à Cursor vont dans .cursor/rules/."),
    L("--force lets it run commands without asking you. Keep it for trusted tasks on a throwaway copy, never for content you didn't write.", "--force le laisse lancer des commandes sans te demander. Garde-le pour des tâches de confiance sur une copie jetable, jamais pour un contenu que tu n'as pas écrit."),
  ],
  steps: [
    {
      kind: "discover",
      title: L("Cursor, without the editor", "Cursor, sans l'éditeur"),
      body: [
        L("You may know Cursor as a code editor. Its agent also runs in the terminal, as cursor-agent, next to Claude Code, Codex and the others. Same idea: you ask, it reads, edits, runs commands and reports.", "Tu connais peut-être Cursor comme éditeur de code. Son agent tourne aussi dans le terminal, sous le nom cursor-agent, à côté de Claude Code, Codex et les autres. Même principe : tu demandes, il lit, modifie, lance des commandes et te fait un compte rendu."),
        L("What makes it easy to add to a team: it reads AGENTS.md, the rulebook Codex already uses. Press Next to see it at work.", "Ce qui le rend facile à ajouter à une équipe : il lit AGENTS.md, le règlement que Codex utilise déjà. Appuie sur Suivant pour le voir à l'œuvre."),
      ],
      scene: "story:cursor-agent",
    },
    {
      kind: "try",
      title: L("Open a session", "Ouvre une session"),
      body: L("Start Cursor's agent. Typing cursor alone would open the editor; the terminal agent is cursor-agent.", "Lance l'agent de Cursor. Taper cursor tout court ouvrirait l'éditeur ; l'agent du terminal, c'est cursor-agent."),
      command: "cursor-agent",
      check: (w) => c.inSession(w, "cursor"),
      success: L("“Rules loaded: AGENTS.md”. You wrote nothing for Cursor, yet it already knows the project uses pnpm and cents.", "« Règles chargées : AGENTS.md ». Tu n'as rien écrit pour Cursor, et pourtant il sait déjà que le projet utilise pnpm et des centimes."),
    },
    {
      kind: "try",
      title: L("Give it a task", "Confie-lui une tâche"),
      body: L("Inside the session, you talk to it in plain words, like any other agent.", "Dans la session, tu lui parles avec tes mots, comme à n'importe quel autre agent."),
      command: P_TOTAL,
      check: (w, s) => c.someRun(w, s, (r) => r.tool === "cursor" && r.task === "fix-total" && r.outcome === "done" && c.ranTests(r, "pnpm")),
      success: L("Fixed and tested with pnpm test, because AGENTS.md says so. Check the Run tab: AGENTS.md is in its context.", "Corrigé et testé avec pnpm test, parce qu'AGENTS.md le dit. Regarde l'onglet Run : AGENTS.md est dans son contexte."),
    },
    {
      kind: "try",
      title: L("Leave the session", "Quitte la session"),
      body: L("Next you'll use it without a session, so go back to the shell.", "Ensuite tu vas l'utiliser sans session, alors reviens au shell."),
      command: "/exit",
      check: (w) => !c.inSession(w),
      success: L("Back in the shell. From here, cursor-agent -p runs one request and exits, like claude -p or codex exec.", "De retour dans le shell. D'ici, cursor-agent -p lance une seule demande puis s'arrête, comme claude -p ou codex exec."),
    },
    {
      kind: "watch",
      title: L("Watch: why --force is risky", "Regarde : pourquoi --force est risqué"),
      body: L("This bug report hides an instruction for AI agents in an HTML comment. Step through the same request, with and without --force.", "Ce rapport de bug cache une instruction pour les agents IA dans un commentaire HTML. Parcours la même demande, avec et sans --force."),
      setup: () => shop({ "AGENTS.md": AGENTS_MD, "issues/42.md": ISSUE_42 }),
      frames: [
        { command: `cursor-agent -p "${INJECTED}"`, caption: L("By default Cursor asks before running commands, so it refuses the hidden curl … | sh and only fixes the real bug.", "Par défaut, Cursor demande avant de lancer des commandes : il refuse le curl … | sh caché et corrige seulement le vrai bug.") },
        { command: "git restore src/cart.ts", caption: L("Put the project back to try again.", "Remets le projet en état pour réessayer.") },
        { command: `cursor-agent --force -p "${INJECTED}"`, caption: L("With --force, nobody is asked: the agent runs the stranger's script on your machine. Only use --force on tasks and files you trust.", "Avec --force, personne n'est consulté : l'agent lance le script d'un inconnu sur ta machine. N'utilise --force que sur des tâches et des fichiers de confiance.") },
      ],
    },
    {
      kind: "challenge",
      title: L("Challenge: one rule, two agents", "Défi : une règle, deux agents"),
      body: L(
        "Your team writes code comments in French. Add that rule once, in the file both Cursor and Codex read. Then have cursor-agent -p add the discount and Codex switch prices to euros, both with French comments, without saying it in the prompts.",
        "Ton équipe écrit ses commentaires en français. Ajoute cette règle une seule fois, dans le fichier que Cursor et Codex lisent tous les deux. Puis fais ajouter la remise par cursor-agent -p et passer les prix en euros par Codex, tous deux avec des commentaires en français, sans le dire dans les prompts.",
      ),
      objectives: [
        {
          id: "rule",
          label: L("AGENTS.md asks for French code comments", "AGENTS.md demande des commentaires en français"),
          check: (w) => c.fileHas(w, "AGENTS.md", /\b(french|fran[çc]ais)\b/i),
          hints: [
            L("Cursor and Codex share one rules file at the root of the project.", "Cursor et Codex partagent un fichier de règles à la racine du projet."),
            L("Add a line to AGENTS.md (Files panel, or >> to append from the shell).", "Ajoute une ligne à AGENTS.md (panneau Fichiers, ou >> pour ajouter depuis le shell)."),
            L(`Type: ${FRENCH_RULE}`, `Tape : ${FRENCH_RULE}`),
          ],
        },
        {
          id: "cursor",
          label: L("Cursor adds the discount with French comments", "Cursor ajoute la remise avec des commentaires en français"),
          check: (w, s) => c.someRun(w, s, (r) => r.tool === "cursor" && r.task === "discount" && r.outcome === "done" && r.followed.includes("lang:fr")),
          hints: [
            L("Rules are read when the request starts, so add the rule first.", "Les règles sont lues au début de la demande, alors ajoute la règle d'abord."),
            L("Use cursor-agent -p with a precise discount prompt that doesn't mention French.", "Utilise cursor-agent -p avec un prompt de remise précis qui ne parle pas de français."),
            L(`Type: cursor-agent -p "${P_DISCOUNT}"`, `Tape : cursor-agent -p "${P_DISCOUNT}"`),
          ],
        },
        {
          id: "codex",
          label: L("Codex follows the same rule", "Codex suit la même règle"),
          check: (w, s) => c.someRun(w, s, (r) => r.tool === "codex" && r.outcome === "done" && r.followed.includes("lang:fr")),
          hints: [
            L("No extra file for Codex: it reads AGENTS.md too.", "Aucun fichier en plus pour Codex : il lit AGENTS.md lui aussi."),
            L("Use codex exec with a precise euro prompt.", "Utilise codex exec avec un prompt précis sur les euros."),
            L(`Type: codex exec "${P_EURO}"`, `Tape : codex exec "${P_EURO}"`),
          ],
        },
      ],
      feedback: (w, s) => {
        const mdcFrench = Object.entries(w.files).some(([p, t]) => /^\.cursor\/rules\/.+\.mdc$/.test(p) && /\b(french|fran[çc]ais)\b/i.test(t));
        if (mdcFrench && !c.fileHas(w, "AGENTS.md", /\b(french|fran[çc]ais)\b/i))
          return L("A .cursor/rules file only reaches Cursor: Codex never reads it. Put the rule in AGENTS.md so both agents share it.", "Un fichier .cursor/rules ne parle qu'à Cursor : Codex ne le lit jamais. Mets la règle dans AGENTS.md pour que les deux agents la partagent.");
        if (c.fileExists(w, "CURSOR.md") || c.fileExists(w, "CODEX.md"))
          return L("Neither agent reads that file name. The shared rulebook is AGENTS.md.", "Aucun des deux agents ne lit ce nom de fichier. Le règlement commun, c'est AGENTS.md.");
        if (c.someRun(w, s, (r) => (r.tool === "cursor" || r.tool === "codex") && r.outcome === "done" && !r.followed.includes("lang:fr") && /\b(french|fran[çc]ais)\b/i.test(r.prompt)))
          return L("You asked for French in the prompt. It works once, but the point is the rule: ask again without mentioning French, and let AGENTS.md do it.", "Tu as demandé le français dans le prompt. Ça marche une fois, mais le but, c'est la règle : redemande sans parler de français, et laisse AGENTS.md s'en charger.");
        return null;
      },
    },
    { kind: "celebrate" },
  ],
};

export const lessons: LessonDef[] = [geminiCli, cursorAgent];

export const solutions: Record<string, Solution> = {
  "gemini-cli": [{ ".gemini/commands/fix.toml": FIX_TOML }, FIX_INPUT],
  "cursor-agent": [FRENCH_RULE, `cursor-agent -p "${P_DISCOUNT}"`, `codex exec "${P_EURO}"`],
};

export const stories: Record<string, StoryDef> = {
  "gemini-cli": {
    intro: L("One Gemini CLI session in the Tiny Shop project, from start to a custom command.", "Une session Gemini CLI dans le projet Tiny Shop, du démarrage à une commande perso."),
    steps: [
      {
        name: L("Start", "Démarrage"),
        line: "$ gemini   Rules loaded: ~/.gemini/GEMINI.md, GEMINI.md, tests/GEMINI.md",
        note: L("Three layers load at once: yours (every project), the project's, and one for the tests folder. General first, specific last: the specific one wins.", "Trois couches se chargent d'un coup : la tienne (tous les projets), celle du projet, et celle du dossier tests. Du général au précis : la plus précise gagne."),
        tone: "muted",
      },
      {
        name: L("Remember", "Retenir"),
        line: '> /memory add "Make small, focused changes"',
        note: L("The fact goes into ~/.gemini/GEMINI.md, your personal layer. Every future session, in any project, starts with it.", "Le fait va dans ~/.gemini/GEMINI.md, ta couche perso. Chaque future session, dans n'importe quel projet, commence avec."),
        tone: "ok",
      },
      {
        name: L("Check", "Vérifier"),
        line: "> /memory show",
        note: L("Prints everything Gemini knows right now, file by file. Use it when the agent does something you didn't expect.", "Affiche tout ce que Gemini sait en ce moment, fichier par fichier. Utilise-le quand l'agent fait quelque chose d'inattendu."),
        tone: "tool",
      },
      {
        name: L("Shortcut", "Raccourci"),
        line: '.gemini/commands/fix.toml   prompt = "Fix this bug: {{args}}. Add a test, run the tests."',
        note: L("A TOML file in .gemini/commands/ becomes a slash command. {{args}} is where the words you type after it go.", "Un fichier TOML dans .gemini/commands/ devient une commande slash. {{args}} est l'endroit où vont les mots que tu tapes après."),
        tone: "agent",
      },
      {
        name: L("Use it", "L'utiliser"),
        line: "> /fix @src/cart.ts total ignores quantity   ✓ 3 tests passed",
        note: L("Six words from you, a complete prompt for the agent: goal, file, how to check. The same quality every time.", "Six mots de ta part, un prompt complet pour l'agent : but, fichier, comment vérifier. La même qualité à chaque fois."),
        tone: "ok",
      },
    ],
  },
  "cursor-agent": {
    prompt: L("Fix the total bug in @src/cart.ts", "Corrige le bug du total dans @src/cart.ts"),
    intro: L("Cursor's agent joins a project where Codex already works.", "L'agent de Cursor rejoint un projet où Codex travaille déjà."),
    steps: [
      {
        name: L("Start", "Démarrage"),
        line: "$ cursor-agent   Rules loaded: AGENTS.md",
        note: L("It found AGENTS.md, the rulebook Codex already reads. Nothing new to write for Cursor.", "Il a trouvé AGENTS.md, le règlement que Codex lit déjà. Rien de nouveau à écrire pour Cursor."),
        tone: "muted",
      },
      {
        name: L("Work", "Travail"),
        line: "→ Edit src/cart.ts   $ pnpm test   ✓ tests passed",
        note: L("It follows the project's rules: pnpm, prices in cents, tests after every change.", "Il suit les règles du projet : pnpm, prix en centimes, tests après chaque changement."),
        tone: "tool",
      },
      {
        name: L("One shot", "En une fois"),
        line: '$ cursor-agent -p "Add a test for formatPrice and run the tests"',
        note: L("-p runs one request and exits, with no session. Handy in scripts and next to other agents.", "-p lance une seule demande puis s'arrête, sans session. Pratique dans des scripts et à côté d'autres agents."),
        tone: "agent",
      },
      {
        name: L("Careful", "Attention"),
        line: '$ cursor-agent --force -p "…"   ⚠ runs commands without asking',
        note: L("--force skips every approval. If a file it reads hides a bad instruction, nobody stops it.", "--force saute toutes les approbations. Si un fichier qu'il lit cache une mauvaise instruction, personne ne l'arrête."),
        tone: "warn",
      },
      {
        name: L("Team", "Équipe"),
        line: "AGENTS.md → Codex · Cursor · Antigravity",
        note: L("One rulebook, several agents. Change a rule once and all of them follow it.", "Un règlement, plusieurs agents. Change une règle une fois et tous la suivent."),
        tone: "ok",
      },
    ],
  },
};
