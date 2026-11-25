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
      out["src/cart.ts"] = out["src/cart.ts"].replace(/\n*$/, "\n\n") + "export function applyDiscount(total: number): number {\n  return total * 0.9;\n}\n";
    } else {
      const doc = fr(ctx) ? "/** Applique une remise en pourcentage (de 0 à 100) à un total en centimes. */" : "/** Applies a percentage discount (0 to 100) to a total in cents. */";
      out["src/cart.ts"] =
        out["src/cart.ts"].replace(/\n*$/, "\n\n") +
        `${doc}\nexport function applyDiscount(totalCents: number, percent: number): number {\n  const p = Math.min(Math.max(percent, 0), 100);\n  return Math.round(totalCents * (1 - p / 100));\n}\n`;
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
    let out: FileMap = { ...files, "src/cart.ts": files["src/cart.ts"].replace("sum + item.price, 0", "sum + item.price * item.quantity, 0") };
    if (ctx.verify)
      out = appendTest(out, "tests/cart.test.ts", "total", `describe("total", () => {\n  it("multiplies by quantity", () => {\n    expect(total([{ name: "Mug", price: 1200, quantity: 3 }])).toBe(3600);\n  });\n});`);
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
    const section = `## [Unreleased]\n### Added\n${items.map((i) => `- ${i}`).join("\n")}\n\n`;
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

export const SHOP: Project = {
  id: "shop",
  name: "Tiny Shop",
  packageManager: "pnpm",
  files: shopFiles,
  // Order matters: the most specific requests first.
  tasks: [changelog, readme, writeTests, discount, euro, fixTotal],
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
};

export const PROJECTS: Record<string, Project> = { shop: SHOP };

export const getProject = (id: string) => PROJECTS[id] ?? SHOP;
