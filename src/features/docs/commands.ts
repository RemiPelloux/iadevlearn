import { tx as L, type Txt } from "@/engine";
import type { Locale } from "@/i18n/locale";

export type Risk = "safe" | "careful" | "destructive";
export type Category = "agents" | "session" | "files" | "orca" | "config";

export interface CommandDoc {
  /** Stable id, used in URLs. */
  id: string;
  /** What you type (or the file name). */
  name: string;
  category: Category;
  summary: Txt;
  /** Plain-language meaning for beginners. */
  plain: Txt;
  syntax: string[];
  flags: Array<{ flag: string; desc: Txt }>;
  risk: Risk;
  riskNote?: Txt;
  /** Which tools it belongs to (for the badges). */
  tools?: Array<"claude" | "codex" | "gemini" | "antigravity" | "orca">;
  /** Interactive before/after demo: setup commands on the Tiny Shop project, then the demonstrated command. */
  demo: { setup: string[]; command: string };
}

const PROMPT = "Fix the total bug in @src/cart.ts: multiply by quantity. Add a test and run it.";

export const COMMAND_DOCS: CommandDoc[] = [
  // ── Agents
  {
    id: "claude",
    name: "claude",
    category: "agents",
    tools: ["claude"],
    summary: L("Start Claude Code", "Lancer Claude Code"),
    plain: L("Anthropic's coding agent, in your terminal. It reads CLAUDE.md and .claude/skills/, edits files and runs commands after asking.", "L'agent de code d'Anthropic, dans ton terminal. Il lit CLAUDE.md et .claude/skills/, modifie des fichiers et lance des commandes après avoir demandé."),
    syntax: ["claude", 'claude "first request"', 'claude -p "request"', "claude --permission-mode plan"],
    flags: [
      { flag: "-p, --print", desc: L("Answer once and exit (headless, for scripts)", "Répondre une fois et quitter (headless, pour les scripts)") },
      { flag: "--permission-mode plan", desc: L("Start in plan mode: propose before acting", "Démarrer en mode plan : proposer avant d'agir") },
      { flag: "mcp add <name> -- <cmd>", desc: L("Connect an MCP server (new tools)", "Connecter un serveur MCP (nouveaux outils)") },
    ],
    risk: "careful",
    riskNote: L("It edits your files. Commit first, and review its diff.", "Il modifie tes fichiers. Commite avant, et relis son diff."),
    demo: { setup: [], command: `claude -p "${PROMPT}"` },
  },
  {
    id: "codex",
    name: "codex",
    category: "agents",
    tools: ["codex"],
    summary: L("Start OpenAI Codex", "Lancer OpenAI Codex"),
    plain: L("OpenAI's coding agent CLI. It reads AGENTS.md and .agents/skills/, and runs inside a sandbox you configure.", "Le CLI d'agent de code d'OpenAI. Il lit AGENTS.md et .agents/skills/, et tourne dans une sandbox que tu configures."),
    syntax: ["codex", 'codex "first request"', 'codex exec "request"', "codex --sandbox workspace-write --ask-for-approval on-request"],
    flags: [
      { flag: "exec", desc: L("Run once without the interactive UI", "Lancer une fois sans l'interface interactive") },
      { flag: "-s, --sandbox", desc: L("read-only · workspace-write · danger-full-access", "read-only · workspace-write · danger-full-access") },
      { flag: "-a, --ask-for-approval", desc: L("untrusted · on-request · never", "untrusted · on-request · never") },
      { flag: "--full-auto", desc: L("workspace-write + on-request", "workspace-write + on-request") },
      { flag: "--yolo", desc: L("No sandbox, no approvals. Only on a throwaway machine!", "Ni sandbox ni approbation. Seulement sur une machine jetable !") },
    ],
    risk: "careful",
    riskNote: L("Never combine danger-full-access with never on your own computer.", "Ne combine jamais danger-full-access et never sur ton propre ordinateur."),
    demo: { setup: ['echo "- Test: \\`pnpm test\\` (run it after every change)" > AGENTS.md'], command: `codex exec "${PROMPT}"` },
  },
  {
    id: "gemini",
    name: "gemini",
    category: "agents",
    tools: ["gemini"],
    summary: L("Start Gemini CLI", "Lancer Gemini CLI"),
    plain: L("Google's open-source agent for the terminal. Its rules file is GEMINI.md, which can import other files with @path.", "L'agent open source de Google pour le terminal. Son fichier de règles est GEMINI.md, qui peut importer d'autres fichiers avec @chemin."),
    syntax: ["gemini", 'gemini -p "request"'],
    flags: [{ flag: "-p, --prompt", desc: L("Answer once and exit", "Répondre une fois et quitter") }],
    risk: "careful",
    demo: { setup: [], command: 'gemini -p "Explain this project"' },
  },
  {
    id: "antigravity",
    name: "antigravity",
    category: "agents",
    tools: ["antigravity"],
    summary: L("Open Antigravity's Agent Manager", "Ouvrir l'Agent Manager d'Antigravity"),
    plain: L("Google's agent-first IDE. Its customizations live in .agents/: rules/, skills/ and workflows/. Here it's simulated as a chat in the terminal.", "L'IDE « agent d'abord » de Google. Ses personnalisations vivent dans .agents/ : rules/, skills/ et workflows/. Ici, il est simulé comme un chat dans le terminal."),
    syntax: ["antigravity", "/<workflow>", "/plan"],
    flags: [{ flag: "/plan", desc: L("Switch Planning / Fast mode", "Basculer mode Planning / Fast") }],
    risk: "careful",
    demo: { setup: [], command: "antigravity" },
  },
  // ── Inside a session
  {
    id: "init",
    name: "/init",
    category: "session",
    tools: ["claude", "codex", "gemini"],
    summary: L("Write a first rules file", "Écrire un premier fichier de règles"),
    plain: L("The agent studies the project and writes CLAUDE.md (Claude Code), AGENTS.md (Codex) or GEMINI.md (Gemini CLI). Always review it.", "L'agent étudie le projet et écrit CLAUDE.md (Claude Code), AGENTS.md (Codex) ou GEMINI.md (Gemini CLI). Relis-le toujours."),
    syntax: ["/init"],
    flags: [],
    risk: "safe",
    demo: { setup: ["claude"], command: "/init" },
  },
  {
    id: "plan",
    name: "/plan",
    category: "session",
    tools: ["claude", "antigravity"],
    summary: L("Plan mode: propose, then act", "Mode plan : proposer, puis agir"),
    plain: L("In plan mode the agent explores and writes a plan but changes nothing until you approve. In real Claude Code, Shift+Tab switches modes.", "En mode plan, l'agent explore et écrit un plan sans rien changer tant que tu n'as pas validé. Dans le vrai Claude Code, Maj+Tab change de mode."),
    syntax: ["/plan", "claude --permission-mode plan"],
    flags: [],
    risk: "safe",
    demo: { setup: ["claude --permission-mode plan"], command: PROMPT },
  },
  {
    id: "context",
    name: "/context",
    category: "session",
    tools: ["claude"],
    summary: L("See what fills the context window", "Voir ce qui remplit la fenêtre de contexte"),
    plain: L("Lists everything the agent currently holds in mind, with sizes: its instructions, your rules, skills, files, MCP tools, the conversation.", "Liste tout ce que l'agent a en tête, avec les tailles : ses instructions, tes règles, les skills, les fichiers, les outils MCP, la conversation."),
    syntax: ["/context"],
    flags: [],
    risk: "safe",
    demo: { setup: ["claude"], command: "/context" },
  },
  {
    id: "skills",
    name: "/skills",
    category: "session",
    tools: ["claude", "codex", "antigravity"],
    summary: L("List the available skills", "Lister les skills disponibles"),
    plain: L("Shows each skill's name and description, the only part the agent reads until it decides to use one.", "Affiche le nom et la description de chaque skill, la seule partie que l'agent lit avant de décider d'en utiliser un."),
    syntax: ["/skills", "$skill-name (Codex)", "/skill-name (Claude Code)"],
    flags: [],
    risk: "safe",
    demo: { setup: ["printf -- '---\\nname: changelog\\ndescription: Update CHANGELOG.md. Use when asked for release notes.\\n---\\n1. Add an Unreleased section\\n2. One line per change\\n' > .claude/skills/changelog/SKILL.md", "claude"], command: "/skills" },
  },
  {
    id: "mention",
    name: "@file",
    category: "session",
    tools: ["claude", "codex", "gemini", "antigravity"],
    summary: L("Point the agent at a file", "Désigner un fichier à l'agent"),
    plain: L("Typing @path puts that file in the context, so the agent doesn't have to search the whole project.", "Taper @chemin met ce fichier dans le contexte, pour que l'agent n'ait pas à fouiller tout le projet."),
    syntax: ["Fix the bug in @src/cart.ts"],
    flags: [],
    risk: "safe",
    demo: { setup: [], command: `claude -p "${PROMPT}"` },
  },
  {
    id: "compact",
    name: "/compact",
    category: "session",
    tools: ["claude", "codex", "gemini"],
    summary: L("Summarize the conversation", "Résumer la conversation"),
    plain: L("Replaces a long conversation by a summary to free up context. Details can get lost: start a fresh session for a new task instead.", "Remplace une longue conversation par un résumé pour libérer du contexte. Des détails peuvent se perdre : pour une nouvelle tâche, ouvre plutôt une nouvelle session."),
    syntax: ["/compact"],
    flags: [],
    risk: "safe",
    demo: { setup: ["claude"], command: "/compact" },
  },
  {
    id: "exit",
    name: "/exit",
    category: "session",
    tools: ["claude", "codex", "gemini", "antigravity"],
    summary: L("Leave the agent", "Quitter l'agent"),
    plain: L("Back to the normal shell. In Claude Code and Gemini CLI, !command runs a single shell command without leaving.", "Retour au shell normal. Dans Claude Code et Gemini CLI, !commande lance une seule commande shell sans quitter."),
    syntax: ["/exit", "!ls"],
    flags: [],
    risk: "safe",
    demo: { setup: ["claude"], command: "/exit" },
  },
  // ── Files
  {
    id: "claude-md",
    name: "CLAUDE.md",
    category: "files",
    tools: ["claude"],
    summary: L("Claude Code's rules (memory)", "Les règles (mémoire) de Claude Code"),
    plain: L("Loaded at the start of every session. Levels: ~/.claude/CLAUDE.md (you), CLAUDE.md (team, committed), CLAUDE.local.md (you, this project). Import others with @path.", "Chargé au début de chaque session. Niveaux : ~/.claude/CLAUDE.md (toi), CLAUDE.md (l'équipe, commité), CLAUDE.local.md (toi, ce projet). Importe d'autres fichiers avec @chemin."),
    syntax: ["CLAUDE.md", "@AGENTS.md"],
    flags: [],
    risk: "safe",
    demo: { setup: [], command: 'echo "@AGENTS.md" > CLAUDE.md' },
  },
  {
    id: "agents-md",
    name: "AGENTS.md",
    category: "files",
    tools: ["codex", "antigravity"],
    summary: L("The shared rules format", "Le format de règles partagé"),
    plain: L("An open format read by Codex, Antigravity, Cursor and many more. Put commands, structure and conventions in it.", "Un format ouvert lu par Codex, Antigravity, Cursor et bien d'autres. Mets-y les commandes, la structure et les conventions."),
    syntax: ["AGENTS.md", "~/.codex/AGENTS.md", "subfolder/AGENTS.md"],
    flags: [],
    risk: "safe",
    demo: { setup: [], command: 'echo "- Test: \\`pnpm test\\` (run it after every change)" > AGENTS.md' },
  },
  {
    id: "gemini-md",
    name: "GEMINI.md",
    category: "files",
    tools: ["gemini", "antigravity"],
    summary: L("Gemini CLI's rules", "Les règles de Gemini CLI"),
    plain: L("Gemini CLI loads ~/.gemini/GEMINI.md and GEMINI.md. Antigravity reads them too, plus AGENTS.md and .agents/rules/.", "Gemini CLI charge ~/.gemini/GEMINI.md et GEMINI.md. Antigravity les lit aussi, plus AGENTS.md et .agents/rules/."),
    syntax: ["GEMINI.md", "~/.gemini/GEMINI.md"],
    flags: [],
    risk: "safe",
    demo: { setup: [], command: 'echo "@AGENTS.md" > GEMINI.md' },
  },
  {
    id: "skill-md",
    name: "SKILL.md",
    category: "files",
    tools: ["claude", "codex", "antigravity"],
    summary: L("A skill: know-how on demand", "Un skill : du savoir-faire à la demande"),
    plain: L("A folder with SKILL.md: frontmatter (name, description saying when to use it) + steps. Claude Code: .claude/skills/. Codex & Antigravity: .agents/skills/.", "Un dossier avec SKILL.md : un en-tête (name, description qui dit quand l'utiliser) + des étapes. Claude Code : .claude/skills/. Codex et Antigravity : .agents/skills/."),
    syntax: ["---\nname: changelog\ndescription: … Use when …\n---\n1. …"],
    flags: [],
    risk: "safe",
    demo: { setup: ["printf -- '---\\nname: changelog\\ndescription: Update CHANGELOG.md. Use when asked to update the changelog.\\n---\\n1. Add a ## [Unreleased] section at the top\\n2. One line per change\\n' > .claude/skills/changelog/SKILL.md"], command: 'claude -p "Update the changelog"' },
  },
  {
    id: "workflows",
    name: ".agents/workflows/",
    category: "files",
    tools: ["antigravity"],
    summary: L("Antigravity workflows", "Les workflows d'Antigravity"),
    plain: L("A Markdown procedure you trigger yourself with /name. Skills are picked by the agent; workflows are started by you.", "Une procédure Markdown que tu déclenches toi-même avec /nom. Les skills sont choisis par l'agent ; les workflows sont lancés par toi."),
    syntax: [".agents/workflows/release.md", "/release"],
    flags: [],
    risk: "safe",
    demo: { setup: ["printf -- '---\\ndescription: Prepare a release\\n---\\n1. Update the changelog: add a ## [Unreleased] section.\\n2. Run \\`pnpm test\\`.\\n' > .agents/workflows/release.md", "antigravity"], command: "/release" },
  },
  // ── Config
  {
    id: "codex-config",
    name: "~/.codex/config.toml",
    category: "config",
    tools: ["codex"],
    summary: L("Codex defaults", "Les réglages par défaut de Codex"),
    plain: L("sandbox_mode decides what Codex can do; approval_policy decides when it asks you. Flags override it for one run.", "sandbox_mode décide de ce que Codex peut faire ; approval_policy décide quand il te demande. Les options le remplacent pour une exécution."),
    syntax: ['sandbox_mode = "workspace-write"', 'approval_policy = "on-request"'],
    flags: [],
    risk: "careful",
    riskNote: L('sandbox_mode = "danger-full-access" removes every protection.', 'sandbox_mode = "danger-full-access" retire toute protection.'),
    demo: { setup: ["printf 'sandbox_mode = \"read-only\"\\n' > ~/.codex/config.toml"], command: `codex exec "${PROMPT}"` },
  },
  {
    id: "mcp",
    name: "mcp add",
    category: "config",
    tools: ["claude", "codex", "gemini"],
    summary: L("Give the agent new tools", "Donner de nouveaux outils à l'agent"),
    plain: L("MCP (Model Context Protocol) servers add tools: a database, a browser, your issue tracker… Each server's tool list takes context in every session.", "Les serveurs MCP (Model Context Protocol) ajoutent des outils : une base de données, un navigateur, ton gestionnaire de tickets… La liste d'outils de chaque serveur prend du contexte à chaque session."),
    syntax: ["claude mcp add <name> -- <command>", "codex mcp add <name> -- <command>", "claude mcp list"],
    flags: [],
    risk: "careful",
    riskNote: L("Only install MCP servers you trust: they run code and see your data.", "N'installe que des serveurs MCP de confiance : ils exécutent du code et voient tes données."),
    demo: { setup: [], command: "claude mcp add docs -- npx docs-mcp-server" },
  },
  // ── Orca
  {
    id: "orca-create",
    name: "orca worktree create",
    category: "orca",
    tools: ["orca"],
    summary: L("A new worktree with an agent in it", "Un nouveau worktree avec un agent dedans"),
    plain: L("Creates a separate checkout on its own branch, starts an agent in its terminal and sends it a prompt. Agents in different worktrees never collide.", "Crée un checkout séparé sur sa propre branche, lance un agent dans son terminal et lui envoie un prompt. Des agents dans des worktrees différents ne se percutent jamais."),
    syntax: ['orca worktree create --name <task> --agent codex --prompt "…"'],
    flags: [
      { flag: "--name", desc: L("Name of the worktree and its branch", "Nom du worktree et de sa branche") },
      { flag: "--agent", desc: L("claude, codex, gemini…", "claude, codex, gemini…") },
      { flag: "--prompt", desc: L("First request sent to the agent", "Première demande envoyée à l'agent") },
    ],
    risk: "safe",
    demo: { setup: [], command: `orca worktree create --name fix-total --agent codex --prompt "${PROMPT}"` },
  },
  {
    id: "orca-ps",
    name: "orca worktree ps",
    category: "orca",
    tools: ["orca"],
    summary: L("Overview of every agent", "Vue d'ensemble de tous les agents"),
    plain: L("One line per worktree: agent, status, files changed, comment.", "Une ligne par worktree : agent, statut, fichiers modifiés, commentaire."),
    syntax: ["orca worktree ps", "orca worktree list", "orca worktree show --worktree <name>"],
    flags: [],
    risk: "safe",
    demo: { setup: [`orca worktree create --name fix-total --agent codex --prompt "${PROMPT}"`], command: "orca worktree ps" },
  },
  {
    id: "orca-set",
    name: "orca worktree set",
    category: "orca",
    tools: ["orca"],
    summary: L("Status and comment of a worktree", "Statut et commentaire d'un worktree"),
    plain: L("Keeps everyone informed: todo, in-progress, in-review, completed, plus a short comment on the card.", "Tient tout le monde au courant : todo, in-progress, in-review, completed, plus un court commentaire sur la carte."),
    syntax: ['orca worktree set --worktree <name> --workspace-status in-review --comment "…"'],
    flags: [],
    risk: "safe",
    demo: { setup: ["orca worktree create --name docs --agent claude"], command: 'orca worktree set --worktree docs --workspace-status in-review --comment "ready"' },
  },
  {
    id: "orca-terminal",
    name: "orca terminal send / read",
    category: "orca",
    tools: ["orca"],
    summary: L("Talk to an agent in another worktree", "Parler à un agent d'un autre worktree"),
    plain: L("send types a prompt into an agent's terminal; read shows what it answered.", "send tape un prompt dans le terminal d'un agent ; read affiche ce qu'il a répondu."),
    syntax: ['orca terminal send --terminal term-<name> --text "…" --enter', "orca terminal read --terminal term-<name>"],
    flags: [],
    risk: "safe",
    demo: { setup: ["orca worktree create --name euro --agent codex"], command: 'orca terminal send --terminal term-euro --text "Format prices in euros in @src/price.ts like “12,50 €”. Keep the name formatPrice." --enter' },
  },
  {
    id: "git-merge",
    name: "git merge <branch>",
    category: "orca",
    tools: ["orca"],
    summary: L("Bring an agent's work into main", "Ramener le travail d'un agent dans main"),
    plain: L("Merges the worktree's branch. If two agents changed the same file, it conflicts, so split tasks by file.", "Fusionne la branche du worktree. Si deux agents ont modifié le même fichier, il y a conflit : découpe les tâches par fichier."),
    syntax: ["git merge <branch>", "git status", "git diff"],
    flags: [],
    risk: "careful",
    riskNote: L("Review the diff before merging an agent's work.", "Relis le diff avant de fusionner le travail d'un agent."),
    demo: { setup: [`orca worktree create --name fix-total --agent codex --prompt "${PROMPT}"`], command: "git merge fix-total" },
  },
];

export const CATEGORIES: Category[] = ["agents", "session", "files", "config", "orca"];

export const CATEGORY_LABEL: Record<Category, Txt> = {
  agents: L("Agents", "Agents"),
  session: L("Inside a session", "Dans une session"),
  files: L("Rules & skills files", "Fichiers de règles et skills"),
  config: L("Settings & tools", "Réglages et outils"),
  orca: L("Orca & worktrees", "Orca et worktrees"),
};

export const categoryLabel = (c: Category, locale: Locale) => CATEGORY_LABEL[c][locale];

export interface Token {
  text: string;
  kind: "program" | "command" | "flag" | "value" | "operator" | "prompt";
  meaning: string;
}

const WORDS: Record<string, Txt> = {
  claude: L("Claude Code, Anthropic's agent", "Claude Code, l'agent d'Anthropic"),
  codex: L("Codex, OpenAI's agent", "Codex, l'agent d'OpenAI"),
  gemini: L("Gemini CLI, Google's agent", "Gemini CLI, l'agent de Google"),
  antigravity: L("Antigravity's Agent Manager", "l'Agent Manager d'Antigravity"),
  orca: L("Orca: worktrees & agents", "Orca : worktrees et agents"),
  git: L("Git", "Git"),
  exec: L("run once, no UI", "exécuter une fois, sans interface"),
  worktree: L("a separate checkout", "un checkout séparé"),
  terminal: L("an agent's terminal", "le terminal d'un agent"),
  create: L("make a new one", "en créer un"),
  ps: L("overview", "vue d'ensemble"),
  set: L("update it", "le mettre à jour"),
  send: L("type into it", "y taper du texte"),
  read: L("read its output", "lire sa sortie"),
  merge: L("bring a branch into main", "ramener une branche dans main"),
  mcp: L("tool servers", "serveurs d'outils"),
  add: L("add", "ajouter"),
  cat: L("print a file", "afficher un fichier"),
  echo: L("write text", "écrire du texte"),
  printf: L("write text (with \\n)", "écrire du texte (avec \\n)"),
  cp: L("copy a file", "copier un fichier"),
  rm: L("delete a file", "supprimer un fichier"),
  ls: L("list files", "lister les fichiers"),
  "-p": L("answer once and exit", "répondre une fois et quitter"),
  "--permission-mode": L("start in a mode", "démarrer dans un mode"),
  plan: L("plan mode", "mode plan"),
  "--sandbox": L("what it may do", "ce qu'il a le droit de faire"),
  "--name": L("worktree name", "nom du worktree"),
  "--agent": L("which agent", "quel agent"),
  "--prompt": L("its first request", "sa première demande"),
  "--worktree": L("which worktree", "quel worktree"),
  "--comment": L("note on the card", "note sur la carte"),
  "--workspace-status": L("status", "statut"),
  "--text": L("what to type", "quoi taper"),
  "--terminal": L("which terminal", "quel terminal"),
  "--enter": L("press Enter", "appuyer sur Entrée"),
  ">": L("write into the file", "écrire dans le fichier"),
  "&&": L("then", "puis"),
};

/** Word-by-word explanation of a suggested command, for the assisted terminal. */
export function explainTokens(input: string, locale: Locale): Token[] {
  const out: Token[] = [];
  const re = /"[^"]*"|'[^']*'|\S+/g;
  const words = input.match(re) ?? [];
  if (words.length && !/^(claude|codex|gemini|antigravity|orca|git|cat|echo|printf|cp|rm|ls|tree|pnpm|npm|\/)/.test(words[0] ?? ""))
    return [{ text: input, kind: "prompt", meaning: locale === "fr" ? "une demande en langage naturel, pour l'agent" : "a plain-language request for the agent" }];
  words.forEach((w, i) => {
    const known = WORDS[w];
    if (w.startsWith("/")) out.push({ text: w, kind: "command", meaning: locale === "fr" ? "commande de l'outil" : "built-in tool command" });
    else if (/^["']/.test(w)) out.push({ text: w, kind: "prompt", meaning: locale === "fr" ? "ta demande / ton texte" : "your request / text" });
    else if (w === ">" || w === "&&") out.push({ text: w, kind: "operator", meaning: known ? known[locale] : "" });
    else if (w.startsWith("-")) out.push({ text: w, kind: "flag", meaning: known ? known[locale] : locale === "fr" ? "une option" : "an option" });
    else if (i === 0) out.push({ text: w, kind: "program", meaning: known ? known[locale] : "" });
    else out.push({ text: w, kind: known ? "command" : "value", meaning: known ? known[locale] : "" });
  });
  return out.filter((t) => t.meaning || t.kind === "value");
}
