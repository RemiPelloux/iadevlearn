import { tx as L, type AgentRun, type World } from "@/engine";
import { claudeSettings, hooksFor } from "@/engine/settings";
import { listSubagents } from "@/engine/subagents";
import * as c from "../checks";
import { AGENTS_MD, shop } from "../scenario";
import type { LessonDef, Solution, StoryDef } from "../types";

const UI = { files: true, editor: true, run: true, orca: false };

// ───────────────────────────────────────────── Helpers

type Server = World["mcp"][number];
const claudeServers = (w: World) => w.mcp.filter((m) => m.tool === "claude");
const isDocs = (m: Server) => /docs|context7|documentation/i.test(`${m.name} ${m.command}`);
const isGithub = (m: Server) => /github|\bgh\b/i.test(`${m.name} ${m.command}`);
const usedDocs = (w: World, r: AgentRun) => (r.mcpUsed ?? []).some((n) => claudeServers(w).some((m) => m.name === n && isDocs(m)));
const usedGithub = (w: World, r: AgentRun) => (r.mcpUsed ?? []).some((n) => claudeServers(w).some((m) => m.name === n && isGithub(m)));
const testHook = (cmd: string) => /\btest\b/.test(cmd);
const askedForTests = (r: AgentRun) => r.report.checks.verify;

const DOCS_ADD = "claude mcp add context7 -- npx -y @upstash/context7-mcp";
const GITHUB_ADD = "claude mcp add github -- npx github-mcp";
const ASK_VERSION = "What is the latest version of vitest?";
const ISSUE_PROMPT = "Fix issue #42";

/** Servers that were connected "because they looked useful", months ago. */
const UNUSED = ["notion", "slack", "postgres", "playwright"];
const CLUTTERED_MCP: Server[] = [
  { tool: "claude", name: "notion", command: "npx notion-mcp" },
  { tool: "claude", name: "slack", command: "npx slack-mcp" },
  { tool: "claude", name: "postgres", command: "npx postgres-mcp" },
  { tool: "claude", name: "playwright", command: "npx @playwright/mcp" },
  { tool: "claude", name: "context7", command: "npx -y @upstash/context7-mcp" },
];

const PRETTIER_SETTINGS = `{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [{ "type": "command", "command": "pnpm exec prettier --write ." }]
      }
    ]
  }
}
`;

const TEST_SETTINGS = `{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          { "type": "command", "command": "pnpm exec prettier --write ." },
          { "type": "command", "command": "pnpm test" }
        ]
      }
    ]
  }
}
`;

const TEST_HOOK_ECHO = `echo '{"hooks":{"PostToolUse":[{"matcher":"Edit|Write","hooks":[{"type":"command","command":"pnpm exec prettier --write ."},{"type":"command","command":"pnpm test"}]}]}}' > .claude/settings.json`;
const DISCOUNT_SHORT = "Add applyDiscount(totalCents, percent) to @src/cart.ts: 20 means 20% off, never below 0.";
const EURO_NO_TESTS = "Format prices in euros in @src/price.ts like “12,50 €”. Keep the name formatPrice.";

const REVIEWER = `---
name: reviewer
description: Reviews code for bugs, risks and missing tests. Use after code changes or when the user asks for a review.
tools: Read, Grep, Glob
---

You are a careful code reviewer for this project.

1. Read the files that changed and the tests that cover them.
2. List real bugs first, then risks, then missing tests.
3. Answer with a short numbered list: file, problem, suggested fix. No code edits.
`;
const DELEGATE = "Use the reviewer subagent to review the code for bugs";

/** A product catalog, big enough that reading it costs real context (a real project has many such files). */
const CATALOG = `// Products sold in the Tiny Shop. Prices are integers in cents.
export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
}

export const catalog: Product[] = [
${Array.from({ length: 220 }, (_, i) => {
  const kinds = ["Mug", "Teapot", "Notebook", "Tote bag", "Poster", "Sticker pack", "Pencil set", "Coaster"];
  const colors = ["blue", "green", "black", "white", "red", "yellow", "grey", "pink", "orange", "purple"];
  return `  { id: "p${String(i + 1).padStart(3, "0")}", name: "${kinds[i % kinds.length]} (${colors[(i * 3) % colors.length]})", price: ${450 + ((i * 175) % 4200)}, stock: ${(i * 7) % 40} },`;
}).join("\n")}
];

export const findProduct = (id: string) => catalog.find((p) => p.id === id);
`;

// ───────────────────────────────────────────── Stories

export const stories: Record<string, StoryDef> = {
  "mcp-intro": {
    prompt: L("What is the latest version of vitest?", "Quelle est la dernière version de vitest ?"),
    intro: L(
      "An agent only knows what it learned during training and what it can reach with its tools. MCP (Model Context Protocol) is an open standard for plugging new tools into any agent. Press Next.",
      "Un agent ne sait que ce qu'il a appris pendant son entraînement et ce qu'il peut atteindre avec ses outils. MCP (Model Context Protocol) est un standard ouvert pour brancher de nouveaux outils sur n'importe quel agent. Appuie sur Suivant.",
    ),
    steps: [
      {
        name: L("No tool, no answer", "Pas d'outil, pas de réponse"),
        line: "I can't check that from here: what I learned about vitest may be out of date.",
        note: L("The model's knowledge stops at its training date. An honest agent says so instead of inventing a version number.", "Le savoir du modèle s'arrête à sa date d'entraînement. Un agent honnête le dit au lieu d'inventer un numéro de version."),
        tone: "warn",
      },
      {
        name: L("Plug in a server", "Branche un serveur"),
        line: "$ claude mcp add context7 -- npx -y @upstash/context7-mcp",
        note: L("An MCP server is a small program that offers tools: read the docs, open a GitHub issue, query a database. You register it once with its start command.", "Un serveur MCP est un petit programme qui propose des outils : lire la doc, ouvrir une issue GitHub, interroger une base de données. Tu l'enregistres une fois avec sa commande de démarrage."),
        tone: "tool",
      },
      {
        name: L("The agent sees new tools", "L'agent voit de nouveaux outils"),
        line: "MCP: context7 (≈1.2k tokens)",
        note: L("When a session starts, the agent receives the list of the server's tools, with a description of each. That's how it knows they exist.", "Au démarrage d'une session, l'agent reçoit la liste des outils du serveur, avec la description de chacun. C'est comme ça qu'il sait qu'ils existent."),
        tone: "muted",
      },
      {
        name: L("It calls one when it needs it", "Il en appelle un quand il en a besoin"),
        line: "● context7 · get_library_docs (MCP)(vitest)",
        note: L("Same question, but now the agent fetches today's docs and answers from them. The line tells you which server and which tool it used.", "Même question, mais maintenant l'agent va chercher la doc du jour et répond à partir d'elle. La ligne te dit quel serveur et quel outil il a utilisés."),
        tone: "tool",
      },
      {
        name: L("One standard, many agents", "Un standard, plein d'agents"),
        line: "claude mcp add · codex mcp add · gemini mcp add",
        note: L("The same server works with Claude Code, Codex, Gemini CLI, Cursor and more. Write a server once, every agent can use it.", "Le même serveur marche avec Claude Code, Codex, Gemini CLI, Cursor et d'autres. Un serveur écrit une fois, tous les agents peuvent s'en servir."),
        tone: "ok",
      },
    ],
  },
  "mcp-cost": {
    intro: L(
      "MCP servers are easy to add, so they pile up. But each one has a price you pay before you even type. Press Next.",
      "Les serveurs MCP s'ajoutent facilement, alors ils s'accumulent. Mais chacun a un prix, que tu paies avant même de taper quoi que ce soit. Appuie sur Suivant.",
    ),
    steps: [
      {
        name: L("Every tool has a manual", "Chaque outil a son mode d'emploi"),
        line: "github: 40+ tools · create_issue, list_pull_requests, get_file_contents…",
        note: L("For each tool, the agent gets its name, what it does and every parameter. A big server exposes dozens of tools: that's thousands of tokens of text.", "Pour chaque outil, l'agent reçoit son nom, ce qu'il fait et chaque paramètre. Un gros serveur expose des dizaines d'outils : ça fait des milliers de tokens de texte."),
        tone: "muted",
      },
      {
        name: L("Paid in every session", "Payé à chaque session"),
        line: "Context usage ≈ 20.8k tokens (before your first word)",
        note: L("Those descriptions sit in the context window from the very start, whether you use the server today or not.", "Ces descriptions occupent la fenêtre de contexte dès le départ, que tu te serves du serveur aujourd'hui ou non."),
        tone: "warn",
      },
      {
        name: L("Less room for your code", "Moins de place pour ton code"),
        line: "mcp 17.6k · files 0.2k · prompt 0.0k",
        note: L("The context is the agent's working memory. Every token spent on unused tools is a token not spent on your files and your conversation, and a long context gets slower and blurrier.", "Le contexte, c'est la mémoire de travail de l'agent. Chaque token dépensé pour des outils inutiles est un token de moins pour tes fichiers et ta conversation, et un contexte long devient plus lent et plus flou."),
        tone: "bad",
      },
      {
        name: L("Keep what this project uses", "Garde ce que ce projet utilise"),
        line: "$ claude mcp remove notion",
        note: L("Connect servers per project, and remove the ones you don't need here. You can add them back in one line the day you do.", "Connecte les serveurs projet par projet, et retire ceux dont tu n'as pas besoin ici. Tu pourras les remettre en une ligne le jour où tu en auras besoin."),
        tone: "ok",
      },
    ],
  },
  "mcp-hooks": {
    intro: L(
      "A rule in CLAUDE.md is advice: the model reads it and usually follows it. A hook is different: Claude Code itself runs your command at a fixed moment, every time. Press Next.",
      "Une règle dans CLAUDE.md, c'est un conseil : le modèle la lit et la suit en général. Un hook, c'est autre chose : Claude Code lui-même lance ta commande à un moment précis, à chaque fois. Appuie sur Suivant.",
    ),
    steps: [
      {
        name: L("Where hooks live", "Où vivent les hooks"),
        line: ".claude/settings.json → \"hooks\": { \"PostToolUse\": [ … ] }",
        note: L("Hooks are JSON in .claude/settings.json, committed with the project so the whole team gets them.", "Les hooks sont du JSON dans .claude/settings.json, commité avec le projet pour que toute l'équipe en profite."),
        tone: "muted",
      },
      {
        name: L("An event and a matcher", "Un événement et un filtre"),
        line: "PostToolUse [Edit|Write] → pnpm test",
        note: L("PostToolUse fires right after a tool runs. The matcher picks which tools: here, only after the agent edits or writes a file.", "PostToolUse se déclenche juste après qu'un outil a tourné. Le filtre choisit lesquels : ici, seulement après que l'agent a modifié ou écrit un fichier."),
        tone: "tool",
      },
      {
        name: L("The agent edits a file", "L'agent modifie un fichier"),
        line: "● Update(src/price.ts)",
        note: L("Nobody mentioned tests in the prompt. The model would have stopped here.", "Personne n'a parlé de tests dans le prompt. Le modèle se serait arrêté là."),
        tone: "agent",
      },
      {
        name: L("The hook runs anyway", "Le hook tourne quand même"),
        line: "  ⎿  PostToolUse hook · pnpm test",
        note: L("Claude Code runs it, not the model: it can't forget or decide to skip it. If the command fails, Claude Code can pass the error back to the agent so it fixes it.", "C'est Claude Code qui le lance, pas le modèle : il ne peut ni l'oublier ni décider de le sauter. Si la commande échoue, Claude Code peut renvoyer l'erreur à l'agent pour qu'il corrige."),
        tone: "ok",
      },
      {
        name: L("At the end: Stop", "À la fin : Stop"),
        line: "  ⎿  Stop hook · pnpm lint",
        note: L("Stop fires when the agent finishes its answer. Good for slower checks you want once per task, not after every edit.", "Stop se déclenche quand l'agent termine sa réponse. Pratique pour des vérifications plus lentes qu'on veut une fois par tâche, pas après chaque modification."),
        tone: "muted",
      },
    ],
  },
  "mcp-subagents": {
    prompt: L("Review the code for bugs", "Relis le code pour trouver les bugs"),
    intro: L(
      "A review means reading lots of files. Done in your main conversation, all of it stays in your context. A subagent does the reading in its own context and only sends back the result. Press Next.",
      "Une relecture, c'est lire beaucoup de fichiers. Faite dans ta conversation principale, tout ça reste dans ton contexte. Un sous-agent fait la lecture dans son propre contexte et ne renvoie que le résultat. Appuie sur Suivant.",
    ),
    steps: [
      {
        name: L("The main agent reads everything", "L'agent principal lit tout"),
        line: "● Search(…) → 4 files   context ≈ 7.1k tokens",
        note: L("Every file it read is now part of your conversation, and stays there for every next message.", "Chaque fichier lu fait maintenant partie de ta conversation, et y reste pour tous les messages suivants."),
        tone: "warn",
      },
      {
        name: L("A specialist in a file", "Un spécialiste dans un fichier"),
        line: ".claude/agents/reviewer.md",
        note: L("A subagent is a Markdown file: a name, a description that says when to use it, the tools it may use, then its instructions.", "Un sous-agent, c'est un fichier Markdown : un nom, une description qui dit quand l'utiliser, les outils qu'il a le droit d'utiliser, puis ses instructions."),
        tone: "muted",
      },
      {
        name: L("Limited tools", "Des outils limités"),
        line: "tools: Read, Grep, Glob",
        note: L("This reviewer can read and search, nothing else: it can't edit a file or run a command, even by mistake.", "Ce relecteur peut lire et chercher, rien d'autre : il ne peut ni modifier un fichier ni lancer une commande, même par erreur."),
        tone: "tool",
      },
      {
        name: L("Its own context window", "Sa propre fenêtre de contexte"),
        line: "● Task(reviewer)  ⎿  4 files read in its own context",
        note: L("The subagent starts fresh, reads what it needs and works on its own. Its reading never touches your conversation.", "Le sous-agent démarre à neuf, lit ce dont il a besoin et travaille de son côté. Sa lecture ne touche jamais ta conversation."),
        tone: "agent",
      },
      {
        name: L("A short summary back", "Un court résumé en retour"),
        line: "subagent  180  reviewer summary",
        note: L("Only its findings come back: a few hundred tokens instead of every file. Your main context stays small and focused.", "Seules ses conclusions reviennent : quelques centaines de tokens au lieu de tous les fichiers. Ton contexte principal reste petit et concentré."),
        tone: "ok",
      },
    ],
  },
};

// ───────────────────────────────────────────── Lessons

const whatIsMcp: LessonDef = {
  id: "what-is-mcp",
  chapterId: "mcp",
  title: L("What is MCP?", "C'est quoi, MCP ?"),
  tagline: L("Plug new tools into your agent", "Branche de nouveaux outils sur ton agent"),
  xp: 120,
  concepts: [L("MCP server", "serveur MCP"), L("MCP tool call", "appel d'outil MCP"), L("knowledge cutoff", "limite de connaissances")],
  commands: ["claude mcp add", "claude mcp list", "/mcp"],
  ui: UI,
  setup: () => shop({ "CLAUDE.md": AGENTS_MD }),
  recap: [
    L("MCP (Model Context Protocol) is an open standard: a server offers tools, and any agent that speaks MCP can use them.", "MCP (Model Context Protocol) est un standard ouvert : un serveur propose des outils, et tout agent qui parle MCP peut s'en servir."),
    L("Add a server with claude mcp add <name> -- <command>, list them with claude mcp list or /mcp, remove one with claude mcp remove <name>.", "Ajoute un serveur avec claude mcp add <nom> -- <commande>, liste-les avec claude mcp list ou /mcp, retire-en un avec claude mcp remove <nom>."),
    L("Use MCP for what the agent can't know or reach on its own: today's docs, your issues, your database. Watch for the “(MCP)” lines to see when it uses one.", "Utilise MCP pour ce que l'agent ne peut pas savoir ou atteindre seul : la doc du jour, tes issues, ta base de données. Repère les lignes « (MCP) » pour voir quand il en utilise un."),
  ],
  steps: [
    {
      kind: "discover",
      title: L("An agent with a window to the world", "Un agent avec une fenêtre sur le monde"),
      body: [
        L("Your agent reads your files and runs commands, but it can't see the web, your GitHub issues or your team's docs. And what it learned in training gets older every day.", "Ton agent lit tes fichiers et lance des commandes, mais il ne voit ni le web, ni tes issues GitHub, ni la doc de ton équipe. Et ce qu'il a appris à l'entraînement vieillit chaque jour."),
        L("MCP servers fill that gap. Step through what happens when you plug one in.", "Les serveurs MCP comblent ce manque. Parcours ce qui se passe quand tu en branches un."),
      ],
      scene: "story:mcp-intro",
    },
    {
      kind: "try",
      title: L("Ask something it can't know", "Demande une chose qu'il ne peut pas savoir"),
      body: L("Libraries release new versions all the time. Ask the agent for the latest one.", "Les bibliothèques sortent sans cesse de nouvelles versions. Demande la dernière à l'agent."),
      command: `claude -p "${ASK_VERSION}"`,
      check: (w, s) => c.someRun(w, s, (r) => r.tool === "claude" && !r.task && !(r.mcpUsed ?? []).length),
      success: L("It refused to guess: it has no tool to check, and its memory may be out of date. That's the right answer, and the problem MCP solves.", "Il a refusé de deviner : il n'a aucun outil pour vérifier, et sa mémoire est peut-être dépassée. C'est la bonne réponse, et c'est le problème que MCP résout."),
    },
    {
      kind: "try",
      title: L("Connect a docs server", "Connecte un serveur de doc"),
      body: L("Context7 is a public MCP server that serves up-to-date library docs. Register it: a name, then the command that starts it after --.", "Context7 est un serveur MCP public qui fournit la doc à jour des bibliothèques. Enregistre-le : un nom, puis la commande qui le lance après --."),
      command: DOCS_ADD,
      check: (w) => claudeServers(w).some(isDocs),
      success: L("Added. Read the green line: its tools now cost context in every session. We'll come back to that in the next lesson.", "Ajouté. Lis la ligne verte : ses outils coûtent maintenant du contexte à chaque session. On y revient à la leçon suivante."),
    },
    {
      kind: "try",
      title: L("Ask again", "Redemande"),
      body: L("Same question. This time, look for the line that ends with (MCP).", "Même question. Cette fois, cherche la ligne qui finit par (MCP)."),
      command: `claude -p "${ASK_VERSION}"`,
      check: (w, s) => c.someRun(w, s, (r) => r.tool === "claude" && usedDocs(w, r)),
      success: L("“context7 · get_library_docs (MCP)”: the agent called a tool from the server, read today's docs, and answered from them. (The simulator doesn't print a version number, but the real server would.)", "« context7 · get_library_docs (MCP) » : l'agent a appelé un outil du serveur, lu la doc du jour, et répondu à partir d'elle. (Le simulateur n'affiche pas de numéro de version, le vrai serveur le ferait.)"),
    },
    {
      kind: "challenge",
      title: L("Challenge: fix a GitHub issue", "Défi : corrige une issue GitHub"),
      body: L(
        "A teammate reported a bug as issue #42 on GitHub. The issue isn't in your files, so the agent can't read it yet. Connect a GitHub MCP server, then ask the agent to fix issue #42 by its number only.",
        "Un collègue a signalé un bug dans l'issue #42 sur GitHub. L'issue n'est pas dans tes fichiers, donc l'agent ne peut pas encore la lire. Connecte un serveur MCP GitHub, puis demande à l'agent de corriger l'issue #42 avec son seul numéro.",
      ),
      objectives: [
        {
          id: "github",
          label: L("A GitHub MCP server is connected", "Un serveur MCP GitHub est connecté"),
          check: (w) => claudeServers(w).some(isGithub),
          hints: [
            L("Same command as for context7, with another name and start command.", "Même commande que pour context7, avec un autre nom et une autre commande de démarrage."),
            L("claude mcp add github -- <command>. In the simulator the command is npx github-mcp; the real GitHub server's README gives its own.", "claude mcp add github -- <commande>. Dans le simulateur, la commande est npx github-mcp ; le README du vrai serveur GitHub donne la sienne."),
            L(`Type: ${GITHUB_ADD}`, `Tape : ${GITHUB_ADD}`),
          ],
        },
        {
          id: "fixed",
          label: L("The agent reads issue #42 through MCP and fixes the bug", "L'agent lit l'issue #42 via MCP et corrige le bug"),
          check: (w, s) => c.someRun(w, s, (r) => r.tool === "claude" && usedGithub(w, r) && r.task === "fix-total" && r.changed.includes("src/cart.ts")),
          hints: [
            L("You don't need to describe the bug: the issue does it.", "Pas besoin de décrire le bug : l'issue le fait."),
            L("Ask for issue #42 by its number. Look for “github · get_issue (MCP)” in the output.", "Demande l'issue #42 par son numéro. Cherche « github · get_issue (MCP) » dans la sortie."),
            L(`Type: claude -p "${ISSUE_PROMPT}"`, `Tape : claude -p "${ISSUE_PROMPT}"`),
          ],
        },
      ],
      feedback: (w, s) => {
        const r = c.lastRunOf(w, s);
        if (r && /\bissue\s*#?\d+/i.test(r.prompt) && !usedGithub(w, r) && !claudeServers(w).some(isGithub))
          return L("The agent can't open GitHub issues without a GitHub server. Connect one first, then ask again.", "L'agent ne peut pas ouvrir d'issue GitHub sans serveur GitHub. Connectes-en un d'abord, puis redemande.");
        return null;
      },
    },
    {
      kind: "experiment",
      title: L("Look around", "Fais le tour"),
      body: L("See what's connected from the shell and from inside a session, ask about another library, or remove a server.", "Regarde ce qui est connecté depuis le shell et depuis une session, pose une question sur une autre bibliothèque, ou retire un serveur."),
      ideas: ["claude mcp list", "claude", "/mcp", "What is the latest version of react?", "/exit", "claude mcp remove context7"],
    },
    { kind: "celebrate" },
  ],
};

const mcpContextCost: LessonDef = {
  id: "mcp-context-cost",
  chapterId: "mcp",
  title: L("What MCP servers cost", "Ce que coûtent les serveurs MCP"),
  tagline: L("Every server is paid in context, every session", "Chaque serveur se paie en contexte, à chaque session"),
  xp: 130,
  concepts: [L("tool definitions", "définitions d'outils"), L("context budget", "budget de contexte"), L("per-project servers", "serveurs par projet")],
  commands: ["claude mcp list", "/context", "claude mcp remove"],
  ui: UI,
  setup: () => ({ ...shop(), mcp: CLUTTERED_MCP.map((m) => ({ ...m })) }),
  recap: [
    L("Each connected MCP server adds its tool descriptions to the context of every session, before you type a word. Big servers cost thousands of tokens.", "Chaque serveur MCP connecté ajoute la description de ses outils au contexte de chaque session, avant que tu tapes un mot. Les gros serveurs coûtent des milliers de tokens."),
    L("Check the bill with claude mcp list and /context, and remove what this project doesn't use with claude mcp remove. Adding one back takes a single line.", "Vérifie la note avec claude mcp list et /context, et retire ce que ce projet n'utilise pas avec claude mcp remove. En remettre un ne prend qu'une ligne."),
    L("Some agents, recent Claude Code versions included, can hold back long tool lists and look tools up only when needed. That softens the cost, but the cheapest server is still the one you don't connect.", "Certains agents, dont les versions récentes de Claude Code, savent mettre de côté les longues listes d'outils et ne les chercher qu'au besoin. Ça adoucit le coût, mais le serveur le moins cher reste celui que tu ne connectes pas."),
  ],
  steps: [
    {
      kind: "discover",
      title: L("The hidden bill", "La facture cachée"),
      body: [
        L("A few months ago, you connected every MCP server that looked useful. Tiny Shop has no database, your team doesn't use Notion or Slack, and there's no web page to drive in a browser. The only one you really use is context7, for library docs.", "Il y a quelques mois, tu as connecté tous les serveurs MCP qui avaient l'air utiles. Tiny Shop n'a pas de base de données, ton équipe n'utilise ni Notion ni Slack, et il n'y a pas de page web à piloter dans un navigateur. Le seul dont tu te sers vraiment, c'est context7, pour la doc des bibliothèques."),
        L("Step through what those servers cost you.", "Parcours ce que ces serveurs te coûtent."),
      ],
      scene: "story:mcp-cost",
    },
    {
      kind: "try",
      title: L("List your servers", "Liste tes serveurs"),
      body: L("claude mcp list shows every server Claude Code will start, with what its tools cost.", "claude mcp list montre chaque serveur que Claude Code va démarrer, avec ce que coûtent ses outils."),
      command: "claude mcp list",
      check: (_w, _s, ran) => ran.includes("claude mcp"),
      success: L("Five servers. Add up the tokens: about 17.6k, just for the tool descriptions.", "Cinq serveurs. Additionne les tokens : environ 17,6k, rien que pour les descriptions d'outils."),
    },
    {
      kind: "try",
      title: L("Open a session", "Ouvre une session"),
      body: L("Start Claude Code and read the banner.", "Lance Claude Code et lis la bannière."),
      command: "claude",
      check: (w) => c.inSession(w, "claude"),
      success: L("The banner says it too: “MCP: notion, slack, postgres, playwright, context7 (≈17.6k tokens)”.", "La bannière le dit aussi : « MCP: notion, slack, postgres, playwright, context7 (≈17.6k tokens) »."),
    },
    {
      kind: "try",
      title: L("Look inside the context", "Regarde dans le contexte"),
      body: L("/context shows what fills the context window right now, line by line.", "/context montre ce qui remplit la fenêtre de contexte en ce moment, ligne par ligne."),
      command: "/context",
      check: (_w, _s, ran) => ran.includes("/context"),
      success: L("About 20.8k tokens and you haven't typed anything yet. The system prompt is 3.2k; the rest is MCP tools.", "Environ 20,8k tokens et tu n'as encore rien tapé. Le prompt système fait 3,2k ; le reste, ce sont les outils MCP."),
    },
    {
      kind: "try",
      title: L("Ask a real question", "Pose une vraie question"),
      body: L("Ask the one thing you actually use MCP for here, and read the grey line at the end.", "Demande la seule chose pour laquelle tu utilises vraiment MCP ici, et lis la ligne grise à la fin."),
      command: ASK_VERSION,
      check: (w, s) => c.someRun(w, s, (r) => r.tool === "claude" && usedDocs(w, r)),
      success: L("≈23.2k tokens of context for one question. Only context7 was called: the four other servers were dead weight.", "≈23,2k tokens de contexte pour une question. Seul context7 a été appelé : les quatre autres serveurs étaient du poids mort."),
    },
    {
      kind: "challenge",
      title: L("Challenge: trim the fat", "Défi : fais maigrir le contexte"),
      body: L(
        "Remove the four servers this project doesn't use, keep context7, then ask the same question again and compare the grey line.",
        "Retire les quatre serveurs que ce projet n'utilise pas, garde context7, puis repose la même question et compare la ligne grise.",
      ),
      objectives: [
        {
          id: "removed",
          label: L("notion, slack, postgres and playwright are removed", "notion, slack, postgres et playwright sont retirés"),
          check: (w) => !claudeServers(w).some((m) => UNUSED.includes(m.name)),
          hints: [
            L("claude mcp is a shell command, not a request for the agent: leave the session first (or prefix it with !).", "claude mcp est une commande du shell, pas une demande pour l'agent : sors d'abord de la session (ou préfixe-la avec !)."),
            L("claude mcp remove <name>, once per server.", "claude mcp remove <nom>, une fois par serveur."),
            L("Type: /exit, then: claude mcp remove notion, claude mcp remove slack, claude mcp remove postgres, claude mcp remove playwright", "Tape : /exit, puis : claude mcp remove notion, claude mcp remove slack, claude mcp remove postgres, claude mcp remove playwright"),
          ],
        },
        {
          id: "kept",
          label: L("context7 is still connected", "context7 est toujours connecté"),
          check: (w) => claudeServers(w).some(isDocs),
          hints: [
            L("context7 is the one server this project uses.", "context7 est le seul serveur que ce projet utilise."),
            L("Run claude mcp list to check it's still there.", "Lance claude mcp list pour vérifier qu'il est toujours là."),
            L(`If you removed it, type: ${DOCS_ADD}`, `Si tu l'as retiré, tape : ${DOCS_ADD}`),
          ],
        },
        {
          id: "cheaper",
          label: L("The same question now costs under 8k tokens of context", "La même question coûte maintenant moins de 8k tokens de contexte"),
          check: (w, s) => c.someRun(w, s, (r) => r.tool === "claude" && usedDocs(w, r) && r.tokens < 8000),
          hints: [
            L("Same question, lighter setup.", "Même question, installation plus légère."),
            L("Ask about the latest vitest version again and read the grey context line.", "Redemande la dernière version de vitest et lis la ligne grise du contexte."),
            L(`Type: claude -p "${ASK_VERSION}"`, `Tape : claude -p "${ASK_VERSION}"`),
          ],
        },
      ],
      feedback: (w) => {
        if (!claudeServers(w).some(isDocs)) return L(`You removed context7 too, and it's the one this project uses. Add it back: ${DOCS_ADD}`, `Tu as aussi retiré context7, et c'est celui que ce projet utilise. Remets-le : ${DOCS_ADD}`);
        return null;
      },
    },
    {
      kind: "experiment",
      title: L("Compare the numbers", "Compare les chiffres"),
      body: L("Open a session and check /context now. Then add a big server back and see what it costs.", "Ouvre une session et regarde /context maintenant. Puis remets un gros serveur et vois ce qu'il coûte."),
      ideas: ["claude", "/context", "/exit", GITHUB_ADD, "claude mcp list"],
    },
    { kind: "celebrate" },
  ],
};

const hooks: LessonDef = {
  id: "hooks",
  chapterId: "mcp",
  title: L("Hooks: commands that always run", "Les hooks : des commandes qui tournent toujours"),
  tagline: L("Rules are advice, hooks are guaranteed", "Les règles conseillent, les hooks garantissent"),
  xp: 140,
  concepts: [L("hooks", "hooks"), L("PostToolUse and Stop", "PostToolUse et Stop"), L(".claude/settings.json", ".claude/settings.json")],
  commands: [".claude/settings.json", "/hooks"],
  ui: UI,
  setup: () => shop(),
  recap: [
    L("Hooks live in .claude/settings.json: an event, a matcher for the tools, and the command to run. Claude Code runs them itself, every time.", "Les hooks vivent dans .claude/settings.json : un événement, un filtre sur les outils, et la commande à lancer. Claude Code les lance lui-même, à chaque fois."),
    L("PostToolUse runs after a tool (Edit|Write: after every file change); Stop runs when the agent finishes. /hooks lists what's set up.", "PostToolUse tourne après un outil (Edit|Write : après chaque changement de fichier) ; Stop tourne quand l'agent a fini. /hooks liste ce qui est en place."),
    L("Use rules for judgment, hooks for what must never be skipped: formatting, tests, checks. Keep hooks fast, or move slow ones to Stop.", "Utilise les règles pour le jugement, les hooks pour ce qui ne doit jamais être sauté : formatage, tests, vérifications. Garde des hooks rapides, ou passe les plus lents sur Stop."),
  ],
  steps: [
    {
      kind: "discover",
      title: L("Advice or guarantee?", "Conseil ou garantie ?"),
      body: [
        L("You can write “run the tests after every change” in CLAUDE.md. The model will usually do it, but on a busy day it may skip it, and nothing tells you.", "Tu peux écrire « lance les tests après chaque changement » dans CLAUDE.md. Le modèle le fera en général, mais un jour chargé il peut le sauter, et rien ne te prévient."),
        L("Hooks move that job from the model to the tool. Step through one.", "Les hooks font passer ce travail du modèle à l'outil. Parcours-en un."),
      ],
      scene: "story:mcp-hooks",
    },
    {
      kind: "try",
      title: L("No tests, nobody asked", "Pas de tests, personne n'a demandé"),
      body: L("This project has no rules file. Ask for a quick fix without mentioning tests, and watch what the agent runs.", "Ce projet n'a pas de fichier de règles. Demande une correction rapide sans parler de tests, et regarde ce que l'agent lance."),
      command: 'claude -p "Fix the total bug in @src/cart.ts"',
      check: (w, s) => c.someRun(w, s, (r) => r.tool === "claude" && r.task === "fix-total" && !c.ranTests(r)),
      success: L("Fixed, but no test ran. The agent even warns you (“Assumed”). Nothing in the project made it check its work.", "Corrigé, mais aucun test n'a tourné. L'agent te prévient même (« Supposé »). Rien dans le projet ne l'a poussé à vérifier son travail."),
    },
    {
      kind: "try",
      title: L("Add your first hook", "Ajoute ton premier hook"),
      body: L("Start with a formatter: after every edit or write, run prettier on the project. Create .claude/settings.json (button), then open it in the Files panel.", "Commence par un formateur : après chaque modification ou écriture, lancer prettier sur le projet. Crée .claude/settings.json (bouton), puis ouvre-le dans le panneau Fichiers."),
      action: { label: L("Create .claude/settings.json", "Créer .claude/settings.json"), kind: "create-file", path: ".claude/settings.json", content: PRETTIER_SETTINGS },
      check: (w) => hooksFor(claudeSettings(w.files), "PostToolUse", "Edit").length > 0,
      success: L("Read it from the inside out: on the PostToolUse event, for the Edit or Write tools, run this command.", "Lis-le de l'intérieur vers l'extérieur : sur l'événement PostToolUse, pour les outils Edit ou Write, lance cette commande."),
    },
    {
      kind: "try",
      title: L("Watch it fire", "Regarde-le se déclencher"),
      body: L("Ask for another change. Don't mention formatting.", "Demande un autre changement. Ne parle pas de formatage."),
      command: `claude -p "${DISCOUNT_SHORT}"`,
      check: (w, s) => c.someRun(w, s, (r) => r.tool === "claude" && (r.hooks ?? []).length > 0),
      success: L("“PostToolUse hook · pnpm exec prettier --write .” right after the edit. Claude Code ran it, not the model: it will happen after every edit, in every session.", "« PostToolUse hook · pnpm exec prettier --write . » juste après la modification. C'est Claude Code qui l'a lancé, pas le modèle : ça se produira après chaque modification, dans chaque session."),
    },
    {
      kind: "challenge",
      title: L("Challenge: tests that always run", "Défi : des tests qui tournent toujours"),
      body: L(
        "Add a second PostToolUse hook that runs pnpm test after every edit (keep the formatter if you like). Then ask for a change without mentioning tests, and see the tests run anyway.",
        "Ajoute un second hook PostToolUse qui lance pnpm test après chaque modification (garde le formateur si tu veux). Puis demande un changement sans parler de tests, et vois les tests tourner quand même.",
      ),
      objectives: [
        {
          id: "hook",
          label: L("A PostToolUse hook runs pnpm test after edits", "Un hook PostToolUse lance pnpm test après les modifications"),
          check: (w) => hooksFor(claudeSettings(w.files), "PostToolUse", "Edit").some((h) => testHook(h.command)),
          hints: [
            L("A hook group can hold several commands: add one to the \"hooks\" list, next to prettier.", "Un groupe de hooks peut contenir plusieurs commandes : ajoutes-en une dans la liste \"hooks\", à côté de prettier."),
            L('Add { "type": "command", "command": "pnpm test" } after the prettier entry, with a comma between them. Edit the file in the Files panel, or rewrite it from the shell.', 'Ajoute { "type": "command", "command": "pnpm test" } après l\'entrée prettier, avec une virgule entre les deux. Modifie le fichier dans le panneau Fichiers, ou réécris-le depuis le shell.'),
            L(`Type: ${TEST_HOOK_ECHO}`, `Tape : ${TEST_HOOK_ECHO}`),
          ],
        },
        {
          id: "ran",
          label: L("A prompt that doesn't ask for tests still runs them", "Un prompt qui ne demande pas de tests les fait quand même tourner"),
          check: (w, s) => c.someRun(w, s, (r) => r.tool === "claude" && (r.hooks ?? []).some(testHook) && c.ranTests(r) && !askedForTests(r)),
          hints: [
            L("The hook should do the work, not the prompt.", "C'est le hook qui doit faire le travail, pas le prompt."),
            L("Ask for any change that edits a file, without the word test.", "Demande n'importe quel changement qui modifie un fichier, sans le mot test."),
            L(`Type: claude -p "${EURO_NO_TESTS}"`, `Tape : claude -p "${EURO_NO_TESTS}"`),
          ],
        },
      ],
      feedback: (w, s) => {
        const st = claudeSettings(w.files);
        if (st.errors.length) return L(`${st.errors[0].path} isn't valid JSON, so Claude Code ignores it: ${st.errors[0].error}. Check the commas and brackets.`, `${st.errors[0].path} n'est pas du JSON valide, donc Claude Code l'ignore : ${st.errors[0].error}. Vérifie les virgules et les crochets.`);
        if (st.hooks.some((h) => testHook(h.command) && h.event !== "PostToolUse")) return L("Your test hook is on another event. Put it under PostToolUse so it runs after each edit.", "Ton hook de test est sur un autre événement. Mets-le sous PostToolUse pour qu'il tourne après chaque modification.");
        const r = c.lastRunOf(w, s);
        if (r && askedForTests(r) && c.ranTests(r)) return L("That worked, but your prompt asked for tests. Try one that doesn't and let the hook do it.", "Ça marche, mais ton prompt demandait des tests. Essaie sans et laisse le hook s'en charger.");
        return null;
      },
    },
    {
      kind: "experiment",
      title: L("Explore hooks", "Explore les hooks"),
      body: L("List your hooks from a session, or try another edit and watch both hooks run.", "Liste tes hooks depuis une session, ou essaie une autre modification et regarde les deux hooks tourner."),
      ideas: ["claude", "/hooks", "/exit", 'claude -p "Update @README.md with a getting started section"'],
    },
    { kind: "celebrate" },
  ],
};

const subagents: LessonDef = {
  id: "subagents",
  chapterId: "mcp",
  title: L("Subagents: delegate and keep your context", "Les sous-agents : déléguer et garder ton contexte"),
  tagline: L("Let a specialist read the files for you", "Laisse un spécialiste lire les fichiers à ta place"),
  xp: 150,
  concepts: [L("subagent", "sous-agent"), L("separate context window", "fenêtre de contexte séparée"), L("limited tools", "outils limités")],
  commands: [".claude/agents/", "/agents", "/context"],
  ui: UI,
  setup: () => shop({ "src/catalog.ts": CATALOG }),
  recap: [
    L("A subagent is a Markdown file in .claude/agents/: name, description (when to use it), tools (what it may use), then its instructions.", "Un sous-agent est un fichier Markdown dans .claude/agents/ : name, description (quand l'utiliser), tools (ce qu'il peut utiliser), puis ses instructions."),
    L("It works in its own context window and only sends back a short summary, so heavy reading (reviews, searches) doesn't fill your main conversation.", "Il travaille dans sa propre fenêtre de contexte et ne renvoie qu'un court résumé : les grosses lectures (relectures, recherches) ne remplissent pas ta conversation principale."),
    L("Call it by name (“use the reviewer subagent”, @agent-reviewer), or let Claude pick it when the request matches its description. /agents lists them.", "Appelle-le par son nom (« use the reviewer subagent », @agent-reviewer), ou laisse Claude le choisir quand la demande correspond à sa description. /agents les liste."),
  ],
  steps: [
    {
      kind: "discover",
      title: L("Reading has a cost", "Lire a un coût"),
      body: [
        L("Every file the agent reads stays in your conversation's context. For a big review, that's a lot of text you'll carry around for the rest of the session.", "Chaque fichier lu par l'agent reste dans le contexte de ta conversation. Pour une grosse relecture, ça fait beaucoup de texte que tu traînes pour le reste de la session."),
        L("This project now has a large product catalog. Step through how a subagent handles the same review.", "Ce projet a maintenant un gros catalogue de produits. Parcours la façon dont un sous-agent gère la même relecture."),
      ],
      scene: "story:mcp-subagents",
    },
    {
      kind: "try",
      title: L("Review in the main conversation", "Relecture dans la conversation principale"),
      body: L("Ask for a review the usual way. Note the context size on the grey line.", "Demande une relecture comme d'habitude. Note la taille du contexte sur la ligne grise."),
      command: 'claude -p "Review the code for bugs"',
      check: (w, s) => c.someRun(w, s, (r) => r.tool === "claude" && r.task === "review" && !r.subagent && r.context.some((x) => x.kind === "file")),
      success: L("Two good findings, but about 7.1k tokens of context: the whole catalog and every other file are now in your conversation.", "Deux bonnes remarques, mais environ 7,1k tokens de contexte : tout le catalogue et chaque autre fichier sont maintenant dans ta conversation."),
    },
    {
      kind: "try",
      title: L("Write a reviewer", "Écris un relecteur"),
      body: L("Create .claude/agents/reviewer.md (button), then read it in the Files panel. Notice the tools line: read and search only.", "Crée .claude/agents/reviewer.md (bouton), puis lis-le dans le panneau Fichiers. Remarque la ligne tools : lire et chercher, rien d'autre."),
      action: { label: L("Create .claude/agents/reviewer.md", "Créer .claude/agents/reviewer.md"), kind: "create-file", path: ".claude/agents/reviewer.md", content: REVIEWER },
      check: (w) => listSubagents(w.files, "claude").some((a) => a.name === "reviewer" && !a.problems.length),
      success: L("The description matters: it tells Claude when to hand work to this subagent.", "La description compte : elle dit à Claude quand confier du travail à ce sous-agent."),
    },
    {
      kind: "try",
      title: L("Open a session", "Ouvre une session"),
      body: L("Start Claude Code. The banner lists the subagents it found.", "Lance Claude Code. La bannière liste les sous-agents trouvés."),
      command: "claude",
      check: (w) => c.inSession(w, "claude"),
      success: L("“Subagents: reviewer”. Claude Code knows it exists, from its name and description only.", "« Subagents: reviewer ». Claude Code sait qu'il existe, grâce à son nom et sa description seulement."),
    },
    {
      kind: "try",
      title: L("List your subagents", "Liste tes sous-agents"),
      body: L("/agents shows each subagent, its description and the tools it may use.", "/agents montre chaque sous-agent, sa description et les outils qu'il peut utiliser."),
      command: "/agents",
      check: (_w, _s, ran) => ran.includes("/agents"),
      success: L("tools: Read, Grep, Glob. This reviewer can't change a single file.", "tools: Read, Grep, Glob. Ce relecteur ne peut pas modifier un seul fichier."),
    },
    {
      kind: "challenge",
      title: L("Challenge: delegate the review", "Défi : délègue la relecture"),
      body: L(
        "In this session, have the reviewer subagent do the same review, then check with /context what actually landed in your main conversation. Compare with the review you did before.",
        "Dans cette session, fais faire la même relecture par le sous-agent reviewer, puis vérifie avec /context ce qui est vraiment arrivé dans ta conversation principale. Compare avec la relecture d'avant.",
      ),
      objectives: [
        {
          id: "delegated",
          label: L("The reviewer subagent does the review", "Le sous-agent reviewer fait la relecture"),
          check: (w, s) => c.someRun(w, s, (r) => r.tool === "claude" && r.task === "review" && r.subagent?.name === "reviewer"),
          hints: [
            L("Name the subagent in your request, or rely on its description.", "Nomme le sous-agent dans ta demande, ou compte sur sa description."),
            L("Ask to use the reviewer subagent to review the code. Look for “Task(reviewer)”.", "Demande d'utiliser le sous-agent reviewer pour relire le code. Cherche « Task(reviewer) »."),
            L(`Type: ${DELEGATE}`, `Tape : ${DELEGATE}`),
          ],
        },
        {
          id: "summary",
          label: L("/context shows its summary, not the files", "/context montre son résumé, pas les fichiers"),
          check: (w, s, ran) => {
            const r = c.lastRunOf(w, s);
            return ran.includes("/context") && !!r?.subagent && !r.context.some((x) => x.kind === "file");
          },
          hints: [
            L("/context shows what's in your main conversation after the last request.", "/context montre ce qu'il y a dans ta conversation principale après la dernière demande."),
            L("Run it right after the delegated review, in the same session.", "Lance-la juste après la relecture déléguée, dans la même session."),
            L("Type: /context", "Tape : /context"),
          ],
        },
      ],
      feedback: (w, s) => {
        const r = c.lastRunOf(w, s);
        if (r && r.task === "review" && !r.subagent) return L("That review ran in your main conversation (no “Task(reviewer)” line). Name it: “Use the reviewer subagent to …”.", "Cette relecture a tourné dans ta conversation principale (pas de ligne « Task(reviewer) »). Nomme-le : « Use the reviewer subagent to … ».");
        if (!c.inSession(w, "claude") && r?.subagent) return L("/context works inside a Claude Code session. Type claude, then /context.", "/context marche dans une session Claude Code. Tape claude, puis /context.");
        return null;
      },
    },
    {
      kind: "experiment",
      title: L("Other ways to call it", "D'autres façons de l'appeler"),
      body: L("Mention it with @agent-reviewer, or just ask for a review: its description says to use it for reviews, so Claude picks it on its own.", "Cite-le avec @agent-reviewer, ou demande simplement une relecture : sa description dit de l'utiliser pour les relectures, donc Claude le choisit tout seul."),
      ideas: ["/clear", "@agent-reviewer review the cart", "Review the code for bugs", "/context"],
    },
    { kind: "celebrate" },
  ],
};

export const lessons: LessonDef[] = [whatIsMcp, mcpContextCost, hooks, subagents];

export const solutions: Record<string, Solution> = {
  "what-is-mcp": [GITHUB_ADD, `claude -p "${ISSUE_PROMPT}"`],
  "mcp-context-cost": ["/exit", ...UNUSED.map((n) => `claude mcp remove ${n}`), `claude -p "${ASK_VERSION}"`],
  hooks: [{ ".claude/settings.json": TEST_SETTINGS }, `claude -p "${EURO_NO_TESTS}"`],
  subagents: [DELEGATE, "/context"],
};
