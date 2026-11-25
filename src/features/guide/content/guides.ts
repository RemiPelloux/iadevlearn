import type { DocPage } from "../types";

export const GUIDE_PAGES: DocPage[] = [
  {
    slug: "agents",
    section: "guides",
    icon: "Bot",
    lesson: "what-is-an-agent",
    title: { en: "What a coding agent is", fr: "Ce qu'est un agent de code" },
    lead: {
      en: "A chat assistant writes text for you to copy. An agent opens your files, edits them and runs commands itself.",
      fr: "Un assistant de chat écrit du texte que tu copies. Un agent ouvre tes fichiers, les modifie et lance des commandes lui-même.",
    },
    body: {
      en: `## The loop

Every agent works the same way, whoever makes it:

1. **Read.** It opens the files it thinks it needs, or searches the project when you don't say where to look.
2. **Plan.** It decides what to change and how it will check the change.
3. **Act.** It edits files and runs commands, asking first if its settings require it.
4. **Verify.** It runs tests or the build. If something fails, it goes back to Plan.
5. **Report.** It tells you what it did, so you can review the diff.

Your job moves from typing code to describing work precisely, giving the agent the right context, and reviewing what comes back.

## The four agents in this course

| Agent | Made by | How it runs | Reads rules from | Skills folder |
|---|---|---|---|---|
| Claude Code | Anthropic | Terminal (also IDE extensions and desktop) | \`CLAUDE.md\` | \`.claude/skills/\` |
| Codex | OpenAI | Terminal, with a configurable sandbox | \`AGENTS.md\` | \`.agents/skills/\` |
| Gemini CLI | Google | Terminal, open source | \`GEMINI.md\` | not covered here |
| Antigravity | Google | Desktop IDE with an Agent Manager | \`AGENTS.md\`, \`GEMINI.md\`, \`.agents/rules/\` | \`.agents/skills/\` |

They differ in commands and file names more than in how you should work with them. Everything in the guides that follow applies to all four.

## Talking to one

Start it in a project folder by typing its name, then write what you want in plain language, in English or French. One-off commands exist too: \`claude -p "..."\`, \`codex exec "..."\` and \`gemini -p "..."\` answer once and exit, which is handy in scripts.`,
      fr: `## La boucle

Tous les agents travaillent de la même façon, quel que soit leur éditeur :

1. **Lire.** Il ouvre les fichiers dont il pense avoir besoin, ou fouille le projet quand tu ne dis pas où regarder.
2. **Planifier.** Il décide quoi changer et comment il vérifiera le changement.
3. **Agir.** Il modifie des fichiers et lance des commandes, en demandant d'abord si ses réglages l'exigent.
4. **Vérifier.** Il lance les tests ou le build. Si quelque chose échoue, il repart à Planifier.
5. **Rendre compte.** Il te dit ce qu'il a fait, pour que tu relises le diff.

Ton travail passe de taper du code à décrire le travail précisément, donner le bon contexte à l'agent, et relire ce qu'il rend.

## Les quatre agents du cours

| Agent | Éditeur | Où il tourne | Lit ses règles dans | Dossier des skills |
|---|---|---|---|---|
| Claude Code | Anthropic | Terminal (aussi extensions d'IDE et appli de bureau) | \`CLAUDE.md\` | \`.claude/skills/\` |
| Codex | OpenAI | Terminal, avec une sandbox configurable | \`AGENTS.md\` | \`.agents/skills/\` |
| Gemini CLI | Google | Terminal, open source | \`GEMINI.md\` | non couvert ici |
| Antigravity | Google | IDE de bureau avec un Agent Manager | \`AGENTS.md\`, \`GEMINI.md\`, \`.agents/rules/\` | \`.agents/skills/\` |

Ils diffèrent par les commandes et les noms de fichiers plus que par la façon de travailler avec eux. Tout ce que disent les guides suivants vaut pour les quatre.

## Lui parler

Lance-le dans un dossier de projet en tapant son nom, puis écris ce que tu veux avec tes mots, en français ou en anglais. Il existe aussi des commandes ponctuelles : \`claude -p "..."\`, \`codex exec "..."\` et \`gemini -p "..."\` répondent une fois puis s'arrêtent, pratique dans les scripts.`,
    },
  },
  {
    slug: "prompting",
    section: "guides",
    icon: "MessageSquareText",
    lesson: "first-prompt",
    title: { en: "Writing prompts that work", fr: "Écrire des prompts qui marchent" },
    lead: {
      en: "An agent never says it doesn't know. Whatever your prompt leaves out, it guesses.",
      fr: "Un agent ne dit jamais qu'il ne sait pas. Tout ce que ton prompt laisse de côté, il le devine.",
    },
    body: {
      en: `## Six things to say

| Ingredient | The question it answers | Example |
|---|---|---|
| Goal | What should change? | Add a discount function |
| Context | Where? | in @src/cart.ts |
| Details | How exactly? | applyDiscount(totalCents, percent), 20 means 20% off |
| Constraints | What must not happen? | never below 0, don't change total() |
| Verify | How do we check it? | add tests and run them |
| Done when | What does finished look like? | it returns whole cents |

You rarely need all six in one sentence. Your rules file can carry the permanent ones (how to run tests, which package manager), and a skill can carry the format of a recurring task.

## The same request, twice

> Warning: "add a discount"

The agent searched the whole project, created \`src/discount.js\` (JavaScript, in a TypeScript project), hard-coded 10% off and wrote no test.

\`\`\`text
Add applyDiscount(totalCents, percent) to @src/cart.ts: 20 means 20% off,
never below 0. Add tests and run them.
\`\`\`

Right file, right rule, two tests, and the agent ran them.

## Habits that pay off

- Point at files with \`@path\` instead of describing them.
- Show the exact output you want in quotes: "12,50 €" leaves nothing to interpret.
- Say what to keep: "keep the name formatPrice" prevents a rename that breaks every import.
- One task per prompt. Two unrelated changes in one request are harder to review.
- If the result is off, say what's wrong and why, rather than repeating the prompt louder.
- Ask questions too. "What does total() do?" changes nothing and costs little.`,
      fr: `## Six choses à dire

| Ingrédient | La question | Exemple |
|---|---|---|
| Objectif | Qu'est-ce qui doit changer ? | Ajoute une fonction de remise |
| Contexte | Où ? | dans @src/cart.ts |
| Précision | Comment exactement ? | applyDiscount(totalCents, percent), 20 veut dire 20 % de remise |
| Contraintes | Qu'est-ce qui ne doit pas arriver ? | jamais sous 0, ne change pas total() |
| Vérification | Comment on vérifie ? | ajoute des tests et lance-les |
| Critère de fin | À quoi ressemble « fini » ? | elle renvoie des centimes entiers |

Il est rare d'avoir besoin des six dans une phrase. Ton fichier de règles peut porter ceux qui ne changent pas (comment lancer les tests, quel gestionnaire de paquets), et un skill peut porter le format d'une tâche récurrente.

## La même demande, deux fois

> Attention : « add a discount »

L'agent a fouillé tout le projet, créé \`src/discount.js\` (du JavaScript dans un projet TypeScript), codé 10 % en dur et n'a écrit aucun test.

\`\`\`text
Add applyDiscount(totalCents, percent) to @src/cart.ts: 20 means 20% off,
never below 0. Add tests and run them.
\`\`\`

Bon fichier, bonne règle, deux tests, et l'agent les a lancés.

## Les habitudes qui paient

- Désigne les fichiers avec \`@chemin\` au lieu de les décrire.
- Montre le résultat exact voulu entre guillemets : « 12,50 € » ne laisse rien à interpréter.
- Dis ce qu'il faut garder : « garde le nom formatPrice » évite un renommage qui casse tous les imports.
- Une tâche par prompt. Deux changements sans rapport dans une demande sont plus durs à relire.
- Si le résultat cloche, dis ce qui ne va pas et pourquoi, au lieu de répéter le prompt plus fort.
- Pose aussi des questions. « Que fait total() ? » ne change rien et coûte peu.`,
    },
  },
  {
    slug: "context",
    section: "guides",
    icon: "Layers",
    lesson: "context-window",
    title: { en: "Context windows and tokens", fr: "Fenêtre de contexte et tokens" },
    lead: {
      en: "An agent only knows what's in its context window. Managing it is most of the skill.",
      fr: "Un agent ne sait que ce qui est dans sa fenêtre de contexte. La gérer, c'est l'essentiel du métier.",
    },
    body: {
      en: `## What fills it

Each time the agent answers, it reads, in order: its own system prompt, your rules files, the list of skill names and descriptions, the tool lists of any MCP servers, the files it opened, the conversation so far, and your new message. All of it is counted in tokens, roughly three quarters of a word each.

The window is large (around 200,000 tokens in current tools) but not free. More tokens cost more, make answers slower, and bury the details that matter under ones that don't.

## Keep it lean

- Mention the files that matter with \`@path\`. An agent that has to search reads far more than it needs.
- Keep rules short: they're loaded into every single conversation.
- Move long procedures into skills, which only load when used.
- Remove MCP servers you don't use. Each one adds its whole tool list to every session.
- Start a fresh session for a new task. The old conversation is noise for the new one.

## When it fills up

Claude Code, Codex and Gemini CLI can summarise the conversation to free space (\`/compact\`). Summaries lose details, so a new session with a clear prompt is often the better reset. In Claude Code, \`/context\` shows what's taking room right now.`,
      fr: `## Ce qui la remplit

Chaque fois que l'agent répond, il lit, dans l'ordre : son propre prompt système, tes fichiers de règles, la liste des noms et descriptions de skills, la liste d'outils des serveurs MCP, les fichiers qu'il a ouverts, la conversation jusqu'ici, et ton nouveau message. Tout est compté en tokens, environ trois quarts de mot chacun.

La fenêtre est grande (environ 200 000 tokens dans les outils actuels) mais pas gratuite. Plus de tokens coûtent plus cher, ralentissent les réponses et noient les détails importants sous ceux qui ne le sont pas.

## Garde-la légère

- Cite les fichiers qui comptent avec \`@chemin\`. Un agent qui doit chercher lit bien plus que nécessaire.
- Garde des règles courtes : elles sont chargées dans chaque conversation.
- Mets les longues procédures dans des skills, qui ne se chargent que quand on s'en sert.
- Retire les serveurs MCP inutiles. Chacun ajoute toute sa liste d'outils à chaque session.
- Ouvre une nouvelle session pour une nouvelle tâche. L'ancienne conversation est du bruit pour la nouvelle.

## Quand elle se remplit

Claude Code, Codex et Gemini CLI peuvent résumer la conversation pour libérer de la place (\`/compact\`). Un résumé perd des détails, alors une nouvelle session avec un prompt clair est souvent un meilleur départ. Dans Claude Code, \`/context\` montre ce qui prend de la place en ce moment.`,
    },
  },
  {
    slug: "plan-verify",
    section: "guides",
    icon: "ListChecks",
    lesson: "plan-verify",
    title: { en: "Plan first, then verify", fr: "Planifier, puis vérifier" },
    lead: {
      en: "Correcting a plan costs one sentence. Correcting finished code costs a review.",
      fr: "Corriger un plan coûte une phrase. Corriger du code fini coûte une relecture.",
    },
    body: {
      en: `## Plan mode

In plan mode the agent explores the project and writes a numbered plan, but changes nothing. You read it, correct it ("use a comma, not a dot"), then approve. Only then does it edit files.

| Tool | How to plan first |
|---|---|
| Claude Code | Shift+Tab cycles to plan mode, or start with \`claude --permission-mode plan\` |
| Antigravity | Choose the Planning mode for the conversation |
| Codex, Gemini CLI | Ask for it: "Propose a plan first and wait for my OK" |

In the simulator, \`/plan\` toggles plan mode and \`yes\` (or \`oui\`) approves.

Plan anything bigger than a one-line fix, anything that touches several files, and anything you're not sure how you'd do yourself.

## Close the loop

An agent that runs the tests catches most of its own mistakes before you see them. Ask for it in the prompt ("add a test and run it"), or once and for all in your rules: \`Test: pnpm test (run it after every change)\`.

## Review before you keep

Read the diff. \`git diff\` in the terminal, or the [[Changes]] view in the editor, shows exactly what changed. Commit before a big request, so that throwing a bad result away is one command.`,
      fr: `## Le mode plan

En mode plan, l'agent explore le projet et écrit un plan numéroté, sans rien changer. Tu le lis, tu le corriges (« mets une virgule, pas un point »), puis tu valides. C'est seulement là qu'il modifie les fichiers.

| Outil | Comment planifier d'abord |
|---|---|
| Claude Code | Maj+Tab passe en mode plan, ou démarre avec \`claude --permission-mode plan\` |
| Antigravity | Choisis le mode Planning pour la conversation |
| Codex, Gemini CLI | Demande-le : « Propose d'abord un plan et attends mon accord » |

Dans le simulateur, \`/plan\` active ou coupe le mode plan, et \`oui\` (ou \`yes\`) valide.

Planifie tout ce qui dépasse une correction d'une ligne, tout ce qui touche plusieurs fichiers, et tout ce que tu ne saurais pas faire toi-même sans réfléchir.

## Boucler la boucle

Un agent qui lance les tests attrape la plupart de ses erreurs avant que tu les voies. Demande-le dans le prompt (« ajoute un test et lance-le »), ou une fois pour toutes dans tes règles : \`Test: pnpm test (run it after every change)\`.

## Relire avant de garder

Lis le diff. \`git diff\` dans le terminal, ou la vue [[Changements]] de l'éditeur, montre exactement ce qui a changé. Commite avant une grosse demande : jeter un mauvais résultat ne prend alors qu'une commande.`,
    },
  },
  {
    slug: "rules",
    section: "guides",
    icon: "BookOpenCheck",
    lesson: "what-are-rules",
    title: { en: "Rules files", fr: "Les fichiers de règles" },
    lead: {
      en: "Agents start every session with no memory of your project. A rules file is the note they read first.",
      fr: "Les agents commencent chaque session sans aucun souvenir de ton projet. Un fichier de règles est la note qu'ils lisent en premier.",
    },
    body: {
      en: `## Where each tool looks

| Tool | Personal (all projects) | Project (shared with the team) | Notes |
|---|---|---|---|
| Claude Code | \`~/.claude/CLAUDE.md\` | \`CLAUDE.md\`, \`.claude/CLAUDE.md\` | \`CLAUDE.local.md\` for personal notes in one project. \`@path\` lines import other files. |
| Codex | \`~/.codex/AGENTS.md\` | \`AGENTS.md\` | An AGENTS.md in a subfolder adds rules for that folder. |
| Gemini CLI | \`~/.gemini/GEMINI.md\` | \`GEMINI.md\` | Supports \`@path\` imports too. |
| Antigravity | \`~/.gemini/GEMINI.md\` | \`AGENTS.md\`, \`GEMINI.md\`, \`.agents/rules/*.md\` | One file per topic in \`.agents/rules/\`. |
| Cursor | | \`.cursor/rules/*.mdc\`, \`AGENTS.md\` | \`.mdc\` rules can target files with globs. |

## One rulebook for every agent

Write the shared rules once in \`AGENTS.md\`. Then point Claude Code and Gemini CLI at it with a one-line file each:

\`\`\`bash
printf '@AGENTS.md\\n' > CLAUDE.md
printf '@AGENTS.md\\n' > GEMINI.md
\`\`\`

You can still add tool-specific rules under the import line.

## What to write

Write what an agent can't guess and would otherwise get wrong:

\`\`\`markdown
# Tiny Shop

## Commands
- Install: \`pnpm install\`
- Test: \`pnpm test\` (run it after every change)

## Conventions
- Prices are integers in cents.
- Never edit \`src/generated/\`: it's rebuilt by \`pnpm codegen\`.
\`\`\`

Exact commands in backticks, conventions that differ from the defaults, folders not to touch. Short sections with headings.

## What to leave out

- Wishes any agent already follows, like "write clean code" or "follow best practices".
- Contradictions. If one line says npm and another says pnpm, the agent picks one, maybe the wrong one.
- Long procedures. Every line is loaded into every conversation, so move step-by-step how-tos into [skills](/docs/skills).
- Shouting. When five rules say IMPORTANT, none of them stands out.

\`/init\` in Claude Code, Codex or Gemini CLI writes a first draft from your project. Read it and fix it: you know things it can't see.`,
      fr: `## Où chaque outil regarde

| Outil | Personnel (tous les projets) | Projet (partagé avec l'équipe) | À savoir |
|---|---|---|---|
| Claude Code | \`~/.claude/CLAUDE.md\` | \`CLAUDE.md\`, \`.claude/CLAUDE.md\` | \`CLAUDE.local.md\` pour des notes perso dans un projet. Les lignes \`@chemin\` importent d'autres fichiers. |
| Codex | \`~/.codex/AGENTS.md\` | \`AGENTS.md\` | Un AGENTS.md dans un sous-dossier ajoute des règles pour ce dossier. |
| Gemini CLI | \`~/.gemini/GEMINI.md\` | \`GEMINI.md\` | Accepte aussi les imports \`@chemin\`. |
| Antigravity | \`~/.gemini/GEMINI.md\` | \`AGENTS.md\`, \`GEMINI.md\`, \`.agents/rules/*.md\` | Un fichier par sujet dans \`.agents/rules/\`. |
| Cursor | | \`.cursor/rules/*.mdc\`, \`AGENTS.md\` | Les règles \`.mdc\` peuvent cibler des fichiers avec des globs. |

## Un seul règlement pour tous les agents

Écris les règles communes une fois dans \`AGENTS.md\`. Ensuite, relie Claude Code et Gemini CLI avec un fichier d'une ligne chacun :

\`\`\`bash
printf '@AGENTS.md\\n' > CLAUDE.md
printf '@AGENTS.md\\n' > GEMINI.md
\`\`\`

Tu peux toujours ajouter des règles propres à un outil sous la ligne d'import.

## Quoi écrire

Écris ce qu'un agent ne peut pas deviner et ferait faux sinon :

\`\`\`markdown
# Tiny Shop

## Commands
- Install: \`pnpm install\`
- Test: \`pnpm test\` (run it after every change)

## Conventions
- Prices are integers in cents.
- Never edit \`src/generated/\`: it's rebuilt by \`pnpm codegen\`.
\`\`\`

Les commandes exactes entre backticks, les conventions qui sortent de l'ordinaire, les dossiers à ne pas toucher. De courtes sections avec des titres.

## Quoi laisser de côté

- Les vœux que tout agent suit déjà, comme « écris du code propre » ou « suis les bonnes pratiques ».
- Les contradictions. Si une ligne dit npm et une autre pnpm, l'agent en choisit une, peut-être la mauvaise.
- Les longues procédures. Chaque ligne est chargée dans chaque conversation : mets les modes d'emploi pas à pas dans des [skills](/docs/skills).
- Les majuscules partout. Quand cinq règles disent IMPORTANT, aucune ne ressort.

\`/init\` dans Claude Code, Codex ou Gemini CLI écrit un premier jet à partir de ton projet. Relis-le et corrige-le : tu sais des choses qu'il ne voit pas.`,
    },
  },
  {
    slug: "skills",
    section: "guides",
    icon: "Sparkles",
    lesson: "what-is-a-skill",
    title: { en: "Skills", fr: "Les skills" },
    lead: {
      en: "A skill is know-how the agent loads only when your request needs it, so you can have dozens without filling the context.",
      fr: "Un skill est un savoir-faire que l'agent ne charge que quand ta demande en a besoin : tu peux en avoir des dizaines sans remplir le contexte.",
    },
    body: {
      en: `## Anatomy

A skill is a folder named after it, with a \`SKILL.md\` inside:

\`\`\`markdown
---
name: changelog
description: Update CHANGELOG.md with the latest changes. Use when the user asks to update the changelog, write release notes or prepare a release.
---

1. Read CHANGELOG.md and the recent changes.
2. Add a \`## [Unreleased]\` section at the top if there isn't one.
3. Group entries under ### Added, ### Fixed or ### Changed.
4. One line per change, starting with a verb.
\`\`\`

The block between the \`---\` lines is the frontmatter. \`name\` is lowercase with hyphens and matches the folder. \`description\` says what the skill does and when to use it. The rest is the instructions. You can add scripts or reference files in the same folder and mention them in the steps.

## How the agent picks one

At the start of a session, the agent reads only each skill's name and description. When your request matches a description, it loads that whole SKILL.md and follows it. This is called progressive disclosure, and it's why the description matters more than anything else in the file. Write the words people actually use: "changelog", "release notes", "README".

You can also call one by name: \`/changelog\` in Claude Code, \`$changelog\` in Codex.

## Where they go

| Tool | Project | Personal |
|---|---|---|
| Claude Code | \`.claude/skills/<name>/SKILL.md\` | \`~/.claude/skills/\` |
| Codex | \`.agents/skills/<name>/SKILL.md\` | \`~/.agents/skills/\` |
| Antigravity | \`.agents/skills/<name>/SKILL.md\` | global skills folder, see its docs |

The format is the same everywhere, so one skill works in several tools:

\`\`\`bash
mkdir -p .agents/skills
cp -r .claude/skills/changelog .agents/skills/
\`\`\`

## Rules or skill?

Rules hold what's always true for the project. A skill holds how to do one specific job. "We use pnpm" is a rule. "How we write release notes" is a skill.`,
      fr: `## Anatomie

Un skill est un dossier qui porte son nom, avec un \`SKILL.md\` dedans :

\`\`\`markdown
---
name: changelog
description: Update CHANGELOG.md with the latest changes. Use when the user asks to update the changelog, write release notes or prepare a release.
---

1. Read CHANGELOG.md and the recent changes.
2. Add a \`## [Unreleased]\` section at the top if there isn't one.
3. Group entries under ### Added, ### Fixed or ### Changed.
4. One line per change, starting with a verb.
\`\`\`

Le bloc entre les lignes \`---\` est l'en-tête (frontmatter). \`name\` s'écrit en minuscules avec des tirets et correspond au dossier. \`description\` dit ce que fait le skill et quand l'utiliser. Le reste, ce sont les instructions. Tu peux ajouter des scripts ou des fichiers de référence dans le même dossier et les citer dans les étapes.

## Comment l'agent en choisit un

Au début d'une session, l'agent ne lit que le nom et la description de chaque skill. Quand ta demande correspond à une description, il charge tout le SKILL.md et le suit. C'est la divulgation progressive, et c'est pour ça que la description compte plus que tout le reste du fichier. Emploie les mots que les gens utilisent vraiment : « changelog », « release notes », « README ».

Tu peux aussi en appeler un par son nom : \`/changelog\` dans Claude Code, \`$changelog\` dans Codex.

## Où les mettre

| Outil | Projet | Personnel |
|---|---|---|
| Claude Code | \`.claude/skills/<nom>/SKILL.md\` | \`~/.claude/skills/\` |
| Codex | \`.agents/skills/<nom>/SKILL.md\` | \`~/.agents/skills/\` |
| Antigravity | \`.agents/skills/<nom>/SKILL.md\` | dossier global, voir sa doc |

Le format est le même partout, donc un skill marche dans plusieurs outils :

\`\`\`bash
mkdir -p .agents/skills
cp -r .claude/skills/changelog .agents/skills/
\`\`\`

## Règle ou skill ?

Les règles contiennent ce qui est toujours vrai pour le projet. Un skill contient la façon de faire un travail précis. « On utilise pnpm » est une règle. « Comment on écrit les notes de version » est un skill.`,
    },
  },
  {
    slug: "codex",
    section: "guides",
    icon: "ShieldCheck",
    lesson: "codex-sandbox",
    title: { en: "Codex: sandbox and approvals", fr: "Codex : sandbox et approbations" },
    lead: {
      en: "Two separate settings decide what Codex may do on its own: the sandbox and the approval policy.",
      fr: "Deux réglages séparés décident de ce que Codex peut faire seul : la sandbox et la politique d'approbation.",
    },
    body: {
      en: `## The two settings

| Setting | Values | Controls |
|---|---|---|
| \`sandbox_mode\` | \`read-only\`, \`workspace-write\`, \`danger-full-access\` | What Codex is technically able to do |
| \`approval_policy\` | \`untrusted\`, \`on-request\`, \`never\` | When it must stop and ask you |

\`read-only\` lets it read and explain but not edit. \`workspace-write\` lets it edit inside the project. \`danger-full-access\` removes the sandbox. \`untrusted\` asks before almost every command, \`on-request\` asks when it needs to go beyond the sandbox, \`never\` never asks.

## Defaults that work day to day

Put them in \`~/.codex/config.toml\`:

\`\`\`toml
sandbox_mode = "workspace-write"
approval_policy = "on-request"
\`\`\`

A project can override them in \`.codex/config.toml\`.

## Per run

Flags win over the config file, for one run:

\`\`\`bash
codex --sandbox read-only            # explore an unknown repo safely
codex exec --full-auto "Fix the failing test in @src/cart.ts"
\`\`\`

\`--full-auto\` is shorthand for workspace-write with on-request approvals. \`codex exec\` runs once without the interactive UI.

> Warning: \`--yolo\` (long form \`--dangerously-bypass-approvals-and-sandbox\`) removes both protections. Keep it for throwaway containers, never your own machine.`,
      fr: `## Les deux réglages

| Réglage | Valeurs | Contrôle |
|---|---|---|
| \`sandbox_mode\` | \`read-only\`, \`workspace-write\`, \`danger-full-access\` | Ce que Codex peut techniquement faire |
| \`approval_policy\` | \`untrusted\`, \`on-request\`, \`never\` | Quand il doit s'arrêter pour te demander |

\`read-only\` le laisse lire et expliquer mais pas modifier. \`workspace-write\` le laisse modifier dans le projet. \`danger-full-access\` retire la sandbox. \`untrusted\` demande avant presque chaque commande, \`on-request\` demande quand il doit sortir de la sandbox, \`never\` ne demande jamais.

## Des valeurs pour le quotidien

Mets-les dans \`~/.codex/config.toml\` :

\`\`\`toml
sandbox_mode = "workspace-write"
approval_policy = "on-request"
\`\`\`

Un projet peut les remplacer dans \`.codex/config.toml\`.

## Pour une exécution

Les options l'emportent sur le fichier de config, le temps d'une exécution :

\`\`\`bash
codex --sandbox read-only            # explorer un dépôt inconnu sans risque
codex exec --full-auto "Fix the failing test in @src/cart.ts"
\`\`\`

\`--full-auto\` est un raccourci pour workspace-write avec les approbations on-request. \`codex exec\` lance une fois sans l'interface interactive.

> Attention : \`--yolo\` (forme longue \`--dangerously-bypass-approvals-and-sandbox\`) retire les deux protections. Garde-le pour des conteneurs jetables, jamais pour ta propre machine.`,
    },
  },
  {
    slug: "antigravity",
    section: "guides",
    icon: "Workflow",
    lesson: "antigravity-workflows",
    title: { en: "Antigravity: rules, skills and workflows", fr: "Antigravity : règles, skills et workflows" },
    lead: {
      en: "Antigravity keeps its customisations in one folder, .agents/, split by who triggers them.",
      fr: "Antigravity range ses personnalisations dans un seul dossier, .agents/, rangées selon qui les déclenche.",
    },
    body: {
      en: `## Three kinds of files

| Folder | Triggered by | When |
|---|---|---|
| \`.agents/rules/\` | Nobody: always on | Loaded in every conversation |
| \`.agents/skills/\` | The agent | When your request matches the skill's description |
| \`.agents/workflows/\` | You | When you type \`/name\` in the chat |

Antigravity also reads \`AGENTS.md\` and \`GEMINI.md\` in the workspace, and global rules in \`~/.gemini/GEMINI.md\`. Older projects may use \`.agent/\` (singular), which it still accepts.

## A workflow

\`\`\`markdown
---
description: Prepare a release
---

1. Update the changelog: add a \`## [Unreleased]\` section with the latest changes.
2. Run \`pnpm test\` and make sure everything passes.
\`\`\`

Saved as \`.agents/workflows/release.md\`, it runs when you type \`/release\`.

## Workflow or skill?

Use a workflow for a procedure you start on purpose, at a moment you choose: a release, a deploy, a weekly cleanup. Use a skill for know-how the agent should apply whenever it fits, without being asked.

> Tip: don't add \`.agents/\` to \`.gitignore\`. Commit it, so your whole team gets the same rules, skills and workflows.`,
      fr: `## Trois sortes de fichiers

| Dossier | Déclenché par | Quand |
|---|---|---|
| \`.agents/rules/\` | Personne : toujours actif | Chargé dans chaque conversation |
| \`.agents/skills/\` | L'agent | Quand ta demande correspond à la description du skill |
| \`.agents/workflows/\` | Toi | Quand tu tapes \`/nom\` dans le chat |

Antigravity lit aussi \`AGENTS.md\` et \`GEMINI.md\` dans l'espace de travail, et les règles globales dans \`~/.gemini/GEMINI.md\`. Les projets plus anciens utilisent parfois \`.agent/\` (au singulier), qu'il accepte encore.

## Un workflow

\`\`\`markdown
---
description: Prepare a release
---

1. Update the changelog: add a \`## [Unreleased]\` section with the latest changes.
2. Run \`pnpm test\` and make sure everything passes.
\`\`\`

Enregistré sous \`.agents/workflows/release.md\`, il s'exécute quand tu tapes \`/release\`.

## Workflow ou skill ?

Prends un workflow pour une procédure que tu lances exprès, au moment que tu choisis : une release, un déploiement, un ménage hebdomadaire. Prends un skill pour un savoir-faire que l'agent doit appliquer dès qu'il convient, sans qu'on le lui demande.

> Astuce : n'ajoute pas \`.agents/\` au \`.gitignore\`. Commite-le, pour que toute l'équipe ait les mêmes règles, skills et workflows.`,
    },
  },
  {
    slug: "orca",
    section: "guides",
    icon: "GitBranch",
    lesson: "parallel-worktrees",
    title: { en: "Orca and parallel agents", fr: "Orca et les agents en parallèle" },
    lead: {
      en: "Two agents in one folder edit the same files at the same time. A git worktree each fixes that, and Orca manages the worktrees for you.",
      fr: "Deux agents dans un même dossier modifient les mêmes fichiers en même temps. Un worktree git chacun règle ça, et Orca gère les worktrees pour toi.",
    },
    body: {
      en: `## Worktrees

A git worktree is a second checkout of the same repository, in its own folder, on its own branch. Agents in different worktrees can't overwrite each other's work, and each result arrives as a branch you can review and merge.

## The cycle

\`\`\`bash
# 1. Hand a task to an agent in a new worktree
orca worktree create --name fix-total --agent codex \\
  --prompt "Fix the total bug in @src/cart.ts. Add a test and run it."

# 2. See every agent at a glance
orca worktree ps

# 3. Read what one of them did
orca terminal read --terminal term-fix-total

# 4. Tell the team where it stands
orca worktree set --worktree fix-total --workspace-status in-review --comment "fix ready, tests pass"

# 5. Bring the work into main
git merge fix-total
\`\`\`

\`orca terminal send --terminal <handle> --text "..." --enter\` sends a follow-up prompt to an agent that's already running. In the real app, terminal handles come from \`orca terminal list\`; in the simulator they look like \`term-<worktree>\`.

## Splitting work so nobody collides

Give each agent a task that touches different files. Prices in \`src/price.ts\` and the cart total in \`src/cart.ts\` merge cleanly. Two agents both editing \`src/cart.ts\` produce a merge conflict for the second one.

Shared rules matter more here: every worktree gets a copy of \`AGENTS.md\`, so every agent tests the same way and follows the same conventions.

## Statuses

\`todo\`, \`in-progress\`, \`in-review\` and \`completed\` show on each worktree's card in Orca, with your comment underneath. Keep the comment to one line about where things stand.`,
      fr: `## Les worktrees

Un worktree git est un second checkout du même dépôt, dans son propre dossier, sur sa propre branche. Des agents dans des worktrees différents ne peuvent pas écraser le travail des autres, et chaque résultat arrive sous forme de branche à relire et fusionner.

## Le cycle

\`\`\`bash
# 1. Confier une tâche à un agent dans un nouveau worktree
orca worktree create --name fix-total --agent codex \\
  --prompt "Fix the total bug in @src/cart.ts. Add a test and run it."

# 2. Voir tous les agents d'un coup d'œil
orca worktree ps

# 3. Lire ce que l'un d'eux a fait
orca terminal read --terminal term-fix-total

# 4. Dire à l'équipe où on en est
orca worktree set --worktree fix-total --workspace-status in-review --comment "fix ready, tests pass"

# 5. Ramener le travail dans main
git merge fix-total
\`\`\`

\`orca terminal send --terminal <identifiant> --text "..." --enter\` envoie une nouvelle demande à un agent déjà lancé. Dans la vraie appli, les identifiants de terminal viennent de \`orca terminal list\` ; dans le simulateur, ils ont la forme \`term-<worktree>\`.

## Découper pour éviter les collisions

Donne à chaque agent une tâche qui touche des fichiers différents. Les prix dans \`src/price.ts\` et le total dans \`src/cart.ts\` fusionnent sans problème. Deux agents qui modifient tous les deux \`src/cart.ts\` créent un conflit de fusion pour le second.

Les règles partagées comptent encore plus ici : chaque worktree reçoit une copie d'\`AGENTS.md\`, donc chaque agent teste de la même façon et suit les mêmes conventions.

## Les statuts

\`todo\`, \`in-progress\`, \`in-review\` et \`completed\` s'affichent sur la carte de chaque worktree dans Orca, avec ton commentaire en dessous. Garde le commentaire à une ligne qui dit où on en est.`,
    },
  },
  {
    slug: "mcp",
    section: "guides",
    icon: "Plug",
    title: { en: "MCP servers", fr: "Les serveurs MCP" },
    lead: {
      en: "MCP (Model Context Protocol) servers give an agent new tools: a database, a browser, your issue tracker.",
      fr: "Les serveurs MCP (Model Context Protocol) donnent de nouveaux outils à un agent : une base de données, un navigateur, ton gestionnaire de tickets.",
    },
    body: {
      en: `## Adding one

\`\`\`bash
claude mcp add docs -- npx docs-mcp-server
codex mcp add docs -- npx docs-mcp-server
claude mcp list
\`\`\`

The part after \`--\` is the command that starts the server. Once added, its tools are available in every session of that agent. \`/mcp\` inside a session lists what's connected.

## The cost

Each server adds its whole list of tools, with their descriptions, to the context of every conversation, whether you use them or not. Add the servers you need for the project you're on, and remove the rest with \`claude mcp remove <name>\`. In the simulator, each server shows up as a yellow block in the context window.

## Trust

An MCP server is a program that runs on your computer and sees what the agent sends it. Install servers from sources you trust, the same way you would any other package.`,
      fr: `## En ajouter un

\`\`\`bash
claude mcp add docs -- npx docs-mcp-server
codex mcp add docs -- npx docs-mcp-server
claude mcp list
\`\`\`

La partie après \`--\` est la commande qui lance le serveur. Une fois ajouté, ses outils sont disponibles dans chaque session de cet agent. \`/mcp\` dans une session liste ce qui est connecté.

## Le coût

Chaque serveur ajoute toute sa liste d'outils, avec leurs descriptions, au contexte de chaque conversation, qu'on s'en serve ou non. Ajoute les serveurs utiles au projet en cours, et retire les autres avec \`claude mcp remove <nom>\`. Dans le simulateur, chaque serveur apparaît comme un bloc jaune dans la fenêtre de contexte.

## La confiance

Un serveur MCP est un programme qui tourne sur ton ordinateur et voit ce que l'agent lui envoie. Installe-les depuis des sources de confiance, comme n'importe quel autre paquet.`,
    },
  },
  {
    slug: "safety",
    section: "guides",
    icon: "ShieldAlert",
    title: { en: "Working safely with agents", fr: "Travailler avec des agents en sécurité" },
    lead: {
      en: "Agents run commands on your machine. A few habits keep that boring.",
      fr: "Les agents lancent des commandes sur ta machine. Quelques habitudes suffisent pour que ça reste sans histoire.",
    },
    body: {
      en: `## Before you start

- Work inside a Git repository and commit before a big request. A bad result is then one \`git checkout .\` away.
- Leave the sandbox and approvals on. Claude Code asks before running commands unless you allow them; Codex follows its \`sandbox_mode\` and \`approval_policy\`.
- Don't run agents with full access on your everyday machine.

## Secrets

- Never paste API keys, passwords or tokens into a prompt or a rules file. Rules files are usually committed and shared.
- Keep secrets in \`.env\` files listed in \`.gitignore\`, and tell the agent in your rules not to read or print them.
- If a secret ends up in a commit, change the secret. Deleting the commit doesn't make it private again.

## Prompt injection

Text the agent reads can contain instructions: a web page, an issue comment, a file in a dependency. A well-built agent treats that text as data, but stay alert. If an agent suddenly wants to send data somewhere or install something you didn't ask for, stop it and look at what it read.

## Review

Read the diff before you keep it, especially in tests (an agent can "fix" a failing test by weakening it), configuration and anything security-related.`,
      fr: `## Avant de commencer

- Travaille dans un dépôt Git et commite avant une grosse demande. Un mauvais résultat n'est alors qu'à un \`git checkout .\` de disparaître.
- Laisse la sandbox et les approbations actives. Claude Code demande avant de lancer des commandes sauf si tu les autorises ; Codex suit son \`sandbox_mode\` et son \`approval_policy\`.
- Ne lance pas d'agent avec un accès complet sur ta machine de tous les jours.

## Les secrets

- Ne colle jamais de clé d'API, de mot de passe ou de jeton dans un prompt ou un fichier de règles. Les fichiers de règles sont généralement commités et partagés.
- Garde les secrets dans des fichiers \`.env\` listés dans \`.gitignore\`, et dis à l'agent dans tes règles de ne pas les lire ni les afficher.
- Si un secret se retrouve dans un commit, change le secret. Supprimer le commit ne le rend pas privé à nouveau.

## L'injection de prompt

Le texte que lit l'agent peut contenir des instructions : une page web, un commentaire de ticket, un fichier dans une dépendance. Un agent bien conçu traite ce texte comme des données, mais reste attentif. Si un agent veut soudain envoyer des données quelque part ou installer quelque chose que tu n'as pas demandé, arrête-le et regarde ce qu'il a lu.

## Relire

Lis le diff avant de le garder, surtout dans les tests (un agent peut « réparer » un test en échec en l'affaiblissant), la configuration et tout ce qui touche à la sécurité.`,
    },
  },
];
