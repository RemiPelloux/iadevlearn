import { tx as L } from "@/engine";
import * as c from "../checks";
import { AGENTS_MD, CODEX_READ_ONLY, P_DISCOUNT, P_EURO, P_TOTAL, RELEASE_WORKFLOW, shop } from "../scenario";
import type { LessonDef } from "../types";

const UI = { files: true, editor: true, run: true, orca: false };
const UI_ORCA = { files: true, editor: true, run: true, orca: true };
const CONFIG_OK = 'printf \'sandbox_mode = "workspace-write"\\napproval_policy = "on-request"\\n\' > ~/.codex/config.toml';

// ───────────────────────────────────────────── Chapter 5 — Codex, Antigravity & co

export const codexSandbox: LessonDef = {
  id: "codex-sandbox",
  chapterId: "tools",
  title: L("Codex: sandbox and approvals", "Codex : sandbox et approbations"),
  tagline: L("Decide what the agent may do on its own", "Décide de ce que l'agent peut faire seul"),
  xp: 130,
  concepts: [L("sandbox", "sandbox"), L("approval policy", "politique d'approbation"), L("config.toml", "config.toml")],
  commands: ["codex exec", "--sandbox", "~/.codex/config.toml"],
  ui: UI,
  setup: () => shop({ "AGENTS.md": AGENTS_MD, "~/.codex/config.toml": CODEX_READ_ONLY }),
  recap: [
    L("The sandbox decides what the agent can technically do: read-only, workspace-write (edit the project) or danger-full-access.", "La sandbox décide de ce que l'agent peut techniquement faire : read-only, workspace-write (modifier le projet) ou danger-full-access."),
    L("The approval policy decides when it must ask you first: untrusted (almost always), on-request (when it needs to leave the sandbox), never.", "La politique d'approbation décide quand il doit te demander : untrusted (presque toujours), on-request (quand il doit sortir de la sandbox), never."),
    L("Set your defaults in ~/.codex/config.toml; override them per run with --sandbox and --ask-for-approval. Avoid --yolo outside a throwaway machine.", "Règle tes valeurs par défaut dans ~/.codex/config.toml ; change-les pour une exécution avec --sandbox et --ask-for-approval. Évite --yolo hors d'une machine jetable."),
  ],
  steps: [
    {
      kind: "discover",
      title: L("A leash with two settings", "Une laisse à deux réglages"),
      body: [
        L("An agent that runs commands can also run the wrong ones. Codex protects you with two separate settings: the sandbox (what it is able to do) and the approval policy (when it must ask you).", "Un agent qui lance des commandes peut aussi lancer les mauvaises. Codex te protège avec deux réglages séparés : la sandbox (ce qu'il peut faire) et la politique d'approbation (quand il doit te demander)."),
        L("Combine them below and see what the agent may do.", "Combine-les ci-dessous et vois ce que l'agent a le droit de faire."),
      ],
      scene: "sandbox",
    },
    {
      kind: "try",
      title: L("Hit the wall", "Prends le mur"),
      body: L("Ask Codex for a fix.", "Demande une correction à Codex."),
      command: `codex exec "${P_TOTAL}"`,
      check: (w, s) => c.someRun(w, s, (r) => r.tool === "codex" && r.outcome === "blocked"),
      success: L("Blocked: the sandbox is read-only. Codex can look and explain, but not edit. Read the yellow box for why.", "Bloqué : la sandbox est en lecture seule. Codex peut regarder et expliquer, mais pas modifier. Lis l'encadré jaune pour comprendre."),
    },
    {
      kind: "try",
      title: L("Find the setting", "Trouve le réglage"),
      body: L("Codex reads its defaults from ~/.codex/config.toml, in your home folder (not in the project).", "Codex lit ses valeurs par défaut dans ~/.codex/config.toml, dans ton dossier perso (pas dans le projet)."),
      command: "cat ~/.codex/config.toml",
      check: (_w, _s, ran) => ran.includes("cat"),
      success: L("read-only + untrusted: the most cautious combination. Great to explore an unknown repo, too strict for daily work.", "read-only + untrusted : la combinaison la plus prudente. Parfait pour explorer un dépôt inconnu, trop strict pour le travail quotidien."),
    },
    {
      kind: "try",
      title: L("Override it for one run", "Change-le pour une exécution"),
      body: L("Flags win over the config file, for this run only.", "Les options l'emportent sur le fichier de config, pour cette exécution seulement."),
      command: `codex exec --sandbox workspace-write "${P_TOTAL}"`,
      check: (w, s) => c.someRun(w, s, (r) => r.tool === "codex" && r.outcome === "done"),
      success: L("It worked. Because approval is still “untrusted”, Codex asked before running pnpm test (auto-approved here).", "Ça a marché. Comme l'approbation est toujours « untrusted », Codex a demandé avant de lancer pnpm test (approuvé automatiquement ici)."),
    },
    {
      kind: "challenge",
      title: L("Challenge: sensible defaults", "Défi : des réglages raisonnables"),
      body: L("Make workspace-write + on-request your permanent defaults in ~/.codex/config.toml (edit it in the Files panel under ~, or with the shell), then get Codex to switch prices to euros without any flag.", "Fais de workspace-write + on-request tes réglages permanents dans ~/.codex/config.toml (modifie-le dans le panneau Fichiers sous ~, ou avec le shell), puis fais passer les prix en euros par Codex sans aucune option."),
      objectives: [
        {
          id: "sandbox",
          label: L('sandbox_mode = "workspace-write"', 'sandbox_mode = "workspace-write"'),
          check: (w) => c.codex(w).sandbox === "workspace-write" && /sandbox_mode\s*=\s*"workspace-write"/.test(w.files["~/.codex/config.toml"] ?? ""),
          hints: [L("The setting lives in ~/.codex/config.toml.", "Le réglage se trouve dans ~/.codex/config.toml."), L('Change read-only to workspace-write on the sandbox_mode line.', 'Remplace read-only par workspace-write sur la ligne sandbox_mode.'), L(`Type: ${CONFIG_OK}`, `Tape : ${CONFIG_OK}`)],
        },
        {
          id: "approval",
          label: L('approval_policy = "on-request"', 'approval_policy = "on-request"'),
          check: (w) => c.codex(w).approval === "on-request",
          hints: [L("Same file, the approval_policy line.", "Même fichier, la ligne approval_policy."), L("Replace untrusted with on-request.", "Remplace untrusted par on-request."), L(`Type: ${CONFIG_OK}`, `Tape : ${CONFIG_OK}`)],
        },
        {
          id: "run",
          label: L("Codex switches prices to euros", "Codex passe les prix en euros"),
          check: (w, s) => c.someRun(w, s, (r) => r.tool === "codex" && r.task === "euro" && r.outcome === "done") && c.codex(w).sandbox === "workspace-write",
          hints: [L("No flag needed once the config is right.", "Plus besoin d'option quand la config est bonne."), L("Use codex exec with a precise prompt.", "Utilise codex exec avec un prompt précis."), L(`Type: codex exec "${P_EURO}"`, `Tape : codex exec "${P_EURO}"`)],
        },
      ],
      feedback: (w) =>
        c.codex(w).sandbox === "danger-full-access"
          ? L("danger-full-access removes every protection: the agent could delete files outside the project. Use workspace-write.", "danger-full-access retire toute protection : l'agent pourrait supprimer des fichiers hors du projet. Utilise workspace-write.")
          : null,
    },
    { kind: "celebrate" },
  ],
};

export const antigravityWorkflows: LessonDef = {
  id: "antigravity-workflows",
  chapterId: "tools",
  title: L("Antigravity: rules, skills, workflows", "Antigravity : règles, skills, workflows"),
  tagline: L("You trigger workflows; the agent triggers skills", "Tu déclenches les workflows ; l'agent déclenche les skills"),
  xp: 130,
  concepts: [L(".agents/ folder", "dossier .agents/"), L("workflows", "workflows"), L("agent-triggered vs user-triggered", "déclenché par l'agent ou par toi")],
  commands: ["antigravity", ".agents/rules/", ".agents/workflows/"],
  ui: UI,
  setup: () => shop({ "AGENTS.md": AGENTS_MD }),
  recap: [
    L("Antigravity keeps its customizations in .agents/: rules/ (always on), skills/ (picked by the agent), workflows/ (run by you with /name).", "Antigravity range ses personnalisations dans .agents/ : rules/ (toujours actives), skills/ (choisis par l'agent), workflows/ (lancés par toi avec /nom)."),
    L("It also reads AGENTS.md and GEMINI.md, and global rules in ~/.gemini/GEMINI.md.", "Il lit aussi AGENTS.md et GEMINI.md, et les règles globales dans ~/.gemini/GEMINI.md."),
    L("Use a workflow for a procedure you start on purpose (release, deploy); a skill for know-how the agent should apply whenever it fits.", "Utilise un workflow pour une procédure que tu lances exprès (release, déploiement) ; un skill pour un savoir-faire que l'agent applique dès qu'il convient."),
    L("Heads-up: Antigravity's docs now mark workflows as deprecated and suggest turning them into skills. You'll still meet them in many projects, and the idea (a procedure you start with /name) carries over.", "À savoir : la doc d'Antigravity marque maintenant les workflows comme obsolètes et conseille d'en faire des skills. Tu en croiseras encore dans beaucoup de projets, et l'idée (une procédure lancée avec /nom) reste la même."),
  ],
  steps: [
    {
      kind: "discover",
      title: L("Three kinds of instructions", "Trois sortes d'instructions"),
      body: [
        L("Antigravity is Google's agent-first IDE: an Agent Manager runs agents that plan, edit, use the terminal and the browser. Here we drive it from the terminal.", "Antigravity est l'IDE « agent d'abord » de Google : un Agent Manager pilote des agents qui planifient, modifient, utilisent le terminal et le navigateur. Ici, on le pilote depuis le terminal."),
        L("It understands three kinds of instruction files. Click each one to see who triggers it.", "Il comprend trois sortes de fichiers d'instructions. Clique sur chacun pour voir qui le déclenche."),
      ],
      scene: "antigravity",
    },
    {
      kind: "try",
      title: L("Open the Agent Manager", "Ouvre l'Agent Manager"),
      body: L("Start Antigravity. Notice it already loaded AGENTS.md.", "Lance Antigravity. Remarque qu'il a déjà chargé AGENTS.md."),
      command: "antigravity",
      check: (w) => c.inSession(w, "antigravity"),
      success: L("“Rules loaded: AGENTS.md”: the same file Codex reads.", "« Règles chargées : AGENTS.md » : le même fichier que lit Codex."),
    },
    {
      kind: "try",
      title: L("Write a workflow", "Écris un workflow"),
      body: L("A workflow is a Markdown file in .agents/workflows/; its name becomes a slash command. Create release.md (button), then read it in the Files panel. (Newer Antigravity versions prefer skills for this, but workflows still work.)", "Un workflow est un fichier Markdown dans .agents/workflows/ ; son nom devient une commande slash. Crée release.md (bouton), puis lis-le dans le panneau Fichiers. (Les versions récentes d'Antigravity préfèrent les skills pour ça, mais les workflows marchent encore.)"),
      action: { label: L("Create .agents/workflows/release.md", "Créer .agents/workflows/release.md"), kind: "create-file", path: ".agents/workflows/release.md", content: RELEASE_WORKFLOW },
      check: (w) => c.workflows(w).some((x) => x.name === "release"),
      success: L("Type /help in Antigravity: /release is now listed.", "Tape /help dans Antigravity : /release est maintenant listé."),
    },
    {
      kind: "try",
      title: L("Run it", "Lance-le"),
      body: L("Run the workflow with its slash command.", "Lance le workflow avec sa commande slash."),
      command: "/release",
      check: (w, s) => c.someRun(w, s, (r) => r.workflow === "release" && r.outcome === "done"),
      success: L("The agent followed every step: changelog section, then tests. One command, the same procedure every time.", "L'agent a suivi chaque étape : section du changelog, puis tests. Une commande, la même procédure à chaque fois."),
    },
    {
      kind: "challenge",
      title: L("Challenge: a team rule", "Défi : une règle d'équipe"),
      body: L("Your team writes code comments in French. Add that as an Antigravity rule in .agents/rules/, then get Antigravity to add the discount with French comments, without asking for them in the prompt.", "Ton équipe écrit ses commentaires en français. Ajoute-le comme règle Antigravity dans .agents/rules/, puis fais ajouter la remise par Antigravity, avec des commentaires en français, sans le demander dans le prompt."),
      objectives: [
        {
          id: "rule",
          label: L("A rule file in .agents/rules/ asks for French comments", "Un fichier dans .agents/rules/ demande des commentaires en français"),
          check: (w) => Object.entries(w.files).some(([p, t]) => /^\.agents\/rules\/[^/]+\.md$/.test(p) && /\b(french|fran[çc]ais)\b/i.test(t)),
          hints: [L("Rule files are plain Markdown, directly inside .agents/rules/.", "Les fichiers de règles sont du Markdown simple, directement dans .agents/rules/."), L("Create .agents/rules/style.md with one line about French comments.", "Crée .agents/rules/style.md avec une ligne sur les commentaires en français."), L('Type: /exit, then: echo "Write code comments in French." > .agents/rules/style.md', 'Tape : /exit puis echo "Write code comments in French." > .agents/rules/style.md')],
        },
        {
          id: "applied",
          label: L("Antigravity adds the discount with French comments", "Antigravity ajoute la remise avec des commentaires en français"),
          check: (w, s) => c.someRun(w, s, (r) => r.tool === "antigravity" && r.task === "discount" && r.outcome === "done" && r.followed.includes("lang:fr")),
          hints: [L("New rules load when a session starts: reopen Antigravity.", "Les nouvelles règles se chargent au démarrage d'une session : rouvre Antigravity."), L("Send a precise discount prompt that doesn't mention French.", "Envoie un prompt de remise précis qui ne parle pas de français."), L(`Type: antigravity, then: ${P_DISCOUNT}`, `Tape : antigravity, puis : ${P_DISCOUNT}`)],
        },
      ],
    },
    { kind: "celebrate" },
  ],
};

// ───────────────────────────────────────────── Chapter 6 — Orca: a team of agents

const FIX_CMD = `orca worktree create --name fix-total --agent codex --prompt "${P_TOTAL}"`;

export const parallelWorktrees: LessonDef = {
  id: "parallel-worktrees",
  chapterId: "orca",
  title: L("Parallel agents with worktrees", "Des agents en parallèle avec les worktrees"),
  tagline: L("One task, one worktree, one agent", "Une tâche, un worktree, un agent"),
  xp: 150,
  concepts: [L("git worktree", "git worktree"), L("Orca", "Orca"), L("agent status", "statut d'agent")],
  commands: ["orca worktree create", "orca worktree ps", "orca terminal read", "git merge"],
  ui: UI_ORCA,
  setup: () => shop({ "AGENTS.md": AGENTS_MD }),
  recap: [
    L("A worktree is a second checkout of the same repository, on its own branch, in its own folder. Agents in different worktrees can't step on each other.", "Un worktree est un second checkout du même dépôt, sur sa propre branche, dans son propre dossier. Des agents dans des worktrees différents ne se marchent pas dessus."),
    L("Orca creates the worktree, starts the agent in its terminal, sends the prompt, and tracks status and comments.", "Orca crée le worktree, lance l'agent dans son terminal, envoie le prompt, et suit le statut et les commentaires."),
    L("When an agent is done, review its work and merge its branch.", "Quand un agent a fini, relis son travail et fusionne sa branche."),
  ],
  steps: [
    {
      kind: "discover",
      title: L("Why not just open two terminals?", "Pourquoi pas juste deux terminaux ?"),
      body: [
        L("Two agents in the same folder edit the same files at the same time. Chaos. Git worktrees give each agent its own copy of the project, on its own branch.", "Deux agents dans le même dossier modifient les mêmes fichiers en même temps : c'est le chaos. Les worktrees Git donnent à chaque agent sa propre copie du projet, sur sa propre branche."),
        L("Orca is an app built around this idea: one worktree per task, an agent in each, all visible at once. Add agents below.", "Orca est une appli construite autour de cette idée : un worktree par tâche, un agent dans chacun, tous visibles d'un coup. Ajoute des agents ci-dessous."),
      ],
      scene: "worktrees",
    },
    {
      kind: "watch",
      title: L("Watch: hand a task to an agent", "Regarde : confier une tâche à un agent"),
      body: L("Step through a full cycle: create, check, merge.", "Parcours un cycle complet : créer, vérifier, fusionner."),
      setup: () => shop({ "AGENTS.md": AGENTS_MD }),
      frames: [
        { command: FIX_CMD, caption: L("One command: Orca creates the fix-total worktree and branch, starts Codex in it and sends the prompt. Codex works in the background.", "Une commande : Orca crée le worktree et la branche fix-total, y lance Codex et envoie le prompt. Codex travaille en arrière-plan.") },
        { command: "orca worktree ps", caption: L("An overview of every worktree: which agent, what status, how many files changed.", "Une vue d'ensemble de tous les worktrees : quel agent, quel statut, combien de fichiers modifiés.") },
        { command: "git merge fix-total", caption: L("The work is good: merge the branch into main. The fix arrives in your project.", "Le travail est bon : fusionne la branche dans main. La correction arrive dans ton projet.") },
      ],
    },
    {
      kind: "try",
      title: L("Hand off a task", "Confie une tâche"),
      body: L("Your turn. Create a worktree with Codex and the fix-total task. Watch the lanes appear above the terminal.", "À toi. Crée un worktree avec Codex et la tâche fix-total. Regarde les couloirs apparaître au-dessus du terminal."),
      command: FIX_CMD,
      check: (w) => !!c.worktree(w, "fix-total")?.runs.length,
      success: L("A new lane: fix-total, with Codex in it. Your main checkout hasn't changed at all.", "Un nouveau couloir : fix-total, avec Codex dedans. Ton checkout principal n'a pas bougé du tout."),
    },
    {
      kind: "try",
      title: L("Read the agent's terminal", "Lis le terminal de l'agent"),
      body: L("The agent works in its own terminal. Read what it did.", "L'agent travaille dans son propre terminal. Lis ce qu'il a fait."),
      command: "orca terminal read --terminal term-fix-total",
      check: (_w, _s, ran) => ran.includes("orca terminal read"),
      success: L("Fixed, tested with pnpm (it read AGENTS.md in its worktree). Ready for review.", "Corrigé, testé avec pnpm (il a lu AGENTS.md dans son worktree). Prêt pour la relecture."),
    },
    {
      kind: "try",
      title: L("Mark it for review", "Marque-le pour relecture"),
      body: L("Status and comments keep everyone (and other agents) informed about each worktree.", "Le statut et les commentaires tiennent tout le monde (y compris les autres agents) au courant de chaque worktree."),
      command: 'orca worktree set --worktree fix-total --workspace-status in-review --comment "fix ready, tests pass"',
      check: (w) => c.worktree(w, "fix-total")?.status === "in-review",
      success: L("The lane now says in-review, with your comment.", "Le couloir affiche maintenant in-review, avec ton commentaire."),
    },
    {
      kind: "try",
      title: L("Merge the work", "Fusionne le travail"),
      body: L("Bring the agent's branch into main.", "Ramène la branche de l'agent dans main."),
      command: "git merge fix-total",
      check: (w) => !!c.worktree(w, "fix-total")?.merged,
      success: L("Merged! The fix is in main, and the worktree is marked completed.", "Fusionné ! La correction est dans main, et le worktree est marqué terminé."),
    },
    { kind: "celebrate" },
  ],
};

export const agentTeam: LessonDef = {
  id: "agent-team",
  chapterId: "orca",
  title: L("Conduct a team of agents", "Dirige une équipe d'agents"),
  tagline: L("Split the work so nobody collides", "Découpe le travail pour éviter les collisions"),
  xp: 250,
  boss: true,
  concepts: [L("parallel tasks", "tâches parallèles"), L("merge conflicts", "conflits de fusion"), L("orchestration", "orchestration")],
  commands: ["orca worktree create", "orca worktree set", "git merge"],
  ui: UI_ORCA,
  setup: () => shop({ "AGENTS.md": AGENTS_MD, "CLAUDE.md": "@AGENTS.md\n" }),
  recap: [
    L("Split work into tasks that touch different files: parallel agents then merge without conflicts.", "Découpe le travail en tâches qui touchent des fichiers différents : les agents en parallèle fusionnent alors sans conflit."),
    L("Shared rules (AGENTS.md + @imports) make every agent in every worktree follow the same conventions.", "Des règles partagées (AGENTS.md + @imports) font suivre les mêmes conventions à chaque agent dans chaque worktree."),
    L("Your job shifts from typing code to writing clear tasks, reviewing and merging.", "Ton travail passe de taper du code à écrire des tâches claires, relire et fusionner."),
  ],
  steps: [
    {
      kind: "challenge",
      title: L("Boss: ship two features in parallel", "Boss : livre deux fonctionnalités en parallèle"),
      body: L("Use Orca to run two different agents (e.g. Claude Code and Codex) in two worktrees, each on its own task. Leave a comment on each, then merge both into main without a conflict. Tip: tasks in different files don't collide.", "Utilise Orca pour faire tourner deux agents différents (ex. Claude Code et Codex) dans deux worktrees, chacun sur sa tâche. Laisse un commentaire sur chacun, puis fusionne les deux dans main sans conflit. Astuce : des tâches dans des fichiers différents ne se percutent pas."),
      objectives: [
        {
          id: "two",
          label: L("Two worktrees with two different agents, each task done", "Deux worktrees avec deux agents différents, chaque tâche réussie"),
          check: (w) => {
            const done = w.worktrees.filter((wt) => wt.agent && w.runs.some((r) => r.where === wt.name && r.outcome === "done"));
            return new Set(done.map((wt) => wt.agent)).size >= 2;
          },
          hints: [
            L("orca worktree create takes --agent and --prompt.", "orca worktree create accepte --agent et --prompt."),
            L("One worktree with --agent claude, another with --agent codex, each with a precise prompt.", "Un worktree avec --agent claude, un autre avec --agent codex, chacun avec un prompt précis."),
            L(`Type: orca worktree create --name euro --agent claude --prompt "${P_EURO}", then: ${FIX_CMD}`, `Tape : orca worktree create --name euro --agent claude --prompt "${P_EURO}", puis : ${FIX_CMD}`),
          ],
        },
        {
          id: "comments",
          label: L("Each of them has an Orca comment", "Chacun a un commentaire Orca"),
          check: (w) => w.worktrees.filter((wt) => wt.agent && wt.comment.trim()).length >= 2,
          hints: [L("Comments live on the worktree card.", "Les commentaires vivent sur la carte du worktree."), L("Use orca worktree set --comment on each.", "Utilise orca worktree set --comment sur chacun."), L('Type: orca worktree set --worktree euro --comment "euros done"', 'Tape : orca worktree set --worktree euro --comment "euros faits"')],
        },
        {
          id: "merged",
          label: L("Both are merged into main", "Les deux sont fusionnés dans main"),
          check: (w) => w.worktrees.filter((wt) => wt.agent && wt.merged).length >= 2,
          hints: [L("Merge each worktree's branch.", "Fusionne la branche de chaque worktree."), L("git merge <branch>, once per worktree. If it conflicts, the two tasks touched the same file.", "git merge <branche>, une fois par worktree. En cas de conflit, les deux tâches ont touché le même fichier."), L("Type: git merge euro, then: git merge fix-total", "Tape : git merge euro, puis : git merge fix-total")],
        },
      ],
      feedback: (w) => {
        const open = w.worktrees.filter((wt) => !wt.merged);
        for (let i = 0; i < open.length; i++)
          for (let j = i + 1; j < open.length; j++) {
            const a = open[i];
            const b = open[j];
            const touched = (x: typeof a) => Object.keys({ ...x.base, ...x.files }).filter((p) => x.base[p] !== x.files[p]);
            const both = touched(a).filter((p) => touched(b).includes(p));
            if (both.length) return L(`${a.name} and ${b.name} both changed ${both[0]}: merging the second one will conflict. Remove one (orca worktree rm --force) and give it a task in another file.`, `${a.name} et ${b.name} ont tous deux modifié ${both[0]} : fusionner le second va créer un conflit. Supprime l'un (orca worktree rm --force) et donne-lui une tâche dans un autre fichier.`);
          }
        return null;
      },
    },
    { kind: "celebrate" },
  ],
};
