"use client";

import { clsx } from "clsx";
import { useState, useSyncExternalStore } from "react";
import { Apple, Check, ClipboardCopy, ExternalLink, Monitor, Terminal } from "lucide-react";
import { useL } from "@/i18n";

type Os = "mac" | "linux" | "windows";
type L = (en: string, fr: string) => string;

interface Block {
  code: string;
  /** Shell to paste it in, shown on the block. */
  shell: string;
  note?: string;
}

interface Step {
  id: string;
  title: string;
  body: string;
  blocks: Partial<Record<Os, Block[]>>;
  link?: { href: string; label: string };
}

export const REPO_URL = "https://github.com/RemiPelloux/iadevlearn";

const STARTER = `# 1. Shared rules, read by Codex, Antigravity, Cursor…
cat > AGENTS.md <<'EOF'
# My project

## Commands
- Install: \`npm install\`
- Test: \`npm test\` (run it after every change)

## Conventions
- Keep changes small and focused.
EOF

# 2. Claude Code and Gemini CLI import the same rules
printf '@AGENTS.md\\n' > CLAUDE.md
printf '@AGENTS.md\\n' > GEMINI.md

# 3. A first skill, for Claude Code (.claude/skills) and Codex/Antigravity (.agents/skills)
mkdir -p .claude/skills/changelog .agents/skills
cat > .claude/skills/changelog/SKILL.md <<'EOF'
---
name: changelog
description: Update CHANGELOG.md with the latest changes. Use when the user asks to update the changelog, write release notes or prepare a release.
---

1. Read CHANGELOG.md and the recent changes (git log).
2. Add a \`## [Unreleased]\` section at the top if there isn't one.
3. Group entries under ### Added, ### Fixed or ### Changed.
4. One line per change, starting with a verb.
EOF
cp -r .claude/skills/changelog .agents/skills/

# 4. Sensible Codex defaults (only added if you haven't set them yet)
mkdir -p ~/.codex
grep -qs '^sandbox_mode' ~/.codex/config.toml || printf 'sandbox_mode = "workspace-write"\\napproval_policy = "on-request"\\n' >> ~/.codex/config.toml`;

function steps(l: L): Step[] {
  return [
    {
      id: "prereq",
      title: l("1. Git and Node.js", "1. Git et Node.js"),
      body: l(
        "Every agent CLI needs Git, and Codex and Gemini CLI install with npm, which comes with Node.js (use the LTS version, 20 or newer).",
        "Chaque CLI d'agent a besoin de Git, et Codex et Gemini CLI s'installent avec npm, fourni avec Node.js (prends la version LTS, 20 ou plus).",
      ),
      blocks: {
        mac: [
          { shell: "Terminal", code: '/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"', note: l("Homebrew, the macOS package manager (skip if you have it).", "Homebrew, le gestionnaire de paquets de macOS (passe si tu l'as déjà).") },
          { shell: "Terminal", code: "brew install git node" },
        ],
        linux: [
          { shell: "bash", code: "sudo apt update && sudo apt install -y git curl", note: l("Debian/Ubuntu. On Arch: sudo pacman -S git curl. On Fedora: sudo dnf install git curl.", "Debian/Ubuntu. Sur Arch : sudo pacman -S git curl. Sur Fedora : sudo dnf install git curl.") },
          { shell: "bash", code: "curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash\nexport NVM_DIR=\"$HOME/.nvm\" && . \"$NVM_DIR/nvm.sh\"\nnvm install --lts", note: l("nvm installs Node.js in your home folder: no sudo needed for npm install -g.", "nvm installe Node.js dans ton dossier perso : pas besoin de sudo pour npm install -g.") },
        ],
        windows: [
          { shell: "PowerShell", code: "winget install --id Git.Git -e\nwinget install --id OpenJS.NodeJS.LTS -e", note: l("Close and reopen PowerShell afterwards so git and node are found.", "Ferme et rouvre PowerShell ensuite pour que git et node soient trouvés.") },
          { shell: l("PowerShell (as administrator)", "PowerShell (en administrateur)"), code: "wsl --install", note: l("Optional but recommended: WSL gives you a real Linux terminal. Codex works best there. Then follow the Linux tab inside WSL.", "Optionnel mais recommandé : WSL te donne un vrai terminal Linux. Codex y marche le mieux. Suis ensuite l'onglet Linux dans WSL.") },
        ],
      },
    },
    {
      id: "claude",
      title: "2. Claude Code",
      body: l("Anthropic's agent. The native installer updates itself. On first launch it asks you to log in (Claude subscription or API key).", "L'agent d'Anthropic. L'installeur natif se met à jour tout seul. Au premier lancement, il te demande de te connecter (abonnement Claude ou clé d'API)."),
      blocks: {
        mac: [
          { shell: "Terminal", code: "curl -fsSL https://claude.ai/install.sh | bash" },
          { shell: "Terminal", code: "claude doctor\nclaude", note: l("Check the install, then start it in a project folder.", "Vérifie l'installation, puis lance-le dans un dossier de projet.") },
        ],
        linux: [
          { shell: "bash", code: "curl -fsSL https://claude.ai/install.sh | bash" },
          { shell: "bash", code: "claude doctor\nclaude" },
        ],
        windows: [
          { shell: "PowerShell", code: "irm https://claude.ai/install.ps1 | iex" },
          { shell: "PowerShell", code: "claude doctor\nclaude", note: l("Git for Windows (step 1) lets Claude Code use bash; without it, it uses PowerShell.", "Git pour Windows (étape 1) permet à Claude Code d'utiliser bash ; sans lui, il utilise PowerShell.") },
        ],
      },
      link: { href: "https://code.claude.com/docs/en/setup", label: l("Official setup docs", "Doc d'installation officielle") },
    },
    {
      id: "codex",
      title: "3. Codex",
      body: l("OpenAI's agent CLI. Sign in with your ChatGPT account (or an API key) on first launch.", "Le CLI d'agent d'OpenAI. Connecte-toi avec ton compte ChatGPT (ou une clé d'API) au premier lancement."),
      blocks: {
        mac: [{ shell: "Terminal", code: "npm install -g @openai/codex\ncodex", note: l("Or with Homebrew: brew install --cask codex", "Ou avec Homebrew : brew install --cask codex") }],
        linux: [{ shell: "bash", code: "npm install -g @openai/codex\ncodex", note: l("Never use sudo with npm install -g: install Node.js with nvm instead (step 1).", "N'utilise jamais sudo avec npm install -g : installe plutôt Node.js avec nvm (étape 1).") }],
        windows: [{ shell: "WSL (Ubuntu)", code: "npm install -g @openai/codex\ncodex", note: l("Run it inside WSL (step 1), after installing Node.js there with the Linux commands.", "Lance-le dans WSL (étape 1), après y avoir installé Node.js avec les commandes Linux.") }],
      },
      link: { href: "https://developers.openai.com/codex", label: l("Official Codex docs", "Doc officielle de Codex") },
    },
    {
      id: "gemini",
      title: "4. Gemini CLI",
      body: l("Google's open-source agent. Log in with your Google account on first launch.", "L'agent open source de Google. Connecte-toi avec ton compte Google au premier lancement."),
      blocks: {
        mac: [{ shell: "Terminal", code: "npm install -g @google/gemini-cli\ngemini" }],
        linux: [{ shell: "bash", code: "npm install -g @google/gemini-cli\ngemini" }],
        windows: [{ shell: "PowerShell", code: "npm install -g @google/gemini-cli\ngemini" }],
      },
      link: { href: "https://github.com/google-gemini/gemini-cli", label: l("Gemini CLI on GitHub", "Gemini CLI sur GitHub") },
    },
    {
      id: "antigravity",
      title: "5. Antigravity",
      body: l("Google's agent-first IDE is a desktop app: download the installer for your system, open it and sign in with Google.", "L'IDE « agent d'abord » de Google est une appli de bureau : télécharge l'installeur pour ton système, ouvre-le et connecte-toi avec Google."),
      blocks: {},
      link: { href: "https://antigravity.google/download", label: l("Download Antigravity", "Télécharger Antigravity") },
    },
    {
      id: "orca",
      title: "6. Orca",
      body: l(
        "Stably's desktop app to run many agents in parallel, one git worktree each. It works with any agent that runs in a terminal (Claude Code, Codex, Gemini…).",
        "L'appli de bureau de Stably pour faire tourner plusieurs agents en parallèle, un worktree git chacun. Elle marche avec tout agent qui tourne dans un terminal (Claude Code, Codex, Gemini…).",
      ),
      blocks: {
        mac: [{ shell: "Terminal", code: "brew install --cask stablyai/orca/orca" }],
        linux: [{ shell: "bash", code: "orca status", note: l("Download the Linux build from onorca.dev (Arch users: it's on the AUR), then check the CLI is on your PATH.", "Télécharge la version Linux sur onorca.dev (sur Arch : elle est dans l'AUR), puis vérifie que le CLI est dans ton PATH.") }],
        windows: [{ shell: "PowerShell", code: "orca status", note: l("Download the installer from onorca.dev, then check the CLI.", "Télécharge l'installeur sur onorca.dev, puis vérifie le CLI.") }],
      },
      link: { href: "https://onorca.dev", label: l("Orca website", "Site d'Orca") },
    },
    {
      id: "check",
      title: l("7. Check everything", "7. Tout vérifier"),
      body: l("Each line should print a version number.", "Chaque ligne doit afficher un numéro de version."),
      blocks: {
        mac: [{ shell: "Terminal", code: "git --version && node --version && claude --version && codex --version && gemini --version" }],
        linux: [{ shell: "bash", code: "git --version && node --version && claude --version && codex --version && gemini --version" }],
        windows: [{ shell: "PowerShell", code: "git --version; node --version; claude --version; gemini --version" }],
      },
    },
    {
      id: "starter",
      title: l("8. Starter kit for your project", "8. Kit de départ pour ton projet"),
      body: l(
        "Run this at the root of one of your projects: shared rules for every agent, a first skill for Claude Code and Codex, and safe Codex defaults — exactly what the lessons teach. Edit the commands in AGENTS.md to match your project.",
        "Lance ceci à la racine d'un de tes projets : des règles partagées pour tous les agents, un premier skill pour Claude Code et Codex, et des réglages Codex prudents — exactement ce qu'enseignent les leçons. Adapte les commandes d'AGENTS.md à ton projet.",
      ),
      blocks: {
        mac: [{ shell: "Terminal", code: STARTER }],
        linux: [{ shell: "bash", code: STARTER }],
        windows: [{ shell: l("Git Bash or WSL", "Git Bash ou WSL"), code: STARTER, note: l("This is a bash script: paste it in Git Bash (installed with Git) or WSL, not PowerShell.", "C'est un script bash : colle-le dans Git Bash (installé avec Git) ou WSL, pas dans PowerShell.") }],
      },
    },
    {
      id: "local",
      title: l("9. Run IA Dev Learn on your computer", "9. Lancer IA Dev Learn sur ton ordinateur"),
      body: l("The whole course runs offline in your browser. Clone it and start it locally:", "Tout le cours tourne hors ligne dans ton navigateur. Clone-le et lance-le en local :"),
      blocks: {
        mac: [{ shell: "Terminal", code: `git clone ${REPO_URL}.git\ncd iadevlearn\nnpm ci\nnpm run dev`, note: "→ http://localhost:3000" }],
        linux: [{ shell: "bash", code: `git clone ${REPO_URL}.git\ncd iadevlearn\nnpm ci\nnpm run dev`, note: "→ http://localhost:3000" }],
        windows: [{ shell: "PowerShell", code: `git clone ${REPO_URL}.git\ncd iadevlearn\nnpm ci\nnpm run dev`, note: "→ http://localhost:3000" }],
      },
    },
  ];
}

function guessOs(): Os {
  if (typeof navigator === "undefined") return "mac";
  const p = `${navigator.platform} ${navigator.userAgent}`.toLowerCase();
  return p.includes("win") ? "windows" : p.includes("mac") ? "mac" : "linux";
}

function CopyButton({ text, label, caption }: { text: string; label: string; caption?: string }) {
  const l = useL();
  const [done, setDone] = useState(false);
  return (
    <button
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 1400);
        } catch {
          /* clipboard unavailable */
        }
      }}
      className="flex items-center gap-1 rounded-md px-2 py-1 font-sans text-[11px] text-[var(--t-muted)] hover:bg-white/10 hover:text-white"
      aria-label={label}
    >
      {done ? <Check className="size-3.5 text-[var(--t-green)]" /> : <ClipboardCopy className="size-3.5" />}
      {done ? l("Copied", "Copié") : (caption ?? l("Copy", "Copier"))}
    </button>
  );
}

function CodeBlock({ block }: { block: Block }) {
  const l = useL();
  return (
    <div>
      <div className="terminal overflow-hidden rounded-lg bg-term">
        <div className="flex items-center justify-between border-b border-white/5 px-3 py-1.5 font-mono text-[11px] text-[var(--t-muted)]">
          <span>{block.shell}</span>
          <CopyButton text={block.code} label={l(`Copy command for ${block.shell}`, `Copier la commande pour ${block.shell}`)} />
        </div>
        <pre className="scrollbar-thin overflow-x-auto px-3 py-2.5 font-mono text-[12.5px] leading-relaxed text-[var(--t-text)]">
          {block.code.split("\n").map((line, i) => (
            <div key={i} className={line.startsWith("#") ? "text-[var(--t-muted)]" : ""}>
              {line || " "}
            </div>
          ))}
        </pre>
      </div>
      {block.note && <p className="mt-1.5 text-xs text-fg-3">{block.note}</p>}
    </div>
  );
}

export function SetupGuide() {
  const l = useL();
  const detected = useSyncExternalStore(
    () => () => {},
    guessOs,
    () => null,
  );
  const [chosen, setChosen] = useState<Os | null>(null);
  const os: Os = chosen ?? detected ?? "mac";
  const all = steps(l);
  const OSES: Array<{ id: Os; label: string; icon: typeof Apple }> = [
    { id: "mac", label: "macOS", icon: Apple },
    { id: "linux", label: "Linux", icon: Terminal },
    { id: "windows", label: "Windows", icon: Monitor },
  ];
  const script = all
    .filter((s) => s.id !== "starter" && s.id !== "local")
    .flatMap((s) => (s.blocks[os] ?? []).map((b) => `# ${s.title}\n${b.code}`))
    .join("\n\n");

  return (
    <div className="mx-auto max-w-3xl px-4 pt-10 pb-28 md:pb-16">
      <h1 className="text-3xl font-semibold tracking-tight">{l("Install the real tools", "Installe les vrais outils")}</h1>
      <p className="mt-2 text-fg-2">
        {l(
          "The lessons use a simulator. When you're ready, here is everything to copy and paste to install the real agents on your computer. Commands come from each tool's official instructions.",
          "Les leçons utilisent un simulateur. Quand tu es prêt, voici tout ce qu'il faut copier-coller pour installer les vrais agents sur ton ordinateur. Les commandes viennent des instructions officielles de chaque outil.",
        )}
      </p>

      <div className="sticky top-14 z-10 -mx-4 mt-6 flex flex-wrap items-center gap-2 border-b border-line bg-bg/90 px-4 py-3 backdrop-blur" role="radiogroup" aria-label={l("Your system", "Ton système")}>
        {OSES.map((o) => (
          <button
            key={o.id}
            role="radio"
            aria-checked={os === o.id}
            onClick={() => setChosen(o.id)}
            className={clsx("flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium", os === o.id ? "border-accent/50 bg-accent-soft text-accent-fg" : "border-line text-fg-2 hover:border-line-strong")}
          >
            <o.icon className="size-4" /> {o.label}
          </button>
        ))}
        <span className="ml-auto">
          <span className="terminal inline-block rounded-lg bg-term">
            <CopyButton text={script} caption={l("Copy all", "Tout copier")} label={l("Copy every install command for this system", "Copier toutes les commandes d'installation pour ce système")} />
          </span>
          <span className="ml-2 hidden text-xs text-fg-3 sm:inline">{l("all steps 1–7 at once", "les étapes 1 à 7 d'un coup")}</span>
        </span>
      </div>

      <ol className="mt-6 space-y-10">
        {all.map((s) => (
          <li key={s.id} id={s.id} className="scroll-mt-32">
            <h2 className="text-xl font-semibold tracking-tight">{s.title}</h2>
            <p className="mt-1.5 text-sm leading-relaxed text-fg-2">{s.body}</p>
            <div className="mt-3 space-y-3">
              {(s.blocks[os] ?? []).map((b, i) => (
                <CodeBlock key={i} block={b} />
              ))}
            </div>
            {s.link && (
              <a href={s.link.href} target="_blank" rel="noreferrer" className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-accent-fg underline-offset-4 hover:underline">
                {s.link.label} <ExternalLink className="size-3.5" />
              </a>
            )}
          </li>
        ))}
      </ol>

      <p className="mt-12 rounded-lg border border-line bg-surface p-4 text-sm text-fg-2">
        {l(
          "Safety first: run agents inside a Git repository and commit before big changes, so you can always review their diff and undo. Never paste API keys into a prompt or a rules file.",
          "La sécurité d'abord : lance les agents dans un dépôt Git et commite avant les gros changements, pour toujours pouvoir relire leur diff et annuler. Ne colle jamais de clé d'API dans un prompt ou un fichier de règles.",
        )}
      </p>
    </div>
  );
}
