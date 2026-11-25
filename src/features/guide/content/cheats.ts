import type { DocPage } from "../types";

export const CHEAT_PAGES: DocPage[] = [
  {
    slug: "cheat-commands",
    section: "cheats",
    icon: "SquareTerminal",
    printable: true,
    title: { en: "Every command, per tool", fr: "Toutes les commandes, par outil" },
    lead: { en: "One page per tool, ready to print or keep open next to your terminal.", fr: "Une section par outil, prête à imprimer ou à garder ouverte à côté du terminal." },
    body: {
      en: `## Claude Code

| Command | What it does |
|---|---|
| \`claude\` | Start a session in the current folder |
| \`claude "request"\` | Start a session with a first request |
| \`claude -p "request"\` | Answer once and exit |
| \`claude --permission-mode plan\` | Start in plan mode |
| Shift+Tab | Cycle modes, including plan mode |
| \`/init\` | Write a first CLAUDE.md |
| \`/memory\` | Show the rules files loaded |
| \`/context\` | Show what fills the context window |
| \`/compact\` | Summarise the conversation |
| \`/clear\` | Start the conversation over |
| \`/skills\` and \`/name\` | List skills, run one by name |
| \`!command\` | Run one shell command |
| \`@path\` | Put a file in the context |
| \`claude mcp add <name> -- <cmd>\` | Add an MCP server |

## Codex

| Command | What it does |
|---|---|
| \`codex\` | Start a session |
| \`codex exec "request"\` | Run once without the interactive UI |
| \`-s, --sandbox <mode>\` | read-only, workspace-write or danger-full-access |
| \`-a, --ask-for-approval <policy>\` | untrusted, on-request or never |
| \`--full-auto\` | workspace-write + on-request |
| \`/init\` | Write a first AGENTS.md |
| \`/status\` | Show sandbox and approval settings |
| \`/skills\` and \`$name\` | List skills, mention one by name |
| \`codex mcp add <name> -- <cmd>\` | Add an MCP server |

## Gemini CLI

For Gemini Code Assist Standard or Enterprise and paid API or Vertex AI keys. Personal Google accounts use the Antigravity CLI, below.

| Command | What it does |
|---|---|
| \`gemini\` | Start a session |
| \`gemini -p "request"\` | Answer once and exit |
| \`/init\` | Write a first GEMINI.md |
| \`/memory show\` | Show the loaded rules |
| \`!command\` | Run one shell command |

## Antigravity

| Command or action | What it does |
|---|---|
| \`agy\` | Start the terminal agent in the current folder |
| \`agy -p "request"\` | Answer once and exit |
| \`agy -i "request"\` | Start a session with a first request |
| \`agy --version\` | Check the install |
| \`/skills reload\` | Pick up a skill you just wrote |
| \`/logout\` | Sign out |
| Desktop app: Agent Manager | Run several conversations side by side |
| Plan first | Pick the Planning mode for the conversation |
| Run a workflow | Type \`/name\` for a file in \`.agents/workflows/\` |

## Orca

| Command | What it does |
|---|---|
| \`orca worktree create --name <task> --agent <agent> --prompt "..."\` | New worktree with an agent and a first request |
| \`orca worktree list\` / \`ps\` | List worktrees / overview with status |
| \`orca worktree show --worktree <name>\` | Details and changed files |
| \`orca worktree set --worktree <name> --comment "..." --workspace-status in-review\` | Update the card |
| \`orca worktree rm --worktree <name>\` | Remove a worktree |
| \`orca terminal list\` | List agent terminals and their handles |
| \`orca terminal send --terminal <handle> --text "..." --enter\` | Send a prompt |
| \`orca terminal read --terminal <handle>\` | Read the agent's output |`,
      fr: `## Claude Code

| Commande | Ce qu'elle fait |
|---|---|
| \`claude\` | Ouvrir une session dans le dossier courant |
| \`claude "demande"\` | Ouvrir une session avec une première demande |
| \`claude -p "demande"\` | Répondre une fois et quitter |
| \`claude --permission-mode plan\` | Démarrer en mode plan |
| Maj+Tab | Changer de mode, dont le mode plan |
| \`/init\` | Écrire un premier CLAUDE.md |
| \`/memory\` | Afficher les fichiers de règles chargés |
| \`/context\` | Montrer ce qui remplit la fenêtre de contexte |
| \`/compact\` | Résumer la conversation |
| \`/clear\` | Repartir d'une conversation vide |
| \`/skills\` et \`/nom\` | Lister les skills, en lancer un par son nom |
| \`!commande\` | Lancer une commande shell |
| \`@chemin\` | Mettre un fichier dans le contexte |
| \`claude mcp add <nom> -- <cmd>\` | Ajouter un serveur MCP |

## Codex

| Commande | Ce qu'elle fait |
|---|---|
| \`codex\` | Ouvrir une session |
| \`codex exec "demande"\` | Lancer une fois sans l'interface interactive |
| \`-s, --sandbox <mode>\` | read-only, workspace-write ou danger-full-access |
| \`-a, --ask-for-approval <politique>\` | untrusted, on-request ou never |
| \`--full-auto\` | workspace-write + on-request |
| \`/init\` | Écrire un premier AGENTS.md |
| \`/status\` | Afficher la sandbox et les approbations |
| \`/skills\` et \`$nom\` | Lister les skills, en citer un par son nom |
| \`codex mcp add <nom> -- <cmd>\` | Ajouter un serveur MCP |

## Gemini CLI

Pour Gemini Code Assist Standard ou Enterprise et les clés payantes API ou Vertex AI. Les comptes Google personnels utilisent Antigravity CLI, plus bas.

| Commande | Ce qu'elle fait |
|---|---|
| \`gemini\` | Ouvrir une session |
| \`gemini -p "demande"\` | Répondre une fois et quitter |
| \`/init\` | Écrire un premier GEMINI.md |
| \`/memory show\` | Afficher les règles chargées |
| \`!commande\` | Lancer une commande shell |

## Antigravity

| Commande ou action | Ce qu'elle fait |
|---|---|
| \`agy\` | Lancer l'agent de terminal dans le dossier courant |
| \`agy -p "demande"\` | Répondre une fois et quitter |
| \`agy -i "demande"\` | Ouvrir une session avec une première demande |
| \`agy --version\` | Vérifier l'installation |
| \`/skills reload\` | Prendre en compte un skill que tu viens d'écrire |
| \`/logout\` | Se déconnecter |
| Appli de bureau : Agent Manager | Mener plusieurs conversations côte à côte |
| Planifier d'abord | Choisis le mode Planning pour la conversation |
| Lancer un workflow | Tape \`/nom\` pour un fichier de \`.agents/workflows/\` |

## Orca

| Commande | Ce qu'elle fait |
|---|---|
| \`orca worktree create --name <tâche> --agent <agent> --prompt "..."\` | Nouveau worktree avec un agent et une première demande |
| \`orca worktree list\` / \`ps\` | Lister les worktrees / vue d'ensemble avec statut |
| \`orca worktree show --worktree <nom>\` | Détails et fichiers modifiés |
| \`orca worktree set --worktree <nom> --comment "..." --workspace-status in-review\` | Mettre à jour la carte |
| \`orca worktree rm --worktree <nom>\` | Supprimer un worktree |
| \`orca terminal list\` | Lister les terminaux d'agents et leurs identifiants |
| \`orca terminal send --terminal <id> --text "..." --enter\` | Envoyer une demande |
| \`orca terminal read --terminal <id>\` | Lire la sortie de l'agent |`,
    },
  },
  {
    slug: "cheat-files",
    section: "cheats",
    icon: "FolderTree",
    printable: true,
    title: { en: "Where every file lives", fr: "Où vit chaque fichier" },
    lead: { en: "Rules, skills, workflows and settings for each tool, in one table.", fr: "Règles, skills, workflows et réglages de chaque outil, dans un seul tableau." },
    body: {
      en: `## Rules

| Tool | Personal | Project |
|---|---|---|
| Claude Code | \`~/.claude/CLAUDE.md\` | \`CLAUDE.md\`, \`.claude/CLAUDE.md\`, \`CLAUDE.local.md\` |
| Codex | \`~/.codex/AGENTS.md\` | \`AGENTS.md\` (and one per subfolder) |
| Gemini CLI | \`~/.gemini/GEMINI.md\` | \`GEMINI.md\` |
| Antigravity (app and \`agy\`) | \`~/.gemini/GEMINI.md\`, \`~/.gemini/AGENTS.md\`, \`~/.gemini/config/rules/\` | \`AGENTS.md\`, \`GEMINI.md\`, \`.agents/rules/*.md\` |
| Cursor | | \`.cursor/rules/*.mdc\`, \`AGENTS.md\` |

## Skills and workflows

| Tool | Skills | Workflows |
|---|---|---|
| Claude Code | \`.claude/skills/<name>/SKILL.md\`, \`~/.claude/skills/\` | |
| Codex | \`.agents/skills/<name>/SKILL.md\`, \`~/.agents/skills/\` | |
| Antigravity (app and \`agy\`) | \`.agents/skills/<name>/SKILL.md\`, \`~/.gemini/config/skills/\` | \`.agents/workflows/<name>.md\` |

## Settings

| Tool | File | Holds |
|---|---|---|
| Codex | \`~/.codex/config.toml\`, \`.codex/config.toml\` | \`sandbox_mode\`, \`approval_policy\`, profiles |
| Claude Code | \`.claude/settings.json\`, \`~/.claude/settings.json\` | permissions, hooks, environment |

## The shared setup in one script

\`\`\`bash
printf '@AGENTS.md\\n' > CLAUDE.md
printf '@AGENTS.md\\n' > GEMINI.md
mkdir -p .claude/skills .agents/skills
\`\`\``,
      fr: `## Règles

| Outil | Personnel | Projet |
|---|---|---|
| Claude Code | \`~/.claude/CLAUDE.md\` | \`CLAUDE.md\`, \`.claude/CLAUDE.md\`, \`CLAUDE.local.md\` |
| Codex | \`~/.codex/AGENTS.md\` | \`AGENTS.md\` (et un par sous-dossier) |
| Gemini CLI | \`~/.gemini/GEMINI.md\` | \`GEMINI.md\` |
| Antigravity (appli et \`agy\`) | \`~/.gemini/GEMINI.md\`, \`~/.gemini/AGENTS.md\`, \`~/.gemini/config/rules/\` | \`AGENTS.md\`, \`GEMINI.md\`, \`.agents/rules/*.md\` |
| Cursor | | \`.cursor/rules/*.mdc\`, \`AGENTS.md\` |

## Skills et workflows

| Outil | Skills | Workflows |
|---|---|---|
| Claude Code | \`.claude/skills/<nom>/SKILL.md\`, \`~/.claude/skills/\` | |
| Codex | \`.agents/skills/<nom>/SKILL.md\`, \`~/.agents/skills/\` | |
| Antigravity (appli et \`agy\`) | \`.agents/skills/<nom>/SKILL.md\`, \`~/.gemini/config/skills/\` | \`.agents/workflows/<nom>.md\` |

## Réglages

| Outil | Fichier | Contient |
|---|---|---|
| Codex | \`~/.codex/config.toml\`, \`.codex/config.toml\` | \`sandbox_mode\`, \`approval_policy\`, profils |
| Claude Code | \`.claude/settings.json\`, \`~/.claude/settings.json\` | permissions, hooks, environnement |

## L'installation partagée en un script

\`\`\`bash
printf '@AGENTS.md\\n' > CLAUDE.md
printf '@AGENTS.md\\n' > GEMINI.md
mkdir -p .claude/skills .agents/skills
\`\`\``,
    },
  },
  {
    slug: "cheat-prompts",
    section: "cheats",
    icon: "ClipboardCheck",
    printable: true,
    title: { en: "Prompt checklist and templates", fr: "Check-list et modèles de prompts" },
    lead: { en: "Copy a template, fill the blanks, check the list before you press Enter.", fr: "Copie un modèle, remplis les trous, vérifie la liste avant d'appuyer sur Entrée." },
    body: {
      en: `## Before you press Enter

1. Does it say what should change?
2. Does it name the files, with \`@path\`?
3. Does it give the exact details (numbers, names, an example output in quotes)?
4. Does it say what must not change?
5. Does it ask for tests, and to run them?
6. Would you know it's done from reading it?

## A fix

\`\`\`text
Fix <the bug> in @<file>: <what happens now> but <what should happen>.
Keep <what must not change>. Add a test that reproduces it and run the tests.
\`\`\`

## A feature

\`\`\`text
Add <feature> to @<file>: <exact behaviour, with an example>.
Don't <constraint>. Add tests for <cases> and run them.
\`\`\`

## Plan first

\`\`\`text
I want <goal>. Read @<files> and propose a numbered plan.
Don't change anything until I say yes.
\`\`\`

## Explore before changing

\`\`\`text
Explain how <part of the project> works, starting from @<file>.
List the files involved. Don't change anything.
\`\`\`

## A review

\`\`\`text
Review the changes since the last commit. Look for bugs, missing tests and
anything that breaks the conventions in AGENTS.md. List problems by severity.
\`\`\``,
      fr: `## Avant d'appuyer sur Entrée

1. Est-ce qu'il dit ce qui doit changer ?
2. Est-ce qu'il cite les fichiers, avec \`@chemin\` ?
3. Est-ce qu'il donne les détails exacts (chiffres, noms, un exemple de résultat entre guillemets) ?
4. Est-ce qu'il dit ce qui ne doit pas changer ?
5. Est-ce qu'il demande des tests, et de les lancer ?
6. En le lisant, saurais-tu quand c'est fini ?

## Une correction

\`\`\`text
Corrige <le bug> dans @<fichier> : <ce qui se passe> au lieu de <ce qui devrait se passer>.
Garde <ce qui ne doit pas changer>. Ajoute un test qui le reproduit et lance les tests.
\`\`\`

## Une fonctionnalité

\`\`\`text
Ajoute <fonctionnalité> dans @<fichier> : <comportement exact, avec un exemple>.
Ne <contrainte> pas. Ajoute des tests pour <cas> et lance-les.
\`\`\`

## D'abord un plan

\`\`\`text
Je veux <objectif>. Lis @<fichiers> et propose un plan numéroté.
Ne change rien tant que je n'ai pas dit oui.
\`\`\`

## Explorer avant de changer

\`\`\`text
Explique comment marche <partie du projet>, en partant de @<fichier>.
Liste les fichiers concernés. Ne change rien.
\`\`\`

## Une relecture

\`\`\`text
Relis les changements depuis le dernier commit. Cherche les bugs, les tests manquants
et ce qui casse les conventions d'AGENTS.md. Classe les problèmes par gravité.
\`\`\``,
    },
  },
];
