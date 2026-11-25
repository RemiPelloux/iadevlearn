import { tx as L } from "@/engine";
import * as c from "../checks";
import { P_DISCOUNT, P_EURO, P_TOTAL, shop } from "../scenario";
import type { LessonDef } from "../types";

const UI_START = { files: true, editor: false, run: false, orca: false };
const UI_RUN = { files: true, editor: true, run: true, orca: false };

// ───────────────────────────────────────────── Chapter 1 — Meet your coding agent

export const whatIsAgent: LessonDef = {
  id: "what-is-an-agent",
  chapterId: "foundations",
  title: L("What is a coding agent?", "C'est quoi, un agent de code ?"),
  tagline: L("An AI that reads, acts and checks — in your terminal", "Une IA qui lit, agit et vérifie — dans ton terminal"),
  xp: 50,
  concepts: [L("coding agent", "agent de code"), L("agent loop", "boucle de l'agent"), L("session", "session")],
  commands: ["claude", "/exit"],
  ui: UI_START,
  setup: () => shop(),
  recap: [
    L("A chatbot answers. A coding agent acts: it reads your files, edits them and runs commands.", "Un chatbot répond. Un agent de code agit : il lit tes fichiers, les modifie et lance des commandes."),
    L("Every agent turns the same loop: read → plan → act → verify → report.", "Tous les agents tournent la même boucle : lire → planifier → agir → vérifier → rendre compte."),
    L("You start a session by typing the tool's name (claude, codex, gemini…), talk in plain words, and leave with /exit.", "Tu ouvres une session en tapant le nom de l'outil (claude, codex, gemini…), tu parles avec tes mots, et tu sors avec /exit."),
  ],
  steps: [
    {
      kind: "discover",
      title: L("From autocomplete to agents", "De l'autocomplétion aux agents"),
      body: [
        L("First, AI finished your lines of code. Then it answered questions in a chat. Today, coding agents like Claude Code, Codex, Gemini CLI or Antigravity do the work themselves.", "D'abord, l'IA complétait tes lignes de code. Puis elle a répondu à des questions dans un chat. Aujourd'hui, des agents comme Claude Code, Codex, Gemini CLI ou Antigravity font le travail eux-mêmes."),
        L("An agent works in a loop: it reads what it needs, makes a plan, acts (edits files, runs commands), verifies the result, then tells you what it did. Step through the loop below.", "Un agent travaille en boucle : il lit ce dont il a besoin, fait un plan, agit (modifie des fichiers, lance des commandes), vérifie le résultat, puis te dit ce qu'il a fait. Parcours la boucle ci-dessous."),
      ],
      scene: "agent-loop",
    },
    {
      kind: "try",
      title: L("Start Claude Code", "Lance Claude Code"),
      body: L("This terminal is a safe simulator: nothing leaves your browser and no account is needed. Type the command below (or press Run) to open a session with Claude Code.", "Ce terminal est un simulateur sans risque : rien ne quitte ton navigateur et aucun compte n'est nécessaire. Tape la commande ci-dessous (ou appuie sur Exécuter) pour ouvrir une session avec Claude Code."),
      command: "claude",
      check: (w) => c.inSession(w, "claude"),
      success: L("You're in! The prompt changed to “>”: from now on, what you type goes to the agent, not to the shell.", "Tu y es ! L'invite est devenue « > » : désormais, ce que tu tapes va à l'agent, pas au shell."),
    },
    {
      kind: "try",
      title: L("Ask about the project", "Pose une question sur le projet"),
      body: L("Talk to the agent in plain words, in English or French. Ask it to explain this project: it will read the files to answer.", "Parle à l'agent avec tes mots, en français ou en anglais. Demande-lui d'expliquer ce projet : il va lire les fichiers pour répondre."),
      command: "Explain this project",
      check: (w, s) => c.someRun(w, s, (r) => r.outcome === "answer"),
      success: L("The agent read the project and even spotted a bug in total(). Notice the last grey line: how much “context” it used, and how good your prompt was.", "L'agent a lu le projet et a même repéré un bug dans total(). Regarde la dernière ligne grise : combien de « contexte » il a utilisé, et la qualité de ton prompt."),
      hint: L("Any question works: “What does this project do?”, “Explique ce projet”…", "N'importe quelle question marche : « Que fait ce projet ? », « Explain this project »…"),
    },
    {
      kind: "try",
      title: L("Leave the session", "Quitte la session"),
      body: L("When you're done, /exit brings you back to the normal shell. Commands that start with a slash are built into each tool.", "Quand tu as fini, /exit te ramène au shell normal. Les commandes qui commencent par une barre oblique sont intégrées à chaque outil."),
      command: "/exit",
      check: (w, _s, ran) => !w.session && ran.includes("/exit"),
      success: L("Back in the shell. You just did a full round trip with an agent!", "De retour dans le shell. Tu viens de faire un aller-retour complet avec un agent !"),
    },
    {
      kind: "experiment",
      title: L("Meet the other agents", "Rencontre les autres agents"),
      body: L("Every tool works the same way: start it by name, talk, /exit. Try them — and /help inside each one shows its own commands.", "Chaque outil marche pareil : on le lance par son nom, on parle, /exit. Essaie-les — et /help dans chacun affiche ses propres commandes."),
      ideas: ["codex", "/help", "/exit", "gemini", "claude --help"],
    },
    { kind: "celebrate" },
  ],
};

export const firstPrompt: LessonDef = {
  id: "first-prompt",
  chapterId: "foundations",
  title: L("Your first real prompt", "Ton premier vrai prompt"),
  tagline: L("Vague in, guesses out", "Flou en entrée, suppositions en sortie"),
  xp: 90,
  concepts: [L("prompt", "prompt"), L("assumptions", "suppositions"), L("prompt quality", "qualité du prompt")],
  commands: ['claude "…"'],
  ui: UI_RUN,
  setup: () => shop(),
  recap: [
    L("An agent never says “I don't know”: when your prompt is vague, it guesses — and shows you what it assumed.", "Un agent ne dit jamais « je ne sais pas » : quand ton prompt est flou, il devine — et te montre ce qu'il a supposé."),
    L("A good prompt says what to do, where (@file), within which limits, how to check it, with details, and when it's done.", "Un bon prompt dit quoi faire, où (@fichier), dans quelles limites, comment vérifier, avec des détails, et quand c'est fini."),
    L("Asking the agent to add and run tests is the cheapest way to catch its mistakes.", "Demander à l'agent d'ajouter et de lancer des tests est le moyen le plus simple d'attraper ses erreurs."),
  ],
  steps: [
    {
      kind: "discover",
      title: L("Same task, two prompts", "Même tâche, deux prompts"),
      body: [
        L("Imagine asking a new colleague to “add a discount”. Which file? How much? What about tests? They'd ask — an agent mostly guesses.", "Imagine demander à un nouveau collègue « ajoute une remise ». Quel fichier ? Combien ? Et les tests ? Lui demanderait — un agent, lui, devine surtout."),
        L("Send both prompts below to the same agent and compare what happens.", "Envoie les deux prompts ci-dessous au même agent et compare ce qui se passe."),
      ],
      scene: "vague-vs-precise",
    },
    {
      kind: "discover",
      title: L("The six ingredients", "Les six ingrédients"),
      body: [
        L("You don't need magic words. A useful prompt answers six questions: the goal, the context (which files), the constraints, how to verify, the details, and when it's done.", "Pas besoin de formules magiques. Un prompt utile répond à six questions : l'objectif, le contexte (quels fichiers), les contraintes, comment vérifier, les détails, et quand c'est fini."),
        L("Click each ingredient to add it to the prompt and watch the score rise.", "Clique sur chaque ingrédient pour l'ajouter au prompt et regarde le score monter."),
      ],
      scene: "prompt-anatomy",
    },
    {
      kind: "try",
      title: L("Send a vague prompt", "Envoie un prompt flou"),
      body: L("Let's see the problem for real. This starts Claude Code with a first request. Read the yellow “Assumed” lines in the output: they're the agent's guesses.", "Voyons le problème en vrai. Cette commande lance Claude Code avec une première demande. Lis les lignes jaunes « Supposé » : ce sont les suppositions de l'agent."),
      command: 'claude "add a discount"',
      check: (w, s) => c.someRun(w, s, (r) => r.task === "discount" && r.outcome === "partial"),
      success: L("It created src/discount.js — a JavaScript file in a TypeScript project — with a hard-coded 10% and no test. Not wrong, just guessed. Open the Run tab to see everything it assumed.", "Il a créé src/discount.js — un fichier JavaScript dans un projet TypeScript — avec 10 % en dur et aucun test. Pas faux, juste deviné. Ouvre l'onglet Exécution pour voir tout ce qu'il a supposé."),
    },
    {
      kind: "challenge",
      title: L("Challenge: get it right", "Défi : obtiens le bon résultat"),
      body: L("You're still talking to Claude Code. Write your own prompt so the agent adds a correct discount to src/cart.ts, with tests it runs itself. Mention the file with @, say how the discount works, and ask for tests.", "Tu parles toujours à Claude Code. Écris ton propre prompt pour que l'agent ajoute une remise correcte dans src/cart.ts, avec des tests qu'il lance lui-même. Cite le fichier avec @, explique le calcul, et demande des tests."),
      objectives: [
        {
          id: "score",
          label: L("Send a prompt that scores 4/6 or more", "Envoie un prompt noté 4/6 ou plus"),
          check: (w, s) => c.someRun(w, s, (r) => r.report.score >= 4),
          hints: [
            L("The score counts the six ingredients: goal, context, constraints, verification, details, done criteria.", "Le score compte les six ingrédients : objectif, contexte, contraintes, vérification, détails, critère de fin."),
            L("Name the file with @src/cart.ts, give a number (20%), add a limit (never below 0) and ask for tests.", "Cite le fichier avec @src/cart.ts, donne un chiffre (20 %), une limite (jamais sous 0) et demande des tests."),
            L(`Type: ${P_DISCOUNT}`, `Tape : ${P_DISCOUNT}`),
          ],
        },
        {
          id: "done",
          label: L("The agent adds the discount without guessing", "L'agent ajoute la remise sans rien deviner"),
          check: (w, s) => c.someRun(w, s, (r) => r.task === "discount" && r.outcome === "done"),
          hints: [
            L("The agent guesses whatever your prompt leaves out. Check the yellow “Assumed” lines after each try.", "L'agent devine tout ce que ton prompt ne dit pas. Regarde les lignes jaunes « Supposé » après chaque essai."),
            L("For a discount it needs: the file, the rule (how much, which limit) and whether to test.", "Pour une remise il lui faut : le fichier, la règle (combien, quelle limite) et s'il faut tester."),
            L(`Type: ${P_DISCOUNT}`, `Tape : ${P_DISCOUNT}`),
          ],
        },
        {
          id: "tests",
          label: L("The agent runs the tests", "L'agent lance les tests"),
          check: (w, s) => c.someRun(w, s, (r) => r.task === "discount" && c.ranTests(r)),
          hints: [L("Agents verify when you ask them to.", "Les agents vérifient quand tu le leur demandes."), L("Add “Add tests and run them” to your prompt.", "Ajoute « Ajoute des tests et lance-les » à ton prompt."), L(`Type: ${P_DISCOUNT}`, `Tape : ${P_DISCOUNT}`)],
        },
      ],
      feedback: (w, s) => {
        const r = c.lastRunOf(w, s);
        if (!r) return w.session ? null : L("You left the session. Type claude to start it again.", "Tu as quitté la session. Tape claude pour la relancer.");
        if (r.task === "discount" && r.assumed.length) {
          const names = { context: L("which file", "quel fichier"), specific: L("the discount rule", "la règle de remise"), verify: L("tests", "les tests"), constraints: L("limits", "les limites"), done: L("when it's done", "quand c'est fini"), goal: L("the goal", "l'objectif") };
          return L(
            `Close! The agent still had to guess: ${r.assumed.map((a) => names[a].en).join(", ")}.`,
            `Presque ! L'agent a encore dû deviner : ${r.assumed.map((a) => names[a].fr).join(", ")}.`,
          );
        }
        return null;
      },
    },
    { kind: "celebrate" },
  ],
};

// ───────────────────────────────────────────── Chapter 2 — The art of prompting

export const contextWindow: LessonDef = {
  id: "context-window",
  chapterId: "prompting",
  title: L("Context is everything", "Le contexte, c'est tout"),
  tagline: L("What the agent sees is all it knows", "Ce que l'agent voit, c'est tout ce qu'il sait"),
  xp: 100,
  concepts: [L("context window", "fenêtre de contexte"), L("tokens", "tokens"), L("@file mentions", "mentions @fichier")],
  commands: ['claude -p "…"', "/context"],
  ui: UI_RUN,
  setup: () => shop(),
  recap: [
    L("An agent only knows what's in its context window: its own instructions, your rules, the files it read and your prompt.", "Un agent ne sait que ce qui est dans sa fenêtre de contexte : ses propres instructions, tes règles, les fichiers lus et ton prompt."),
    L("Context is measured in tokens (≈ ¾ of a word). It's limited, it costs money and too much noise makes the agent worse.", "Le contexte se mesure en tokens (≈ ¾ de mot). Il est limité, il coûte de l'argent et trop de bruit rend l'agent moins bon."),
    L("Point at files with @path: the agent reads just those instead of searching everywhere.", "Désigne les fichiers avec @chemin : l'agent lit juste ceux-là au lieu de tout fouiller."),
  ],
  steps: [
    {
      kind: "discover",
      title: L("The agent's desk", "Le bureau de l'agent"),
      body: [
        L("Picture the agent's context window as a desk. Everything it uses to answer must fit on it: its instructions, your rules, the files it opened, your conversation.", "Imagine la fenêtre de contexte comme un bureau. Tout ce que l'agent utilise pour répondre doit y tenir : ses instructions, tes règles, les fichiers ouverts, votre conversation."),
        L("Add things to the desk below. When it's full, older things get summarized (that's /compact) — and details get lost.", "Ajoute des choses sur le bureau ci-dessous. Quand il est plein, les plus anciennes sont résumées (c'est /compact) — et des détails se perdent."),
      ],
      scene: "context-window",
    },
    {
      kind: "try",
      title: L("Without context", "Sans contexte"),
      body: L("claude -p answers once and exits (“headless” mode, handy for scripts). Ask it to fix the bug without saying where it is. Watch the context panel: the agent has to search.", "claude -p répond une fois puis s'arrête (mode « headless », pratique pour les scripts). Demande-lui de corriger le bug sans dire où il est. Regarde le panneau de contexte : l'agent doit chercher."),
      command: 'claude -p "Fix the total bug"',
      check: (w, s) => c.someRun(w, s, (r) => r.task === "fix-total" && r.context.some((i) => i.label.endsWith("(search)"))),
      success: L("It searched and read every code file to find the bug. It worked here, but in a real project with thousands of files that's slow, costly — and it may fix the wrong thing.", "Il a cherché et lu tous les fichiers de code pour trouver le bug. Ça a marché ici, mais dans un vrai projet de milliers de fichiers, c'est lent, coûteux — et il peut corriger la mauvaise chose."),
    },
    {
      kind: "try",
      title: L("Point at the file", "Désigne le fichier"),
      body: L("Now give it the file with @. In real tools, typing @ opens a file picker.", "Maintenant, donne-lui le fichier avec @. Dans les vrais outils, taper @ ouvre un sélecteur de fichiers."),
      command: `claude -p "${P_TOTAL}"`,
      check: (w, s) => c.someRun(w, s, (r) => r.task === "fix-total" && r.report.files.includes("src/cart.ts") && r.outcome === "done"),
      success: L("It read only src/cart.ts, fixed the bug, added a test and ran it. Less context, better result.", "Il n'a lu que src/cart.ts, corrigé le bug, ajouté un test et l'a lancé. Moins de contexte, meilleur résultat."),
    },
    {
      kind: "experiment",
      title: L("Look inside the context", "Regarde dans le contexte"),
      body: L("Open a session and type /context: Claude Code shows what fills its window, item by item. Compare with the bar above the terminal.", "Ouvre une session et tape /context : Claude Code montre ce qui remplit sa fenêtre, élément par élément. Compare avec la barre au-dessus du terminal."),
      ideas: ["claude", "/context", "/compact", "/exit"],
    },
    {
      kind: "challenge",
      title: L("Challenge: lean and right", "Défi : léger et juste"),
      body: L("Get any agent to switch prices to euros (“12,50 €”) in src/price.ts — reading only that file, keeping the function name formatPrice.", "Fais passer les prix en euros (« 12,50 € ») dans src/price.ts par n'importe quel agent — en ne lisant que ce fichier, et en gardant le nom formatPrice."),
      objectives: [
        {
          id: "lean",
          label: L("The agent reads src/price.ts without searching", "L'agent lit src/price.ts sans chercher"),
          check: (w, s) => c.someRun(w, s, (r) => r.task === "euro" && r.report.files.includes("src/price.ts") && !r.context.some((i) => i.label.endsWith("(search)"))),
          hints: [L("Mention the file so the agent doesn't need to search.", "Cite le fichier pour que l'agent n'ait pas besoin de chercher."), L("Use @src/price.ts in your prompt.", "Mets @src/price.ts dans ton prompt."), L(`Type: claude -p "${P_EURO}"`, `Tape : claude -p "${P_EURO}"`)],
        },
        {
          id: "done",
          label: L("Prices show “12,50 €” and formatPrice keeps its name", "Les prix affichent « 12,50 € » et formatPrice garde son nom"),
          check: (w) => c.fileHas(w, "src/price.ts", /export function formatPrice[\s\S]*replace\("\.", ","\)/),
          hints: [
            L("Without an example the agent picks its own format, and without a constraint it may rename the function.", "Sans exemple, l'agent choisit son propre format, et sans contrainte il peut renommer la fonction."),
            L("Show the exact format in quotes and say “Keep the name formatPrice”.", "Montre le format exact entre guillemets et dis « Garde le nom formatPrice »."),
            L(`Type: claude -p "${P_EURO}"`, `Tape : claude -p "${P_EURO}"`),
          ],
        },
      ],
      feedback: (w, s) => {
        const r = c.lastRunOf(w, s);
        if (r?.task === "euro" && r.assumed.includes("constraints")) return L("The agent renamed the function to formatEuro: other files still import formatPrice! Tell it to keep the name.", "L'agent a renommé la fonction en formatEuro : d'autres fichiers importent encore formatPrice ! Dis-lui de garder le nom.");
        if (r?.task === "euro" && r.assumed.includes("specific")) return L("It used “€12.50”. Show the exact format you want, in quotes.", "Il a utilisé « €12.50 ». Montre le format exact voulu, entre guillemets.");
        return null;
      },
    },
    { kind: "celebrate" },
  ],
};

export const planVerify: LessonDef = {
  id: "plan-verify",
  chapterId: "prompting",
  title: L("Plan first, then verify", "D'abord le plan, ensuite la vérification"),
  tagline: L("Review the plan before the code", "Relire le plan avant le code"),
  xp: 110,
  concepts: [L("plan mode", "mode plan"), L("approval", "validation"), L("verification loop", "boucle de vérification")],
  commands: ["claude --permission-mode plan", "/plan"],
  ui: UI_RUN,
  setup: () => shop(),
  recap: [
    L("In plan mode the agent reads and proposes, but changes nothing until you approve.", "En mode plan, l'agent lit et propose, mais ne change rien tant que tu n'as pas validé."),
    L("Fixing a plan costs one sentence; fixing code costs a review. Plan for anything bigger than a small fix.", "Corriger un plan coûte une phrase ; corriger du code coûte une relecture. Planifie tout ce qui dépasse une petite correction."),
    L("Close the loop: ask the agent to run tests so it checks its own work.", "Boucle la boucle : demande à l'agent de lancer les tests pour qu'il vérifie son propre travail."),
  ],
  steps: [
    {
      kind: "discover",
      title: L("Measure twice, cut once", "Mesurer deux fois, couper une fois"),
      body: [
        L("For bigger tasks, good developers ask the agent for a plan first. The agent explores and proposes steps; you read them, correct them, then let it act.", "Pour les tâches plus grosses, les bons développeurs demandent d'abord un plan. L'agent explore et propose des étapes ; tu les lis, tu corriges, puis tu le laisses agir."),
        L("Then the agent verifies its own work by running the tests. Step through the loop.", "Ensuite l'agent vérifie son propre travail en lançant les tests. Parcours la boucle."),
      ],
      scene: "plan-act",
    },
    {
      kind: "try",
      title: L("Start in plan mode", "Démarre en mode plan"),
      body: L("Claude Code can start directly in plan mode. In the real app, Shift+Tab switches modes during a session; here you can also type /plan.", "Claude Code peut démarrer directement en mode plan. Dans la vraie appli, Maj+Tab change de mode en cours de session ; ici tu peux aussi taper /plan."),
      command: "claude --permission-mode plan",
      check: (w) => !!w.session?.plan,
      success: L("Plan mode is on (⏸). The agent will propose before it acts.", "Le mode plan est activé (⏸). L'agent proposera avant d'agir."),
    },
    {
      kind: "try",
      title: L("Ask for a change", "Demande un changement"),
      body: L("Ask for the euro formatting. The agent will answer with a plan — and change nothing yet.", "Demande le format en euros. L'agent répondra par un plan — sans rien changer pour l'instant."),
      command: P_EURO,
      check: (w, s) => c.someRun(w, s, (r) => r.outcome === "plan"),
      success: L("A numbered plan, and the files are untouched. This is your moment to say “no, use a comma” or “also update the README”.", "Un plan numéroté, et les fichiers sont intacts. C'est le moment de dire « non, mets une virgule » ou « mets aussi le README à jour »."),
    },
    {
      kind: "try",
      title: L("Approve the plan", "Valide le plan"),
      body: L("The plan looks right. Approve it and watch the agent act, then verify.", "Le plan est bon. Valide-le et regarde l'agent agir, puis vérifier."),
      command: "yes",
      check: (w, s) => c.someRun(w, s, (r) => r.task === "euro" && r.phases.includes("act") && r.phases.includes("verify")),
      success: L("Plan → act → verify: the full loop. The Run tab shows each phase.", "Plan → action → vérification : la boucle complète. L'onglet Exécution montre chaque phase."),
    },
    {
      kind: "challenge",
      title: L("Challenge: the careful fix", "Défi : la correction prudente"),
      body: L("Fix the total() bug the careful way: get a plan first, approve it, and make sure the agent adds a test and runs it.", "Corrige le bug de total() avec prudence : obtiens d'abord un plan, valide-le, et assure-toi que l'agent ajoute un test et le lance."),
      objectives: [
        {
          id: "plan",
          label: L("Get a plan for the total() fix", "Obtiens un plan pour corriger total()"),
          check: (w, s) => c.someRun(w, s, (r) => r.task === "fix-total" && r.outcome === "plan"),
          hints: [L("Plan mode must be on when you send the request.", "Le mode plan doit être activé quand tu envoies la demande."), L("You're still in plan mode — just describe the fix.", "Tu es toujours en mode plan — décris simplement la correction."), L(`Type: ${P_TOTAL}`, `Tape : ${P_TOTAL}`)],
        },
        {
          id: "fixed",
          label: L("total() multiplies by quantity", "total() multiplie par la quantité"),
          check: (w) => c.fileHas(w, "src/cart.ts", /item\.price \* item\.quantity/),
          hints: [L("A plan alone changes nothing.", "Un plan seul ne change rien."), L("Approve the plan.", "Valide le plan."), L("Type: yes", "Tape : oui")],
        },
        {
          id: "tested",
          label: L("A test for quantities was added and run", "Un test sur les quantités a été ajouté et lancé"),
          check: (w, s) => c.fileHas(w, "tests/cart.test.ts", /multiplies by quantity/) && c.someRun(w, s, (r) => r.task === "fix-total" && c.ranTests(r)),
          hints: [L("The agent only tests when asked.", "L'agent ne teste que si on le lui demande."), L("Ask for a test in the request, then approve.", "Demande un test dans ta requête, puis valide."), L(`Type: ${P_TOTAL} — then: yes`, `Tape : ${P_TOTAL} — puis : oui`)],
        },
      ],
      feedback: (w) => (w.session?.pending ? L("A plan is waiting for you. Type yes to approve, or tell the agent what to change.", "Un plan t'attend. Tape oui pour valider, ou dis à l'agent quoi changer.") : !w.session ? L("You left the session. Type claude --permission-mode plan to come back.", "Tu as quitté la session. Tape claude --permission-mode plan pour revenir.") : null),
    },
    { kind: "celebrate" },
  ],
};
