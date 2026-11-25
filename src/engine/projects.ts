import { tx, type Txt } from "./context";
import type { FileMap, Locale, PromptCheck } from "./types";

/**
 * What the simulated agents know how to do in a project. Each task has a
 * "right" version and a "guessed" version: when the prompt (or the rules,
 * or a skill) doesn't say something the task needs, the agent guesses — and
 * the learner sees what it assumed.
 */
export interface TaskCtx {
  directives: string[];
  locale: Locale;
  /** Body of the skill or workflow the agent is following, if any. */
  guide: string | null;
  /** What the prompt didn't say (empty when the agent can do it right). */
  missing: PromptCheck[];
  /** The agent will run the tests (asked in the prompt, the rules or the skill). */
  verify: boolean;
  /** Recent prompts that changed something (for changelogs). */
  history: string[];
  /** The contents of a secrets file the agent read (.env), if it read one. */
  envSecret?: string | null;
}

export interface TaskResult {
  files: FileMap;
  summary: Txt;
}

export interface Task {
  id: string;
  match: RegExp;
  /** What must be said (by the prompt, the rules or a skill) for the agent to do it right. */
  needs: PromptCheck[];
  /** What the agent guesses when a need isn't met. */
  assume: Partial<Record<PromptCheck, Txt>>;
  plan: Txt[];
  run: (files: FileMap, ctx: TaskCtx) => TaskResult;
}

export interface Project {
  id: string;
  name: string;
  /** The project's own package manager (from package.json). */
  packageManager: "npm" | "pnpm";
  files: () => FileMap;
  tasks: Task[];
  summary: Txt;
  /** What `/init` writes. */
  initRules: (pm: string) => string;
  testCount: (files: FileMap) => number;
  /** Tests that fail with these files (empty = all green). */
  failing: (files: FileMap) => TestFailure[];
  /** What a code review of these files finds. */
  review: (files: FileMap) => Txt[];
}

export interface TestFailure {
  file: string;
  name: string;
  message: string;
  line: number;
}

const fr = (ctx: TaskCtx) => ctx.directives.includes("lang:fr");
const without = (ctx: TaskCtx, c: PromptCheck) => ctx.missing.includes(c);

function appendTest(files: FileMap, path: string, imports: string, block: string): FileMap {
  const cur = files[path];
  // Never add the same test twice.
  const name = block.match(/it\("([^"]+)"/)?.[1];
  if (cur && name && cur.includes(`it("${name}"`)) return files;
  if (!cur) return { ...files, [path]: `import { describe, expect, it } from "vitest";\nimport { ${imports} } from "../src/${path.includes("price") ? "price" : "cart"}";\n\n${block}\n` };
  // Add the import name if missing, then the new block at the end.
  let next = cur;
  const imp = next.match(/import \{ ([^}]+) \} from "\.\.\/src\/(cart|price)";/);
  if (imp && !imp[1].split(",").map((s) => s.trim()).includes(imports)) next = next.replace(imp[0], `import { ${imp[1].trim()}, ${imports} } from "../src/${imp[2]}";`);
  return { ...files, [path]: next.replace(/\n*$/, "\n\n") + block + "\n" };
}

// ───────────────────────────────────────────── Tiny Shop

const CART = `export interface Item {
  name: string;
  price: number; // in cents
  quantity: number;
}

export function addItem(cart: Item[], item: Item): Item[] {
  return [...cart, item];
}

export function total(cart: Item[]): number {
  return cart.reduce((sum, item) => sum + item.price, 0);
}
`;

const PRICE = `export function formatPrice(cents: number): string {
  return "$" + (cents / 100).toFixed(2);
}
`;

const CART_TEST = `import { describe, expect, it } from "vitest";
import { addItem, total } from "../src/cart";

describe("cart", () => {
  it("adds an item", () => {
    expect(addItem([], { name: "Mug", price: 1200, quantity: 1 })).toHaveLength(1);
  });

  it("totals the cart", () => {
    expect(total([{ name: "Mug", price: 1200, quantity: 1 }])).toBe(1200);
  });
});
`;

export const SHOP_README = `# Tiny Shop

A tiny online shop, used to practise AI-assisted development.

- \`src/cart.ts\`: the shopping cart
- \`src/price.ts\`: price formatting
- \`tests/cart.test.ts\`: the tests
`;

const shopFiles = (): FileMap => ({
  "README.md": SHOP_README,
  "package.json": `{
  "name": "tiny-shop",
  "private": true,
  "packageManager": "pnpm@10.4.0",
  "scripts": {
    "test": "vitest run"
  },
  "devDependencies": {
    "vitest": "^3.0.0"
  }
}
`,
  "pnpm-lock.yaml": "lockfileVersion: '9.0'\n",
  "src/cart.ts": CART,
  "src/price.ts": PRICE,
  "tests/cart.test.ts": CART_TEST,
  "CHANGELOG.md": "# Changelog\n\n## 0.1.0\n- First version of the cart.\n",
});

const discount: Task = {
  id: "discount",
  match: /(discount|coupon|promo(tion)?|r[ée]duction|remise)/i,
  needs: ["context", "specific", "verify"],
  assume: {
    context: tx("I didn't know where the cart code lives, so I created a new file, src/discount.js.", "Je ne savais pas où vit le code du panier, alors j'ai créé un nouveau fichier, src/discount.js."),
    specific: tx("No rule for the discount was given, so I hard-coded 10% off, with no limit.", "Aucune règle de remise n'était donnée, alors j'ai codé 10 % en dur, sans limite."),
    verify: tx("Nobody asked me to test it, so I didn't add or run any test.", "Personne ne m'a demandé de tester, donc je n'ai ajouté ni lancé aucun test."),
  },
  plan: [
    tx("Read src/cart.ts and tests/cart.test.ts", "Lire src/cart.ts et tests/cart.test.ts"),
    tx("Add applyDiscount(totalCents, percent) next to total(), clamped between 0 and 100 %", "Ajouter applyDiscount(totalCents, percent) à côté de total(), borné entre 0 et 100 %"),
    tx("Add a test for 20 % off and for a percent above 100", "Ajouter un test pour 20 % et pour un pourcentage au-dessus de 100"),
    tx("Run the tests", "Lancer les tests"),
  ],
  run: (files, ctx) => {
    let out = { ...files };
    if (without(ctx, "context")) {
      out["src/discount.js"] = "// discount\nexport function discount(total) {\n  return total * 0.9;\n}\n";
    } else if (without(ctx, "specific")) {
      // Asked again: don't add a second copy.
      if (!/export function applyDiscount\s*\(/.test(out["src/cart.ts"])) out["src/cart.ts"] = out["src/cart.ts"].replace(/\n*$/, "\n\n") + "export function applyDiscount(total: number): number {\n  return total * 0.9;\n}\n";
    } else {
      const doc = fr(ctx) ? "/** Applique une remise en pourcentage (de 0 à 100) à un total en centimes. */" : "/** Applies a percentage discount (0 to 100) to a total in cents. */";
      const full = `${doc}\nexport function applyDiscount(totalCents: number, percent: number): number {\n  const p = Math.min(Math.max(percent, 0), 100);\n  return Math.round(totalCents * (1 - p / 100));\n}\n`;
      const cart = out["src/cart.ts"];
      if (/export function applyDiscount\(totalCents: number, percent: number\)/.test(cart)) {
        // Already there (a follow-up asked for more): keep it as it is.
      } else if (/export function applyDiscount\(total: number\)/.test(cart)) {
        // Replace the earlier guessed version instead of adding a second function.
        out["src/cart.ts"] = cart.replace(/export function applyDiscount\(total: number\): number \{\n  return total \* 0\.9;\n\}\n/, full);
      } else out["src/cart.ts"] = cart.replace(/\n*$/, "\n\n") + full;
    }
    if (ctx.verify && !without(ctx, "context"))
      out = appendTest(
        out,
        "tests/cart.test.ts",
        "applyDiscount",
        `describe("applyDiscount", () => {\n  it("takes 20% off", () => {\n    expect(applyDiscount(1000, 20)).toBe(800);\n  });\n\n  it("never goes below zero", () => {\n    expect(applyDiscount(1000, 150)).toBe(0);\n  });\n});`,
      );
    return ctx.missing.length
      ? { files: out, summary: tx("Added a discount, but I had to guess a few things (see “Assumed” below).", "J'ai ajouté une remise, mais j'ai dû deviner certaines choses (voir « Supposé » plus bas).") }
      : { files: out, summary: tx("Added applyDiscount() to src/cart.ts, clamped between 0 and 100 %, with two tests.", "J'ai ajouté applyDiscount() dans src/cart.ts, bornée entre 0 et 100 %, avec deux tests.") };
  },
};

const fixTotal: Task = {
  id: "fix-total",
  match: /\b(total|quantit(y|ies|[ée]s?)|bug)\b/i,
  needs: ["verify"],
  assume: {
    verify: tx("I fixed it but didn't add a test, so this bug could come back unnoticed.", "Je l'ai corrigé sans ajouter de test : ce bug pourrait revenir sans que personne ne le voie."),
  },
  plan: [
    tx("Read total() in src/cart.ts", "Lire total() dans src/cart.ts"),
    tx("Multiply each price by its quantity", "Multiplier chaque prix par sa quantité"),
    tx("Add a test with quantity 3", "Ajouter un test avec une quantité de 3"),
    tx("Run the tests", "Lancer les tests"),
  ],
  run: (files, ctx) => {
    const alreadyFixed = !files["src/cart.ts"].includes("sum + item.price, 0");
    let out: FileMap = { ...files, "src/cart.ts": files["src/cart.ts"].replace("sum + item.price, 0", "sum + item.price * item.quantity, 0") };
    if (ctx.verify)
      out = appendTest(out, "tests/cart.test.ts", "total", `describe("total", () => {\n  it("multiplies by quantity", () => {\n    expect(total([{ name: "Mug", price: 1200, quantity: 3 }])).toBe(3600);\n  });\n});`);
    if (alreadyFixed)
      return {
        files: out,
        summary: out === files || JSON.stringify(out) === JSON.stringify(files)
          ? tx("total() already multiplies by quantity: nothing to fix.", "total() multiplie déjà par la quantité : rien à corriger.")
          : tx("total() was already right. I added the missing test.", "total() était déjà juste. J'ai ajouté le test qui manquait."),
      };
    return {
      files: out,
      summary: ctx.verify
        ? tx("total() ignored quantities. Fixed it and added a test with 3 mugs.", "total() ignorait les quantités. C'est corrigé, avec un test à 3 tasses.")
        : tx("total() ignored quantities. Fixed it.", "total() ignorait les quantités. C'est corrigé."),
    };
  },
};

const euro: Task = {
  id: "euro",
  match: /\b(euros?|eur|currency|devise|monnaie)\b|€/i,
  needs: ["specific", "constraints"],
  assume: {
    specific: tx("You didn't show the format you want, so I used “€12.50”.", "Tu n'as pas montré le format voulu, alors j'ai utilisé « €12.50 »."),
    constraints: tx("Nothing said to keep the function name, so I renamed it to formatEuro (other files still import formatPrice!).", "Rien ne disait de garder le nom, alors j'ai renommé la fonction en formatEuro (d'autres fichiers importent encore formatPrice !)."),
  },
  plan: [
    tx("Read src/price.ts", "Lire src/price.ts"),
    tx("Keep formatPrice(cents) and return French formatting: 12,50 €", "Garder formatPrice(cents) et renvoyer un format français : 12,50 €"),
    tx("Add tests/price.test.ts", "Ajouter tests/price.test.ts"),
  ],
  run: (files, ctx) => {
    const name = without(ctx, "constraints") ? "formatEuro" : "formatPrice";
    const body = without(ctx, "specific") ? `return "€" + (cents / 100).toFixed(2);` : `return (cents / 100).toFixed(2).replace(".", ",") + " €";`;
    let out: FileMap = { ...files, "src/price.ts": `export function ${name}(cents: number): string {\n  ${body}\n}\n` };
    if (ctx.verify && name === "formatPrice")
      out = appendTest(out, "tests/price.test.ts", "formatPrice", `describe("formatPrice", () => {\n  it("formats euros", () => {\n    expect(formatPrice(1250)).toBe("12,50 €");\n  });\n});`);
    return {
      files: out,
      summary: ctx.missing.length ? tx("Prices now show euros, with a few guesses.", "Les prix s'affichent en euros, avec quelques suppositions.") : tx("formatPrice() now returns “12,50 €”. Same name, same signature.", "formatPrice() renvoie maintenant « 12,50 € ». Même nom, même signature."),
    };
  },
};

const changelog: Task = {
  id: "changelog",
  match: /\b(changelog|release notes?|notes de version|journal des (modifications|changements))\b/i,
  needs: ["specific", "done"],
  assume: {
    specific: tx("No format was given, so I wrote a loose bullet list.", "Aucun format n'était donné, alors j'ai écrit une liste en vrac."),
    done: tx("I didn't know which version or section to use, so I appended at the bottom.", "Je ne savais pas quelle version ou section utiliser, alors j'ai ajouté à la fin."),
  },
  plan: [
    tx("Read CHANGELOG.md and the recent changes", "Lire CHANGELOG.md et les changements récents"),
    tx("Add an “Unreleased” section at the top, grouped by Added / Fixed / Changed", "Ajouter une section « Unreleased » en haut, groupée en Added / Fixed / Changed"),
  ],
  run: (files, ctx) => {
    const cur = files["CHANGELOG.md"] ?? "# Changelog\n";
    const items = ctx.history.length ? ctx.history.slice(-3).map((h) => h.replace(/\s+/g, " ").slice(0, 70)) : [ctx.locale === "fr" ? "Améliorations diverses" : "Various improvements"];
    if (ctx.missing.length) return { files: { ...files, "CHANGELOG.md": cur.replace(/\n*$/, "\n") + items.map((i) => `- ${i}`).join("\n") + "\n" }, summary: tx("Appended a few lines to CHANGELOG.md.", "J'ai ajouté quelques lignes à CHANGELOG.md.") };
    // Fixes go under ### Fixed, everything else under ### Added (Keep a Changelog).
    const isFix = (i: string) => /\b(fix|bug|corrige|repair|r[ée]pare)\w*/i.test(i);
    const added = items.filter((i) => !isFix(i));
    const fixed = items.filter(isFix);
    const section = `## [Unreleased]\n${added.length ? `### Added\n${added.map((i) => `- ${i}`).join("\n")}\n` : ""}${fixed.length ? `${added.length ? "\n" : ""}### Fixed\n${fixed.map((i) => `- ${i}`).join("\n")}\n` : ""}\n`;
    const next = cur.replace(/^(# Changelog\s*\n+)/, `$1${section}`);
    return { files: { ...files, "CHANGELOG.md": next === cur ? section + cur : next }, summary: tx("Added an [Unreleased] section to the top of CHANGELOG.md, following your format.", "J'ai ajouté une section [Unreleased] en haut de CHANGELOG.md, en suivant ton format.") };
  },
};

const readme: Task = {
  id: "readme",
  match: /\breadme\b/i,
  needs: ["specific"],
  assume: { specific: tx("You didn't say what to document, so I added a generic “About” paragraph.", "Tu n'as pas dit quoi documenter, alors j'ai ajouté un paragraphe « À propos » générique.") },
  plan: [tx("Read package.json and README.md", "Lire package.json et README.md"), tx("Add a “Getting started” section with the install and test commands", "Ajouter une section « Getting started » avec les commandes d'installation et de test")],
  run: (files, ctx) => {
    const pm = ctx.directives.find((d) => d.startsWith("pm:"))?.slice(3) ?? "npm";
    if (ctx.missing.length) return { files: { ...files, "README.md": files["README.md"].replace(/\n*$/, "\n\n") + "## About\n\nThis project is great and easy to use.\n" }, summary: tx("Added an About section.", "J'ai ajouté une section À propos.") };
    return {
      files: { ...files, "README.md": files["README.md"].replace(/\n*$/, "\n\n") + `## Getting started\n\n\`\`\`bash\n${pm} install\n${pm} test\n\`\`\`\n` },
      summary: tx(`Added “Getting started” with ${pm} commands.`, `J'ai ajouté « Getting started » avec les commandes ${pm}.`),
    };
  },
};

const writeTests: Task = {
  id: "tests",
  match: /\b(write|add|create|[ée]cri[st]|ajoute[rz]?|cr[ée]e[rz]?)\b[^.\n]{0,30}\btests?\b/i,
  needs: ["context"],
  assume: { context: tx("You didn't say what to test, so I read every file and tested addItem() again.", "Tu n'as pas dit quoi tester, alors j'ai tout lu et re-testé addItem().") },
  plan: [tx("Read src/price.ts", "Lire src/price.ts"), tx("Create tests/price.test.ts with a few cases", "Créer tests/price.test.ts avec quelques cas"), tx("Run the tests", "Lancer les tests")],
  run: (files, ctx) => {
    if (ctx.missing.length)
      return { files: appendTest(files, "tests/cart.test.ts", "addItem", `it("adds another item", () => {\n  expect(addItem([], { name: "Pen", price: 100, quantity: 1 })).toHaveLength(1);\n});`), summary: tx("Added one more test for addItem().", "J'ai ajouté un test de plus pour addItem().") };
    return {
      files: appendTest(files, "tests/price.test.ts", "formatPrice", `describe("formatPrice", () => {\n  it("formats cents", () => {\n    expect(formatPrice(1250)).toContain("12");\n  });\n\n  it("formats zero", () => {\n    expect(formatPrice(0)).toContain("0");\n  });\n});`),
      summary: tx("Created tests/price.test.ts with two cases.", "J'ai créé tests/price.test.ts avec deux cas."),
    };
  },
};

/** The test whose `it("…")` block contains a line, and that line's number (1-based). */
function locate(text: string, needle: string): { name: string; line: number } | null {
  const lines = text.split("\n");
  const i = lines.findIndex((l) => l.includes(needle));
  if (i < 0) return null;
  for (let j = i; j >= 0; j--) {
    const m = lines[j].match(/\bit\(\s*["'`]([^"'`]+)/);
    if (m) return { name: m[1], line: i + 1 };
  }
  return { name: "test", line: i + 1 };
}

function shopFailing(files: FileMap): TestFailure[] {
  const out: TestFailure[] = [];
  const cart = files["src/cart.ts"] ?? "";
  const price = files["src/price.ts"] ?? "";
  for (const [file, text] of Object.entries(files)) {
    if (!/^tests\/.*\.test\.ts$/.test(file)) continue;
    // total() must multiply by quantity for a "quantity: 3 → 3600" expectation to hold.
    if (/quantity:\s*3\b/.test(text) && text.includes("toBe(3600)") && !/item\.price\s*\*\s*item\.quantity/.test(cart)) {
      const at = locate(text, "toBe(3600)");
      if (at) out.push({ file, name: at.name, line: at.line, message: "AssertionError: expected 1200 to be 3600 // Object.is equality" });
    }
    if (text.includes("applyDiscount") && !/export function applyDiscount\s*\(/.test(cart)) {
      const at = locate(text, "applyDiscount(");
      if (at) out.push({ file, name: at.name, line: at.line, message: "TypeError: applyDiscount is not a function" });
    }
    if (text.includes('"12,50 €"') && !(price.includes('replace(".", ",")') && price.includes('" €"') && /export function formatPrice\b/.test(price))) {
      const at = locate(text, '"12,50 €"');
      if (at) out.push({ file, name: at.name, line: at.line, message: /export function formatPrice\b/.test(price) ? "AssertionError: expected '$12.50' to be '12,50 €'" : "TypeError: formatPrice is not a function" });
    }
  }
  return out;
}

function shopReview(files: FileMap): Txt[] {
  const out: Txt[] = [];
  const cart = files["src/cart.ts"] ?? "";
  const tests = Object.entries(files)
    .filter(([p]) => p.startsWith("tests/"))
    .map(([, c]) => c)
    .join("\n");
  if (cart.includes("sum + item.price, 0")) out.push(tx("src/cart.ts: total() ignores quantity, so 3 mugs cost the price of 1.", "src/cart.ts : total() ignore la quantité, donc 3 tasses coûtent le prix d'une."));
  if (/export function applyDiscount/.test(cart) && !tests.includes("applyDiscount")) out.push(tx("src/cart.ts: applyDiscount() has no test.", "src/cart.ts : applyDiscount() n'a aucun test."));
  if (/return total \* 0\.9/.test(cart) || files["src/discount.js"]) out.push(tx("A 10% discount is hard-coded: the percentage should be a parameter.", "Une remise de 10 % est codée en dur : le pourcentage devrait être un paramètre."));
  if ((files["src/price.ts"] ?? "").includes('"$"')) out.push(tx("src/price.ts: the currency symbol is hard-coded to $.", "src/price.ts : le symbole monétaire est codé en dur en $."));
  for (const [p, c] of Object.entries(files)) if (/sk_(live|test)_/.test(c) && !p.startsWith(".env")) out.push(tx(`${p}: a secret API key is written in the code. Read it from process.env instead.`, `${p} : une clé d'API secrète est écrite dans le code. Lis-la depuis process.env.`));
  return out;
}

const makeTestsPass: Task = {
  id: "make-tests-pass",
  match: /\b(make|get)\b[^.\n]{0,25}\btests?\b[^.\n]{0,15}\b(pass|green|work)|\bfais passer les tests|\btests?\b[^.\n]{0,15}\b(passent|au vert)/i,
  needs: ["constraints"],
  assume: {
    constraints: tx(
      "Nothing said to leave the tests alone, so I changed the expected value in the test to match what the code returns.",
      "Rien ne disait de ne pas toucher aux tests, alors j'ai changé la valeur attendue dans le test pour coller à ce que renvoie le code.",
    ),
  },
  plan: [tx("Run the tests and read the failure", "Lancer les tests et lire l'échec"), tx("Fix the code so the test's expectation holds", "Corriger le code pour que l'attente du test soit respectée"), tx("Run the tests again", "Relancer les tests")],
  run: (files, ctx) => {
    const failing = shopFailing(files);
    if (!failing.length) return { files, summary: tx("All tests already pass. Nothing to change.", "Tous les tests passent déjà. Rien à changer.") };
    const out = { ...files };
    if (without(ctx, "constraints")) {
      for (const f of failing) out[f.file] = out[f.file].replace("toBe(3600)", "toBe(1200)").replace('toBe("12,50 €")', 'toBe("$12.50")');
      return { files: out, summary: tx("Done! All tests pass now. ✓", "C'est fait ! Tous les tests passent maintenant. ✓") };
    }
    out["src/cart.ts"] = out["src/cart.ts"].replace("sum + item.price, 0", "sum + item.price * item.quantity, 0");
    if (failing.some((f) => f.message.includes("12,50"))) out["src/price.ts"] = `export function formatPrice(cents: number): string {\n  return (cents / 100).toFixed(2).replace(".", ",") + " €";\n}\n`;
    return { files: out, summary: tx("The test was right: total() ignored quantities. I fixed the code and left the tests as they were.", "Le test avait raison : total() ignorait les quantités. J'ai corrigé le code sans toucher aux tests.") };
  },
};

const review: Task = {
  id: "review",
  match: /\b(review|relis|relire|relecture|audit)\w*/i,
  needs: [],
  assume: {},
  plan: [tx("Read the code and the tests", "Lire le code et les tests"), tx("List bugs, risks and missing tests", "Lister les bugs, les risques et les tests manquants")],
  run: (files, ctx) => {
    const found = shopReview(files);
    const t = (x: Txt) => x[ctx.locale];
    return {
      files,
      summary: found.length
        ? tx(`Review: ${found.length} finding${found.length > 1 ? "s" : ""}.\n${found.map((f, i) => `  ${i + 1}. ${f.en}`).join("\n")}`, `Relecture : ${found.length} point${found.length > 1 ? "s" : ""}.\n${found.map((f, i) => `  ${i + 1}. ${t(f)}`).join("\n")}`)
        : tx("Review: nothing to report. The code and tests look good.", "Relecture : rien à signaler. Le code et les tests sont bons."),
    };
  },
};

const checkout: Task = {
  id: "checkout",
  match: /\b(checkout|payments?|paiements?|stripe)\b/i,
  needs: ["context"],
  assume: { context: tx("You didn't say where the checkout goes, so I created src/checkout.ts.", "Tu n'as pas dit où mettre le paiement, alors j'ai créé src/checkout.ts.") },
  plan: [tx("Read src/cart.ts", "Lire src/cart.ts"), tx("Add checkout(cart) in src/checkout.ts that charges total(cart)", "Ajouter checkout(cart) dans src/checkout.ts qui débite total(cart)"), tx("Read the API key from process.env", "Lire la clé d'API depuis process.env")],
  run: (files, ctx) => {
    const key = ctx.envSecret?.match(/^\s*([A-Z_]*(?:KEY|SECRET|TOKEN)[A-Z_]*)\s*=\s*(\S+)/m);
    const line = key ? `const apiKey = "${key[2]}"; // from .env` : `const apiKey = process.env.STRIPE_SECRET_KEY;`;
    const code = `import { total, type Item } from "./cart";\n\n${line}\n\nexport async function checkout(cart: Item[]): Promise<{ charged: number }> {\n  if (!apiKey) throw new Error("Missing STRIPE_SECRET_KEY");\n  return { charged: total(cart) };\n}\n`;
    return {
      files: { ...files, "src/checkout.ts": code },
      summary: key
        ? tx(`Added checkout() in src/checkout.ts. I copied ${key[1]} from .env so it works right away.`, `J'ai ajouté checkout() dans src/checkout.ts. J'ai copié ${key[1]} depuis .env pour que ça marche tout de suite.`)
        : tx("Added checkout() in src/checkout.ts. It reads STRIPE_SECRET_KEY from the environment, never from the code.", "J'ai ajouté checkout() dans src/checkout.ts. Elle lit STRIPE_SECRET_KEY dans l'environnement, jamais dans le code."),
    };
  },
};

export const SHOP: Project = {
  id: "shop",
  name: "Tiny Shop",
  packageManager: "pnpm",
  files: shopFiles,
  // Order matters: the most specific requests first.
  tasks: [makeTestsPass, review, changelog, readme, writeTests, checkout, discount, euro, fixTotal],
  summary: tx(
    "This is Tiny Shop, a small TypeScript project. src/cart.ts holds the cart (addItem, total), src/price.ts formats prices, and tests/ has Vitest tests. package.json says it uses pnpm. Heads-up: total() ignores item quantities, which looks like a bug.",
    "C'est Tiny Shop, un petit projet TypeScript. src/cart.ts contient le panier (addItem, total), src/price.ts formate les prix et tests/ contient des tests Vitest. package.json indique pnpm. Attention : total() ignore les quantités, ce qui ressemble à un bug.",
  ),
  initRules: (pm) => `# Tiny Shop

A small TypeScript shop used to practise AI-assisted development.

## Commands
- Install: \`${pm} install\`
- Test: \`${pm} test\`

## Structure
- \`src/cart.ts\`: cart logic (addItem, total)
- \`src/price.ts\`: price formatting
- \`tests/\`: Vitest tests, one file per module

## Conventions
- Prices are integers in cents.
`,
  testCount: (files) => Object.entries(files).filter(([p]) => p.startsWith("tests/")).reduce((n, [, c]) => n + (c.match(/\bit\(/g)?.length ?? 0), 0),
  failing: shopFailing,
  review: shopReview,
};

export const PROJECTS: Record<string, Project> = { shop: SHOP };

export const getProject = (id: string) => PROJECTS[id] ?? SHOP;
