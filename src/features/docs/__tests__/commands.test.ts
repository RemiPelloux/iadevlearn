import { describe, expect, it } from "vitest";
import { execute, projectWorld, type World } from "@/engine";
import { COMMAND_DOCS } from "../commands";

describe("reference demos", () => {
  for (const doc of COMMAND_DOCS)
    it(`${doc.id} runs`, () => {
      let w: World = projectWorld();
      for (const cmd of doc.demo.setup) {
        const r = execute(w, cmd);
        expect(r.ok, `${doc.id} setup "${cmd}": ${r.lines.map((l) => l.text).join("\n")}`).toBe(true);
        w = r.world;
      }
      const r = execute(w, doc.demo.command);
      expect(r.ok, `${doc.id} "${doc.demo.command}": ${r.lines.map((l) => l.text).join("\n")}`).toBe(true);
    });
});
