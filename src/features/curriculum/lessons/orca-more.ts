import { tx as L, type OrchTask, type World } from "@/engine";
import * as c from "../checks";
import { AGENTS_MD, P_EURO, P_TOTAL, shop } from "../scenario";
import type { LessonDef, Solution, StoryDef } from "../types";

const UI_ORCA = { files: true, editor: true, run: true, orca: true };
/** Claude imports AGENTS.md, so every worker uses pnpm, whichever agent it is. */
const TEAM_RULES = { "AGENTS.md": AGENTS_MD, "CLAUDE.md": "@AGENTS.md\n" };

const CHANGELOG_SPEC = "Update CHANGELOG.md: add an Unreleased section at the top with one line per change. It must group entries under Added and Fixed.";

// ───────────────────────────────────────────── Orchestration: a coordinator Run

const RUN_CMD = 'orca orchestration run-create --objective "Euro prices and the total fix, then a changelog"';
const TASK_EURO = `orca orchestration task-create --task-title euro --spec "${P_EURO}"`;
const TASK_TOTAL = `orca orchestration task-create --task-title fix-total --spec "${P_TOTAL}"`;
const START_1 = "orca orchestration worker-start --task task_1 --agent claude";
const START_2 = "orca orchestration worker-start --task task_2 --agent codex";
const TASK_CHANGELOG = `orca orchestration task-create --task-title changelog --deps '["task_1","task_2"]' --spec "${CHANGELOG_SPEC}"`;
const START_3 = "orca orchestration worker-start --task task_3 --agent claude";

const tasks = (w: World) => w.orchestration?.tasks ?? [];
const task = (w: World, id: string) => tasks(w).find((t) => t.id === id);
const mergedTask = (w: World, t: OrchTask | undefined) => !!t?.worktree && !!c.worktree(w, t.worktree)?.merged;
/** Changelog tasks that wait for both independent tasks. */
const changelogTasks = (w: World) => tasks(w).filter((t) => t.deps.includes("task_1") && t.deps.includes("task_2") && /changelog/i.test(t.spec));
const listsBoth = (text: string | undefined) => /euros/i.test(text ?? "") && /total bug/i.test(text ?? "");
const wtChangelog = (w: World, t: OrchTask) => (t.worktree ? c.worktree(w, t.worktree)?.files["CHANGELOG.md"] : undefined);

export const orchestration: LessonDef = {
  id: "orchestration",
  chapterId: "orca",
  title: L("A coordinator with tasks and dependencies", "Un coordinateur avec des tâches et des dépendances"),
  tagline: L("Split the work, start workers, merge, then the next step", "Découpe le travail, lance des workers, fusionne, puis l'étape suivante"),
  xp: 160,
  concepts: [L("orchestration Run", "Run d'orchestration"), L("task dependencies", "dépendances entre tâches"), L("specs are prompts", "une spec est un prompt")],
  commands: ["orca orchestration run-create", "orca orchestration task-create", "orca orchestration worker-start", "orca orchestration check", "git merge"],
  ui: UI_ORCA,
  setup: () => shop(TEAM_RULES),
  recap: [
    L("A Run holds the objective; tasks split it into pieces. A task with --deps waits until the tasks it depends on are completed.", "Un Run porte l'objectif ; les tâches le découpent en morceaux. Une tâche avec --deps attend que les tâches dont elle dépend soient terminées."),
    L("worker-start gives one task to one agent, in its own worktree, and the worker reports to your inbox (orca orchestration check). Merging its branch is still your job.", "worker-start confie une tâche à un agent, dans son propre worktree, et le worker écrit dans ta boîte (orca orchestration check). Fusionner sa branche reste ton travail."),
    L("The spec is the worker's whole prompt: it never sees your conversation and nobody answers its questions. Write it complete: file, rule, format, tests, when it's done.", "La spec est tout le prompt du worker : il ne voit jamais ta conversation et personne ne répond à ses questions. Écris-la complète : fichier, règle, format, tests, critère de fin."),
  ],
  steps: [
    {
      kind: "discover",
      title: L("From two agents to a plan", "De deux agents à un plan"),
      body: [
        L("With worktrees you started agents one by one. When the work has an order (fix two things, then write the changelog that describes them), you want a plan: a list of tasks, who waits for whom, and a place where workers report back.", "Avec les worktrees, tu lançais les agents un par un. Quand le travail a un ordre (corriger deux choses, puis écrire le changelog qui les décrit), il te faut un plan : une liste de tâches, qui attend qui, et un endroit où les workers font leur compte rendu."),
        L("That's an orchestration Run in Orca. You are the coordinator. Press Next to follow one from start to finish.", "C'est un Run d'orchestration dans Orca. Le coordinateur, c'est toi. Appuie sur Suivant pour en suivre un du début à la fin."),
      ],
      scene: "story:orchestration",
    },
    {
      kind: "try",
      title: L("Create the Run", "Crée le Run"),
      body: L("A Run starts with an objective: what the whole team should achieve.", "Un Run commence par un objectif : ce que toute l'équipe doit accomplir."),
      command: RUN_CMD,
      check: (w) => !!w.orchestration?.run,
      success: L("run_1 is bound to this terminal: you're the coordinator. Now split the work.", "run_1 est lié à ce terminal : tu es le coordinateur. Maintenant, découpe le travail."),
    },
    {
      kind: "try",
      title: L("First task: euro prices", "Première tâche : les prix en euros"),
      body: L("The spec is exactly what the worker will receive as its prompt. This one names the file, the format, what to keep and how to check.", "La spec est exactement ce que le worker recevra comme prompt. Celle-ci nomme le fichier, le format, ce qu'il faut garder et comment vérifier."),
      command: TASK_EURO,
      check: (w) => tasks(w).length >= 1,
      success: L("task_1 is ready: it depends on nothing, so it can start any time.", "task_1 est prête : elle ne dépend de rien, elle peut démarrer quand tu veux."),
    },
    {
      kind: "try",
      title: L("Second task: the total fix", "Deuxième tâche : la correction du total"),
      body: L("It touches src/cart.ts, the first one src/price.ts: different files, so the two can run in parallel and merge without conflict.", "Elle touche src/cart.ts, la première src/price.ts : des fichiers différents, donc les deux peuvent tourner en parallèle et fusionner sans conflit."),
      command: TASK_TOTAL,
      check: (w) => tasks(w).length >= 2,
      success: L("task_2 is ready too. Type orca orchestration task-list any time to see the plan.", "task_2 est prête aussi. Tape orca orchestration task-list quand tu veux pour voir le plan."),
    },
    {
      kind: "try",
      title: L("Start a worker", "Lance un worker"),
      body: L("Give task_1 to Claude Code. Orca creates a worktree named after the task and sends the spec as the prompt.", "Confie task_1 à Claude Code. Orca crée un worktree au nom de la tâche et envoie la spec comme prompt."),
      command: START_1,
      check: (w) => task(w, "task_1")?.status === "completed",
      success: L("A new lane, euro, appeared above the terminal. The worker finished and left a message in your inbox.", "Un nouveau couloir, euro, est apparu au-dessus du terminal. Le worker a fini et t'a laissé un message."),
    },
    {
      kind: "try",
      title: L("Read the inbox", "Lis ta boîte"),
      body: L("Workers don't interrupt you: they report to the coordinator's inbox.", "Les workers ne t'interrompent pas : ils écrivent dans la boîte du coordinateur."),
      command: "orca orchestration check",
      check: (_w, _s, ran) => ran.includes("orca orchestration check"),
      success: L("“Done. Changed src/price.ts, tests/price.test.ts.” A short report, so you know what to review before merging.", "« Done. Changed src/price.ts, tests/price.test.ts. » Un compte rendu court, pour savoir quoi relire avant de fusionner."),
    },
    {
      kind: "challenge",
      title: L("Challenge: finish the Run", "Défi : termine le Run"),
      body: L(
        "Add a third task that writes the changelog and waits for task_1 and task_2 (--deps). Write its spec as a complete prompt: the worker can't ask you anything. Start task_2 with another agent, merge both branches, then start the changelog task and merge it too. Careful: a worktree is a copy of main, so the changelog worker only sees what you already merged.",
        "Ajoute une troisième tâche qui écrit le changelog et attend task_1 et task_2 (--deps). Écris sa spec comme un prompt complet : le worker ne peut rien te demander. Lance task_2 avec un autre agent, fusionne les deux branches, puis lance la tâche du changelog et fusionne-la aussi. Attention : un worktree est une copie de main, donc le worker du changelog ne voit que ce que tu as déjà fusionné.",
      ),
      objectives: [
        {
          id: "deps",
          label: L("A changelog task waits for task_1 and task_2", "Une tâche changelog attend task_1 et task_2"),
          check: (w) => changelogTasks(w).length > 0,
          hints: [
            L("task-create takes --deps, a JSON list of task ids, in single quotes.", "task-create accepte --deps, une liste JSON d'ids de tâches, entre apostrophes."),
            L(`Say which file, which section, the format and when it's done, e.g. "${CHANGELOG_SPEC}"`, `Dis quel fichier, quelle section, le format et le critère de fin, ex. « ${CHANGELOG_SPEC} »`),
            L(`Type: ${TASK_CHANGELOG}`, `Tape : ${TASK_CHANGELOG}`),
          ],
        },
        {
          id: "merged",
          label: L("task_2 is done, and both branches are merged into main", "task_2 est terminée, et les deux branches sont fusionnées dans main"),
          check: (w) => task(w, "task_2")?.status === "completed" && mergedTask(w, task(w, "task_1")) && mergedTask(w, task(w, "task_2")),
          hints: [
            L("worker-start takes --task and --agent. Then merge each worker's branch: it's named after its worktree.", "worker-start accepte --task et --agent. Puis fusionne la branche de chaque worker : elle porte le nom de son worktree."),
            L("Start task_2 with Codex, then git merge euro and git merge fix-total.", "Lance task_2 avec Codex, puis git merge euro et git merge fix-total."),
            L(`Type: ${START_2}, then: git merge euro, then: git merge fix-total`, `Tape : ${START_2}, puis : git merge euro, puis : git merge fix-total`),
          ],
        },
        {
          id: "changelog",
          label: L("The changelog is written without guessing, lists both changes, and is merged into main", "Le changelog est écrit sans deviner, liste les deux changements, et est fusionné dans main"),
          check: (w) =>
            changelogTasks(w).some((t) => t.status === "completed" && !!t.result?.startsWith("done") && listsBoth(wtChangelog(w, t)) && mergedTask(w, t)) && listsBoth(w.files["CHANGELOG.md"]),
          hints: [
            L("Once task_1 and task_2 are completed, the changelog task becomes ready. Start it after the merges, so its worktree contains the work.", "Quand task_1 et task_2 sont terminées, la tâche du changelog devient prête. Lance-la après les fusions, pour que son worktree contienne le travail."),
            L("worker-start on the changelog task, read the inbox, then merge its branch.", "worker-start sur la tâche du changelog, lis la boîte, puis fusionne sa branche."),
            L(`Type: ${START_3}, then: git merge changelog`, `Tape : ${START_3}, puis : git merge changelog`),
          ],
        },
      ],
      feedback: (w) => {
        const good = changelogTasks(w).find((t) => t.status === "completed" && !!t.result?.startsWith("done") && listsBoth(wtChangelog(w, t)));
        if (good) return mergedTask(w, good) ? null : L(`The changelog is ready in the ${good.worktree} worktree. Merge it: git merge ${good.worktree}`, `Le changelog est prêt dans le worktree ${good.worktree}. Fusionne-le : git merge ${good.worktree}`);
        for (const t of changelogTasks(w).filter((x) => x.status === "completed").reverse()) {
          if (t.result?.startsWith("partial"))
            return L(`${t.id} finished with guesses (read the inbox): its spec didn't say the format or when it's done. A finished task can't be rerun: create a new one with a complete spec, and start it with --name changelog-2.`, `${t.id} a fini en devinant (lis la boîte) : sa spec ne disait ni le format ni le critère de fin. Une tâche terminée ne se relance pas : crée-en une nouvelle avec une spec complète, et lance-la avec --name changelog-2.`);
          return L(`${t.id} started before you merged euro and fix-total, so its worktree (a copy of main) didn't have the work and the changelog is generic. Merge both, then create and start a new changelog task with --name changelog-2.`, `${t.id} a démarré avant que tu fusionnes euro et fix-total, donc son worktree (une copie de main) n'avait pas le travail et le changelog est générique. Fusionne les deux, puis crée et lance une nouvelle tâche changelog avec --name changelog-2.`);
        }
        return null;
      },
    },
    {
      kind: "experiment",
      title: L("Experiment", "Expérimente"),
      body: L("Look at the plan from every angle. task-list --ready shows what can start right now.", "Regarde le plan sous tous les angles. task-list --ready montre ce qui peut démarrer tout de suite."),
      ideas: ["orca orchestration task-list", "orca orchestration task-list --ready", "orca orchestration check --all", "orca orchestration run-show", "orca worktree ps"],
    },
    { kind: "celebrate" },
  ],
};

// ───────────────────────────────────────────── Automations: prompts on a schedule

const CREATE_VAGUE = 'orca automations create --name "Weekday changelog" --trigger weekdays --time 09:00 --prompt "Update the changelog" --provider claude --repo path:~/project --disabled';
const EDIT_PROMPT = `orca automations edit auto_1 --prompt "${CHANGELOG_SPEC}"`;
const RUN_AUTO = "orca automations run auto_1";
const ENABLE = "orca automations edit auto_1 --enabled";

const auto = (w: World) => w.automations?.[0];
const autoDone = (w: World) => !!auto(w)?.runs.some((r) => r.outcome === "done");
/** The prompt an automation run actually used. */
const promptOfRun = (w: World, runId: number) => w.runs.find((r) => r.id === runId)?.prompt;

export const automations: LessonDef = {
  id: "automations",
  chapterId: "orca",
  title: L("Automations: prompts on a schedule", "Automatisations : des prompts planifiés"),
  tagline: L("Nobody will be there to answer", "Personne ne sera là pour répondre"),
  xp: 140,
  concepts: [L("automations", "automatisations"), L("test before you enable", "tester avant d'activer"), L("unattended prompts", "prompts sans surveillance")],
  commands: ["orca automations create", "orca automations run", "orca automations edit", "orca terminal read"],
  ui: UI_ORCA,
  setup: () => shop(TEAM_RULES),
  recap: [
    L("An automation is a prompt that an agent runs on a schedule (daily, weekdays, weekly, hourly or a cron), in a fresh worktree each time.", "Une automatisation est un prompt qu'un agent exécute selon un planning (daily, weekdays, weekly, hourly ou un cron), dans un worktree neuf à chaque fois."),
    L("Create it with --disabled, run it once with orca automations run, read the result, and enable it only when the test run is done without guessing.", "Crée-la avec --disabled, lance-la une fois avec orca automations run, lis le résultat, et active-la seulement quand l'essai finit sans deviner."),
    L("Nobody answers an unattended prompt: it must say everything. Which file, which format, how to check, and what done looks like.", "Personne ne répond à un prompt sans surveillance : il doit tout dire. Quel fichier, quel format, comment vérifier, et à quoi ressemble le travail fini."),
  ],
  steps: [
    {
      kind: "discover",
      title: L("A teammate who works at 9:00 sharp", "Un coéquipier qui travaille à 9 h pile"),
      body: [
        L("Some prompts you'd type every morning: update the changelog, check the dependencies, summarize yesterday's work. An automation runs one for you, on a schedule, while you do something else.", "Certains prompts, tu les taperais tous les matins : mettre à jour le changelog, vérifier les dépendances, résumer le travail de la veille. Une automatisation en lance un pour toi, selon un planning, pendant que tu fais autre chose."),
        L("The catch: when it runs, you're not there. If the prompt is vague, the agent guesses, every single day. Press Next to see the safe way to set one up.", "Le piège : quand elle tourne, tu n'es pas là. Si le prompt est vague, l'agent devine, chaque jour. Appuie sur Suivant pour voir la bonne façon d'en installer une."),
      ],
      scene: "story:automations",
    },
    {
      kind: "try",
      title: L("Create it, switched off", "Crée-la, éteinte"),
      body: L("Every weekday at 9:00, Claude Code should update the changelog. Start with --disabled: nothing runs until you've tested it.", "Chaque jour de semaine à 9 h, Claude Code doit mettre à jour le changelog. Commence avec --disabled : rien ne tourne tant que tu ne l'as pas testée."),
      command: CREATE_VAGUE,
      check: (w) => !!auto(w) && !auto(w)!.enabled,
      success: L("auto_1 exists, switched off. --repo path:~/project means each run gets a fresh worktree of this project.", "auto_1 existe, éteinte. --repo path:~/project veut dire que chaque exécution reçoit un worktree neuf de ce projet."),
    },
    {
      kind: "try",
      title: L("Run it once to test", "Lance-la une fois pour tester"),
      body: L("orca automations run starts it now, exactly as the schedule would.", "orca automations run la démarre tout de suite, exactement comme le ferait le planning."),
      command: RUN_AUTO,
      check: (w) => !!auto(w)?.runs.length,
      success: L("Partial: the agent had to guess. Imagine that every weekday, with nobody reading it.", "Partiel : l'agent a dû deviner. Imagine ça chaque jour de semaine, sans personne pour le lire."),
    },
    {
      kind: "try",
      title: L("Read what it did", "Lis ce qu'elle a fait"),
      body: L("Each run has its own worktree and terminal. Read its output to see what it assumed.", "Chaque exécution a son propre worktree et son terminal. Lis sa sortie pour voir ce qu'elle a supposé."),
      command: "orca terminal read --terminal term-weekday-changelog-1",
      check: (_w, _s, ran) => ran.includes("orca terminal read"),
      success: L("Two “Assumed” lines: no format was given, and it didn't know where to write, so it appended a loose list at the bottom. The prompt is the problem, not the agent.", "Deux lignes « Supposé » : aucun format n'était donné, et il ne savait pas où écrire, alors il a ajouté une liste en vrac à la fin. Le problème, c'est le prompt, pas l'agent."),
    },
    {
      kind: "challenge",
      title: L("Challenge: make it safe to switch on", "Défi : rends-la sûre à activer"),
      body: L(
        "Rewrite auto_1's prompt so it says everything (which file, which section, one line per change, and what done looks like), test it again until the run is done, and only then enable it.",
        "Réécris le prompt de auto_1 pour qu'il dise tout (quel fichier, quelle section, une ligne par changement, et à quoi ressemble le travail fini), teste-la à nouveau jusqu'à ce que l'exécution soit terminée, et seulement alors active-la.",
      ),
      objectives: [
        {
          id: "tested",
          label: L("A test run finishes without guessing", "Un essai se termine sans deviner"),
          check: autoDone,
          hints: [
            L("Change the prompt with orca automations edit, then run it again.", "Change le prompt avec orca automations edit, puis relance-la."),
            L(`Name the file, the section, the format and the done criterion, e.g. "${CHANGELOG_SPEC}"`, `Nomme le fichier, la section, le format et le critère de fin, ex. « ${CHANGELOG_SPEC} »`),
            L(`Type: ${EDIT_PROMPT}, then: ${RUN_AUTO}`, `Tape : ${EDIT_PROMPT}, puis : ${RUN_AUTO}`),
          ],
        },
        {
          id: "enabled",
          label: L("auto_1 is enabled, after a successful test", "auto_1 est activée, après un essai réussi"),
          check: (w) => !!auto(w)?.enabled && autoDone(w),
          hints: [
            L("edit can switch an automation on or off.", "edit peut allumer ou éteindre une automatisation."),
            L("Use orca automations edit auto_1 with --enabled.", "Utilise orca automations edit auto_1 avec --enabled."),
            L(`Type: ${ENABLE}`, `Tape : ${ENABLE}`),
          ],
        },
      ],
      feedback: (w) => {
        const a = auto(w);
        if (!a) return L("auto_1 is gone. Create it again with --disabled (see the first step).", "auto_1 a disparu. Recrée-la avec --disabled (voir la première étape).");
        if (autoDone(w)) return a.enabled ? null : L("The test run is done. Now switch it on: " + ENABLE, "L'essai est réussi. Maintenant, allume-la : " + ENABLE);
        if (a.enabled) return L("You switched it on before it worked: every weekday at 9:00 it would guess again, with nobody watching. Turn it off (--disabled), fix the prompt and test it first.", "Tu l'as allumée avant qu'elle marche : chaque jour de semaine à 9 h, elle devinerait encore, sans personne pour regarder. Éteins-la (--disabled), corrige le prompt et teste-la d'abord.");
        const lastRun = a.runs.at(-1);
        if (lastRun && promptOfRun(w, lastRun.run) !== a.prompt) return L("You changed the prompt. Test it again: " + RUN_AUTO, "Tu as changé le prompt. Teste-le à nouveau : " + RUN_AUTO);
        if (lastRun && a.prompt !== "Update the changelog")
          return L("Still guessing. Say where to write (CHANGELOG.md, an Unreleased section at the top), the format (one line per change) and what done looks like (grouped under Added and Fixed).", "Il devine encore. Dis où écrire (CHANGELOG.md, une section Unreleased en haut), le format (une ligne par changement) et à quoi ressemble le travail fini (groupé sous Added et Fixed).");
        return null;
      },
    },
    {
      kind: "experiment",
      title: L("Experiment", "Expérimente"),
      body: L("Change the schedule, look at the history of runs, or add a second automation. A 5-field cron works too, like \"0 9 * * 1-5\".", "Change le planning, regarde l'historique des exécutions, ou ajoute une seconde automatisation. Un cron à 5 champs marche aussi, comme \"0 9 * * 1-5\"."),
      ideas: ["orca automations list", "orca automations show auto_1", "orca automations runs --id auto_1", "orca automations edit auto_1 --trigger weekly --day 1 --time 08:30"],
    },
    { kind: "celebrate" },
  ],
};

export const lessons: LessonDef[] = [orchestration, automations];

export const solutions: Record<string, Solution> = {
  orchestration: [TASK_CHANGELOG, START_2, "orca orchestration check", "git merge euro", "git merge fix-total", START_3, "orca orchestration check", "git merge changelog"],
  automations: [EDIT_PROMPT, RUN_AUTO, ENABLE],
};

export const stories: Record<string, StoryDef> = {
  orchestration: {
    intro: L("You coordinate; the workers do the tasks. Follow one Run from the objective to the last merge.", "Tu coordonnes ; les workers font les tâches. Suis un Run de l'objectif à la dernière fusion."),
    steps: [
      {
        name: L("Objective", "Objectif"),
        line: '$ orca orchestration run-create --objective "Euro prices and the total fix, then a changelog"',
        note: L("The Run holds the goal and binds this terminal as the coordinator.", "Le Run porte le but et fait de ce terminal le coordinateur."),
        tone: "tool",
      },
      {
        name: L("Tasks", "Tâches"),
        line: "task_1 ready · euro       task_2 ready · fix-total",
        note: L("Two tasks in different files, with no dependencies: both can start right away, in parallel.", "Deux tâches dans des fichiers différents, sans dépendance : les deux peuvent démarrer tout de suite, en parallèle."),
        tone: "ok",
      },
      {
        name: L("Waiting", "Attente"),
        line: "task_3 pending · changelog   deps: task_1, task_2",
        note: L("The changelog describes the other two changes, so it waits. Orca refuses to start it before they're completed.", "Le changelog décrit les deux autres changements, donc il attend. Orca refuse de le lancer avant qu'elles soient terminées."),
        tone: "muted",
      },
      {
        name: L("Workers", "Workers"),
        line: "$ orca orchestration worker-start --task task_1 --agent claude",
        note: L("Each worker gets a fresh worktree and the spec as its only prompt. It never saw your conversation and can't ask you anything: a vague spec means guesses.", "Chaque worker reçoit un worktree neuf et la spec comme seul prompt. Il n'a jamais vu ta conversation et ne peut rien te demander : une spec vague, ce sont des suppositions."),
        tone: "agent",
      },
      {
        name: L("Inbox", "Boîte"),
        line: "✉ worker:euro · task_1 completed   Done. Changed src/price.ts",
        note: L("Workers report to your inbox. Read it with orca orchestration check, review, then merge the branch.", "Les workers écrivent dans ta boîte. Lis-la avec orca orchestration check, relis le travail, puis fusionne la branche."),
        tone: "ok",
      },
      {
        name: L("Next step", "Étape suivante"),
        line: "$ git merge euro && git merge fix-total   → task_3 ready",
        note: L("Once the work is merged into main, start the changelog task: its worktree, a copy of main, now contains both changes.", "Une fois le travail fusionné dans main, lance la tâche du changelog : son worktree, une copie de main, contient maintenant les deux changements."),
        tone: "tool",
      },
    ],
  },
  automations: {
    prompt: L("Update the changelog every weekday at 9:00", "Mets à jour le changelog chaque jour de semaine à 9 h"),
    intro: L("The safe way to hand a prompt to a schedule: off, test, read, fix, on.", "La façon sûre de confier un prompt à un planning : éteinte, test, lecture, correction, allumée."),
    steps: [
      {
        name: L("Create", "Créer"),
        line: '$ orca automations create --name "Weekday changelog" --trigger weekdays --time 09:00 … --disabled',
        note: L("It exists but stays off. Nothing will run behind your back yet.", "Elle existe mais reste éteinte. Rien ne tournera dans ton dos pour l'instant."),
        tone: "tool",
      },
      {
        name: L("Test", "Tester"),
        line: "$ orca automations run auto_1   Claude Code: partial",
        note: L("Run it once by hand, exactly as the schedule would. Partial means the agent guessed.", "Lance-la une fois à la main, exactement comme le planning. Partiel veut dire que l'agent a deviné."),
        tone: "warn",
      },
      {
        name: L("Read", "Lire"),
        line: "Assumed (details): no format was given, so I wrote a loose bullet list.",
        note: L("With nobody there to answer, every gap in the prompt becomes a guess, every day.", "Sans personne pour répondre, chaque trou dans le prompt devient une supposition, chaque jour."),
        tone: "bad",
      },
      {
        name: L("Fix", "Corriger"),
        line: '$ orca automations edit auto_1 --prompt "Update CHANGELOG.md: add an Unreleased section at the top …"',
        note: L("Say everything: the file, the section, one line per change, what done looks like.", "Dis tout : le fichier, la section, une ligne par changement, à quoi ressemble le travail fini."),
        tone: "agent",
      },
      {
        name: L("Enable", "Activer"),
        line: "$ orca automations run auto_1   ✓ done   $ orca automations edit auto_1 --enabled",
        note: L("A clean test run, then switch it on. From now on it runs every weekday at 9:00, in a fresh worktree.", "Un essai propre, puis allume-la. Désormais elle tourne chaque jour de semaine à 9 h, dans un worktree neuf."),
        tone: "ok",
      },
    ],
  },
};
