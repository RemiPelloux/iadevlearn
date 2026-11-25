import { tx as L, type AgentRun } from "@/engine";
import * as c from "../checks";
import { CART_SCREENSHOT, FAILING_TOTAL_TEST, shop, TOTAL_ERROR } from "../scenario";
import type { LessonDef, Solution, StoryDef } from "../types";

const UI = { files: true, editor: true, run: true, orca: false };

// ───────────────────────────────────────────── Steering a conversation

const FIRST_DISCOUNT = "Add applyDiscount(totalCents, percent) to @src/cart.ts: 20 means 20% off, never below 0.";
const FOLLOW_TESTS = "Now add tests and run them";

const discountFirst = (r: AgentRun) => r.task === "discount" && !r.followUp && r.changed.includes("src/cart.ts");

export const iterate: LessonDef = {
  id: "iterate",
  chapterId: "prompting",
  title: L("Steer the conversation", "Guide la conversation"),
  tagline: L("Follow up, rewind, start fresh", "Relance, reviens en arrière, repars à zéro"),
  xp: 120,
  concepts: [L("follow-up", "relance"), L("/rewind", "/rewind"), L("/clear", "/clear")],
  commands: ["claude", "/rewind", "/clear"],
  ui: UI,
  setup: () => shop(),
  recap: [
    L("Inside a session the agent remembers the conversation, so a short follow-up like “Now add tests and run them” is enough.", "Dans une session, l'agent se souvient de la conversation : une relance courte comme « Now add tests and run them » suffit."),
    L("When a run goes the wrong way, /rewind puts the files back as they were before it. Then ask again, better.", "Quand une exécution part dans le mauvais sens, /rewind remet les fichiers comme avant. Ensuite, redemande, en mieux."),
    L("Starting something unrelated? /clear first, so old messages don't mix into the new task.", "Tu passes à autre chose ? /clear d'abord, pour que les anciens messages ne se mélangent pas à la nouvelle tâche."),
  ],
  steps: [
    {
      kind: "discover",
      title: L("A conversation, not a vending machine", "Une conversation, pas un distributeur"),
      body: [
        L("You don't have to get everything right in one prompt. In a session, the agent keeps what you said earlier, so you can add what you forgot in a few words.", "Pas besoin de tout réussir en un seul prompt. Dans une session, l'agent garde ce que tu as dit avant : tu peux ajouter ce que tu as oublié en quelques mots."),
        L("And when it heads the wrong way, you don't fix its mess by hand: you rewind and ask again. Press Next to follow one conversation.", "Et quand il part dans le mauvais sens, tu ne répares pas ses dégâts à la main : tu reviens en arrière et tu redemandes. Appuie sur Suivant pour suivre une conversation."),
      ],
      scene: "story:iterate",
    },
    {
      kind: "try",
      title: L("Open a session", "Ouvre une session"),
      body: L("Follow-ups only work inside a session: the agent needs the earlier messages. Start Claude Code.", "Les relances ne marchent que dans une session : l'agent a besoin des messages précédents. Lance Claude Code."),
      command: "claude",
      check: (w) => c.inSession(w, "claude"),
      success: L("You're in. Everything you type now goes into one conversation.", "Tu y es. Tout ce que tu tapes maintenant va dans une même conversation."),
    },
    {
      kind: "try",
      title: L("Forget something on purpose", "Oublie quelque chose exprès"),
      body: L("This prompt says what and where, but forgets the tests. Send it and read the yellow “Assumed” line.", "Ce prompt dit quoi et où, mais oublie les tests. Envoie-le et lis la ligne jaune « Supposé »."),
      command: "Fix the total bug in @src/cart.ts",
      check: (w, s) => c.someRun(w, s, (r) => r.task === "fix-total" && r.assumed.includes("verify")),
      success: L("Fixed, but with no test, so nothing proves it works. No need to retype the whole prompt: just add what's missing.", "C'est corrigé, mais sans test : rien ne prouve que ça marche. Pas besoin de tout retaper : ajoute juste ce qui manque."),
    },
    {
      kind: "try",
      title: L("Follow up in a few words", "Relance en quelques mots"),
      body: L("Short messages that start with “Now”, “Also” or “Actually” build on what you said before.", "Les messages courts qui commencent par « Now », « Also » ou « Actually » s'appuient sur ce que tu as dit avant."),
      command: "Now add a test and run the tests",
      check: (w, s) => c.someRun(w, s, (r) => !!r.followUp && r.task === "fix-total" && r.outcome === "done" && c.ranTests(r)),
      success: L("“Continuing from your earlier message”: the agent combined both messages, added a test and ran it. Eight words did the job.", "« Dans la suite de ton message précédent » : l'agent a combiné les deux messages, ajouté un test et l'a lancé. Huit mots ont suffi."),
    },
    {
      kind: "try",
      title: L("Change topic? Clear first", "Tu changes de sujet ? Efface d'abord"),
      body: L("The next task has nothing to do with the total. /clear forgets the conversation, so the old messages don't leak into the new task (and stop costing tokens).", "La prochaine tâche n'a rien à voir avec le total. /clear oublie la conversation : les anciens messages ne se glissent plus dans la nouvelle tâche (et ne coûtent plus de tokens)."),
      command: "/clear",
      check: (w, _s, ran) => ran.includes("/clear") && c.inSession(w, "claude") && !w.session?.history?.length,
      success: L("A clean slate. The files are still there, only the conversation is gone.", "Table rase. Les fichiers sont toujours là, seule la conversation a disparu."),
    },
    {
      kind: "try",
      title: L("A request that goes wrong", "Une demande qui tourne mal"),
      body: L("Send a lazy request on purpose, and look at what the agent creates in the Files panel.", "Envoie exprès une demande paresseuse, et regarde ce que l'agent crée dans le panneau Fichiers."),
      command: "add a discount",
      check: (w) => c.fileExists(w, "src/discount.js"),
      success: L("It guessed: a new JavaScript file, src/discount.js, with 10% hard-coded. Don't patch that by hand.", "Il a deviné : un nouveau fichier JavaScript, src/discount.js, avec 10 % codé en dur. Ne rafistole pas ça à la main."),
    },
    {
      kind: "try",
      title: L("Rewind", "Reviens en arrière"),
      body: L("/rewind undoes the files the agent's last run changed, and drops that message from the conversation. In the real Claude Code, pressing Esc twice opens the same thing.", "/rewind annule les fichiers modifiés par la dernière exécution de l'agent, et retire ce message de la conversation. Dans le vrai Claude Code, deux appuis sur Échap ouvrent la même chose."),
      command: "/rewind",
      check: (w, _s, ran) => ran.includes("/rewind") && !c.fileExists(w, "src/discount.js"),
      success: L("src/discount.js is gone, as if you never asked. Now you can ask properly.", "src/discount.js a disparu, comme si tu n'avais jamais demandé. Maintenant tu peux demander correctement."),
    },
    {
      kind: "challenge",
      title: L("Challenge: the discount, in two messages", "Défi : la remise, en deux messages"),
      body: L("Do the discount right in the same session. First a precise prompt that leaves out the tests, then a short follow-up that asks for them. Keep the project free of guessed files.", "Fais la remise correctement dans la même session. D'abord un prompt précis qui laisse de côté les tests, puis une relance courte qui les demande. Garde le projet sans fichier deviné."),
      objectives: [
        {
          id: "first",
          label: L("A precise first prompt adds applyDiscount to src/cart.ts, without tests yet", "Un premier prompt précis ajoute applyDiscount dans src/cart.ts, sans tests pour l'instant"),
          check: (w, s) => c.someRun(w, s, (r) => discountFirst(r) && !c.ranTests(r)),
          hints: [
            L("Say what to add, where (@src/cart.ts) and the rule for the numbers. Leave the tests for the next message.", "Dis quoi ajouter, où (@src/cart.ts) et la règle pour les nombres. Garde les tests pour le message suivant."),
            L("Name the function, the file and what 20 means. Don't mention tests.", "Nomme la fonction, le fichier et ce que veut dire 20. Ne parle pas de tests."),
            L(`Type: ${FIRST_DISCOUNT}`, `Tape : ${FIRST_DISCOUNT}`),
          ],
        },
        {
          id: "followup",
          label: L("A short follow-up adds the tests and runs them", "Une relance courte ajoute les tests et les lance"),
          check: (w, s) => c.someRun(w, s, (r) => r.task === "discount" && !!r.followUp && r.outcome === "done" && c.ranTests(r)),
          hints: [
            L("Right after the first prompt, in the same session, add only what's missing.", "Juste après le premier prompt, dans la même session, ajoute seulement ce qui manque."),
            L("Start with “Now” and keep it under 12 words.", "Commence par « Now » et reste sous 12 mots."),
            L(`Type: ${FOLLOW_TESTS}`, `Tape : ${FOLLOW_TESTS}`),
          ],
        },
        {
          id: "clean",
          label: L("No guessed src/discount.js left in the project", "Aucun src/discount.js deviné dans le projet"),
          check: (w) => !c.fileExists(w, "src/discount.js"),
          hints: [
            L("A guessed attempt should be undone, not patched.", "Une tentative devinée s'annule, elle ne se rafistole pas."),
            L("Right after the run that created it, rewind.", "Juste après l'exécution qui l'a créé, reviens en arrière."),
            L("Type: /rewind", "Tape : /rewind"),
          ],
        },
      ],
      feedback: (w, s) => {
        if (c.fileExists(w, "src/discount.js")) return L("A guessed src/discount.js is back. Type /rewind right after the run that made it.", "Un src/discount.js deviné est revenu. Tape /rewind juste après l'exécution qui l'a créé.");
        if (!c.inSession(w, "claude")) return L("Follow-ups only work inside a session. Start claude, then send your two messages.", "Les relances ne marchent que dans une session. Lance claude, puis envoie tes deux messages.");
        const first = c.someRun(w, s, (r) => discountFirst(r) && !c.ranTests(r));
        const follow = c.someRun(w, s, (r) => r.task === "discount" && !!r.followUp && r.outcome === "done" && c.ranTests(r));
        if (first && follow) return null;
        const r = c.lastRunOf(w, s);
        if (!r) return null;
        if (r.followUp && r.task !== "discount") return L("That follow-up got mixed with older messages. Type /clear, then send the discount prompt again.", "Cette relance s'est mélangée à d'anciens messages. Tape /clear, puis renvoie le prompt de la remise.");
        if (discountFirst(r) && c.ranTests(r)) return L("That first prompt already asked for tests. For this challenge, leave them out, then ask for them in a short follow-up.", "Ce premier prompt demandait déjà des tests. Pour ce défi, laisse-les de côté, puis demande-les dans une relance courte.");
        if (discountFirst(r)) return L("Good first message. Now a short follow-up for the tests.", "Bon premier message. Maintenant, une relance courte pour les tests.");
        if (r.task === "discount" && !r.followUp && !r.changed.includes("src/cart.ts")) return L("The agent didn't know where to put it. Point at @src/cart.ts.", "L'agent ne savait pas où le mettre. Indique @src/cart.ts.");
        return null;
      },
    },
    {
      kind: "experiment",
      title: L("Explore", "Explore"),
      body: L("See what the conversation costs, rewind the last change, or start over.", "Regarde ce que coûte la conversation, annule le dernier changement, ou repars de zéro."),
      ideas: ["/context", "/rewind", "/clear", "/exit"],
    },
    { kind: "celebrate" },
  ],
};

// ───────────────────────────────────────────── Evidence: errors and screenshots

const PASTE_ERROR = `The tests fail with this error: ${TOTAL_ERROR}. Fix the code, not the test.`;
const IMAGE_PROMPT = "Fix the bug shown in @screenshots/cart.png and run the tests";

const sawImage = (r: AgentRun) => r.context.some((x) => x.kind === "image" && x.source === "screenshots/cart.png");
const fixedFromImage = (r: AgentRun) => sawImage(r) && r.outcome === "done" && r.changed.includes("src/cart.ts") && r.failing === 0;

export const errorsAndScreenshots: LessonDef = {
  id: "errors-and-screenshots",
  chapterId: "prompting",
  title: L("Show the agent the evidence", "Montre les preuves à l'agent"),
  tagline: L("Paste the error, point at the screenshot", "Colle l'erreur, montre la capture d'écran"),
  xp: 130,
  concepts: [L("error messages", "messages d'erreur"), L("screenshots", "captures d'écran"), L("image tokens", "tokens d'image")],
  commands: ["pnpm test", "@screenshots/cart.png", "/context"],
  ui: UI,
  setup: () => shop({ "tests/cart.test.ts": FAILING_TOTAL_TEST, "screenshots/cart.png": CART_SCREENSHOT }),
  recap: [
    L("“It's broken” makes the agent ask questions or guess. A failing test's output answers them: which file, which test, what was expected, what came out.", "« C'est cassé » pousse l'agent à poser des questions ou à deviner. La sortie d'un test qui échoue y répond : quel fichier, quel test, ce qui était attendu, ce qui est sorti."),
    L("For visual bugs, a screenshot is strong context: point at it with @ (or paste it, in the real tools).", "Pour un bug visuel, une capture d'écran est un contexte solide : montre-la avec @ (ou colle-la, dans les vrais outils)."),
    L("Images are expensive: one costs as many tokens as a long file. A line of error text costs almost nothing, so prefer text when you have it.", "Les images coûtent cher : une seule pèse autant qu'un long fichier. Une ligne d'erreur ne coûte presque rien : préfère le texte quand tu l'as."),
  ],
  steps: [
    {
      kind: "discover",
      title: L("Don't describe the bug, show it", "Ne décris pas le bug, montre-le"),
      body: [
        L("When something breaks, you already hold the best context there is: the exact error message, or what the screen looks like.", "Quand quelque chose casse, tu as déjà le meilleur contexte qui soit : le message d'erreur exact, ou ce qu'affiche l'écran."),
        L("Press Next to see the same bug reported three ways.", "Appuie sur Suivant pour voir le même bug signalé de trois façons."),
      ],
      scene: "story:evidence",
    },
    {
      kind: "experiment",
      title: L("Look at the evidence yourself", "Regarde les preuves toi-même"),
      body: L("Run the tests: they fail, and the terminal shows it in red (that's expected here). Read the error line: it names the file, the test, and both numbers. Then look at the screenshot a customer sent. In this simulator an image is shown as a description of what it contains.", "Lance les tests : ils échouent, et le terminal l'affiche en rouge (c'est normal ici). Lis la ligne d'erreur : elle nomme le fichier, le test, et les deux nombres. Puis regarde la capture d'écran envoyée par un client. Dans ce simulateur, une image s'affiche comme une description de ce qu'elle contient."),
      ideas: ["pnpm test", "cat screenshots/cart.png", "cat tests/cart.test.ts"],
    },
    {
      kind: "try",
      title: L("Open a session", "Ouvre une session"),
      body: L("Start Claude Code. You'll try several reports in one session.", "Lance Claude Code. Tu vas essayer plusieurs signalements dans une même session."),
      command: "claude",
      check: (w) => c.inSession(w, "claude"),
      success: L("Ready. First, the report everyone sends.", "Prêt. D'abord, le signalement que tout le monde envoie."),
    },
    {
      kind: "try",
      title: L("“It's broken”", "« C'est cassé »"),
      body: L("Describe the problem the way most people do.", "Décris le problème comme la plupart des gens."),
      command: "The cart is broken, fix it",
      check: (w, s) => c.someRun(w, s, (r) => r.outcome === "clarify"),
      success: L("It can't act: which file, what should happen, how will we know? You have all three answers in the test output.", "Il ne peut rien faire : quel fichier, que doit-il se passer, comment savoir ? Tu as les trois réponses dans la sortie des tests."),
    },
    {
      kind: "try",
      title: L("Paste the error", "Colle l'erreur"),
      body: L("Copy the failing line from pnpm test into your prompt. Adding “not the test” stops the agent from cheating by changing the expected number.", "Copie la ligne en échec de pnpm test dans ton prompt. Ajouter « not the test » empêche l'agent de tricher en changeant le nombre attendu."),
      command: PASTE_ERROR,
      check: (w, s) => c.someRun(w, s, (r) => r.prompt.includes("expected 1200 to be 3600") && r.outcome === "done" && r.changed.includes("src/cart.ts") && r.failing === 0),
      success: L("One pasted line gave it the file, the test and the numbers: it went straight to total() and the tests are green. That line cost about 20 tokens.", "Une ligne collée lui a donné le fichier, le test et les nombres : il est allé droit à total() et les tests sont au vert. Cette ligne a coûté environ 20 tokens."),
    },
    {
      kind: "try",
      title: L("Put the bug back", "Remets le bug"),
      body: L("To try the other kind of evidence, undo that fix with /rewind.", "Pour essayer l'autre type de preuve, annule cette correction avec /rewind."),
      command: "/rewind",
      check: (w, _s, ran) => ran.includes("/rewind") && c.fileHas(w, "src/cart.ts", /sum \+ item\.price, 0/),
      success: L("The bug is back in src/cart.ts. This time you only have the customer's screenshot.", "Le bug est de retour dans src/cart.ts. Cette fois, tu n'as que la capture du client."),
    },
    {
      kind: "challenge",
      title: L("Challenge: fix it from the screenshot", "Défi : corrige à partir de la capture"),
      body: L("Get the agent to fix the total from screenshots/cart.png, with the tests run and green. Then check how much the picture weighed in the context window.", "Fais corriger le total par l'agent à partir de screenshots/cart.png, avec les tests lancés et au vert. Puis vérifie combien pesait l'image dans la fenêtre de contexte."),
      objectives: [
        {
          id: "image",
          label: L("The agent looked at the screenshot", "L'agent a regardé la capture d'écran"),
          check: (w, s) => c.someRun(w, s, sawImage),
          hints: [
            L("Point at the image the same way you point at a file.", "Montre l'image comme tu montres un fichier."),
            L("Use @screenshots/cart.png in your prompt.", "Utilise @screenshots/cart.png dans ton prompt."),
            L(`Type: ${IMAGE_PROMPT}`, `Tape : ${IMAGE_PROMPT}`),
          ],
        },
        {
          id: "fixed",
          label: L("From it, src/cart.ts is fixed and the tests pass", "À partir d'elle, src/cart.ts est corrigé et les tests passent"),
          check: (w, s) => c.someRun(w, s, fixedFromImage),
          hints: [
            L("A picture shows the symptom; the tests prove the fix.", "Une image montre le symptôme ; les tests prouvent la correction."),
            L("In the same prompt as the image, ask it to run the tests.", "Dans le même prompt que l'image, demande-lui de lancer les tests."),
            L(`Type: ${IMAGE_PROMPT}`, `Tape : ${IMAGE_PROMPT}`),
          ],
        },
        {
          id: "cost",
          label: L("/context shows what the image cost", "/context montre ce qu'a coûté l'image"),
          check: (w, s, ran) => ran.includes("/context") && c.someRun(w, s, sawImage),
          hints: [
            L("Every image goes into the context window, like a file.", "Chaque image entre dans la fenêtre de contexte, comme un fichier."),
            L("After the run, list what filled the context window.", "Après l'exécution, liste ce qui a rempli la fenêtre de contexte."),
            L("Type: /context", "Tape : /context"),
          ],
        },
      ],
      feedback: (w, s) => {
        if (c.someRun(w, s, fixedFromImage)) return null;
        const r = c.lastRunOf(w, s);
        if (!r) return null;
        if (!sawImage(r)) return L("The agent didn't see the picture. Point at it with @screenshots/cart.png.", "L'agent n'a pas vu l'image. Montre-la avec @screenshots/cart.png.");
        if (r.failing === undefined) return L("It saw the picture but didn't run the tests, so nothing proves the fix. Ask it to run them.", "Il a vu l'image mais n'a pas lancé les tests : rien ne prouve la correction. Demande-lui de les lancer.");
        return null;
      },
    },
    {
      kind: "experiment",
      title: L("Explore", "Explore"),
      body: L("Run the tests yourself from the session, or look at what changed.", "Lance les tests toi-même depuis la session, ou regarde ce qui a changé."),
      ideas: ["!pnpm test", "!git diff", "/exit"],
    },
    { kind: "celebrate" },
  ],
};

export const lessons: LessonDef[] = [iterate, errorsAndScreenshots];

export const solutions: Record<string, Solution> = {
  iterate: [FIRST_DISCOUNT, FOLLOW_TESTS],
  "errors-and-screenshots": [IMAGE_PROMPT, "/context"],
};

export const stories: Record<string, StoryDef> = {
  iterate: {
    intro: L("One session, a few messages. Watch how each one builds on the last.", "Une session, quelques messages. Regarde comment chacun s'appuie sur le précédent."),
    steps: [
      {
        name: L("A good first message", "Un bon premier message"),
        line: `> ${FIRST_DISCOUNT}`,
        note: L("What, where and the rule for the numbers. But nothing about tests.", "Quoi, où et la règle pour les nombres. Mais rien sur les tests."),
        tone: "agent",
      },
      {
        name: L("The gap shows", "Le manque se voit"),
        line: "Assumed (verification): Nobody asked me to test it, so I didn't add or run any test.",
        note: L("The agent tells you what it skipped. You don't need to start over.", "L'agent te dit ce qu'il a laissé de côté. Pas besoin de tout recommencer."),
        tone: "warn",
      },
      {
        name: L("A short follow-up", "Une relance courte"),
        line: `> ${FOLLOW_TESTS}`,
        note: L("Six words. The agent still has your first message, so “them” and “tests” make sense.", "Six mots. L'agent a encore ton premier message : « them » et « tests » ont du sens."),
        tone: "agent",
      },
      {
        name: L("It builds on what you said", "Il s'appuie sur ce que tu as dit"),
        line: "  ↳ continuing from your earlier message",
        note: L("Both messages are read together: the discount, now with tests, run and green.", "Les deux messages sont lus ensemble : la remise, maintenant avec des tests, lancés et au vert."),
        tone: "ok",
      },
      {
        name: L("Wrong turn? Rewind", "Mauvaise route ? Reviens en arrière"),
        line: "/rewind",
        note: L("Undoes the files the last run changed. Better than fixing a bad guess by hand.", "Annule les fichiers modifiés par la dernière exécution. Mieux que de réparer une mauvaise supposition à la main."),
        tone: "tool",
      },
      {
        name: L("New task? Clear", "Nouvelle tâche ? Efface"),
        line: "/clear",
        note: L("Forgets the conversation so old messages don't mix into the next task, and stop costing tokens.", "Oublie la conversation pour que les anciens messages ne se mêlent pas à la tâche suivante, et ne coûtent plus de tokens."),
        tone: "muted",
      },
    ],
  },
  evidence: {
    intro: L("A customer says the cart total is wrong. Here are three ways to tell the agent.", "Un client dit que le total du panier est faux. Voici trois façons de le dire à l'agent."),
    steps: [
      {
        name: L("The vague report", "Le signalement vague"),
        line: "> The cart is broken, fix it",
        note: L("Which file? What should happen? How will we know? The agent has to ask, or guess.", "Quel fichier ? Que doit-il se passer ? Comment le savoir ? L'agent doit demander, ou deviner."),
        tone: "bad",
      },
      {
        name: L("Run the tests", "Lance les tests"),
        line: "$ pnpm test",
        note: L("The test suite already knows what's wrong. Ask it first.", "Les tests savent déjà ce qui ne va pas. Demande-leur d'abord."),
        tone: "tool",
      },
      {
        name: L("The error says everything", "L'erreur dit tout"),
        line: TOTAL_ERROR,
        note: L("The file, the test, what was expected (3600) and what came out (1200). Paste it as is.", "Le fichier, le test, ce qui était attendu (3600) et ce qui est sorti (1200). Colle-la telle quelle."),
        tone: "bad",
      },
      {
        name: L("Or show the screen", "Ou montre l'écran"),
        line: "● Read(screenshots/cart.png)  (image)",
        note: L("For what you can see but can't copy (a layout, a wrong number on a page), a screenshot works. It costs about 1,600 tokens, against about 20 for the error line.", "Pour ce qui se voit mais ne se copie pas (une mise en page, un mauvais nombre sur une page), une capture marche. Elle coûte environ 1 600 tokens, contre une vingtaine pour la ligne d'erreur."),
        tone: "warn",
      },
      {
        name: L("Fixed and proven", "Corrigé et prouvé"),
        line: "  ⎿  ✓ 3 tests passed",
        note: L("Evidence in, a precise fix out. Ask for the tests to run, so the fix is proven, not just claimed.", "Des preuves en entrée, une correction précise en sortie. Demande à lancer les tests : la correction est prouvée, pas juste annoncée."),
        tone: "ok",
      },
    ],
  },
};
