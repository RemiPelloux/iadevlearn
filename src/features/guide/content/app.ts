import type { DocPage } from "../types";

export const APP_PAGES: DocPage[] = [
  {
    slug: "start",
    section: "app",
    icon: "Rocket",
    title: { en: "Start here", fr: "Par où commencer" },
    lead: {
      en: "IA Dev Learn teaches you to work with coding agents by using them, in a terminal that runs entirely in your browser.",
      fr: "IA Dev Learn t'apprend à travailler avec des agents de code en t'en servant, dans un terminal qui tourne entièrement dans ton navigateur.",
    },
    body: {
      en: `## Your first five minutes

1. On the home page, press [[Start learning]].
2. The welcome tour asks for your language, a name for the terminal prompt, how much you already know and a daily goal. Each screen has [[Next]], and [[Skip]] if you are in a hurry.
3. Press [[Start my first lesson]]. You land in "What is a coding agent?", which takes about three minutes.

Nothing to install, no account, no API key. The agents you meet here are simulated: they behave like Claude Code, Codex, Gemini CLI and Antigravity, but they never call a real AI model, and nothing you type leaves your browser.

## Why a simulator

A real agent gives a slightly different answer every time, which makes it hard to see why a prompt worked. The simulator is deterministic. The same prompt in the same project always gives the same result, and the screen shows you what the agent read, what it guessed and what it changed. Once that is clear, the real tools stop feeling like magic.

When you want the real thing, the [install guide](/setup) has copy-paste commands for macOS, Linux and Windows.

## What's where

| Page | What you do there |
|---|---|
| Learn | Your path through the chapters, your daily goal, quests and badges |
| Playground | A free project where you can try anything, with no lesson |
| Reference | Every command and file, each with a before and after example |
| Docs | These pages: how the app works, concept guides and cheat sheets |
| Install | Commands to install the real agents on your computer |
| Profile | Name, settings, achievements, profiles and your data |

On a phone, the same pages sit in the bar at the bottom of the screen.

## Where to go next

- [How a lesson works](/docs/lessons)
- [The terminal](/docs/terminal)
- [Reading the Agent view](/docs/agent-view)`,
      fr: `## Tes cinq premières minutes

1. Sur la page d'accueil, appuie sur [[Commencer]].
2. La visite de bienvenue te demande ta langue, un nom pour l'invite du terminal, ton niveau et un objectif quotidien. Chaque écran a [[Suivant]], et [[Passer]] si tu es pressé.
3. Appuie sur [[Commencer ma première leçon]]. Tu arrives dans « C'est quoi, un agent de code ? », qui prend environ trois minutes.

Rien à installer, pas de compte, pas de clé d'API. Les agents que tu rencontres ici sont simulés : ils se comportent comme Claude Code, Codex, Gemini CLI et Antigravity, mais n'appellent jamais de vrai modèle d'IA, et rien de ce que tu tapes ne quitte ton navigateur.

## Pourquoi un simulateur

Un vrai agent donne une réponse un peu différente à chaque fois, ce qui empêche de comprendre pourquoi un prompt a marché. Le simulateur est déterministe. Le même prompt dans le même projet donne toujours le même résultat, et l'écran te montre ce que l'agent a lu, ce qu'il a deviné et ce qu'il a changé. Une fois que c'est clair, les vrais outils n'ont plus rien de magique.

Quand tu veux passer aux vrais outils, le [guide d'installation](/setup) donne les commandes à copier pour macOS, Linux et Windows.

## Ce qu'il y a où

| Page | Ce que tu y fais |
|---|---|
| Apprendre | Ton parcours dans les chapitres, ton objectif du jour, les quêtes et les badges |
| Bac à sable | Un projet libre pour tout essayer, sans leçon |
| Référence | Chaque commande et chaque fichier, avec un exemple avant et après |
| Docs | Ces pages : le fonctionnement de l'appli, les guides et les antisèches |
| Installer | Les commandes pour installer les vrais agents sur ton ordinateur |
| Profil | Nom, réglages, succès, profils et tes données |

Sur téléphone, les mêmes pages sont dans la barre en bas de l'écran.

## Et ensuite

- [Comment marche une leçon](/docs/lessons)
- [Le terminal](/docs/terminal)
- [Lire la vue Agent](/docs/agent-view)`,
    },
  },
  {
    slug: "lessons",
    section: "app",
    icon: "GraduationCap",
    title: { en: "How a lesson works", fr: "Comment marche une leçon" },
    lead: {
      en: "Every lesson walks the same steps, so after the first one you always know where you are.",
      fr: "Chaque leçon suit les mêmes étapes : après la première, tu sais toujours où tu en es.",
    },
    body: {
      en: `## The steps

The bar at the top of a lesson lists its steps. A tick means done, the filled dot is where you are, and you can press any finished step to go back to it.

| Step | What happens |
|---|---|
| Discover | A short scene explains one idea. Press the button in the scene to play it, then [[Continue]]. |
| Watch | Real commands run one at a time. Press [[Next command]] to step through, [[Rewind]] to go back, then [[Your turn]]. |
| Try | One small task in the workspace. The step turns green when it's done and [[Continue]] lights up. |
| Experiment | Free play with a few ideas to click. Press [[I'm done exploring]] when you are. |
| Challenge | A goal with a checklist. Each line ticks itself as soon as the project reaches that state. |
| Celebrate | XP, stars, badges, and a link to the next lesson. |

## The highlighted control

When a step is waiting for you, the control you need next pulses softly: [[Run it for me]] during a Try step, [[Continue]] once it's done, [[Complete lesson]] when every objective is ticked. If you set motion to Reduced in your profile, the pulse becomes a steady outline.

## Checks look at the result, not your typing

A challenge never compares what you typed with an expected answer. It looks at the project: did the agent add the discount, did it run the tests, does CLAUDE.md say to use pnpm. Any way you get there counts.

## Hints

Under a challenge, [[Need a hint?]] opens three levels in turn. Idea explains the concept, Command names what to use, and Walkthrough gives the exact input. Hints never cost XP. Finishing without opening the Walkthrough earns a star.

## Stars

| Star | How to earn it |
|---|---|
| First | Finish the lesson |
| Second | Don't open the Walkthrough hint |
| Third | Make two mistakes or fewer (a command that fails counts as one) |

A three-star first run also pays a small XP bonus.

## Leaving and coming back

Lessons save themselves after every command and every edit. Close the tab, come back tomorrow, and the project, the terminal history and the step are where you left them. [[Restart]] in the top bar throws that away and starts the lesson fresh.`,
      fr: `## Les étapes

La barre en haut d'une leçon liste ses étapes. Une coche veut dire terminé, le point plein montre où tu es, et tu peux appuyer sur n'importe quelle étape terminée pour y revenir.

| Étape | Ce qui se passe |
|---|---|
| Découvrir | Une courte scène explique une idée. Appuie sur le bouton de la scène pour la jouer, puis sur [[Continuer]]. |
| Observer | De vraies commandes s'exécutent une par une. Appuie sur [[Commande suivante]] pour avancer, [[Revenir]] pour reculer, puis [[À toi]]. |
| Essayer | Une petite tâche dans l'espace de travail. L'étape passe au vert quand c'est fait et [[Continuer]] s'allume. |
| Expérimenter | Du jeu libre avec quelques idées à cliquer. Appuie sur [[J'ai fini d'explorer]] quand tu veux. |
| Défi | Un objectif avec une liste. Chaque ligne se coche toute seule dès que le projet atteint cet état. |
| Bravo | XP, étoiles, badges, et un lien vers la leçon suivante. |

## Le contrôle mis en évidence

Quand une étape t'attend, le contrôle dont tu as besoin pulse doucement : [[Lance-la pour moi]] pendant une étape Essayer, [[Continuer]] une fois qu'elle est faite, [[Terminer la leçon]] quand tous les objectifs sont cochés. Si tu règles les animations sur Réduites dans ton profil, la pulsation devient un contour fixe.

## Les vérifications regardent le résultat, pas ta frappe

Un défi ne compare jamais ce que tu as tapé à une réponse attendue. Il regarde le projet : l'agent a-t-il ajouté la remise, a-t-il lancé les tests, est-ce que CLAUDE.md dit d'utiliser pnpm. Tous les chemins comptent.

## Les indices

Sous un défi, [[Besoin d'un indice ?]] ouvre trois niveaux l'un après l'autre. Idée explique le concept, Commande dit quoi utiliser, et Solution donne la saisie exacte. Les indices ne coûtent jamais d'XP. Finir sans ouvrir la Solution rapporte une étoile.

## Les étoiles

| Étoile | Comment l'obtenir |
|---|---|
| Première | Terminer la leçon |
| Deuxième | Ne pas ouvrir l'indice Solution |
| Troisième | Faire deux erreurs ou moins (une commande qui échoue compte pour une) |

Un premier passage à trois étoiles rapporte aussi un petit bonus d'XP.

## Partir et revenir

Les leçons s'enregistrent après chaque commande et chaque modification. Ferme l'onglet, reviens demain : le projet, l'historique du terminal et l'étape sont là où tu les as laissés. [[Recommencer]] dans la barre du haut efface tout ça et relance la leçon.`,
    },
  },
  {
    slug: "terminal",
    section: "app",
    icon: "SquareTerminal",
    title: { en: "The terminal", fr: "Le terminal" },
    lead: {
      en: "One terminal, two kinds of conversation: with the shell, and with an agent once you start one.",
      fr: "Un seul terminal, deux sortes de conversation : avec le shell, et avec un agent une fois que tu en lances un.",
    },
    body: {
      en: `## Shell or agent: read the prompt

The text before your cursor tells you who is listening.

| You see | You're talking to | Example input |
|---|---|---|
| \`camille:~/project (main) $\` | The shell | \`ls\`, \`cat CLAUDE.md\`, \`git status\`, \`orca worktree ps\` |
| \`claude >\` | Claude Code | \`Fix the total bug in @src/cart.ts\` |
| \`codex ›\` | Codex | \`Update the README\` |
| \`gemini >\` | Gemini CLI | \`Explain this project\` |
| \`antigravity ▸\` | Antigravity | \`/release\` |

Type \`claude\`, \`codex\`, \`gemini\` or \`antigravity\` to start a session, and \`/exit\` to leave it. \`agy\`, the real Antigravity CLI command, opens Antigravity too. Inside Claude Code or Gemini CLI, start a line with \`!\` to run one shell command without leaving, for example \`!rm package-lock.json\`.

## Assisted and Real

The switch in the terminal's title bar has two modes. Your choice is remembered.

In [[Assisted]] mode, a lesson step shows its command under the output with two buttons. [[Run]] runs it as is. [[Insert]] puts it in the input so you can change it first. A line below explains each word of the command.

In [[Real]] mode there is no suggestion. The input line pulses when a step is waiting for you, and the guide still has [[Show me what to type]] if you get stuck.

## Keys that save time

| Key | What it does |
|---|---|
| Tab | Completes the command, file name or slash command |
| Right arrow | Accepts the grey ghost suggestion |
| Up and Down | Walks through your previous inputs |
| Ctrl+L | Clears the terminal |
| Ctrl+C | Empties the input line |
| Esc | Closes the completion list |

Type \`@\` followed by a few letters inside a session to complete a file name, and \`/\` to list that tool's slash commands.

## When something fails

Errors come in red, like a real terminal. Most of them are followed by a yellow box headed "In plain words" that says what went wrong and how to fix it. The commands \`help\` and \`claude --help\` (or \`codex --help\`, and so on) list what this sandbox understands.

## What's simulated

Files, Git, the four agents and Orca are all simulated inside the page. Commands that exist in the real tools but aren't modelled here say so plainly rather than pretending, for example \`/hooks\` in Claude Code.`,
      fr: `## Shell ou agent : lis l'invite

Le texte avant ton curseur te dit qui écoute.

| Tu vois | Tu parles à | Exemple de saisie |
|---|---|---|
| \`camille:~/project (main) $\` | Le shell | \`ls\`, \`cat CLAUDE.md\`, \`git status\`, \`orca worktree ps\` |
| \`claude >\` | Claude Code | \`Fix the total bug in @src/cart.ts\` |
| \`codex ›\` | Codex | \`Update the README\` |
| \`gemini >\` | Gemini CLI | \`Explique ce projet\` |
| \`antigravity ▸\` | Antigravity | \`/release\` |

Tape \`claude\`, \`codex\`, \`gemini\` ou \`antigravity\` pour ouvrir une session, et \`/exit\` pour en sortir. \`agy\`, la vraie commande d'Antigravity CLI, ouvre aussi Antigravity. Dans Claude Code ou Gemini CLI, commence une ligne par \`!\` pour lancer une commande shell sans sortir, par exemple \`!rm package-lock.json\`.

## Assisté et Réel

L'interrupteur dans la barre de titre du terminal a deux modes. Ton choix est retenu.

En mode [[Assisté]], une étape de leçon affiche sa commande sous la sortie avec deux boutons. [[Exécuter]] la lance telle quelle. [[Insérer]] la met dans la saisie pour que tu la modifies d'abord. Une ligne en dessous explique chaque mot de la commande.

En mode [[Réel]], pas de suggestion. La ligne de saisie pulse quand une étape t'attend, et le guide garde [[Montre-moi quoi taper]] si tu bloques.

## Les touches qui font gagner du temps

| Touche | Ce qu'elle fait |
|---|---|
| Tab | Complète la commande, le nom de fichier ou la commande slash |
| Flèche droite | Accepte la suggestion grisée |
| Haut et Bas | Parcourt tes saisies précédentes |
| Ctrl+L | Efface le terminal |
| Ctrl+C | Vide la ligne de saisie |
| Échap | Ferme la liste de complétion |

Dans une session, tape \`@\` suivi de quelques lettres pour compléter un nom de fichier, et \`/\` pour lister les commandes slash de l'outil.

## Quand quelque chose échoue

Les erreurs s'affichent en rouge, comme dans un vrai terminal. La plupart sont suivies d'un encadré jaune « En clair » qui dit ce qui ne va pas et comment corriger. Les commandes \`help\` et \`claude --help\` (ou \`codex --help\`, etc.) listent ce que ce bac à sable comprend.

## Ce qui est simulé

Les fichiers, Git, les quatre agents et Orca sont simulés dans la page. Les commandes qui existent dans les vrais outils mais ne sont pas modélisées ici le disent franchement au lieu de faire semblant, par exemple \`/hooks\` dans Claude Code.`,
    },
  },
  {
    slug: "agent-view",
    section: "app",
    icon: "Bot",
    title: { en: "Reading the Agent view", fr: "Lire la vue Agent" },
    lead: {
      en: "The panel above the terminal shows what the agent saw, how far it got and how good your prompt was.",
      fr: "Le panneau au-dessus du terminal montre ce que l'agent a vu, jusqu'où il est allé et ce que valait ton prompt.",
    },
    body: {
      en: `## Context window

The coloured bar is everything the agent had in mind for its last answer, in tokens. One colour per kind of thing:

| Colour | Item | Where it comes from |
|---|---|---|
| Grey | System prompt | The tool's own instructions. You can't change it. |
| Orange | Rules | CLAUDE.md, AGENTS.md, GEMINI.md or .agents/rules |
| Blue | Skill index | One line per installed skill: name and description |
| Teal | Skill | A whole SKILL.md, loaded because your request matched it |
| Purple | Workflow | An Antigravity workflow you ran with a slash command |
| Green | File | A file the agent read. "(search)" means it had to look for it. |
| Yellow | MCP | The tool list of an MCP server you added |
| Violet | Your prompt | What you typed |

Before you send anything, the panel shows what a tool loads at startup. Use the [[Claude Code]], [[Codex]], [[Gemini CLI]] and [[Antigravity]] buttons to compare them. It's the quickest way to check that a rules file is in the right place.

Real tools hold around 200,000 tokens. The simulator's numbers are small on purpose, so differences are easy to see.

## Agent loop

Five dots: Read, Plan, Act, Verify, Report. A lit dot is a phase the agent went through. Verify stays grey when nobody asked for tests, which is usually the first thing to fix. The badge on the right gives the outcome:

| Badge | Meaning |
|---|---|
| done | It did the task without guessing |
| guessed | It did something, but filled gaps on its own |
| needs details | The request was too vague to act on |
| answered | It answered a question and changed nothing |
| plan proposed | Plan mode: it's waiting for your yes |
| blocked | A sandbox or setting stopped it |

## Prompt meter

Six chips grade your prompt: Goal, Context, Constraints, Verify, Details and Done when. A ticked chip was in your prompt. A yellow chip is something the agent had to guess. The score goes from 0/6 (vague) to 6/6 (sharp). Rules and skills can fill a gap too, which is why a three-word prompt sometimes gets a perfect result.

## The Run tab

The [[Run]] tab beside [[Files]] tells the story of one prompt: what was guessed, which rules were read and applied, which commands ran, which files changed. When you've sent several prompts, the numbered buttons at the top switch between them. Press a file name to open it in the editor.

## Orca lanes

In the Orca lessons and the Playground, a lane appears for each worktree, with its agent, status and comment. A merge icon shows when its branch is back in main.`,
      fr: `## Fenêtre de contexte

La barre colorée représente tout ce que l'agent avait en tête pour sa dernière réponse, en tokens. Une couleur par type d'élément :

| Couleur | Élément | D'où il vient |
|---|---|---|
| Gris | Prompt système | Les instructions de l'outil lui-même. Tu ne peux pas le changer. |
| Orange | Règles | CLAUDE.md, AGENTS.md, GEMINI.md ou .agents/rules |
| Bleu | Index des skills | Une ligne par skill installé : nom et description |
| Sarcelle | Skill | Un SKILL.md complet, chargé parce que ta demande correspondait |
| Violet foncé | Workflow | Un workflow Antigravity lancé avec une commande slash |
| Vert | Fichier | Un fichier lu par l'agent. « (search) » veut dire qu'il a dû le chercher. |
| Jaune | MCP | La liste d'outils d'un serveur MCP que tu as ajouté |
| Violet | Ton prompt | Ce que tu as tapé |

Avant que tu envoies quoi que ce soit, le panneau montre ce qu'un outil charge au démarrage. Utilise les boutons [[Claude Code]], [[Codex]], [[Gemini CLI]] et [[Antigravity]] pour les comparer. C'est le moyen le plus rapide de vérifier qu'un fichier de règles est au bon endroit.

Les vrais outils tiennent environ 200 000 tokens. Les chiffres du simulateur sont petits exprès, pour que les différences sautent aux yeux.

## Boucle de l'agent

Cinq points : Lire, Planifier, Agir, Vérifier, Rendre compte. Un point allumé est une phase par laquelle l'agent est passé. Vérifier reste gris quand personne n'a demandé de tests, et c'est souvent la première chose à corriger. Le badge à droite donne le résultat :

| Badge | Sens |
|---|---|
| réussi | Il a fait la tâche sans rien deviner |
| deviné | Il a fait quelque chose, mais a comblé des trous tout seul |
| manque de détails | La demande était trop floue pour agir |
| répondu | Il a répondu à une question sans rien changer |
| plan proposé | Mode plan : il attend ton oui |
| bloqué | Une sandbox ou un réglage l'a arrêté |

## Note du prompt

Six pastilles notent ton prompt : Objectif, Contexte, Contraintes, Vérification, Précision et Critère de fin. Une pastille cochée était dans ton prompt. Une pastille jaune est quelque chose que l'agent a dû deviner. La note va de 0/6 (flou) à 6/6 (précis). Les règles et les skills peuvent aussi combler un manque, c'est pour ça qu'un prompt de trois mots donne parfois un résultat parfait.

## L'onglet Exécution

L'onglet [[Exécution]] à côté de [[Fichiers]] raconte un prompt : ce qui a été deviné, quelles règles ont été lues et appliquées, quelles commandes ont tourné, quels fichiers ont changé. Quand tu as envoyé plusieurs prompts, les boutons numérotés en haut passent de l'un à l'autre. Appuie sur un nom de fichier pour l'ouvrir dans l'éditeur.

## Les couloirs Orca

Dans les leçons Orca et le bac à sable, un couloir apparaît pour chaque worktree, avec son agent, son statut et son commentaire. Une icône de fusion indique que sa branche est revenue dans main.`,
    },
  },
  {
    slug: "files",
    section: "app",
    icon: "Files",
    title: { en: "Files and the editor", fr: "Les fichiers et l'éditeur" },
    lead: {
      en: "Rules, skills and settings are plain text files. The editor checks them as you type.",
      fr: "Règles, skills et réglages sont de simples fichiers texte. L'éditeur les vérifie pendant que tu tapes.",
    },
    body: {
      en: `## The file list

The [[Files]] tab lists the project, then your home folder (\`~\`) below it. Icons tell you what a file is for:

| Icon colour | Kind of file |
|---|---|
| Orange book | Rules, loaded at the start of every session |
| Teal sparkle | A skill, loaded only when relevant |
| Purple flow | An Antigravity workflow |
| Yellow gear | A tool's settings, like \`~/.codex/config.toml\` |

A green **N** means the file is new since the last commit, a yellow **M** that it was modified. Hover a row to see [[Rename]] and [[Delete]]. [[New file]] accepts a full path such as \`.claude/skills/demo/SKILL.md\`: folders appear on their own. Click a folder to fold or unfold it; hover it to add a file inside or delete the whole folder.

## Editing

Press a file to open it. Changes save as you type. [[Edit]] and [[Changes]] at the top switch between the text and a diff against the last commit.

When you open a rules file or a SKILL.md, a strip under the file name tells you which agents load it from where it sits, and lists what to fix: a vague rule, a contradiction, a missing "Use when..." in a skill description, no steps. It turns green when the file is in good shape.

## From the terminal

\`edit CLAUDE.md\` opens a file in the editor. \`cat\`, \`echo "…" > file\`, \`printf\`, \`cp\`, \`mv\` and \`rm\` work as you'd expect. \`tree\` prints the whole project, and \`tree ~\` your home folder.`,
      fr: `## La liste des fichiers

L'onglet [[Fichiers]] liste le projet, puis ton dossier perso (\`~\`) en dessous. Les icônes disent à quoi sert un fichier :

| Couleur de l'icône | Type de fichier |
|---|---|
| Livre orange | Règles, chargées au début de chaque session |
| Étincelle sarcelle | Un skill, chargé seulement quand c'est utile |
| Flux violet | Un workflow Antigravity |
| Engrenage jaune | Les réglages d'un outil, comme \`~/.codex/config.toml\` |

Un **N** vert veut dire que le fichier est nouveau depuis le dernier commit, un **M** jaune qu'il a été modifié. Survole une ligne pour voir [[Renommer]] et [[Supprimer]]. [[Nouveau fichier]] accepte un chemin complet comme \`.claude/skills/demo/SKILL.md\` : les dossiers apparaissent tout seuls. Clique sur un dossier pour le replier ou le déplier ; survole-le pour y ajouter un fichier ou supprimer tout le dossier.

## Modifier

Appuie sur un fichier pour l'ouvrir. Les changements s'enregistrent pendant que tu tapes. [[Modifier]] et [[Changements]] en haut basculent entre le texte et un diff par rapport au dernier commit.

Quand tu ouvres un fichier de règles ou un SKILL.md, une bande sous le nom du fichier indique quels agents le chargent à cet endroit, et liste ce qu'il faut corriger : une règle vague, une contradiction, un « Use when... » manquant dans la description d'un skill, pas d'étapes. Elle passe au vert quand le fichier est en bon état.

## Depuis le terminal

\`edit CLAUDE.md\` ouvre un fichier dans l'éditeur. \`cat\`, \`echo "…" > fichier\`, \`printf\`, \`cp\`, \`mv\` et \`rm\` marchent comme prévu. \`tree\` affiche tout le projet, et \`tree ~\` ton dossier perso.`,
    },
  },
  {
    slug: "playground",
    section: "app",
    icon: "FlaskConical",
    title: { en: "The Playground", fr: "Le bac à sable" },
    lead: {
      en: "The same workspace as the lessons, with no goal and no checks.",
      fr: "Le même espace de travail que les leçons, sans objectif ni vérification.",
    },
    body: {
      en: `## Pick a starting project

The menu at the top left loads one of five projects. Each one starts the agents in a different situation:

| Project | Good for |
|---|---|
| Tiny Shop | Prompting from scratch: no rules, no skills |
| Shared rulebook | Watching four agents follow one AGENTS.md |
| With skills | Triggering a changelog skill and running \`/release\` in Antigravity |
| Orca team | Reviewing and merging two agents that already worked in parallel |
| Locked-down Codex | Fixing a read-only sandbox in \`~/.codex/config.toml\` |

Picking a project replaces the current one. [[Reset sandbox]] reloads the one you're on.

## Undo anything

The simulator remembers every state the project went through. [[Undo]] and [[Redo]] step through them, or use Ctrl+Alt+Z and Ctrl+Alt+Shift+Z. [[Time travel]] lists every step so you can jump straight back. Real agents have no such button, so in real projects, commit before you ask for a big change.

## Saving and sharing

The Playground saves itself in this browser after each command; the toolbar says "Saved locally". [[Copy link]] copies a link that rebuilds this exact project for whoever opens it, without needing your progress. [[Full-screen view]] hides the terminal and gives the Agent view the whole window.`,
      fr: `## Choisis un projet de départ

Le menu en haut à gauche charge l'un des cinq projets. Chacun met les agents dans une situation différente :

| Projet | Idéal pour |
|---|---|
| Tiny Shop | Prompter de zéro : ni règles ni skills |
| Règlement partagé | Voir quatre agents suivre un seul AGENTS.md |
| Avec des skills | Déclencher un skill changelog et lancer \`/release\` dans Antigravity |
| Équipe Orca | Relire et fusionner deux agents qui ont déjà travaillé en parallèle |
| Codex verrouillé | Réparer une sandbox en lecture seule dans \`~/.codex/config.toml\` |

Choisir un projet remplace le projet actuel. [[Réinitialiser]] recharge celui où tu es.

## Tout annuler

Le simulateur retient chaque état par lequel le projet est passé. [[Annuler]] et [[Rétablir]] les parcourent, ou Ctrl+Alt+Z et Ctrl+Alt+Maj+Z. [[Voyage dans le temps]] liste chaque étape pour y revenir directement. Les vrais agents n'ont pas ce bouton : dans un vrai projet, commite avant de demander un gros changement.

## Enregistrer et partager

Le bac à sable s'enregistre dans ce navigateur après chaque commande ; la barre d'outils affiche « Enregistré localement ». [[Copier le lien]] copie un lien qui reconstruit ce projet exact pour la personne qui l'ouvre, sans avoir besoin de ta progression. [[Vue plein écran]] masque le terminal et donne toute la fenêtre à la vue Agent.`,
    },
  },
  {
    slug: "profile-data",
    section: "app",
    icon: "HardDrive",
    title: { en: "Profiles, progress and your data", fr: "Profils, progression et tes données" },
    lead: {
      en: "Everything is stored in this browser. Several people can share it, and you can take your progress with you.",
      fr: "Tout est stocké dans ce navigateur. Plusieurs personnes peuvent le partager, et tu peux emporter ta progression.",
    },
    body: {
      en: `## Where your progress lives

IA Dev Learn has no server and no account. Your name, XP, lessons, badges, settings, unfinished lessons and Playground are saved in your browser's local storage. Nothing you type is sent anywhere.

That has two consequences. Your progress doesn't follow you to another browser or computer on its own, and clearing your browser data erases it. Backups solve both.

## Back up and restore

On your [profile](/profile#data), under Your data:

1. Press [[Download backup]]. You get one \`.json\` file with your progress and your Playground.
2. On the other computer or browser, open your profile and press [[Choose a backup file]].
3. Pick the file. It's added as a new profile next to any that exist, and the app switches to it. Nothing already there is overwritten.

## Several people, one browser

A family computer or a classroom laptop can hold one profile per learner, each with its own name, colour, XP, lessons and Playground.

- To add someone, press [[Add a profile]] on the profile page, type a name and press [[Create and start]]. The new learner starts with the welcome tour.
- To switch, open the menu under your avatar in the top bar (or the list on the profile page) and pick a name. The page reloads in a second.
- To remove a profile, press the bin icon next to it, then [[Delete]]. You can't delete the profile you're using: switch first.

## What's stored, exactly

The Your data section lists every key IA Dev Learn keeps in local storage, what it holds and how big it is. Two buttons sit at the bottom:

- [[Reset]] erases the active profile's XP, lessons, badges and Playground, and keeps its name and settings.
- [[Erase]] removes every profile and setting on this browser. Download a backup first if you might want it back.

Both ask for confirmation before doing anything.`,
      fr: `## Où vit ta progression

IA Dev Learn n'a ni serveur ni compte. Ton nom, ton XP, tes leçons, tes badges, tes réglages, tes leçons en cours et ton bac à sable sont enregistrés dans le stockage local de ton navigateur. Rien de ce que tu tapes n'est envoyé où que ce soit.

Deux conséquences. Ta progression ne te suit pas toute seule sur un autre navigateur ou ordinateur, et effacer les données du navigateur l'efface. Les sauvegardes règlent les deux.

## Sauvegarder et restaurer

Sur ton [profil](/profile#data), dans Tes données :

1. Appuie sur [[Télécharger une sauvegarde]]. Tu obtiens un fichier \`.json\` avec ta progression et ton bac à sable.
2. Sur l'autre ordinateur ou navigateur, ouvre ton profil et appuie sur [[Choisir un fichier de sauvegarde]].
3. Choisis le fichier. Il est ajouté comme nouveau profil à côté de ceux qui existent, et l'appli bascule dessus. Rien de ce qui est déjà là n'est écrasé.

## Plusieurs personnes, un navigateur

Un ordinateur familial ou un portable de classe peut garder un profil par personne, chacun avec son nom, sa couleur, son XP, ses leçons et son bac à sable.

- Pour ajouter quelqu'un, appuie sur [[Ajouter un profil]] sur la page de profil, tape un nom puis [[Créer et commencer]]. La nouvelle personne commence par la visite de bienvenue.
- Pour changer, ouvre le menu sous ton avatar dans la barre du haut (ou la liste de la page de profil) et choisis un nom. La page se recharge en une seconde.
- Pour retirer un profil, appuie sur la corbeille à côté, puis sur [[Supprimer]]. Tu ne peux pas supprimer le profil que tu utilises : change d'abord.

## Ce qui est stocké, exactement

La section Tes données liste chaque clé qu'IA Dev Learn garde dans le stockage local, ce qu'elle contient et sa taille. Deux boutons en bas :

- [[Réinitialiser]] efface l'XP, les leçons, les badges et le bac à sable du profil actif, en gardant son nom et ses réglages.
- [[Effacer]] supprime tous les profils et réglages de ce navigateur. Télécharge d'abord une sauvegarde si tu risques d'en avoir besoin.

Les deux demandent une confirmation avant d'agir.`,
    },
  },
  {
    slug: "settings",
    section: "app",
    icon: "Accessibility",
    title: { en: "Settings, keys and accessibility", fr: "Réglages, raccourcis et accessibilité" },
    lead: {
      en: "Language, theme, motion and terminal mode, all on your profile page.",
      fr: "Langue, thème, animations et mode du terminal, tout sur ta page de profil.",
    },
    body: {
      en: `## Preferences

| Setting | Options | Notes |
|---|---|---|
| Language | English, Français | Lessons, explanations and the agents' answers. Commands stay in English, like the real tools. Also in the top bar under EN / FR. |
| Daily goal | 30, 60 or 120 XP | Fills the ring next to your XP. Missing it costs nothing. |
| Theme | Paper, Dark | Also the moon and sun button in the top bar. The terminal stays dark in both. |
| Motion | System, Reduced, Full | Reduced removes animations and turns the pulsing highlight into a steady outline. |
| Terminal mode | Assisted, Real | See [the terminal](/docs/terminal). |
| Show streaks | On, Off | Turn streaks off if they feel like pressure. |

## Keyboard

Everything works without a mouse. Tab moves between controls, Enter and Space press them, and every focused control shows an outline. In the terminal, Tab completes, Up and Down walk history, Ctrl+L clears. In the Playground, Ctrl+Alt+Z undoes a step.

## Screen readers

Terminal output is announced as it arrives. Objectives say whether they're done. The Agent view's bars carry text labels with their token counts, and lesson steps are a labelled navigation list.`,
      fr: `## Préférences

| Réglage | Options | À savoir |
|---|---|---|
| Langue | English, Français | Leçons, explications et réponses des agents. Les commandes restent en anglais, comme dans les vrais outils. Aussi dans la barre du haut sous EN / FR. |
| Objectif du jour | 30, 60 ou 120 XP | Remplit l'anneau à côté de ton XP. Le rater ne coûte rien. |
| Thème | Papier, Sombre | Aussi le bouton lune et soleil dans la barre du haut. Le terminal reste sombre dans les deux. |
| Animations | Système, Réduites, Complètes | Réduites retire les animations et transforme la pulsation en contour fixe. |
| Mode du terminal | Assisté, Réel | Voir [le terminal](/docs/terminal). |
| Afficher les séries | Oui, Non | Désactive les séries si elles te mettent la pression. |

## Clavier

Tout marche sans souris. Tab passe d'un contrôle à l'autre, Entrée et Espace les activent, et chaque contrôle ciblé affiche un contour. Dans le terminal, Tab complète, Haut et Bas parcourent l'historique, Ctrl+L efface. Dans le bac à sable, Ctrl+Alt+Z annule une étape.

## Lecteurs d'écran

La sortie du terminal est annoncée au fur et à mesure. Les objectifs disent s'ils sont faits. Les barres de la vue Agent portent des libellés texte avec leur nombre de tokens, et les étapes d'une leçon forment une navigation étiquetée.`,
    },
  },
];
