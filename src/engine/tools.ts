import { codexSettings, isApproval, lastRun, MCP_TOKENS, runAgent, startupContext, viewFiles } from "./agent";
import { fail, tx, type Ctx } from "./context";
import { getProject } from "./projects";
import { INIT_FILE, loadRules, TOOL_NAMES } from "./rules";
import { listSkills, listWorkflows } from "./skills";
import type { ToolId } from "./types";

export const TOOLS: ToolId[] = ["claude", "codex", "gemini", "antigravity"];

export const SESSION_PROMPT: Record<ToolId, string> = { claude: ">", codex: "›", gemini: ">", antigravity: "▸" };

/** Pull `--flag value` / `-f value` options out of argv. */
export function takeFlag(args: string[], names: string[], hasValue = true): string | true | undefined {
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    for (const n of names) {
      if (a === n) {
        if (!hasValue) {
          args.splice(i, 1);
          return true;
        }
        const v = args[i + 1];
        args.splice(i, 2);
        return v ?? "";
      }
      if (hasValue && a.startsWith(n + "=")) {
        args.splice(i, 1);
        return a.slice(n.length + 1);
      }
    }
  }
  return undefined;
}

function banner(ctx: Ctx, tool: ToolId) {
  const view = viewFiles(ctx.world);
  const rules = loadRules(view, tool);
  const skills = listSkills(view, tool);
  const mcp = ctx.world.mcp.filter((m) => m.tool === tool);
  const titles: Record<ToolId, string> = {
    claude: "✻ Welcome to Claude Code (simulated)",
    codex: ">_ OpenAI Codex (simulated)",
    gemini: "✦ Gemini CLI (simulated)",
    antigravity: "◆ Antigravity · Agent Manager (simulated)",
  };
  ctx.out(titles[tool], "agent");
  if (tool === "codex") {
    const s = codexSettings(view, { sandbox: ctx.world.session?.sandbox, approval: ctx.world.session?.approval });
    ctx.out(`  directory: ~/project · sandbox: ${s.sandbox} · approval: ${s.approval}`, "muted");
    if (s.sandbox === "danger-full-access" && s.approval === "never")
      ctx.out(tx("  ⚠ No sandbox and no approvals: Codex can run anything on your machine.", "  ⚠ Ni sandbox ni approbation : Codex peut tout exécuter sur ta machine."), "warning");
  } else ctx.out("  cwd: ~/project", "muted");
  ctx.out(
    rules.length
      ? tx(`  Rules loaded: ${rules.map((r) => r.path).join(", ")}`, `  Règles chargées : ${rules.map((r) => r.path).join(", ")}`)
      : tx(`  No rules file found (${tool === "claude" ? "CLAUDE.md" : tool === "codex" ? "AGENTS.md" : tool === "gemini" ? "GEMINI.md" : "AGENTS.md / .agents/rules/"}). Try /init.`, `  Aucun fichier de règles (${tool === "claude" ? "CLAUDE.md" : tool === "codex" ? "AGENTS.md" : tool === "gemini" ? "GEMINI.md" : "AGENTS.md / .agents/rules/"}). Essaie /init.`),
    "muted",
  );
  if (skills.length) ctx.out(tx(`  Skills: ${skills.map((s) => s.name).join(", ")}`, `  Skills : ${skills.map((s) => s.name).join(", ")}`), "muted");
  if (mcp.length) ctx.out(`  MCP: ${mcp.map((m) => m.name).join(", ")}`, "muted");
  ctx.out(tx("  Type a request in plain words · /help for commands · /exit to leave", "  Écris ta demande avec tes mots · /help pour les commandes · /exit pour sortir"), "muted");
}

function startSession(ctx: Ctx, tool: ToolId, opts: { plan?: boolean; sandbox?: string; approval?: string } = {}) {
  if (ctx.world.session) fail(tx(`You're already in ${TOOL_NAMES[ctx.world.session.tool]}. Type /exit first.`, `Tu es déjà dans ${TOOL_NAMES[ctx.world.session.tool]}. Tape d'abord /exit.`));
  ctx.world.session = { tool, plan: !!opts.plan, pending: null, sandbox: opts.sandbox, approval: opts.approval };
  banner(ctx, tool);
  if (opts.plan) ctx.out(tx("  ⏸ plan mode on", "  ⏸ mode plan activé"), "hint");
  ctx.emit({ type: "session-start", tool });
}

function requirePrompt(p: string | true | undefined, usage: string): string {
  if (typeof p !== "string" || !p.trim()) fail(`usage: ${usage}`, tx("Put your request in quotes after the flag.", "Mets ta demande entre guillemets après l'option."));
  return p;
}

function mcpCommand(ctx: Ctx, tool: ToolId, args: string[]) {
  const [sub, ...rest] = args;
  const own = ctx.world.mcp.filter((m) => m.tool === tool);
  if (sub === "list" || !sub) {
    if (!own.length) ctx.out(tx("No MCP servers configured.", "Aucun serveur MCP configuré."), "muted");
    for (const m of own) ctx.out(`${m.name}: ${m.command} - ✓ Connected`);
    return;
  }
  if (sub === "add") {
    const dash = rest.indexOf("--");
    const name = rest.filter((a) => !a.startsWith("-"))[0];
    const command = (dash >= 0 ? rest.slice(dash + 1) : rest.slice(rest.indexOf(name) + 1)).join(" ");
    if (!name || !command) fail(`usage: ${tool} mcp add <name> -- <command>`, tx("An MCP server needs a name and the command that starts it, e.g. claude mcp add docs -- npx docs-mcp", "Un serveur MCP a besoin d'un nom et de la commande qui le lance, ex. claude mcp add docs -- npx docs-mcp"));
    if (own.some((m) => m.name === name)) fail(tx(`MCP server ${name} already exists.`, `Le serveur MCP ${name} existe déjà.`));
    ctx.world.mcp = [...ctx.world.mcp, { tool, name, command }];
    ctx.out(tx(`Added MCP server ${name} for ${TOOL_NAMES[tool]}. Its tools now cost ≈${MCP_TOKENS} tokens of context in every session.`, `Serveur MCP ${name} ajouté pour ${TOOL_NAMES[tool]}. Ses outils coûtent maintenant ≈${MCP_TOKENS} tokens de contexte à chaque session.`), "success");
    ctx.emit({ type: "mcp-add", name });
    return;
  }
  if (sub === "remove" || sub === "rm") {
    const name = rest[0];
    if (!own.some((m) => m.name === name)) fail(tx(`No MCP server named ${name}.`, `Aucun serveur MCP nommé ${name}.`));
    ctx.world.mcp = ctx.world.mcp.filter((m) => !(m.tool === tool && m.name === name));
    ctx.out(tx(`Removed ${name}.`, `${name} supprimé.`), "success");
    return;
  }
  fail(`${tool} mcp: unknown command '${sub}'. Try: add, list, remove`);
}

/** `claude`, `codex`, `gemini`, `antigravity` typed in the shell. Returns the recognized command name. */
export function toolCommand(ctx: Ctx, tool: ToolId, argv: string[]): string {
  const args = [...argv];
  if (args[0] === "--version" || args[0] === "-v") {
    ctx.out(`${TOOL_NAMES[tool]} (simulated in IA Dev Learn)`);
    return `${tool} --version`;
  }
  if (args[0] === "--help" || args[0] === "-h") {
    const help: Record<ToolId, string[]> = {
      claude: ['claude                 start an interactive session', 'claude "request"       start a session with a first request', 'claude -p "request"    answer once and exit (headless)', "claude --permission-mode plan   start in plan mode", "claude mcp add|list|remove      manage MCP servers"],
      codex: ['codex                  start an interactive session', 'codex "request"        start with a first request', 'codex exec "request"   run once without the UI (headless)', "-s, --sandbox <read-only|workspace-write|danger-full-access>", "-a, --ask-for-approval <untrusted|on-request|never>", "--full-auto            workspace-write sandbox + on-request approvals", "codex mcp add|list|remove"],
      gemini: ["gemini                 start an interactive session", 'gemini -p "request"    answer once and exit', "gemini mcp add|list|remove"],
      antigravity: ["antigravity            open the Agent Manager (here: a chat in the terminal)", "  /<workflow>          run a workflow from .agents/workflows/", "  /plan                switch between Planning and Fast mode"],
    };
    ctx.out(help[tool], "muted");
    return `${tool} --help`;
  }
  if (args[0] === "mcp" && tool !== "antigravity") {
    mcpCommand(ctx, tool, args.slice(1));
    return `${tool} mcp`;
  }
  if (args[0] === "login" || args[0] === "auth") {
    ctx.out(tx("Already logged in (the simulator needs no account).", "Déjà connecté (le simulateur n'a besoin d'aucun compte)."), "muted");
    return `${tool} login`;
  }

  const unknownFlag = (rest: string[]) => {
    const bad = rest.find((a) => /^--?[a-zA-Z]/.test(a));
    if (bad) fail(`error: unexpected argument '${bad}' found`, tx(`${TOOL_NAMES[tool]} doesn't know ${bad}. ${tool} --help lists the options.`, `${TOOL_NAMES[tool]} ne connaît pas ${bad}. ${tool} --help liste les options.`));
  };

  if (tool === "codex") {
    const yolo = takeFlag(args, ["--yolo", "--dangerously-bypass-approvals-and-sandbox"], false);
    const fullAuto = takeFlag(args, ["--full-auto"], false);
    let sandbox = takeFlag(args, ["--sandbox", "-s"]) as string | undefined;
    let approval = takeFlag(args, ["--ask-for-approval", "-a"]) as string | undefined;
    if (fullAuto) {
      sandbox = "workspace-write";
      approval = "on-request";
    }
    if (yolo) {
      sandbox = "danger-full-access";
      approval = "never";
    }
    if (sandbox && !["read-only", "workspace-write", "danger-full-access"].includes(sandbox)) fail(`error: invalid value '${sandbox}' for '--sandbox <SANDBOX_MODE>'`, tx("Valid sandboxes: read-only, workspace-write, danger-full-access.", "Sandboxes valides : read-only, workspace-write, danger-full-access."));
    if (approval && !["untrusted", "on-request", "on-failure", "never"].includes(approval)) fail(`error: invalid value '${approval}' for '--ask-for-approval <APPROVAL_POLICY>'`, tx("Valid policies: untrusted, on-request, never.", "Politiques valides : untrusted, on-request, never."));
    unknownFlag(args);
    if (args[0] === "exec" || args[0] === "e") {
      const prompt = requirePrompt(args.slice(1).join(" ") || undefined, 'codex exec "<request>"');
      const s = codexSettings(viewFiles(ctx.world), { sandbox, approval });
      ctx.out(`>_ codex exec · sandbox: ${s.sandbox} · approval: ${s.approval}`, "muted");
      runAgent(ctx, "codex", prompt, { sandbox, approval });
      return "codex exec";
    }
    startSession(ctx, tool, { sandbox, approval });
    if (args.length) runAgent(ctx, tool, args.join(" "));
    return "codex";
  }

  if (tool === "claude" || tool === "gemini") {
    const p = takeFlag(args, ["-p", "--print", "--prompt"]);
    const mode = takeFlag(args, ["--permission-mode"]);
    if (p !== undefined) {
      runAgent(ctx, tool, requirePrompt(p === true ? undefined : p || args.join(" "), `${tool} -p "<request>"`));
      return `${tool} -p`;
    }
    if (mode && mode !== "plan" && mode !== "default" && mode !== "acceptEdits") fail(`error: invalid permission mode '${mode}'`);
    unknownFlag(args);
    startSession(ctx, tool, { plan: mode === "plan" });
    if (args.length) runAgent(ctx, tool, args.join(" "));
    return tool;
  }

  unknownFlag(args);
  startSession(ctx, tool);
  if (args.length) runAgent(ctx, tool, args.join(" "));
  return tool;
}

function slashHelp(ctx: Ctx, tool: ToolId) {
  const common: Record<string, [string, string]> = {
    "/init": ["create a rules file for this project", "crée un fichier de règles pour ce projet"],
    "/memory": ["show the rules files loaded", "affiche les fichiers de règles chargés"],
    "/context": ["show what fills the context window", "montre ce qui remplit la fenêtre de contexte"],
    "/skills": ["list the skills the agent can use", "liste les skills que l'agent peut utiliser"],
    "/plan": ["toggle plan mode: propose first, act after you approve", "active/désactive le mode plan : proposer d'abord, agir après ton accord"],
    "/mcp": ["list MCP servers", "liste les serveurs MCP"],
    "/status": ["show sandbox and approval settings", "affiche la sandbox et les approbations"],
    "/clear": ["clear the conversation", "efface la conversation"],
    "/compact": ["summarize the conversation to free context", "résume la conversation pour libérer du contexte"],
    "/exit": ["leave the agent, back to the shell", "quitter l'agent, retour au shell"],
  };
  const per: Record<ToolId, string[]> = {
    claude: ["/init", "/memory", "/context", "/skills", "/plan", "/mcp", "/clear", "/compact", "/exit"],
    codex: ["/init", "/status", "/skills", "/mcp", "/compact", "/exit"],
    gemini: ["/init", "/memory", "/mcp", "/clear", "/compact", "/exit"],
    antigravity: ["/plan", "/skills", "/memory", "/exit"],
  };
  for (const c of per[tool]) ctx.out(`  ${c.padEnd(10)} ${common[c][ctx.locale === "fr" ? 1 : 0]}`, "muted");
  if (tool === "antigravity") {
    const wfs = listWorkflows(viewFiles(ctx.world), tool);
    for (const w of wfs) ctx.out(`  /${w.name.padEnd(9)} ${w.description || "workflow"}`, "muted");
  }
  if (tool === "codex") ctx.out(tx("  $name     mention a skill explicitly", "  $nom      mentionner un skill explicitement"), "muted");
  if (tool === "claude") ctx.out(tx("  /name     run a skill by name · !cmd runs a shell command", "  /nom      lancer un skill par son nom · !cmd lance une commande shell"), "muted");
  ctx.out(tx("  Anything else you type is a request for the agent.", "  Tout le reste est une demande pour l'agent."), "muted");
}

const NOT_SIMULATED = ["/agents", "/hooks", "/permissions", "/config", "/doctor", "/review", "/cost", "/resume", "/login", "/logout", "/diff", "/undo", "/tools", "/settings", "/model"];

/**
 * Input typed while an agent session is open. Returns the recognized command
 * ("prompt" for a plain request). `shell` runs `!cmd` lines.
 */
export function sessionInput(ctx: Ctx, input: string, shell: (line: string) => string | null): string {
  const session = ctx.world.session!;
  const tool = session.tool;
  const text = input.trim();
  const lower = text.toLowerCase();

  if (["/exit", "/quit", "exit", "quit", "/q"].includes(lower)) {
    ctx.world.session = null;
    ctx.out(tx(`Left ${TOOL_NAMES[tool]}. Back to the shell.`, `Tu as quitté ${TOOL_NAMES[tool]}. Retour au shell.`), "muted");
    ctx.emit({ type: "session-end", tool });
    return "/exit";
  }
  if (text.startsWith("!") && (tool === "claude" || tool === "gemini")) {
    return shell(text.slice(1).trim()) ?? "!";
  }
  if (session.pending && isApproval(text)) {
    const prompt = session.pending.prompt;
    session.pending = null;
    runAgent(ctx, tool, prompt, { approved: true });
    return "approve";
  }
  if (text.startsWith("/")) {
    const [cmd, ...rest] = text.split(/\s+/);
    const view = viewFiles(ctx.world);
    switch (cmd) {
      case "/help":
        slashHelp(ctx, tool);
        return "/help";
      case "/init": {
        if (tool === "antigravity") break;
        const path = INIT_FILE[tool];
        if (view[path] !== undefined) {
          ctx.out(tx(`${path} already exists. Edit it to improve your rules.`, `${path} existe déjà. Modifie-le pour améliorer tes règles.`), "muted");
          return "/init";
        }
        const project = getProject(ctx.world.project);
        const pmMatch = view["package.json"]?.match(/"packageManager":\s*"(\w+)@/);
        const content = project.initRules(pmMatch?.[1] ?? "npm");
        ctx.world.files = { ...ctx.world.files, [path]: content };
        ctx.out(`${tool === "codex" ? "•" : "●"} ${tool === "codex" ? "Added" : "Write"}(${path})`, "tool");
        ctx.out(tx(`Created ${path}: commands, structure and conventions I found in the project. Review it: you know things I don't!`, `J'ai créé ${path} : les commandes, la structure et les conventions trouvées dans le projet. Relis-le : tu sais des choses que j'ignore !`), "agent");
        ctx.emit({ type: "rules-write", path });
        ctx.emit({ type: "file-change", paths: [path] });
        return "/init";
      }
      case "/memory": {
        const rules = loadRules(view, tool);
        if (!rules.length) ctx.out(tx("No rules files loaded.", "Aucun fichier de règles chargé."), "muted");
        for (const r of rules) ctx.out(`  ${r.path}${r.importedBy ? `  (@ ${r.importedBy})` : ""} · ${r.content.split("\n").length} lines`, "out");
        return "/memory";
      }
      case "/context": {
        if (tool !== "claude") break;
        const run = lastRun(ctx.world, "main");
        const items = run && run.tool === tool ? run.context : startupContext(ctx.world, tool);
        const total = items.reduce((n, c) => n + c.tokens, 0);
        ctx.out(tx(`Context usage ≈ ${(total / 1000).toFixed(1)}k tokens`, `Contexte utilisé ≈ ${(total / 1000).toFixed(1)}k tokens`), "info");
        for (const c of items) ctx.out(`  ${c.kind.padEnd(12)} ${String(c.tokens).padStart(5)}  ${c.label}`, "muted");
        return "/context";
      }
      case "/skills": {
        if (tool === "gemini") break;
        const skills = listSkills(view, tool);
        if (!skills.length) ctx.out(tx("No skills found.", "Aucun skill trouvé."), "muted");
        for (const s of skills) {
          ctx.out(`  ${s.name}: ${s.description || "(no description)"}`, s.problems.length ? "warning" : "out");
          for (const p of s.problems) ctx.out(`    ⚠ ${ctx.t(p.message)}`, "warning");
        }
        return "/skills";
      }
      case "/plan": {
        if (tool !== "claude" && tool !== "antigravity") break;
        session.plan = !session.plan;
        session.pending = null;
        ctx.out(
          session.plan
            ? tool === "claude"
              ? tx("⏸ plan mode on: I'll propose a plan and wait for your OK. (Real Claude Code: Shift+Tab)", "⏸ mode plan activé : je propose un plan et j'attends ton accord. (Vrai Claude Code : Maj+Tab)")
              : tx("Planning mode: the agent writes a plan before acting.", "Mode Planning : l'agent écrit un plan avant d'agir.")
            : tx("Plan mode off: I'll act directly.", "Mode plan désactivé : j'agis directement."),
          "hint",
        );
        return "/plan";
      }
      case "/mcp": {
        mcpCommand(ctx, tool, ["list"]);
        return "/mcp";
      }
      case "/status":
      case "/approvals": {
        if (tool !== "codex") break;
        const s = codexSettings(view, { sandbox: session.sandbox, approval: session.approval });
        ctx.out(`  sandbox: ${s.sandbox}\n  approval: ${s.approval}\n  config: ~/.codex/config.toml${view["~/.codex/config.toml"] ? "" : " (not created yet)"}`, "out");
        return cmd;
      }
      case "/clear":
        ctx.clear = true;
        return "/clear";
      case "/compact":
      case "/new":
        ctx.out(tx("Conversation summarized. Older messages now take a few hundred tokens instead of thousands.", "Conversation résumée. Les anciens messages prennent maintenant quelques centaines de tokens au lieu de milliers."), "muted");
        return cmd;
    }
    // Claude Code runs a skill with /name; Antigravity runs workflows with /name.
    const name = cmd.slice(1);
    if (tool === "claude" && listSkills(view, tool).some((s) => s.name === name)) {
      runAgent(ctx, tool, text);
      return "prompt";
    }
    if (tool === "antigravity" && listWorkflows(view, tool).some((w) => w.name === name)) {
      runAgent(ctx, tool, text);
      return "workflow";
    }
    if (NOT_SIMULATED.includes(cmd))
      fail(tx(`${cmd} exists in the real tool but isn't simulated here.`, `${cmd} existe dans le vrai outil mais n'est pas simulé ici.`), tx("Type /help to see what works in this simulator.", "Tape /help pour voir ce qui marche dans ce simulateur."));
    void rest;
    fail(tx(`Unknown command ${cmd}. Type /help.`, `Commande inconnue ${cmd}. Tape /help.`), tx("Slash commands are built into each tool, and they differ from tool to tool. /help lists them.", "Les commandes / sont propres à chaque outil, et elles changent d'un outil à l'autre. /help les liste."));
  }
  if (/^(git|ls|cat|orca|npm|pnpm|cd|claude|codex|gemini|antigravity)(\s|$)/.test(text)) {
    const how = tool === "claude" || tool === "gemini" ? tx("prefix it with ! or type /exit", "ajoute ! devant ou tape /exit") : tx("type /exit first", "tape d'abord /exit");
    ctx.out(tx(`You're talking to ${TOOL_NAMES[tool]}, not the shell. To run a shell command, ${how.en}.`, `Tu parles à ${TOOL_NAMES[tool]}, pas au shell. Pour une commande shell, ${how.fr}.`), "hint");
    return "hint";
  }
  runAgent(ctx, tool, text);
  return "prompt";
}
