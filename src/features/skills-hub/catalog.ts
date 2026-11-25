import type { HubSkill } from "./types";

/**
 * Public skills from other authors, checked on 2026-11-25: every GitHub link,
 * raw SKILL.md and skills.sh page answered. Descriptions are our own summaries;
 * each skill keeps its author's licence. Install commands are copied from the
 * skill's skills.sh page and the repo's README.
 */
export const CATALOG: HubSkill[] = [
 {
  "name": "academy-guide",
  "source": "anthropics/skills",
  "group": "anthropic",
  "category": "other",
  "description": {
   "en": "Points you to matching Claude Academy courses and tutorials when you ask how to use Claude or one of its features.",
   "fr": "Te recommande les cours et tutoriels Claude Academy adaptés quand tu demandes comment utiliser Claude ou une de ses fonctions."
  },
  "license": "Apache-2.0",
  "url": "https://github.com/anthropics/skills/tree/main/skills/academy-guide",
  "raw": "https://raw.githubusercontent.com/anthropics/skills/main/skills/academy-guide/SKILL.md",
  "install": [
   "npx skills add https://github.com/anthropics/skills --skill academy-guide",
   "/plugin marketplace add anthropics/skills",
   "/plugin install academy-guide@anthropic-agent-skills"
  ],
  "singleFile": false
 },
 {
  "name": "algorithmic-art",
  "source": "anthropics/skills",
  "group": "anthropic",
  "category": "design",
  "description": {
   "en": "Creates generative art with p5.js, using seeded randomness, flow fields and particles, with interactive parameters to explore variations.",
   "fr": "Crée de l'art génératif avec p5.js, avec aléatoire contrôlé, champs de flux et particules, et des paramètres interactifs pour explorer."
  },
  "license": "Apache-2.0",
  "url": "https://github.com/anthropics/skills/tree/main/skills/algorithmic-art",
  "raw": "https://raw.githubusercontent.com/anthropics/skills/main/skills/algorithmic-art/SKILL.md",
  "install": [
   "npx skills add https://github.com/anthropics/skills --skill algorithmic-art",
   "/plugin marketplace add anthropics/skills",
   "/plugin install example-skills@anthropic-agent-skills"
  ],
  "singleFile": false
 },
 {
  "name": "brand-guidelines",
  "source": "anthropics/skills",
  "group": "anthropic",
  "category": "design",
  "description": {
   "en": "Applies Anthropic's official brand colors and typography to slides, documents and other artifacts; a template for your own brand skill.",
   "fr": "Applique les couleurs et la typographie officielles d'Anthropic à tes documents et slides ; un modèle pour ta propre charte."
  },
  "license": "Apache-2.0",
  "url": "https://github.com/anthropics/skills/tree/main/skills/brand-guidelines",
  "raw": "https://raw.githubusercontent.com/anthropics/skills/main/skills/brand-guidelines/SKILL.md",
  "install": [
   "npx skills add https://github.com/anthropics/skills --skill brand-guidelines",
   "/plugin marketplace add anthropics/skills",
   "/plugin install example-skills@anthropic-agent-skills"
  ],
  "singleFile": false
 },
 {
  "name": "canvas-design",
  "source": "anthropics/skills",
  "group": "anthropic",
  "category": "design",
  "description": {
   "en": "Designs original posters and static visuals as PNG or PDF files, starting from a written design philosophy.",
   "fr": "Conçoit des affiches et visuels statiques originaux en PNG ou PDF, à partir d'une philosophie de design rédigée."
  },
  "license": "Apache-2.0",
  "url": "https://github.com/anthropics/skills/tree/main/skills/canvas-design",
  "raw": "https://raw.githubusercontent.com/anthropics/skills/main/skills/canvas-design/SKILL.md",
  "install": [
   "npx skills add https://github.com/anthropics/skills --skill canvas-design",
   "/plugin marketplace add anthropics/skills",
   "/plugin install example-skills@anthropic-agent-skills"
  ],
  "singleFile": false
 },
 {
  "name": "claude-api",
  "source": "anthropics/skills",
  "group": "anthropic",
  "category": "ai-dev",
  "description": {
   "en": "Reference for building with the Claude API and Anthropic SDKs: models, pricing, streaming, tool use, caching and agents, in many languages.",
   "fr": "Référence pour coder avec l'API Claude et les SDK Anthropic : modèles, tarifs, streaming, outils, cache et agents, dans plusieurs langages."
  },
  "license": "Apache-2.0",
  "url": "https://github.com/anthropics/skills/tree/main/skills/claude-api",
  "raw": "https://raw.githubusercontent.com/anthropics/skills/main/skills/claude-api/SKILL.md",
  "install": [
   "npx skills add https://github.com/anthropics/skills --skill claude-api",
   "/plugin marketplace add anthropics/skills",
   "/plugin install claude-api@anthropic-agent-skills"
  ],
  "singleFile": false
 },
 {
  "name": "discernment-nudge",
  "source": "anthropics/skills",
  "group": "anthropic",
  "category": "other",
  "description": {
   "en": "After a substantive answer, adds two or three follow-up questions that help you check facts, test the reasoning and spot missing context.",
   "fr": "Après une réponse importante, ajoute deux ou trois questions pour t'aider à vérifier les faits, tester le raisonnement et repérer ce qui manque."
  },
  "license": "Apache-2.0",
  "url": "https://github.com/anthropics/skills/tree/main/skills/discernment-nudge",
  "raw": "https://raw.githubusercontent.com/anthropics/skills/main/skills/discernment-nudge/SKILL.md",
  "install": [
   "npx skills add https://github.com/anthropics/skills --skill discernment-nudge",
   "/plugin marketplace add anthropics/skills",
   "/plugin install discernment-nudge@anthropic-agent-skills"
  ],
  "singleFile": false
 },
 {
  "name": "doc-coauthoring",
  "source": "anthropics/skills",
  "group": "anthropic",
  "category": "writing",
  "description": {
   "en": "Guides a structured co-writing workflow for docs, proposals and specs: gather context, refine section by section, then test it on a reader.",
   "fr": "Te guide pour co-écrire docs, propositions et specs : rassembler le contexte, affiner section par section, puis tester sur un lecteur."
  },
  "license": "unknown",
  "url": "https://github.com/anthropics/skills/tree/main/skills/doc-coauthoring",
  "raw": "https://raw.githubusercontent.com/anthropics/skills/main/skills/doc-coauthoring/SKILL.md",
  "install": [
   "npx skills add https://github.com/anthropics/skills --skill doc-coauthoring",
   "/plugin marketplace add anthropics/skills",
   "/plugin install example-skills@anthropic-agent-skills"
  ],
  "singleFile": false
 },
 {
  "name": "docx",
  "source": "anthropics/skills",
  "group": "anthropic",
  "category": "documents",
  "description": {
   "en": "Creates, reads and edits Word documents, including tables of contents, headers, tracked changes and comments, using Python and JavaScript tooling.",
   "fr": "Crée, lit et modifie des documents Word, avec tables des matières, en-têtes, suivi des modifications et commentaires."
  },
  "license": "Apache-2.0",
  "url": "https://github.com/anthropics/skills/tree/main/skills/docx",
  "raw": "https://raw.githubusercontent.com/anthropics/skills/main/skills/docx/SKILL.md",
  "install": [
   "npx skills add https://github.com/anthropics/skills --skill docx",
   "/plugin marketplace add anthropics/skills",
   "/plugin install document-skills@anthropic-agent-skills"
  ],
  "singleFile": false
 },
 {
  "name": "frontend-design",
  "source": "anthropics/skills",
  "group": "anthropic",
  "category": "frontend",
  "description": {
   "en": "Pushes the agent toward distinctive, intentional UI design with a clear aesthetic direction and typography instead of generic templated layouts.",
   "fr": "Pousse l'agent vers un design d'interface distinctif et assumé, avec une vraie direction esthétique, plutôt que des mises en page génériques."
  },
  "license": "Apache-2.0",
  "url": "https://github.com/anthropics/skills/tree/main/skills/frontend-design",
  "raw": "https://raw.githubusercontent.com/anthropics/skills/main/skills/frontend-design/SKILL.md",
  "install": [
   "npx skills add https://github.com/anthropics/skills --skill frontend-design",
   "/plugin marketplace add anthropics/skills",
   "/plugin install example-skills@anthropic-agent-skills",
   "/plugin install frontend-design@claude-plugins-official"
  ],
  "singleFile": false
 },
 {
  "name": "internal-comms",
  "source": "anthropics/skills",
  "group": "anthropic",
  "category": "writing",
  "description": {
   "en": "Writes internal communications such as status reports, leadership updates, newsletters, FAQs and incident reports in your company's formats.",
   "fr": "Rédige tes communications internes : points d'avancement, mises à jour pour la direction, newsletters, FAQ et rapports d'incident."
  },
  "license": "Apache-2.0",
  "url": "https://github.com/anthropics/skills/tree/main/skills/internal-comms",
  "raw": "https://raw.githubusercontent.com/anthropics/skills/main/skills/internal-comms/SKILL.md",
  "install": [
   "npx skills add https://github.com/anthropics/skills --skill internal-comms",
   "/plugin marketplace add anthropics/skills",
   "/plugin install example-skills@anthropic-agent-skills"
  ],
  "singleFile": false
 },
 {
  "name": "mcp-builder",
  "source": "anthropics/skills",
  "group": "anthropic",
  "category": "ai-dev",
  "description": {
   "en": "Guides you through designing, building and evaluating a high-quality MCP server in Python (FastMCP) or TypeScript so LLMs can use an external API.",
   "fr": "Te guide pour concevoir, coder et évaluer un serveur MCP de qualité en Python (FastMCP) ou TypeScript, pour brancher une API sur un LLM."
  },
  "license": "Apache-2.0",
  "url": "https://github.com/anthropics/skills/tree/main/skills/mcp-builder",
  "raw": "https://raw.githubusercontent.com/anthropics/skills/main/skills/mcp-builder/SKILL.md",
  "install": [
   "npx skills add https://github.com/anthropics/skills --skill mcp-builder",
   "/plugin marketplace add anthropics/skills",
   "/plugin install example-skills@anthropic-agent-skills"
  ],
  "singleFile": false
 },
 {
  "name": "pdf",
  "source": "anthropics/skills",
  "group": "anthropic",
  "category": "documents",
  "description": {
   "en": "Handles PDF tasks: extract text and tables, merge, split, rotate, watermark, fill forms, encrypt and OCR scanned pages.",
   "fr": "Gère tes PDF : extraire texte et tableaux, fusionner, découper, pivoter, filigraner, remplir des formulaires, chiffrer et faire de l'OCR."
  },
  "license": "Apache-2.0",
  "url": "https://github.com/anthropics/skills/tree/main/skills/pdf",
  "raw": "https://raw.githubusercontent.com/anthropics/skills/main/skills/pdf/SKILL.md",
  "install": [
   "npx skills add https://github.com/anthropics/skills --skill pdf",
   "/plugin marketplace add anthropics/skills",
   "/plugin install document-skills@anthropic-agent-skills"
  ],
  "singleFile": false
 },
 {
  "name": "pptx",
  "source": "anthropics/skills",
  "group": "anthropic",
  "category": "documents",
  "description": {
   "en": "Creates, reads and edits PowerPoint decks, from new presentations and templates to extracting text from existing slides.",
   "fr": "Crée, lit et modifie des présentations PowerPoint, des nouveaux decks et modèles jusqu'à l'extraction du texte de slides existantes."
  },
  "license": "Apache-2.0",
  "url": "https://github.com/anthropics/skills/tree/main/skills/pptx",
  "raw": "https://raw.githubusercontent.com/anthropics/skills/main/skills/pptx/SKILL.md",
  "install": [
   "npx skills add https://github.com/anthropics/skills --skill pptx",
   "/plugin marketplace add anthropics/skills",
   "/plugin install document-skills@anthropic-agent-skills"
  ],
  "singleFile": false
 },
 {
  "name": "skill-creator",
  "source": "anthropics/skills",
  "group": "anthropic",
  "category": "ai-dev",
  "description": {
   "en": "Helps you create, edit and improve skills, run evals and benchmarks on them, and tune descriptions so they trigger reliably.",
   "fr": "T'aide à créer, modifier et améliorer des skills, à les évaluer avec des benchmarks et à affiner leur description pour qu'elles se déclenchent bien."
  },
  "license": "Apache-2.0",
  "url": "https://github.com/anthropics/skills/tree/main/skills/skill-creator",
  "raw": "https://raw.githubusercontent.com/anthropics/skills/main/skills/skill-creator/SKILL.md",
  "install": [
   "npx skills add https://github.com/anthropics/skills --skill skill-creator",
   "/plugin marketplace add anthropics/skills",
   "/plugin install example-skills@anthropic-agent-skills",
   "/plugin install skill-creator@claude-plugins-official"
  ],
  "singleFile": false
 },
 {
  "name": "slack-gif-creator",
  "source": "anthropics/skills",
  "group": "anthropic",
  "category": "design",
  "description": {
   "en": "Makes animated GIFs sized and optimized for Slack, with validation tools and animation tips.",
   "fr": "Fabrique des GIF animés optimisés pour Slack, avec des outils de validation et des conseils d'animation."
  },
  "license": "Apache-2.0",
  "url": "https://github.com/anthropics/skills/tree/main/skills/slack-gif-creator",
  "raw": "https://raw.githubusercontent.com/anthropics/skills/main/skills/slack-gif-creator/SKILL.md",
  "install": [
   "npx skills add https://github.com/anthropics/skills --skill slack-gif-creator",
   "/plugin marketplace add anthropics/skills",
   "/plugin install example-skills@anthropic-agent-skills"
  ],
  "singleFile": false
 },
 {
  "name": "theme-factory",
  "source": "anthropics/skills",
  "group": "anthropic",
  "category": "design",
  "description": {
   "en": "Styles slides, documents, reports and web pages with one of ten preset color and font themes, or generates a new theme.",
   "fr": "Habille tes slides, documents, rapports et pages web avec l'un des dix thèmes de couleurs et polices prédéfinis, ou en crée un nouveau."
  },
  "license": "Apache-2.0",
  "url": "https://github.com/anthropics/skills/tree/main/skills/theme-factory",
  "raw": "https://raw.githubusercontent.com/anthropics/skills/main/skills/theme-factory/SKILL.md",
  "install": [
   "npx skills add https://github.com/anthropics/skills --skill theme-factory",
   "/plugin marketplace add anthropics/skills",
   "/plugin install example-skills@anthropic-agent-skills"
  ],
  "singleFile": false
 },
 {
  "name": "web-artifacts-builder",
  "source": "anthropics/skills",
  "group": "anthropic",
  "category": "frontend",
  "description": {
   "en": "Builds complex multi-component HTML artifacts with React, Tailwind CSS and shadcn/ui, bundled into a single file.",
   "fr": "Construit des artifacts HTML complexes à plusieurs composants avec React, Tailwind CSS et shadcn/ui, regroupés en un seul fichier."
  },
  "license": "Apache-2.0",
  "url": "https://github.com/anthropics/skills/tree/main/skills/web-artifacts-builder",
  "raw": "https://raw.githubusercontent.com/anthropics/skills/main/skills/web-artifacts-builder/SKILL.md",
  "install": [
   "npx skills add https://github.com/anthropics/skills --skill web-artifacts-builder",
   "/plugin marketplace add anthropics/skills",
   "/plugin install example-skills@anthropic-agent-skills"
  ],
  "singleFile": false
 },
 {
  "name": "webapp-testing",
  "source": "anthropics/skills",
  "group": "anthropic",
  "category": "testing",
  "description": {
   "en": "Tests local web apps with Playwright: drives the browser, checks UI behavior, takes screenshots and reads console logs.",
   "fr": "Teste tes applis web locales avec Playwright : pilote le navigateur, vérifie l'interface, prend des captures et lit les logs de la console."
  },
  "license": "Apache-2.0",
  "url": "https://github.com/anthropics/skills/tree/main/skills/webapp-testing",
  "raw": "https://raw.githubusercontent.com/anthropics/skills/main/skills/webapp-testing/SKILL.md",
  "install": [
   "npx skills add https://github.com/anthropics/skills --skill webapp-testing",
   "/plugin marketplace add anthropics/skills",
   "/plugin install example-skills@anthropic-agent-skills"
  ],
  "singleFile": false
 },
 {
  "name": "xlsx",
  "source": "anthropics/skills",
  "group": "anthropic",
  "category": "documents",
  "description": {
   "en": "Creates, edits and cleans spreadsheets (xlsx, csv, tsv) with formulas, formatting and charts, keeping formulas recalculated and error free.",
   "fr": "Crée, modifie et nettoie des tableurs (xlsx, csv, tsv) avec formules, mise en forme et graphiques, sans erreurs de formules."
  },
  "license": "Apache-2.0",
  "url": "https://github.com/anthropics/skills/tree/main/skills/xlsx",
  "raw": "https://raw.githubusercontent.com/anthropics/skills/main/skills/xlsx/SKILL.md",
  "install": [
   "npx skills add https://github.com/anthropics/skills --skill xlsx",
   "/plugin marketplace add anthropics/skills",
   "/plugin install document-skills@anthropic-agent-skills"
  ],
  "singleFile": false
 },
 {
  "name": "brainstorming",
  "source": "obra/superpowers",
  "group": "community",
  "category": "planning",
  "description": {
   "en": "Before building anything, asks questions to draw out what you really want, then plays it back and writes a design you approve.",
   "fr": "Avant de coder, te pose des questions pour clarifier ce que tu veux vraiment, puis reformule et rédige un design que tu valides."
  },
  "license": "MIT",
  "url": "https://github.com/obra/superpowers/tree/main/skills/brainstorming",
  "raw": "https://raw.githubusercontent.com/obra/superpowers/main/skills/brainstorming/SKILL.md",
  "install": [
   "npx skills add https://github.com/obra/superpowers --skill brainstorming",
   "/plugin install superpowers@claude-plugins-official",
   "agy plugin install https://github.com/obra/superpowers"
  ],
  "singleFile": false
 },
 {
  "name": "dispatching-parallel-agents",
  "source": "obra/superpowers",
  "group": "community",
  "category": "ai-dev",
  "description": {
   "en": "Splits two or more independent tasks across subagents that run at the same time, then combines their results.",
   "fr": "Répartit plusieurs tâches indépendantes entre des sous-agents qui travaillent en parallèle, puis rassemble leurs résultats."
  },
  "license": "MIT",
  "url": "https://github.com/obra/superpowers/tree/main/skills/dispatching-parallel-agents",
  "raw": "https://raw.githubusercontent.com/obra/superpowers/main/skills/dispatching-parallel-agents/SKILL.md",
  "install": [
   "npx skills add https://github.com/obra/superpowers --skill dispatching-parallel-agents",
   "/plugin install superpowers@claude-plugins-official",
   "agy plugin install https://github.com/obra/superpowers"
  ],
  "singleFile": false
 },
 {
  "name": "executing-plans",
  "source": "obra/superpowers",
  "group": "community",
  "category": "planning",
  "description": {
   "en": "Works through a written implementation plan inline in the current session, then does one fresh review of the whole branch at the end.",
   "fr": "Exécute un plan d'implémentation écrit directement dans la session en cours, puis fait une revue complète de la branche à la fin."
  },
  "license": "MIT",
  "url": "https://github.com/obra/superpowers/tree/main/skills/executing-plans",
  "raw": "https://raw.githubusercontent.com/obra/superpowers/main/skills/executing-plans/SKILL.md",
  "install": [
   "npx skills add https://github.com/obra/superpowers --skill executing-plans",
   "/plugin install superpowers@claude-plugins-official",
   "agy plugin install https://github.com/obra/superpowers"
  ],
  "singleFile": false
 },
 {
  "name": "finishing-a-development-branch",
  "source": "obra/superpowers",
  "group": "community",
  "category": "git",
  "description": {
   "en": "When the work is done, verifies tests, then offers to merge, open a PR, keep or discard the branch, and cleans up.",
   "fr": "Quand le travail est fini, vérifie les tests puis te propose de fusionner, ouvrir une PR, garder ou jeter la branche, et fait le ménage."
  },
  "license": "MIT",
  "url": "https://github.com/obra/superpowers/tree/main/skills/finishing-a-development-branch",
  "raw": "https://raw.githubusercontent.com/obra/superpowers/main/skills/finishing-a-development-branch/SKILL.md",
  "install": [
   "npx skills add https://github.com/obra/superpowers --skill finishing-a-development-branch",
   "/plugin install superpowers@claude-plugins-official",
   "agy plugin install https://github.com/obra/superpowers"
  ],
  "singleFile": false
 },
 {
  "name": "receiving-code-review",
  "source": "obra/superpowers",
  "group": "community",
  "category": "git",
  "description": {
   "en": "Handles review feedback with technical rigor: verify each suggestion and push back when it is wrong, instead of agreeing blindly.",
   "fr": "Traite les retours de revue avec rigueur : vérifie chaque suggestion et conteste-la si elle est fausse, au lieu d'acquiescer par réflexe."
  },
  "license": "MIT",
  "url": "https://github.com/obra/superpowers/tree/main/skills/receiving-code-review",
  "raw": "https://raw.githubusercontent.com/obra/superpowers/main/skills/receiving-code-review/SKILL.md",
  "install": [
   "npx skills add https://github.com/obra/superpowers --skill receiving-code-review",
   "/plugin install superpowers@claude-plugins-official",
   "agy plugin install https://github.com/obra/superpowers"
  ],
  "singleFile": false
 },
 {
  "name": "requesting-code-review",
  "source": "obra/superpowers",
  "group": "community",
  "category": "git",
  "description": {
   "en": "Gets the finished work reviewed against the plan and requirements, with issues ranked by severity and critical ones blocking progress.",
   "fr": "Fait relire le travail terminé par rapport au plan et aux exigences, avec des problèmes classés par gravité ; les critiques bloquent la suite."
  },
  "license": "MIT",
  "url": "https://github.com/obra/superpowers/tree/main/skills/requesting-code-review",
  "raw": "https://raw.githubusercontent.com/obra/superpowers/main/skills/requesting-code-review/SKILL.md",
  "install": [
   "npx skills add https://github.com/obra/superpowers --skill requesting-code-review",
   "/plugin install superpowers@claude-plugins-official",
   "agy plugin install https://github.com/obra/superpowers"
  ],
  "singleFile": false
 },
 {
  "name": "subagent-driven-development",
  "source": "obra/superpowers",
  "group": "community",
  "category": "ai-dev",
  "description": {
   "en": "Executes a plan by sending each task to a fresh subagent, then reviewing spec compliance and code quality after every task.",
   "fr": "Exécute un plan en confiant chaque tâche à un nouveau sous-agent, puis vérifie la conformité et la qualité du code après chaque tâche."
  },
  "license": "MIT",
  "url": "https://github.com/obra/superpowers/tree/main/skills/subagent-driven-development",
  "raw": "https://raw.githubusercontent.com/obra/superpowers/main/skills/subagent-driven-development/SKILL.md",
  "install": [
   "npx skills add https://github.com/obra/superpowers --skill subagent-driven-development",
   "/plugin install superpowers@claude-plugins-official",
   "agy plugin install https://github.com/obra/superpowers"
  ],
  "singleFile": false
 },
 {
  "name": "systematic-debugging",
  "source": "obra/superpowers",
  "group": "community",
  "category": "debugging",
  "description": {
   "en": "A four-phase root-cause process for bugs and failing tests that forbids guessing at fixes before the cause is understood.",
   "fr": "Une méthode en quatre phases pour trouver la vraie cause d'un bug ou d'un test qui échoue, sans tenter de correctif au hasard."
  },
  "license": "MIT",
  "url": "https://github.com/obra/superpowers/tree/main/skills/systematic-debugging",
  "raw": "https://raw.githubusercontent.com/obra/superpowers/main/skills/systematic-debugging/SKILL.md",
  "install": [
   "npx skills add https://github.com/obra/superpowers --skill systematic-debugging",
   "/plugin install superpowers@claude-plugins-official",
   "agy plugin install https://github.com/obra/superpowers"
  ],
  "singleFile": false
 },
 {
  "name": "test-driven-development",
  "source": "obra/superpowers",
  "group": "community",
  "category": "testing",
  "description": {
   "en": "Enforces strict red-green-refactor: write a failing test, watch it fail, write the minimum code to pass, then refactor.",
   "fr": "Impose le cycle rouge-vert-refactor : écris un test qui échoue, vérifie l'échec, code le minimum pour le faire passer, puis nettoie."
  },
  "license": "MIT",
  "url": "https://github.com/obra/superpowers/tree/main/skills/test-driven-development",
  "raw": "https://raw.githubusercontent.com/obra/superpowers/main/skills/test-driven-development/SKILL.md",
  "install": [
   "npx skills add https://github.com/obra/superpowers --skill test-driven-development",
   "/plugin install superpowers@claude-plugins-official",
   "agy plugin install https://github.com/obra/superpowers"
  ],
  "singleFile": false
 },
 {
  "name": "using-git-worktrees",
  "source": "obra/superpowers",
  "group": "community",
  "category": "git",
  "description": {
   "en": "Creates an isolated git worktree on a new branch for feature work, runs project setup and checks the tests start green.",
   "fr": "Crée un worktree git isolé sur une nouvelle branche, installe le projet et vérifie que les tests passent avant de commencer."
  },
  "license": "MIT",
  "url": "https://github.com/obra/superpowers/tree/main/skills/using-git-worktrees",
  "raw": "https://raw.githubusercontent.com/obra/superpowers/main/skills/using-git-worktrees/SKILL.md",
  "install": [
   "npx skills add https://github.com/obra/superpowers --skill using-git-worktrees",
   "/plugin install superpowers@claude-plugins-official",
   "agy plugin install https://github.com/obra/superpowers"
  ],
  "singleFile": false
 },
 {
  "name": "verification-before-completion",
  "source": "obra/superpowers",
  "group": "community",
  "category": "testing",
  "description": {
   "en": "Makes the agent run the real verification commands and read their output before it claims anything is done, fixed or passing.",
   "fr": "Oblige l'agent à lancer les vraies commandes de vérification et à lire le résultat avant d'annoncer que c'est fini ou corrigé."
  },
  "license": "MIT",
  "url": "https://github.com/obra/superpowers/tree/main/skills/verification-before-completion",
  "raw": "https://raw.githubusercontent.com/obra/superpowers/main/skills/verification-before-completion/SKILL.md",
  "install": [
   "npx skills add https://github.com/obra/superpowers --skill verification-before-completion",
   "/plugin install superpowers@claude-plugins-official",
   "agy plugin install https://github.com/obra/superpowers"
  ],
  "singleFile": false
 },
 {
  "name": "writing-plans",
  "source": "obra/superpowers",
  "group": "community",
  "category": "planning",
  "description": {
   "en": "Turns an approved design into a detailed implementation plan of small tasks with exact file paths, code and verification steps.",
   "fr": "Transforme un design validé en plan d'implémentation détaillé : petites tâches avec chemins de fichiers, code et étapes de vérification."
  },
  "license": "MIT",
  "url": "https://github.com/obra/superpowers/tree/main/skills/writing-plans",
  "raw": "https://raw.githubusercontent.com/obra/superpowers/main/skills/writing-plans/SKILL.md",
  "install": [
   "npx skills add https://github.com/obra/superpowers --skill writing-plans",
   "/plugin install superpowers@claude-plugins-official",
   "agy plugin install https://github.com/obra/superpowers"
  ],
  "singleFile": false
 },
 {
  "name": "writing-skills",
  "source": "obra/superpowers",
  "group": "community",
  "category": "ai-dev",
  "description": {
   "en": "Teaches the agent to write new skills test-first, checking that each skill actually changes agent behavior before it ships.",
   "fr": "Apprend à l'agent à écrire de nouvelles skills en commençant par les tests, pour vérifier qu'elles changent vraiment son comportement."
  },
  "license": "MIT",
  "url": "https://github.com/obra/superpowers/tree/main/skills/writing-skills",
  "raw": "https://raw.githubusercontent.com/obra/superpowers/main/skills/writing-skills/SKILL.md",
  "install": [
   "npx skills add https://github.com/obra/superpowers --skill writing-skills",
   "/plugin install superpowers@claude-plugins-official",
   "agy plugin install https://github.com/obra/superpowers"
  ],
  "singleFile": false
 },
 {
  "name": "caveman",
  "source": "JuliusBrussee/caveman",
  "group": "community",
  "category": "productivity",
  "description": {
   "en": "Makes the agent answer in a terse caveman voice that keeps every technical fact but drops filler, to save tokens.",
   "fr": "Fait répondre l'agent en style homme des cavernes, ultra concis, en gardant tous les faits techniques mais sans blabla, pour économiser des tokens."
  },
  "license": "Apache-2.0",
  "url": "https://github.com/JuliusBrussee/caveman/tree/main/skills/caveman",
  "raw": "https://raw.githubusercontent.com/JuliusBrussee/caveman/main/skills/caveman/SKILL.md",
  "install": [
   "npx skills add https://github.com/juliusbrussee/caveman --skill caveman",
   "npx skills add JuliusBrussee/caveman -g",
   "claude plugin marketplace add JuliusBrussee/caveman",
   "claude plugin install caveman@caveman",
   "gemini extensions install https://github.com/JuliusBrussee/caveman"
  ],
  "singleFile": false
 },
 {
  "name": "design-taste-frontend",
  "source": "Leonxlnx/taste-skill",
  "group": "community",
  "category": "frontend",
  "description": {
   "en": "An anti-generic frontend skill that builds polished company websites with one design system, real imagery and browser-checked rules.",
   "fr": "Une skill frontend anti-générique qui construit des sites d'entreprise soignés, avec un seul design system, de vraies images et des règles vérifiées."
  },
  "license": "MIT",
  "url": "https://github.com/Leonxlnx/taste-skill/tree/main/skills/taste-skill",
  "raw": "https://raw.githubusercontent.com/Leonxlnx/taste-skill/main/skills/taste-skill/SKILL.md",
  "install": [
   "npx skills add https://github.com/leonxlnx/taste-skill --skill design-taste-frontend",
   "npx skills add https://github.com/Leonxlnx/taste-skill --skill \"design-taste-frontend\"",
   "/plugin marketplace add Leonxlnx/taste-skill",
   "/plugin install taste-skill@taste-skill"
  ],
  "singleFile": false
 },
 {
  "name": "cloudflare",
  "source": "cloudflare/skills",
  "group": "community",
  "category": "devops",
  "description": {
   "en": "Helps choose the right Cloudflare products for apps, APIs, agents and storage, and diagnoses Cloudflare error pages like 52x or 403.",
   "fr": "T'aide à choisir les bons produits Cloudflare pour tes applis, API, agents et stockage, et à diagnostiquer les erreurs Cloudflare (52x, 403)."
  },
  "license": "Apache-2.0",
  "url": "https://github.com/cloudflare/skills/tree/main/skills/cloudflare",
  "raw": "https://raw.githubusercontent.com/cloudflare/skills/main/skills/cloudflare/SKILL.md",
  "install": [
   "npx skills add https://github.com/cloudflare/skills --skill cloudflare",
   "/plugin marketplace add cloudflare/skills",
   "/plugin install cloudflare@cloudflare",
   "npx skills add https://github.com/cloudflare/skills"
  ],
  "singleFile": false
 },
 {
  "name": "web-perf",
  "source": "cloudflare/skills",
  "group": "community",
  "category": "frontend",
  "description": {
   "en": "Audits and improves website loading and interaction speed, Core Web Vitals and Lighthouse performance scores.",
   "fr": "Analyse et améliore la vitesse de chargement et d'interaction de ton site, les Core Web Vitals et le score Lighthouse."
  },
  "license": "Apache-2.0",
  "url": "https://github.com/cloudflare/skills/tree/main/skills/web-perf",
  "raw": "https://raw.githubusercontent.com/cloudflare/skills/main/skills/web-perf/SKILL.md",
  "install": [
   "npx skills add https://github.com/cloudflare/skills --skill web-perf",
   "/plugin marketplace add cloudflare/skills",
   "/plugin install cloudflare@cloudflare",
   "npx skills add https://github.com/cloudflare/skills"
  ],
  "singleFile": false
 },
 {
  "name": "workers-best-practices",
  "source": "cloudflare/skills",
  "group": "community",
  "category": "devops",
  "description": {
   "en": "Best practices for writing, reviewing and configuring Cloudflare Workers that run in production.",
   "fr": "Les bonnes pratiques pour écrire, relire et configurer des Cloudflare Workers en production."
  },
  "license": "Apache-2.0",
  "url": "https://github.com/cloudflare/skills/tree/main/skills/workers-best-practices",
  "raw": "https://raw.githubusercontent.com/cloudflare/skills/main/skills/workers-best-practices/SKILL.md",
  "install": [
   "npx skills add https://github.com/cloudflare/skills --skill workers-best-practices",
   "/plugin marketplace add cloudflare/skills",
   "/plugin install cloudflare@cloudflare",
   "npx skills add https://github.com/cloudflare/skills"
  ],
  "singleFile": false
 },
 {
  "name": "wrangler",
  "source": "cloudflare/skills",
  "group": "community",
  "category": "devops",
  "description": {
   "en": "Runs and troubleshoots Wrangler CLI commands for local development, previews, deployment and resource management in Workers projects.",
   "fr": "Lance et dépanne les commandes de la CLI Wrangler pour le développement local, les previews, le déploiement et les ressources de tes Workers."
  },
  "license": "Apache-2.0",
  "url": "https://github.com/cloudflare/skills/tree/main/skills/wrangler",
  "raw": "https://raw.githubusercontent.com/cloudflare/skills/main/skills/wrangler/SKILL.md",
  "install": [
   "npx skills add https://github.com/cloudflare/skills --skill wrangler",
   "/plugin marketplace add cloudflare/skills",
   "/plugin install cloudflare@cloudflare",
   "npx skills add https://github.com/cloudflare/skills"
  ],
  "singleFile": false
 },
 {
  "name": "expo-router",
  "source": "expo/skills",
  "group": "community",
  "category": "frontend",
  "description": {
   "en": "Navigation and routing with Expo Router: file-based and dynamic routes, native stacks and tabs, modals, sheets and headers.",
   "fr": "Navigation et routage avec Expo Router : routes par fichiers et dynamiques, piles et onglets natifs, modales, feuilles et en-têtes."
  },
  "license": "MIT",
  "url": "https://github.com/expo/skills/tree/main/plugins/expo/skills/expo-router",
  "raw": "https://raw.githubusercontent.com/expo/skills/main/plugins/expo/skills/expo-router/SKILL.md",
  "install": [
   "npx skills add https://github.com/expo/skills --skill expo-router",
   "claude plugin install expo@claude-plugins-official",
   "codex plugin add expo@openai-curated",
   "npx skills@latest add expo/skills --skill '*'"
  ],
  "singleFile": false
 },
 {
  "name": "expo-upgrade",
  "source": "expo/skills",
  "group": "community",
  "category": "frontend",
  "description": {
   "en": "Guides upgrading an Expo app to a new SDK version and fixing the dependency problems that follow.",
   "fr": "Te guide pour passer ton appli Expo à une nouvelle version du SDK et corriger les problèmes de dépendances qui suivent."
  },
  "license": "MIT",
  "url": "https://github.com/expo/skills/tree/main/plugins/expo/skills/expo-upgrade",
  "raw": "https://raw.githubusercontent.com/expo/skills/main/plugins/expo/skills/expo-upgrade/SKILL.md",
  "install": [
   "npx skills add https://github.com/expo/skills --skill expo-upgrade",
   "claude plugin install expo@claude-plugins-official",
   "codex plugin add expo@openai-curated",
   "npx skills@latest add expo/skills --skill '*'"
  ],
  "singleFile": false
 },
 {
  "name": "code-simplifier",
  "source": "getsentry/skills",
  "group": "community",
  "category": "other",
  "description": {
   "en": "Simplifies recently changed code for clarity, consistency and maintainability without changing what it does.",
   "fr": "Simplifie le code récemment modifié pour le rendre plus clair, cohérent et maintenable, sans changer son comportement."
  },
  "license": "Apache-2.0",
  "url": "https://github.com/getsentry/skills/tree/main/skills/code-simplifier",
  "raw": "https://raw.githubusercontent.com/getsentry/skills/main/skills/code-simplifier/SKILL.md",
  "install": [
   "npx skills add https://github.com/getsentry/skills --skill code-simplifier",
   "claude plugin marketplace add getsentry/skills",
   "claude plugin install sentry-skills@sentry-skills",
   "npx skills add getsentry/skills"
  ],
  "singleFile": false
 },
 {
  "name": "commit",
  "source": "getsentry/skills",
  "group": "community",
  "category": "git",
  "description": {
   "en": "Writes Sentry-style conventional commit messages with issue references whenever you ask to commit.",
   "fr": "Rédige des messages de commit conventionnels façon Sentry, avec références aux tickets, dès que tu demandes un commit."
  },
  "license": "Apache-2.0",
  "url": "https://github.com/getsentry/skills/tree/main/skills/commit",
  "raw": "https://raw.githubusercontent.com/getsentry/skills/main/skills/commit/SKILL.md",
  "install": [
   "npx skills add https://github.com/getsentry/skills --skill commit",
   "claude plugin marketplace add getsentry/skills",
   "claude plugin install sentry-skills@sentry-skills",
   "npx skills add getsentry/skills"
  ],
  "singleFile": false
 },
 {
  "name": "find-bugs",
  "source": "getsentry/skills",
  "group": "community",
  "category": "debugging",
  "description": {
   "en": "Reviews the changes on your current branch to find bugs, security vulnerabilities and code quality problems.",
   "fr": "Relit les changements de ta branche pour trouver bugs, failles de sécurité et problèmes de qualité du code."
  },
  "license": "Apache-2.0",
  "url": "https://github.com/getsentry/skills/tree/main/skills/find-bugs",
  "raw": "https://raw.githubusercontent.com/getsentry/skills/main/skills/find-bugs/SKILL.md",
  "install": [
   "npx skills add https://github.com/getsentry/skills --skill find-bugs",
   "claude plugin marketplace add getsentry/skills",
   "claude plugin install sentry-skills@sentry-skills",
   "npx skills add getsentry/skills"
  ],
  "singleFile": false
 },
 {
  "name": "iterate-pr",
  "source": "getsentry/skills",
  "group": "community",
  "category": "git",
  "description": {
   "en": "Keeps iterating on a pull request until CI passes and high and medium priority review comments are addressed.",
   "fr": "Retravaille une pull request en boucle jusqu'à ce que la CI passe et que les commentaires de revue importants soient traités."
  },
  "license": "Apache-2.0",
  "url": "https://github.com/getsentry/skills/tree/main/skills/iterate-pr",
  "raw": "https://raw.githubusercontent.com/getsentry/skills/main/skills/iterate-pr/SKILL.md",
  "install": [
   "npx skills add https://github.com/getsentry/skills --skill iterate-pr",
   "claude plugin marketplace add getsentry/skills",
   "claude plugin install sentry-skills@sentry-skills",
   "npx skills add getsentry/skills"
  ],
  "singleFile": false
 },
 {
  "name": "security-review",
  "source": "getsentry/skills",
  "group": "community",
  "category": "security",
  "description": {
   "en": "Systematic security code review for injection, XSS, auth, access control and crypto issues, based on OWASP material, with confidence levels.",
   "fr": "Revue de sécurité systématique du code (injections, XSS, authentification, contrôle d'accès, crypto) basée sur l'OWASP, avec niveaux de confiance."
  },
  "license": "Apache-2.0 AND CC-BY-SA-4.0",
  "url": "https://github.com/getsentry/skills/tree/main/skills/security-review",
  "raw": "https://raw.githubusercontent.com/getsentry/skills/main/skills/security-review/SKILL.md",
  "install": [
   "npx skills add https://github.com/getsentry/skills --skill security-review",
   "claude plugin marketplace add getsentry/skills",
   "claude plugin install sentry-skills@sentry-skills",
   "npx skills add getsentry/skills"
  ],
  "singleFile": false
 },
 {
  "name": "gemini-api-dev",
  "source": "google-gemini/gemini-skills",
  "group": "community",
  "category": "ai-dev",
  "description": {
   "en": "Helps write code against the Gemini API: text, chat, multimodal input, image, video and speech generation, function calling and structured output.",
   "fr": "T'aide à coder avec l'API Gemini : texte, chat, multimodal, génération d'images, de vidéo et de voix, appels de fonctions et sortie structurée."
  },
  "license": "Apache-2.0",
  "url": "https://github.com/google-gemini/gemini-skills/tree/main/skills/gemini-api-dev",
  "raw": "https://raw.githubusercontent.com/google-gemini/gemini-skills/main/skills/gemini-api-dev/SKILL.md",
  "install": [
   "npx skills add https://github.com/google-gemini/gemini-skills --skill gemini-api-dev",
   "npx skills add google-gemini/gemini-skills --skill gemini-api-dev",
   "/plugin marketplace add google-gemini/gemini-skills",
   "/plugin install gemini-skills@gemini-skills",
   "agy plugin install https://github.com/google-gemini/gemini-skills"
  ],
  "singleFile": false
 },
 {
  "name": "design-md",
  "source": "google-labs-code/stitch-skills",
  "group": "community",
  "category": "design",
  "description": {
   "en": "Analyzes a Google Stitch project and writes its design system into a DESIGN.md file that agents can follow.",
   "fr": "Analyse un projet Google Stitch et décrit son design system dans un fichier DESIGN.md que les agents peuvent suivre."
  },
  "license": "Apache-2.0",
  "url": "https://github.com/google-labs-code/stitch-skills/tree/main/plugins/stitch-utilities/skills/design-md",
  "raw": "https://raw.githubusercontent.com/google-labs-code/stitch-skills/main/plugins/stitch-utilities/skills/design-md/SKILL.md",
  "install": [
   "npx skills add https://github.com/google-labs-code/stitch-skills --skill design-md",
   "npx skills add google-labs-code/stitch-skills",
   "npx plugins add google-labs-code/stitch-skills --scope project --target claude-code"
  ],
  "singleFile": false
 },
 {
  "name": "stitch::react-components",
  "source": "google-labs-code/stitch-skills",
  "group": "community",
  "category": "frontend",
  "description": {
   "en": "Turns Google Stitch designs into modular Vite and React components, or syncs existing components with the latest designs.",
   "fr": "Transforme des maquettes Google Stitch en composants React et Vite modulaires, ou aligne tes composants sur les dernières maquettes."
  },
  "license": "Apache-2.0",
  "url": "https://github.com/google-labs-code/stitch-skills/tree/main/plugins/stitch-build/skills/react-components",
  "raw": "https://raw.githubusercontent.com/google-labs-code/stitch-skills/main/plugins/stitch-build/skills/react-components/SKILL.md",
  "install": [
   "npx skills add https://github.com/google-labs-code/stitch-skills --skill stitch::react-components",
   "npx skills add google-labs-code/stitch-skills",
   "npx plugins add google-labs-code/stitch-skills --scope project --target claude-code"
  ],
  "singleFile": false
 },
 {
  "name": "terraform-style-guide",
  "source": "hashicorp/agent-skills",
  "group": "community",
  "category": "devops",
  "description": {
   "en": "Writes and reviews Terraform HCL following HashiCorp's official style conventions and best practices.",
   "fr": "Écrit et relit du Terraform HCL en suivant les conventions de style et bonnes pratiques officielles de HashiCorp."
  },
  "license": "MPL-2.0",
  "url": "https://github.com/hashicorp/agent-skills/tree/main/plugins/terraform/skills/terraform-style-guide",
  "raw": "https://raw.githubusercontent.com/hashicorp/agent-skills/main/plugins/terraform/skills/terraform-style-guide/SKILL.md",
  "install": [
   "npx skills add https://github.com/hashicorp/agent-skills --skill terraform-style-guide",
   "npx skills add hashicorp/agent-skills/plugins/terraform/skills/terraform-style-guide",
   "claude plugin marketplace add hashicorp/agent-skills",
   "claude plugin install terraform@hashicorp"
  ],
  "singleFile": false
 },
 {
  "name": "hf-cli",
  "source": "huggingface/skills",
  "group": "community",
  "category": "ai-dev",
  "description": {
   "en": "Uses the Hugging Face hf CLI to download, upload and manage models, datasets, Spaces, repos and jobs on the Hub.",
   "fr": "Utilise la CLI hf de Hugging Face pour télécharger, publier et gérer modèles, datasets, Spaces, dépôts et jobs sur le Hub."
  },
  "license": "Apache-2.0",
  "url": "https://github.com/huggingface/skills/tree/main/skills/hf-cli",
  "raw": "https://raw.githubusercontent.com/huggingface/skills/main/skills/hf-cli/SKILL.md",
  "install": [
   "npx skills add https://github.com/huggingface/skills --skill hf-cli",
   "/plugin marketplace add huggingface/skills",
   "/plugin install hf-cli@huggingface/skills"
  ],
  "singleFile": false
 },
 {
  "name": "huggingface-gradio",
  "source": "huggingface/skills",
  "group": "community",
  "category": "ai-dev",
  "description": {
   "en": "Builds and debugs Gradio web interfaces and demos in Python: components, layouts and event listeners.",
   "fr": "Construit et débogue des interfaces web et démos Gradio en Python : composants, mises en page et gestion des événements."
  },
  "license": "Apache-2.0",
  "url": "https://github.com/huggingface/skills/tree/main/skills/huggingface-gradio",
  "raw": "https://raw.githubusercontent.com/huggingface/skills/main/skills/huggingface-gradio/SKILL.md",
  "install": [
   "npx skills add https://github.com/huggingface/skills --skill huggingface-gradio",
   "hf skills add huggingface-gradio"
  ],
  "singleFile": false
 },
 {
  "name": "huggingface-llm-trainer",
  "source": "huggingface/skills",
  "group": "community",
  "category": "ai-dev",
  "description": {
   "en": "Fine-tunes language and vision models with TRL or Unsloth on Hugging Face Jobs (SFT, DPO, GRPO), with cost estimates and GGUF export.",
   "fr": "Affine des modèles de langage et de vision avec TRL ou Unsloth sur Hugging Face Jobs (SFT, DPO, GRPO), avec estimation des coûts et export GGUF."
  },
  "license": "Apache-2.0",
  "url": "https://github.com/huggingface/skills/tree/main/skills/huggingface-llm-trainer",
  "raw": "https://raw.githubusercontent.com/huggingface/skills/main/skills/huggingface-llm-trainer/SKILL.md",
  "install": [
   "npx skills add https://github.com/huggingface/skills --skill huggingface-llm-trainer",
   "hf skills add huggingface-llm-trainer"
  ],
  "singleFile": false
 },
 {
  "name": "code-review",
  "source": "mattpocock/skills",
  "group": "community",
  "category": "git",
  "description": {
   "en": "Reviews changes since a commit or branch on two axes, repo coding standards and the original spec, using parallel subagents.",
   "fr": "Relit les changements depuis un commit ou une branche sur deux axes, les standards du dépôt et la spec d'origine, avec des sous-agents en parallèle."
  },
  "license": "MIT",
  "url": "https://github.com/mattpocock/skills/tree/main/skills/engineering/code-review",
  "raw": "https://raw.githubusercontent.com/mattpocock/skills/main/skills/engineering/code-review/SKILL.md",
  "install": [
   "npx skills add https://github.com/mattpocock/skills --skill code-review",
   "claude plugin install mattpocock-skills@claude-plugins-official",
   "npx skills@latest add mattpocock/skills"
  ],
  "singleFile": false
 },
 {
  "name": "diagnosing-bugs",
  "source": "mattpocock/skills",
  "group": "community",
  "category": "debugging",
  "description": {
   "en": "A disciplined diagnosis loop for hard bugs and performance regressions: reproduce, form hypotheses, instrument, then fix and check.",
   "fr": "Une boucle de diagnostic rigoureuse pour les bugs difficiles et les régressions de performance : reproduire, émettre des hypothèses, instrumenter, corriger."
  },
  "license": "MIT",
  "url": "https://github.com/mattpocock/skills/tree/main/skills/engineering/diagnosing-bugs",
  "raw": "https://raw.githubusercontent.com/mattpocock/skills/main/skills/engineering/diagnosing-bugs/SKILL.md",
  "install": [
   "npx skills add https://github.com/mattpocock/skills --skill diagnosing-bugs",
   "claude plugin install mattpocock-skills@claude-plugins-official",
   "npx skills@latest add mattpocock/skills"
  ],
  "singleFile": false
 },
 {
  "name": "git-guardrails-claude-code",
  "source": "mattpocock/skills",
  "group": "community",
  "category": "git",
  "description": {
   "en": "Sets up Claude Code hooks that block dangerous git commands like push, reset --hard, clean and branch -D before they run.",
   "fr": "Installe des hooks Claude Code qui bloquent les commandes git dangereuses comme push, reset --hard, clean ou branch -D avant leur exécution."
  },
  "license": "MIT",
  "url": "https://github.com/mattpocock/skills/tree/main/skills/misc/git-guardrails-claude-code",
  "raw": "https://raw.githubusercontent.com/mattpocock/skills/main/skills/misc/git-guardrails-claude-code/SKILL.md",
  "install": [
   "npx skills add https://github.com/mattpocock/skills --skill git-guardrails-claude-code",
   "claude plugin install mattpocock-skills@claude-plugins-official",
   "npx skills@latest add mattpocock/skills"
  ],
  "singleFile": false
 },
 {
  "name": "grill-me",
  "source": "mattpocock/skills",
  "group": "community",
  "category": "planning",
  "description": {
   "en": "The agent interviews you relentlessly about a plan or design until every branch of the decision tree is resolved.",
   "fr": "L'agent t'interroge sans relâche sur ton plan ou ton design jusqu'à ce que chaque décision soit tranchée."
  },
  "license": "MIT",
  "url": "https://github.com/mattpocock/skills/tree/main/skills/productivity/grill-me",
  "raw": "https://raw.githubusercontent.com/mattpocock/skills/main/skills/productivity/grill-me/SKILL.md",
  "install": [
   "npx skills add https://github.com/mattpocock/skills --skill grill-me",
   "claude plugin install mattpocock-skills@claude-plugins-official",
   "npx skills@latest add mattpocock/skills"
  ],
  "singleFile": false
 },
 {
  "name": "grill-with-docs",
  "source": "mattpocock/skills",
  "group": "community",
  "category": "planning",
  "description": {
   "en": "Same relentless interview as grill-me, but it also writes architecture decision records and a project glossary as you go.",
   "fr": "Le même interrogatoire que grill-me, mais il rédige aussi au fil de l'eau des décisions d'architecture (ADR) et un glossaire du projet."
  },
  "license": "MIT",
  "url": "https://github.com/mattpocock/skills/tree/main/skills/engineering/grill-with-docs",
  "raw": "https://raw.githubusercontent.com/mattpocock/skills/main/skills/engineering/grill-with-docs/SKILL.md",
  "install": [
   "npx skills add https://github.com/mattpocock/skills --skill grill-with-docs",
   "claude plugin install mattpocock-skills@claude-plugins-official",
   "npx skills@latest add mattpocock/skills"
  ],
  "singleFile": false
 },
 {
  "name": "improve-codebase-architecture",
  "source": "mattpocock/skills",
  "group": "community",
  "category": "planning",
  "description": {
   "en": "Scans a codebase for opportunities to deepen modules, shows them in an HTML report, then grills you on the one you pick.",
   "fr": "Analyse le code pour trouver où approfondir les modules, présente le tout dans un rapport HTML, puis t'interroge sur la piste choisie."
  },
  "license": "MIT",
  "url": "https://github.com/mattpocock/skills/tree/main/skills/engineering/improve-codebase-architecture",
  "raw": "https://raw.githubusercontent.com/mattpocock/skills/main/skills/engineering/improve-codebase-architecture/SKILL.md",
  "install": [
   "npx skills add https://github.com/mattpocock/skills --skill improve-codebase-architecture",
   "claude plugin install mattpocock-skills@claude-plugins-official",
   "npx skills@latest add mattpocock/skills"
  ],
  "singleFile": false
 },
 {
  "name": "prototype",
  "source": "mattpocock/skills",
  "group": "community",
  "category": "planning",
  "description": {
   "en": "Builds a throwaway prototype to answer a design question, such as whether a state model works or how a UI should look.",
   "fr": "Construit un prototype jetable pour répondre à une question de conception, par exemple si un modèle d'état tient ou à quoi ressemble une interface."
  },
  "license": "MIT",
  "url": "https://github.com/mattpocock/skills/tree/main/skills/engineering/prototype",
  "raw": "https://raw.githubusercontent.com/mattpocock/skills/main/skills/engineering/prototype/SKILL.md",
  "install": [
   "npx skills add https://github.com/mattpocock/skills --skill prototype",
   "claude plugin install mattpocock-skills@claude-plugins-official",
   "npx skills@latest add mattpocock/skills"
  ],
  "singleFile": false
 },
 {
  "name": "setup-pre-commit",
  "source": "mattpocock/skills",
  "group": "community",
  "category": "git",
  "description": {
   "en": "Adds Husky pre-commit hooks with lint-staged and Prettier, type checking and tests to the current repository.",
   "fr": "Ajoute à ton dépôt des hooks pre-commit Husky avec lint-staged et Prettier, vérification des types et tests."
  },
  "license": "MIT",
  "url": "https://github.com/mattpocock/skills/tree/main/skills/misc/setup-pre-commit",
  "raw": "https://raw.githubusercontent.com/mattpocock/skills/main/skills/misc/setup-pre-commit/SKILL.md",
  "install": [
   "npx skills add https://github.com/mattpocock/skills --skill setup-pre-commit",
   "claude plugin install mattpocock-skills@claude-plugins-official",
   "npx skills@latest add mattpocock/skills"
  ],
  "singleFile": false
 },
 {
  "name": "tdd",
  "source": "mattpocock/skills",
  "group": "community",
  "category": "testing",
  "description": {
   "en": "Builds features and fixes bugs test-first with red-green-refactor, favoring integration tests through public interfaces.",
   "fr": "Développe tes fonctionnalités et corrige tes bugs en commençant par les tests (rouge-vert-refactor), surtout via des tests d'intégration."
  },
  "license": "MIT",
  "url": "https://github.com/mattpocock/skills/tree/main/skills/engineering/tdd",
  "raw": "https://raw.githubusercontent.com/mattpocock/skills/main/skills/engineering/tdd/SKILL.md",
  "install": [
   "npx skills add https://github.com/mattpocock/skills --skill tdd",
   "claude plugin install mattpocock-skills@claude-plugins-official",
   "npx skills@latest add mattpocock/skills"
  ],
  "singleFile": false
 },
 {
  "name": "teach",
  "source": "mattpocock/skills",
  "group": "community",
  "category": "productivity",
  "description": {
   "en": "Turns the agent into a tutor that teaches you a new skill or concept inside your current workspace.",
   "fr": "Transforme l'agent en tuteur qui t'apprend une nouvelle compétence ou notion directement dans ton espace de travail."
  },
  "license": "MIT",
  "url": "https://github.com/mattpocock/skills/tree/main/skills/productivity/teach",
  "raw": "https://raw.githubusercontent.com/mattpocock/skills/main/skills/productivity/teach/SKILL.md",
  "install": [
   "npx skills add https://github.com/mattpocock/skills --skill teach",
   "claude plugin install mattpocock-skills@claude-plugins-official",
   "npx skills@latest add mattpocock/skills"
  ],
  "singleFile": false
 },
 {
  "name": "to-spec",
  "source": "mattpocock/skills",
  "group": "community",
  "category": "planning",
  "description": {
   "en": "Turns what you already discussed in the conversation into a spec and publishes it to your project's issue tracker.",
   "fr": "Transforme ce que vous avez déjà discuté dans la conversation en spec et la publie dans le gestionnaire de tickets du projet."
  },
  "license": "MIT",
  "url": "https://github.com/mattpocock/skills/tree/main/skills/engineering/to-spec",
  "raw": "https://raw.githubusercontent.com/mattpocock/skills/main/skills/engineering/to-spec/SKILL.md",
  "install": [
   "npx skills add https://github.com/mattpocock/skills --skill to-spec",
   "claude plugin install mattpocock-skills@claude-plugins-official",
   "npx skills@latest add mattpocock/skills"
  ],
  "singleFile": false
 },
 {
  "name": "to-tickets",
  "source": "mattpocock/skills",
  "group": "community",
  "category": "planning",
  "description": {
   "en": "Breaks a plan or spec into small tracer-bullet tickets with their blocking dependencies and publishes them to your tracker.",
   "fr": "Découpe un plan ou une spec en petits tickets de bout en bout, avec leurs dépendances bloquantes, et les publie dans ton outil de suivi."
  },
  "license": "MIT",
  "url": "https://github.com/mattpocock/skills/tree/main/skills/engineering/to-tickets",
  "raw": "https://raw.githubusercontent.com/mattpocock/skills/main/skills/engineering/to-tickets/SKILL.md",
  "install": [
   "npx skills add https://github.com/mattpocock/skills --skill to-tickets",
   "claude plugin install mattpocock-skills@claude-plugins-official",
   "npx skills@latest add mattpocock/skills"
  ],
  "singleFile": false
 },
 {
  "name": "triage",
  "source": "mattpocock/skills",
  "group": "community",
  "category": "productivity",
  "description": {
   "en": "Moves issues and external PRs through triage states: categorize, verify, ask questions if needed, and write agent-ready briefs.",
   "fr": "Fait avancer issues et PR externes dans un circuit de tri : catégoriser, vérifier, questionner si besoin et rédiger des briefs prêts pour un agent."
  },
  "license": "MIT",
  "url": "https://github.com/mattpocock/skills/tree/main/skills/engineering/triage",
  "raw": "https://raw.githubusercontent.com/mattpocock/skills/main/skills/engineering/triage/SKILL.md",
  "install": [
   "npx skills add https://github.com/mattpocock/skills --skill triage",
   "claude plugin install mattpocock-skills@claude-plugins-official",
   "npx skills@latest add mattpocock/skills"
  ],
  "singleFile": false
 },
 {
  "name": "azure-deploy",
  "source": "microsoft/azure-skills",
  "group": "community",
  "category": "devops",
  "description": {
   "en": "Runs Azure deployments for apps already prepared with a deployment plan, using azd, Terraform or az commands with error recovery.",
   "fr": "Lance le déploiement sur Azure d'une appli déjà préparée avec un plan, via azd, Terraform ou az, avec reprise sur erreur."
  },
  "license": "MIT",
  "url": "https://github.com/microsoft/azure-skills/tree/main/.github/plugins/azure-skills/skills/azure-deploy",
  "raw": "https://raw.githubusercontent.com/microsoft/azure-skills/main/.github/plugins/azure-skills/skills/azure-deploy/SKILL.md",
  "install": [
   "npx skills add https://github.com/microsoft/azure-skills --skill azure-deploy",
   "/plugin install azure@claude-plugins-official",
   "npx skills add https://github.com/microsoft/azure-skills/tree/main/.github/plugins/azure-skills/skills -a github-copilot -g -y"
  ],
  "singleFile": false
 },
 {
  "name": "neon-postgres",
  "source": "neondatabase/agent-skills",
  "group": "community",
  "category": "data",
  "description": {
   "en": "Guides working with Postgres on Neon: connections and pooling, migrations, branching per PR, autoscaling, scale-to-zero and restore.",
   "fr": "Te guide pour utiliser Postgres sur Neon : connexions et pooling, migrations, une branche par PR, autoscaling, mise en veille et restauration."
  },
  "license": "Apache-2.0",
  "url": "https://github.com/neondatabase/agent-skills/tree/main/skills/neon-postgres",
  "raw": "https://raw.githubusercontent.com/neondatabase/agent-skills/main/skills/neon-postgres/SKILL.md",
  "install": [
   "npx skills add https://github.com/neondatabase/agent-skills --skill neon-postgres",
   "npx skills add neondatabase/agent-skills",
   "/plugin marketplace add neondatabase/agent-skills",
   "/plugin install neon-postgres@neon",
   "agy plugin install https://github.com/neondatabase/agent-skills"
  ],
  "singleFile": false
 },
 {
  "name": "gh-address-comments",
  "source": "openai/skills",
  "group": "community",
  "category": "git",
  "description": {
   "en": "Works through review and issue comments on the current branch's open GitHub PR using the gh CLI.",
   "fr": "Traite les commentaires de revue et de ticket sur la PR GitHub ouverte de ta branche, avec la CLI gh."
  },
  "license": "Apache-2.0",
  "url": "https://github.com/openai/skills/tree/main/skills/.curated/gh-address-comments",
  "raw": "https://raw.githubusercontent.com/openai/skills/main/skills/.curated/gh-address-comments/SKILL.md",
  "install": [
   "npx skills add https://github.com/openai/skills --skill gh-address-comments",
   "$skill-installer gh-address-comments"
  ],
  "singleFile": false
 },
 {
  "name": "gh-fix-ci",
  "source": "openai/skills",
  "group": "community",
  "category": "devops",
  "description": {
   "en": "Debugs failing GitHub Actions checks on a PR with the gh CLI, summarizes the failure and proposes a fix before applying it.",
   "fr": "Débogue les checks GitHub Actions en échec d'une PR avec la CLI gh, résume l'erreur et propose un correctif avant de l'appliquer."
  },
  "license": "Apache-2.0",
  "url": "https://github.com/openai/skills/tree/main/skills/.curated/gh-fix-ci",
  "raw": "https://raw.githubusercontent.com/openai/skills/main/skills/.curated/gh-fix-ci/SKILL.md",
  "install": [
   "npx skills add https://github.com/openai/skills --skill gh-fix-ci",
   "$skill-installer gh-fix-ci"
  ],
  "singleFile": false
 },
 {
  "name": "jupyter-notebook",
  "source": "openai/skills",
  "group": "community",
  "category": "data",
  "description": {
   "en": "Creates and edits clean Jupyter notebooks for experiments, explorations and tutorials from bundled templates.",
   "fr": "Crée et modifie des notebooks Jupyter propres pour tes expériences, explorations et tutoriels, à partir de modèles fournis."
  },
  "license": "Apache-2.0",
  "url": "https://github.com/openai/skills/tree/main/skills/.curated/jupyter-notebook",
  "raw": "https://raw.githubusercontent.com/openai/skills/main/skills/.curated/jupyter-notebook/SKILL.md",
  "install": [
   "npx skills add https://github.com/openai/skills --skill jupyter-notebook",
   "$skill-installer jupyter-notebook"
  ],
  "singleFile": false
 },
 {
  "name": "playwright",
  "source": "openai/skills",
  "group": "community",
  "category": "testing",
  "description": {
   "en": "Automates a real browser from the terminal with playwright-cli: navigation, forms, snapshots, screenshots and UI flow debugging.",
   "fr": "Automatise un vrai navigateur depuis le terminal avec playwright-cli : navigation, formulaires, captures d'écran et débogage de parcours."
  },
  "license": "Apache-2.0",
  "url": "https://github.com/openai/skills/tree/main/skills/.curated/playwright",
  "raw": "https://raw.githubusercontent.com/openai/skills/main/skills/.curated/playwright/SKILL.md",
  "install": [
   "npx skills add https://github.com/openai/skills --skill playwright",
   "$skill-installer playwright"
  ],
  "singleFile": false
 },
 {
  "name": "security-threat-model",
  "source": "openai/skills",
  "group": "community",
  "category": "security",
  "description": {
   "en": "Builds a threat model grounded in your repo: trust boundaries, assets, attacker capabilities, abuse paths and mitigations, written in Markdown.",
   "fr": "Construit un modèle de menaces basé sur ton dépôt : frontières de confiance, actifs, capacités de l'attaquant, scénarios d'abus et parades."
  },
  "license": "Apache-2.0",
  "url": "https://github.com/openai/skills/tree/main/skills/.curated/security-threat-model",
  "raw": "https://raw.githubusercontent.com/openai/skills/main/skills/.curated/security-threat-model/SKILL.md",
  "install": [
   "npx skills add https://github.com/openai/skills --skill security-threat-model",
   "$skill-installer security-threat-model"
  ],
  "singleFile": false
 },
 {
  "name": "remotion-best-practices",
  "source": "remotion-dev/skills",
  "group": "community",
  "category": "other",
  "description": {
   "en": "Entry point to Remotion's skills for making videos with React code: routes the agent to the right Remotion guidance.",
   "fr": "Point d'entrée des skills Remotion pour créer des vidéos en code React : oriente l'agent vers les bonnes consignes Remotion."
  },
  "license": "unknown",
  "url": "https://github.com/remotion-dev/skills/tree/main/skills/remotion-best-practices",
  "raw": "https://raw.githubusercontent.com/remotion-dev/skills/main/skills/remotion-best-practices/SKILL.md",
  "install": [
   "npx skills add https://github.com/remotion-dev/skills --skill remotion-best-practices",
   "npx remotion skills add",
   "npx skills add remotion-dev/skills",
   "gh skill install remotion-dev/skills"
  ],
  "singleFile": false
 },
 {
  "name": "stripe-best-practices",
  "source": "stripe/ai",
  "group": "community",
  "category": "other",
  "description": {
   "en": "Guides Stripe integration choices: Checkout vs PaymentIntents, Connect, subscriptions, tax and test sandboxes.",
   "fr": "Te guide dans tes choix d'intégration Stripe : Checkout ou PaymentIntents, Connect, abonnements, taxes et environnements de test."
  },
  "license": "MIT",
  "url": "https://github.com/stripe/ai/tree/main/skills/stripe-best-practices",
  "raw": "https://raw.githubusercontent.com/stripe/ai/main/skills/stripe-best-practices/SKILL.md",
  "install": [
   "npx skills add https://github.com/stripe/ai --skill stripe-best-practices",
   "claude plugin install stripe@claude-plugins-official",
   "codex plugin add stripe@openai-curated",
   "npx skills add https://docs.stripe.com"
  ],
  "singleFile": false
 },
 {
  "name": "stripe-docs",
  "source": "stripe/ai",
  "group": "community",
  "category": "other",
  "description": {
   "en": "Reads and searches Stripe documentation and API reference from the terminal with the Stripe CLI, including gated pages.",
   "fr": "Lit et recherche la documentation Stripe et la référence API depuis le terminal avec la CLI Stripe, y compris les pages protégées."
  },
  "license": "MIT",
  "url": "https://github.com/stripe/ai/tree/main/skills/stripe-docs",
  "raw": "https://raw.githubusercontent.com/stripe/ai/main/skills/stripe-docs/SKILL.md",
  "install": [
   "npx skills add https://github.com/stripe/ai --skill stripe-docs",
   "claude plugin install stripe@claude-plugins-official",
   "codex plugin add stripe@openai-curated",
   "npx skills add https://docs.stripe.com"
  ],
  "singleFile": false
 },
 {
  "name": "supabase",
  "source": "supabase/agent-skills",
  "group": "community",
  "category": "data",
  "description": {
   "en": "Covers any Supabase task: database, auth, edge functions, realtime, storage, client libraries, CLI, MCP and migrations.",
   "fr": "Couvre toutes les tâches Supabase : base de données, auth, edge functions, temps réel, stockage, bibliothèques clientes, CLI et migrations."
  },
  "license": "MIT",
  "url": "https://github.com/supabase/agent-skills/tree/main/skills/supabase",
  "raw": "https://raw.githubusercontent.com/supabase/agent-skills/main/skills/supabase/SKILL.md",
  "install": [
   "npx skills add https://github.com/supabase/agent-skills --skill supabase",
   "npx skills add supabase/agent-skills --skill supabase",
   "claude plugin marketplace add supabase/agent-skills",
   "claude plugin install supabase@supabase-agent-skills"
  ],
  "singleFile": false
 },
 {
  "name": "supabase-postgres-best-practices",
  "source": "supabase/agent-skills",
  "group": "community",
  "category": "data",
  "description": {
   "en": "Supabase's Postgres best practices for schema design, column types, migrations, RLS policies, indexes and functions, for any Postgres.",
   "fr": "Les bonnes pratiques Postgres de Supabase : conception du schéma, types de colonnes, migrations, RLS, index et fonctions, pour tout Postgres."
  },
  "license": "MIT",
  "url": "https://github.com/supabase/agent-skills/tree/main/skills/supabase-postgres-best-practices",
  "raw": "https://raw.githubusercontent.com/supabase/agent-skills/main/skills/supabase-postgres-best-practices/SKILL.md",
  "install": [
   "npx skills add https://github.com/supabase/agent-skills --skill supabase-postgres-best-practices",
   "npx skills add supabase/agent-skills --skill supabase-postgres-best-practices",
   "claude plugin marketplace add supabase/agent-skills",
   "claude plugin install postgres-best-practices@supabase-agent-skills"
  ],
  "singleFile": false
 },
 {
  "name": "codeql",
  "source": "trailofbits/skills",
  "group": "community",
  "category": "security",
  "description": {
   "en": "Scans a codebase for vulnerabilities with CodeQL data flow and taint tracking across Python, JavaScript, Go, Java, C/C++ and more.",
   "fr": "Cherche les vulnérabilités dans ton code avec l'analyse de flux et de propagation de CodeQL, pour Python, JavaScript, Go, Java, C/C++ et d'autres."
  },
  "license": "CC-BY-SA-4.0",
  "url": "https://github.com/trailofbits/skills/tree/main/plugins/static-analysis/skills/codeql",
  "raw": "https://raw.githubusercontent.com/trailofbits/skills/main/plugins/static-analysis/skills/codeql/SKILL.md",
  "install": [
   "npx skills add https://github.com/trailofbits/skills --skill codeql",
   "/plugin marketplace add trailofbits/skills",
   "/plugin install static-analysis@trailofbits",
   "codex plugin marketplace add trailofbits/skills",
   "codex plugin add static-analysis@trailofbits"
  ],
  "singleFile": false
 },
 {
  "name": "differential-review",
  "source": "trailofbits/skills",
  "group": "community",
  "category": "security",
  "description": {
   "en": "Security-focused review of a PR or diff: uses git blame, measures blast radius, checks test coverage and writes a report.",
   "fr": "Revue de sécurité d'une PR ou d'un diff : utilise git blame, mesure l'impact, vérifie la couverture de tests et rédige un rapport."
  },
  "license": "CC-BY-SA-4.0",
  "url": "https://github.com/trailofbits/skills/tree/main/plugins/differential-review/skills/differential-review",
  "raw": "https://raw.githubusercontent.com/trailofbits/skills/main/plugins/differential-review/skills/differential-review/SKILL.md",
  "install": [
   "npx skills add https://github.com/trailofbits/skills --skill differential-review",
   "/plugin marketplace add trailofbits/skills",
   "/plugin install differential-review@trailofbits",
   "codex plugin marketplace add trailofbits/skills",
   "codex plugin add differential-review@trailofbits"
  ],
  "singleFile": false
 },
 {
  "name": "modern-python",
  "source": "trailofbits/skills",
  "group": "community",
  "category": "devops",
  "description": {
   "en": "Sets up Python projects and scripts with modern tooling (uv, ruff, ty) and migrates away from pip, Poetry, mypy or black.",
   "fr": "Configure tes projets et scripts Python avec l'outillage moderne (uv, ruff, ty) et migre depuis pip, Poetry, mypy ou black."
  },
  "license": "CC-BY-SA-4.0",
  "url": "https://github.com/trailofbits/skills/tree/main/plugins/modern-python/skills/modern-python",
  "raw": "https://raw.githubusercontent.com/trailofbits/skills/main/plugins/modern-python/skills/modern-python/SKILL.md",
  "install": [
   "npx skills add https://github.com/trailofbits/skills --skill modern-python",
   "/plugin marketplace add trailofbits/skills",
   "/plugin install modern-python@trailofbits",
   "codex plugin marketplace add trailofbits/skills",
   "codex plugin add modern-python@trailofbits"
  ],
  "singleFile": false
 },
 {
  "name": "property-based-testing",
  "source": "trailofbits/skills",
  "group": "community",
  "category": "testing",
  "description": {
   "en": "Writes and reviews property-based tests with Hypothesis, fast-check, proptest and others, covering whole input domains instead of examples.",
   "fr": "Écrit et relit des tests basés sur des propriétés avec Hypothesis, fast-check, proptest et d'autres, pour couvrir tout un domaine d'entrées."
  },
  "license": "CC-BY-SA-4.0",
  "url": "https://github.com/trailofbits/skills/tree/main/plugins/property-based-testing/skills/property-based-testing",
  "raw": "https://raw.githubusercontent.com/trailofbits/skills/main/plugins/property-based-testing/skills/property-based-testing/SKILL.md",
  "install": [
   "npx skills add https://github.com/trailofbits/skills --skill property-based-testing",
   "/plugin marketplace add trailofbits/skills",
   "/plugin install property-based-testing@trailofbits",
   "codex plugin marketplace add trailofbits/skills",
   "codex plugin add property-based-testing@trailofbits"
  ],
  "singleFile": false
 },
 {
  "name": "semgrep",
  "source": "trailofbits/skills",
  "group": "community",
  "category": "security",
  "description": {
   "en": "Runs a Semgrep security scan: detects languages, picks rulesets, asks your approval, then merges the results into SARIF.",
   "fr": "Lance un scan de sécurité Semgrep : détecte les langages, choisit les règles, demande ton accord, puis fusionne les résultats en SARIF."
  },
  "license": "CC-BY-SA-4.0",
  "url": "https://github.com/trailofbits/skills/tree/main/plugins/static-analysis/skills/semgrep",
  "raw": "https://raw.githubusercontent.com/trailofbits/skills/main/plugins/static-analysis/skills/semgrep/SKILL.md",
  "install": [
   "npx skills add https://github.com/trailofbits/skills --skill semgrep",
   "/plugin marketplace add trailofbits/skills",
   "/plugin install static-analysis@trailofbits",
   "codex plugin marketplace add trailofbits/skills",
   "codex plugin add static-analysis@trailofbits"
  ],
  "singleFile": false
 },
 {
  "name": "supply-chain-risk-auditor",
  "source": "trailofbits/skills",
  "group": "community",
  "category": "security",
  "description": {
   "en": "Audits dependencies for supply-chain risk: known advisories, abandoned packages, publisher concentration and install-time scripts.",
   "fr": "Audite tes dépendances pour les risques de chaîne d'approvisionnement : failles connues, paquets abandonnés, scripts lancés à l'installation."
  },
  "license": "CC-BY-SA-4.0",
  "url": "https://github.com/trailofbits/skills/tree/main/plugins/supply-chain-risk-auditor/skills/supply-chain-risk-auditor",
  "raw": "https://raw.githubusercontent.com/trailofbits/skills/main/plugins/supply-chain-risk-auditor/skills/supply-chain-risk-auditor/SKILL.md",
  "install": [
   "npx skills add https://github.com/trailofbits/skills --skill supply-chain-risk-auditor",
   "/plugin marketplace add trailofbits/skills",
   "/plugin install supply-chain-risk-auditor@trailofbits",
   "codex plugin marketplace add trailofbits/skills",
   "codex plugin add supply-chain-risk-auditor@trailofbits"
  ],
  "singleFile": false
 },
 {
  "name": "find-docs",
  "source": "upstash/context7",
  "group": "community",
  "category": "productivity",
  "description": {
   "en": "Fetches up-to-date documentation and code examples for any library or framework through Context7, instead of relying on training data.",
   "fr": "Récupère via Context7 la documentation et des exemples à jour pour n'importe quelle bibliothèque, au lieu de se fier à des connaissances datées."
  },
  "license": "MIT",
  "url": "https://github.com/upstash/context7/tree/master/skills/find-docs",
  "raw": "https://raw.githubusercontent.com/upstash/context7/master/skills/find-docs/SKILL.md",
  "install": [
   "npx skills add https://github.com/upstash/context7 --skill find-docs",
   "npx ctx7 setup"
  ],
  "singleFile": false
 },
 {
  "name": "agent-browser",
  "source": "vercel-labs/agent-browser",
  "group": "community",
  "category": "testing",
  "description": {
   "en": "Lets the agent drive a real browser through the agent-browser CLI: navigate, click, fill forms, take screenshots and scrape pages.",
   "fr": "Permet à l'agent de piloter un vrai navigateur via la CLI agent-browser : naviguer, cliquer, remplir des formulaires, capturer et extraire."
  },
  "license": "Apache-2.0",
  "url": "https://github.com/vercel-labs/agent-browser/tree/main/skills/agent-browser",
  "raw": "https://raw.githubusercontent.com/vercel-labs/agent-browser/main/skills/agent-browser/SKILL.md",
  "install": [
   "npx skills add https://github.com/vercel-labs/agent-browser --skill agent-browser",
   "npm install -g agent-browser",
   "npx skills add vercel-labs/agent-browser"
  ],
  "singleFile": false
 },
 {
  "name": "deploy-to-vercel",
  "source": "vercel-labs/agent-skills",
  "group": "community",
  "category": "devops",
  "description": {
   "en": "Deploys your app to Vercel through git push or the Vercel CLI, or as a temporary deployment with a claim link when logged out.",
   "fr": "Déploie ton appli sur Vercel via git push ou la CLI Vercel, et peut créer un déploiement temporaire avec un lien à réclamer sans compte."
  },
  "license": "MIT",
  "url": "https://github.com/vercel-labs/agent-skills/tree/main/skills/deploy-to-vercel",
  "raw": "https://raw.githubusercontent.com/vercel-labs/agent-skills/main/skills/deploy-to-vercel/SKILL.md",
  "install": [
   "npx skills add https://github.com/vercel-labs/agent-skills --skill deploy-to-vercel",
   "npx skills add vercel-labs/agent-skills"
  ],
  "singleFile": false
 },
 {
  "name": "vercel-composition-patterns",
  "source": "vercel-labs/agent-skills",
  "group": "community",
  "category": "frontend",
  "description": {
   "en": "React composition patterns, such as compound components and context providers, to replace boolean-prop sprawl, including React 19 API changes.",
   "fr": "Des patterns de composition React (composants composés, providers de contexte) pour éviter l'avalanche de props booléennes, avec React 19."
  },
  "license": "MIT",
  "url": "https://github.com/vercel-labs/agent-skills/tree/main/skills/composition-patterns",
  "raw": "https://raw.githubusercontent.com/vercel-labs/agent-skills/main/skills/composition-patterns/SKILL.md",
  "install": [
   "npx skills add https://github.com/vercel-labs/agent-skills --skill vercel-composition-patterns",
   "npx skills add vercel-labs/agent-skills"
  ],
  "singleFile": false
 },
 {
  "name": "vercel-react-best-practices",
  "source": "vercel-labs/agent-skills",
  "group": "community",
  "category": "frontend",
  "description": {
   "en": "Vercel Engineering's React and Next.js performance rules for data fetching, bundle size, rendering and re-renders, used when writing or reviewing code.",
   "fr": "Les règles de performance React et Next.js de Vercel (chargement de données, taille du bundle, rendu) pour écrire ou relire ton code."
  },
  "license": "MIT",
  "url": "https://github.com/vercel-labs/agent-skills/tree/main/skills/react-best-practices",
  "raw": "https://raw.githubusercontent.com/vercel-labs/agent-skills/main/skills/react-best-practices/SKILL.md",
  "install": [
   "npx skills add https://github.com/vercel-labs/agent-skills --skill vercel-react-best-practices",
   "npx skills add vercel-labs/agent-skills"
  ],
  "singleFile": false
 },
 {
  "name": "vercel-react-native-skills",
  "source": "vercel-labs/agent-skills",
  "group": "community",
  "category": "frontend",
  "description": {
   "en": "React Native and Expo best practices for fast mobile apps: list performance, animations and native modules.",
   "fr": "Bonnes pratiques React Native et Expo pour des applis mobiles rapides : performance des listes, animations et modules natifs."
  },
  "license": "MIT",
  "url": "https://github.com/vercel-labs/agent-skills/tree/main/skills/react-native-skills",
  "raw": "https://raw.githubusercontent.com/vercel-labs/agent-skills/main/skills/react-native-skills/SKILL.md",
  "install": [
   "npx skills add https://github.com/vercel-labs/agent-skills --skill vercel-react-native-skills",
   "npx skills add vercel-labs/agent-skills"
  ],
  "singleFile": false
 },
 {
  "name": "web-design-guidelines",
  "source": "vercel-labs/agent-skills",
  "group": "community",
  "category": "frontend",
  "description": {
   "en": "Reviews UI code against Vercel's Web Interface Guidelines for accessibility, UX and design best practices.",
   "fr": "Relit ton code d'interface selon les Web Interface Guidelines de Vercel : accessibilité, UX et bonnes pratiques de design."
  },
  "license": "MIT",
  "url": "https://github.com/vercel-labs/agent-skills/tree/main/skills/web-design-guidelines",
  "raw": "https://raw.githubusercontent.com/vercel-labs/agent-skills/main/skills/web-design-guidelines/SKILL.md",
  "install": [
   "npx skills add https://github.com/vercel-labs/agent-skills --skill web-design-guidelines",
   "npx skills add vercel-labs/agent-skills"
  ],
  "singleFile": false
 },
 {
  "name": "writing-guidelines",
  "source": "vercel-labs/agent-skills",
  "group": "community",
  "category": "writing",
  "description": {
   "en": "Reviews documentation and prose against Vercel's writing handbook for style, voice and tone.",
   "fr": "Relit ta documentation et tes textes selon le guide de rédaction de Vercel : style, voix et ton."
  },
  "license": "MIT",
  "url": "https://github.com/vercel-labs/agent-skills/tree/main/skills/writing-guidelines",
  "raw": "https://raw.githubusercontent.com/vercel-labs/agent-skills/main/skills/writing-guidelines/SKILL.md",
  "install": [
   "npx skills add https://github.com/vercel-labs/agent-skills --skill writing-guidelines",
   "npx skills add vercel-labs/agent-skills"
  ],
  "singleFile": false
 },
 {
  "name": "find-skills",
  "source": "vercel-labs/skills",
  "group": "community",
  "category": "ai-dev",
  "description": {
   "en": "Helps the agent search the skills.sh ecosystem and install a skill when you ask for a capability it does not have yet.",
   "fr": "Aide l'agent à chercher dans l'écosystème skills.sh et à installer une skill quand tu demandes une capacité qu'il n'a pas encore."
  },
  "license": "MIT",
  "url": "https://github.com/vercel-labs/skills/tree/main/skills/find-skills",
  "raw": "https://raw.githubusercontent.com/vercel-labs/skills/main/skills/find-skills/SKILL.md",
  "install": [
   "npx skills add https://github.com/vercel-labs/skills --skill find-skills"
  ],
  "singleFile": false
 }
];

export const GROUP_SETUP: Record<"anthropic" | "community", { blurb: { en: string; fr: string }; setup?: string[] }> = {
  anthropic: {
    blurb: {
      en: "Anthropic's skills repository: Word, PDF, PowerPoint and Excel documents (Apache-2.0 since November 2026), design, testing, MCP servers and skill-creator. In Claude Code, add the marketplace once, then install a plugin; npx skills add works for any agent.",
      fr: "Le dépôt de skills d'Anthropic : documents Word, PDF, PowerPoint et Excel (Apache-2.0 depuis novembre 2026), design, tests, serveurs MCP et skill-creator. Dans Claude Code, ajoute la marketplace une fois, puis installe un plugin ; npx skills add marche pour tous les agents.",
    },
    setup: ["/plugin marketplace add anthropics/skills"],
  },
  community: {
    blurb: {
      en: "Skills from well-known teams and authors: Superpowers, Matt Pocock, Vercel, Trail of Bits, Sentry, Cloudflare, Stripe, Supabase, Hugging Face and more. npx skills add (from skills.sh, needs Node.js 22.20 or newer) installs one for Claude Code, Codex, Cursor and others; npx skills find searches the whole registry.",
      fr: "Des skills d'équipes et d'auteurs connus : Superpowers, Matt Pocock, Vercel, Trail of Bits, Sentry, Cloudflare, Stripe, Supabase, Hugging Face et d'autres. npx skills add (de skills.sh, demande Node.js 22.20 ou plus) en installe un pour Claude Code, Codex, Cursor et d'autres ; npx skills find cherche dans tout le registre.",
    },
    setup: ["npx skills find"],
  },
};
