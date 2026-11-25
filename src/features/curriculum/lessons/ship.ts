import { tx as L } from "@/engine";
import type { AgentRun, World } from "@/engine";
import * as c from "../checks";
import { P_DISCOUNT, P_EURO, P_TOTAL, shop } from "../scenario";
import type { LessonDef, Solution, StoryDef } from "../types";

const UI = { files: true, editor: true, run: true, orca: false };

// ───────────────────────────────────────────── helpers

/** A Conventional Commits message: type(optional scope)(!): description. */
const CONVENTIONAL = /^(feat|fix|docs|test|refactor|chore|perf|style|build|ci)(\([\w./-]+\))?!?: \S/;
const newCommits = (w: World, s: World) => w.git.log.slice(s.git.log.length);
/** The commit an agent run made, if any. */
const agentCommit = (r: AgentRun) => r.commands.find((x) => x.startsWith("git commit -m "))?.slice('git commit -m "'.length, -1) ?? null;

const VAGUE_COMMIT = "Commit the changes";
const GOOD_COMMIT = "Commit the changes with a conventional commit message";
const BASE_RULES = "# Tiny Shop\n\n## Commands\n- Install: `pnpm install`\n- Test: `pnpm test` (run it after every change)\n";
const COMMIT_RULES = `${BASE_RULES}\n## Commits\n- Use Conventional Commits: \`feat:\`, \`fix:\`, \`docs:\`, \`test:\`.\n- One change per commit.\n`;

// ───────────────────────────────────────────── 1. Agent commits

const agentCommits: LessonDef = {
  id: "agent-commits",
  chapterId: "ship",
  title: L("Let the agent write the commit", "Laisse l'agent écrire le commit"),
  tagline: L("Good messages, small commits, no effort", "De bons messages, de petits commits, sans effort"),
  xp: 120,
  concepts: [L("commit messages", "messages de commit"), L("Conventional Commits", "Conventional Commits"), L("small commits", "petits commits")],
  commands: ['claude -p "Commit the changes"', "git log", "CLAUDE.md"],
  ui: UI,
  setup: () => shop({ "CLAUDE.md": BASE_RULES }),
  recap: [
    L("Agents can commit for you: they read git status and git diff, then write the message. Say how you want it, or you get “Update files”.", "Les agents peuvent commiter pour toi : ils lisent git status et git diff, puis écrivent le message. Dis comment tu le veux, sinon tu obtiens « Update files »."),
    L("Conventional Commits is a common format: a type (feat, fix, docs, test…), a colon, then what changed. History becomes readable, and tools can build a changelog from it.", "Conventional Commits est un format courant : un type (feat, fix, docs, test…), deux-points, puis ce qui a changé. L'historique devient lisible, et des outils peuvent en tirer un changelog."),
    L("Put the convention in CLAUDE.md once, and commit after each change: small commits are easy to review and easy to undo.", "Mets la convention dans CLAUDE.md une fois pour toutes, et commite après chaque changement : un petit commit se relit et s'annule facilement."),
  ],
  steps: [
    {
      kind: "discover",
      title: L("History is for humans", "L'historique, c'est pour les humains"),
      body: [
        L("Every commit has a message. In six months, it's the only thing that explains why a line changed. Writing good ones is boring, so it's a perfect job for an agent.", "Chaque commit a un message. Dans six mois, c'est la seule chose qui expliquera pourquoi une ligne a changé. En écrire de bons, c'est ennuyeux : un travail parfait pour un agent."),
        L("Press Next to compare a vague request with a precise one.", "Appuie sur Suivant pour comparer une demande vague et une demande précise."),
      ],
      scene: "story:commit-messages",
    },
    {
      kind: "try",
      title: L("Make a change", "Fais un changement"),
      body: L("You need something to commit. Ask for the total() fix.", "Il te faut quelque chose à commiter. Demande la correction de total()."),
      command: `claude -p "${P_TOTAL}"`,
      check: (w, s) => c.someRun(w, s, (r) => r.task === "fix-total" && r.changed.includes("src/cart.ts")),
      success: L("Fixed and tested. Two files changed: src/cart.ts and the test.", "Corrigé et testé. Deux fichiers ont changé : src/cart.ts et le test."),
    },
    {
      kind: "try",
      title: L("Ask for a commit, vaguely", "Demande un commit, vaguement"),
      body: L("Ask the agent to commit, without saying anything about the message.", "Demande à l'agent de commiter, sans rien dire du message."),
      command: `claude -p "${VAGUE_COMMIT}"`,
      check: (w, s) => newCommits(w, s).some((x) => x.message === "Update files"),
      success: L("“Update files”. True, and useless: it doesn't say what changed or why. The agent even warns you it had to guess.", "« Update files ». Vrai, et inutile : ça ne dit ni ce qui a changé ni pourquoi. L'agent te prévient même qu'il a dû deviner."),
    },
    {
      kind: "try",
      title: L("Another change", "Un autre changement"),
      body: L("Let's try again with a new change: euro prices.", "Recommençons avec un nouveau changement : les prix en euros."),
      command: `claude -p "${P_EURO}"`,
      check: (w, s) => c.someRun(w, s, (r) => r.task === "euro" && r.changed.includes("src/price.ts")),
      success: L("Done. Now commit it properly.", "C'est fait. Maintenant, commite-le correctement."),
    },
    {
      kind: "try",
      title: L("Ask for a conventional message", "Demande un message conventionnel"),
      body: L("This time, name the format you want.", "Cette fois, nomme le format que tu veux."),
      command: `claude -p "${GOOD_COMMIT}"`,
      check: (w, s) => newCommits(w, s).some((x) => x.message.startsWith("feat: ")),
      success: L("“feat: format prices in euros”. A type, then what changed. Type git log to compare both commits.", "« feat: format prices in euros ». Un type, puis ce qui a changé. Tape git log pour comparer les deux commits."),
    },
    {
      kind: "challenge",
      title: L("Challenge: make it the default", "Défi : fais-en l'habitude"),
      body: L("You don't want to repeat “conventional” every time. Add the convention to CLAUDE.md, add the discount, then send a plain “Commit the changes”. The message must follow the convention anyway.", "Tu ne veux pas répéter « conventional » à chaque fois. Ajoute la convention dans CLAUDE.md, ajoute la remise, puis envoie un simple « Commit the changes ». Le message doit quand même suivre la convention."),
      objectives: [
        {
          id: "rule",
          label: L("CLAUDE.md asks for Conventional Commits", "CLAUDE.md demande des Conventional Commits"),
          check: (w) => c.directivesFor(w, "claude").includes("conventional"),
          hints: [
            L("Rules are for what you'd otherwise repeat in every prompt.", "Les règles, c'est pour ce que tu répéterais sinon à chaque prompt."),
            L("Open CLAUDE.md (Files panel) and add a ## Commits section that names the convention.", "Ouvre CLAUDE.md (panneau Fichiers) et ajoute une section ## Commits qui nomme la convention."),
            L("Add this line to CLAUDE.md: - Use Conventional Commits: `feat:`, `fix:`, `docs:`, `test:`.", "Ajoute cette ligne dans CLAUDE.md : - Use Conventional Commits: `feat:`, `fix:`, `docs:`, `test:`."),
          ],
        },
        {
          id: "plain",
          label: L("A plain “Commit the changes” gives a conventional message", "Un simple « Commit the changes » donne un message conventionnel"),
          check: (w, s) => c.someRun(w, s, (r) => !/conventional/i.test(r.prompt) && CONVENTIONAL.test(agentCommit(r) ?? "")),
          hints: [
            L("You need a change to commit first, then a short request.", "Il te faut d'abord un changement à commiter, puis une demande courte."),
            L("Ask for the discount, then ask for a commit without saying how to write the message.", "Demande la remise, puis demande un commit sans dire comment écrire le message."),
            L(`Type: claude -p "${P_DISCOUNT}", then: claude -p "${VAGUE_COMMIT}"`, `Tape : claude -p "${P_DISCOUNT}", puis : claude -p "${VAGUE_COMMIT}"`),
          ],
        },
      ],
      feedback: (w, s) => {
        const r = c.lastRunOf(w, s);
        if (!r || c.someRun(w, s, (x) => !/conventional/i.test(x.prompt) && CONVENTIONAL.test(agentCommit(x) ?? ""))) return null;
        const msg = agentCommit(r);
        if (msg === "Update files") return L("“Update files” again: the agent didn't find the convention. Is the line in CLAUDE.md?", "Encore « Update files » : l'agent n'a pas trouvé la convention. La ligne est-elle dans CLAUDE.md ?");
        if (msg && /conventional/i.test(r.prompt)) return L("That works, but you asked for it in the prompt. Put the convention in CLAUDE.md and just say “Commit the changes”.", "Ça marche, mais tu l'as demandé dans le prompt. Mets la convention dans CLAUDE.md et dis simplement « Commit the changes ».");
        if (!msg && /\bcommit/i.test(r.prompt) && !r.task) return L("Nothing to commit yet: ask for the discount first.", "Rien à commiter pour l'instant : demande d'abord la remise.");
        return null;
      },
    },
    {
      kind: "experiment",
      title: L("Read your history", "Lis ton historique"),
      body: L("git log lists your commits, newest first. Which ones would you understand in six months?", "git log liste tes commits, du plus récent au plus ancien. Lesquels comprendras-tu dans six mois ?"),
      ideas: ["git log", "git status", "cat CLAUDE.md"],
    },
    { kind: "celebrate" },
  ],
};

// ───────────────────────────────────────────── 2. Capstone

const discountDone = (r: AgentRun) => r.task === "discount" && r.outcome === "done" && r.changed.includes("src/cart.ts");

const capstone: LessonDef = {
  id: "capstone",
  chapterId: "ship",
  title: L("Boss: ship a feature end to end", "Boss : livre une fonctionnalité de bout en bout"),
  tagline: L("Rules, plan, review, tests, commit. All of it.", "Règles, plan, relecture, tests, commit. Tout."),
  xp: 200,
  boss: true,
  concepts: [L("the full workflow", "le workflow complet"), L("plan, approve, verify", "planifier, valider, vérifier"), L("review before you commit", "relire avant de commiter")],
  commands: ["/init", "/plan", "yes", "git diff", "git commit"],
  ui: UI,
  setup: () => shop(),
  recap: [
    L("Rules first: a CLAUDE.md with the test command means every session knows how to check its work.", "D'abord les règles : un CLAUDE.md avec la commande de test, et chaque session sait vérifier son travail."),
    L("For a feature, get a plan, read it, approve it. Then read the diff and make sure the tests pass.", "Pour une fonctionnalité, obtiens un plan, lis-le, valide-le. Ensuite lis le diff et vérifie que les tests passent."),
    L("Finish with a small commit and a clear message. That's how people ship with agents every day.", "Termine par un petit commit avec un message clair. C'est comme ça qu'on livre avec des agents, tous les jours."),
  ],
  steps: [
    {
      kind: "discover",
      title: L("The routine", "La routine"),
      body: [
        L("You've learned each piece on its own. Real work chains them: rules, plan, approve, review, test, commit. Skip one and it shows up later as a bug, a leak or a mystery commit.", "Tu as appris chaque morceau séparément. Le vrai travail les enchaîne : règles, plan, validation, relecture, tests, commit. Saute une étape et elle revient plus tard sous forme de bug, de fuite ou de commit mystère."),
        L("Press Next to walk through the whole routine once before you do it yourself.", "Appuie sur Suivant pour parcourir toute la routine une fois avant de la faire toi-même."),
      ],
      scene: "story:ship-routine",
    },
    {
      kind: "try",
      title: L("Know your starting point", "Connais ton point de départ"),
      body: L("Before changing anything, run the tests yourself. If something breaks later, you'll know it wasn't already broken.", "Avant de toucher à quoi que ce soit, lance les tests toi-même. Si quelque chose casse plus tard, tu sauras que ce n'était pas déjà cassé."),
      command: "pnpm test",
      check: (_w, _s, ran) => ran.some((x) => x.startsWith("pnpm")),
      success: L("All green. That's your baseline.", "Tout est vert. C'est ta base de départ."),
    },
    {
      kind: "try",
      title: L("Start from a clean tree", "Pars d'un arbre propre"),
      body: L("Check that nothing is waiting to be committed, so your commit will hold only this feature.", "Vérifie que rien n'attend d'être commité, pour que ton commit ne contienne que cette fonctionnalité."),
      command: "git status",
      check: (_w, _s, ran) => ran.includes("git status"),
      success: L("“nothing to commit, working tree clean”. Off you go.", "« nothing to commit, working tree clean ». C'est parti."),
    },
    {
      kind: "challenge",
      title: L("Boss: ship the discount", "Boss : livre la remise"),
      body: L("Ship applyDiscount() like a pro, with no step skipped: write the rules, get a plan in plan mode and approve it, make sure the tests pass, read the diff, then commit with a conventional message. The guide tracks each step.", "Livre applyDiscount() comme un pro, sans sauter d'étape : écris les règles, obtiens un plan en mode plan et valide-le, vérifie que les tests passent, lis le diff, puis commite avec un message conventionnel. Le guide suit chaque étape."),
      objectives: [
        {
          id: "rules",
          label: L("CLAUDE.md exists and gives the test command", "CLAUDE.md existe et donne la commande de test"),
          check: (w) => c.fileHas(w, "CLAUDE.md", /pnpm test/),
          hints: [
            L("Rules first, so every session knows how to test.", "D'abord les règles, pour que chaque session sache tester."),
            L("In a Claude Code session, /init writes a first CLAUDE.md for you. Do it before plan mode: in plan mode the agent doesn't write files.", "Dans une session Claude Code, /init écrit un premier CLAUDE.md pour toi. Fais-le avant le mode plan : en mode plan, l'agent n'écrit pas de fichiers."),
            L("Type: claude, then: /init", "Tape : claude, puis : /init"),
          ],
        },
        {
          id: "plan",
          label: L("A plan for the discount, approved and carried out", "Un plan pour la remise, validé et réalisé"),
          check: (w, s) => c.someRun(w, s, (r) => r.task === "discount" && r.outcome === "plan") && c.someRun(w, s, discountDone),
          hints: [
            L("In plan mode, the agent proposes first and acts after your OK.", "En mode plan, l'agent propose d'abord et agit après ton accord."),
            L("Switch on plan mode (/plan here, Shift+Tab in the real app), send a precise request (file, rule, tests), read the plan, then approve.", "Active le mode plan (/plan ici, Maj+Tab dans la vraie appli), envoie une demande précise (fichier, règle, tests), lis le plan, puis valide."),
            L(`Type: /plan, then: ${P_DISCOUNT}, then: yes`, `Tape : /plan, puis : ${P_DISCOUNT}, puis : oui`),
          ],
        },
        {
          id: "green",
          label: L("The discount has tests, and they all pass", "La remise a des tests, et ils passent tous"),
          check: (w, s) => c.fileHas(w, "tests/cart.test.ts", /applyDiscount/) && c.someRun(w, s, (r) => discountDone(r) && c.ranTests(r) && r.failing === 0),
          hints: [
            L("The agent only checks its work if someone asks: your prompt or your rules.", "L'agent ne vérifie son travail que si quelqu'un le demande : ton prompt ou tes règles."),
            L("End your request with “Add tests and run them.”", "Termine ta demande par « Add tests and run them. »"),
            L(`Type: ${P_DISCOUNT}, then: yes`, `Tape : ${P_DISCOUNT}, puis : oui`),
          ],
        },
        {
          id: "commit",
          label: L("The feature is committed with a conventional message", "La fonctionnalité est commitée avec un message conventionnel"),
          check: (w, s) => /applyDiscount/.test(w.git.head["src/cart.ts"] ?? "") && newCommits(w, s).some((x) => CONVENTIONAL.test(x.message)),
          hints: [
            L("Read the diff first (!git diff inside a session), then commit.", "Lis d'abord le diff (!git diff dans une session), puis commite."),
            L("Still in the session, ask the agent to commit and name the format. In plan mode it proposes the commit first: approve it with yes.", "Toujours dans la session, demande à l'agent de commiter en nommant le format. En mode plan, il propose d'abord le commit : valide-le avec oui."),
            L(`Type: ${GOOD_COMMIT}, then: yes`, `Tape : ${GOOD_COMMIT}, puis : oui`),
          ],
        },
      ],
      feedback: (w, s) => {
        const r = c.lastRunOf(w, s);
        if (w.session?.pending) return L("A plan is waiting. Read it, then type yes to approve, or tell the agent what to change.", "Un plan t'attend. Lis-le, puis tape oui pour valider, ou dis à l'agent quoi changer.");
        if (r?.task === "discount" && r.failing) return L("Some tests fail. Paste the error into your next prompt: it names the file and the numbers.", "Des tests échouent. Colle l'erreur dans ton prochain prompt : elle nomme le fichier et les nombres.");
        if (c.someRun(w, s, discountDone) && !c.someRun(w, s, (x) => x.task === "discount" && x.outcome === "plan"))
          return L("The discount went in without a plan first. For this boss, the plan is part of the job: switch on plan mode (/plan) and ask again.", "La remise est arrivée sans plan. Pour ce boss, le plan fait partie du travail : active le mode plan (/plan) et redemande.");
        const committed = newCommits(w, s);
        if (committed.length && !committed.some((x) => CONVENTIONAL.test(x.message)))
          return L(`“${committed.at(-1)!.message}” isn't a Conventional Commits message (type: description). Make a small follow-up change and commit it as feat: or fix:.`, `« ${committed.at(-1)!.message} » n'est pas un message Conventional Commits (type: description). Fais un petit changement de suivi et commite-le en feat: ou fix:.`);
        if (c.fileHas(w, "src/cart.ts", /applyDiscount/) && !/applyDiscount/.test(w.git.head["src/cart.ts"] ?? "")) return L("Feature done. Read the diff (!git diff in a session), then commit with a conventional message.", "Fonctionnalité terminée. Lis le diff (!git diff dans une session), puis commite avec un message conventionnel.");
        return null;
      },
    },
    {
      kind: "experiment",
      title: L("Admire your work", "Admire ton travail"),
      body: L("Look at the history you built, or ask a second agent for a review before your next push.", "Regarde l'historique que tu as construit, ou demande une relecture à un second agent avant ton prochain push."),
      ideas: ["git log", 'claude -p "Review the code for bugs"', "cat CLAUDE.md"],
    },
    { kind: "celebrate" },
  ],
};

export const lessons: LessonDef[] = [agentCommits, capstone];

export const solutions: Record<string, Solution> = {
  "agent-commits": [{ "CLAUDE.md": COMMIT_RULES }, `claude -p "${P_DISCOUNT}"`, `claude -p "${VAGUE_COMMIT}"`],
  capstone: ["claude", "/init", "/plan", P_DISCOUNT, "yes", "!git diff", GOOD_COMMIT, "yes"],
};

export const stories: Record<string, StoryDef> = {
  "commit-messages": {
    intro: L("The fix works. Now it needs a commit, and the agent can write the message for you.", "La correction marche. Maintenant il faut un commit, et l'agent peut écrire le message pour toi."),
    steps: [
      {
        name: L("A vague request", "Une demande vague"),
        line: `> ${VAGUE_COMMIT}`,
        note: L("The agent runs git status and git diff, then commits. But you didn't say how to write the message.", "L'agent lance git status et git diff, puis commite. Mais tu n'as pas dit comment écrire le message."),
        tone: "agent",
      },
      {
        name: L("A useless message", "Un message inutile"),
        line: "[main 4f2a9c1] Update files",
        note: L("True, and useless. In six months, git log is a wall of “Update files” and nobody knows what changed or why.", "Vrai, et inutile. Dans six mois, git log est un mur de « Update files » et personne ne sait ce qui a changé ni pourquoi."),
        tone: "bad",
      },
      {
        name: L("Name the format", "Nomme le format"),
        line: `> ${GOOD_COMMIT}`,
        note: L("Conventional Commits is a widely used format: a type (feat, fix, docs, test…), a colon, then what changed.", "Conventional Commits est un format très répandu : un type (feat, fix, docs, test…), deux-points, puis ce qui a changé."),
        tone: "agent",
      },
      {
        name: L("A message that explains", "Un message qui explique"),
        line: "[main 9be03d2] fix: count item quantities in total()",
        note: L("Anyone can scan the history now, and tools can even build a changelog from it.", "Tout le monde peut parcourir l'historique, et des outils peuvent même en tirer un changelog."),
        tone: "ok",
      },
      {
        name: L("Say it once", "Dis-le une fois"),
        line: "- Use Conventional Commits: `feat:`, `fix:`, `docs:`, `test:`.",
        note: L("Put the convention in CLAUDE.md and every commit follows it, without asking each time.", "Mets la convention dans CLAUDE.md et chaque commit la suit, sans avoir à le redemander."),
        tone: "tool",
      },
      {
        name: L("Small commits", "Petits commits"),
        line: "one change → one commit",
        note: L("A commit that does one thing is easy to review and easy to undo. Commit after each change, not at the end of the day.", "Un commit qui fait une seule chose se relit et s'annule facilement. Commite après chaque changement, pas en fin de journée."),
        tone: "muted",
      },
    ],
  },
  "ship-routine": {
    intro: L("A real feature, start to finish: a discount for the Tiny Shop. Here's the routine people who ship with agents follow.", "Une vraie fonctionnalité, du début à la fin : une remise pour la Tiny Shop. Voici la routine de ceux qui livrent avec des agents."),
    steps: [
      {
        name: L("Rules", "Règles"),
        line: "/init",
        note: L("CLAUDE.md tells every session how to install, test and commit. Set it up once, review it, keep it short.", "CLAUDE.md dit à chaque session comment installer, tester et commiter. Mets-le en place une fois, relis-le, garde-le court."),
        tone: "tool",
      },
      {
        name: L("Plan", "Plan"),
        line: "claude --permission-mode plan",
        note: L("For a feature, ask for a plan first. Fixing a plan costs one sentence; fixing code costs a review.", "Pour une fonctionnalité, demande d'abord un plan. Corriger un plan coûte une phrase ; corriger du code coûte une relecture."),
        tone: "agent",
      },
      {
        name: L("Approve", "Valider"),
        line: "> yes",
        note: L("When the plan looks right, approve it. The agent acts, then runs the tests.", "Quand le plan te va, valide-le. L'agent agit, puis lance les tests."),
        tone: "ok",
      },
      {
        name: L("Review", "Relire"),
        line: "git diff",
        note: L("Read what changed. Is the test real? Did anything else move? This is where shortcuts get caught.", "Lis ce qui a changé. Le test est-il réel ? Autre chose a-t-il bougé ? C'est là qu'on attrape les raccourcis."),
        tone: "warn",
      },
      {
        name: L("Green", "Vert"),
        line: "✓ all tests passed",
        note: L("Never commit red. If something fails, paste the error back to the agent.", "Ne commite jamais du rouge. Si quelque chose échoue, recolle l'erreur à l'agent."),
        tone: "ok",
      },
      {
        name: L("Commit", "Commit"),
        line: "feat: add applyDiscount()",
        note: L("One small commit, one clear message. Shipped.", "Un petit commit, un message clair. Livré."),
        tone: "ok",
      },
    ],
  },
};
