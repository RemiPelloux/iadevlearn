import { describe, expect, it } from "vitest";
import { checkSkill, parseFrontmatter } from "@/engine";
import { HUB_SKILLS } from "../data";

describe("skills hub", () => {
  it("embedded skills are valid SKILL.md files whose name matches the entry", () => {
    for (const s of HUB_SKILLS.filter((x) => x.content)) {
      expect(checkSkill(s.name, s.content!), s.name).toEqual([]);
      expect(parseFrontmatter(s.content!).data.name, s.name).toBe(s.name);
    }
  });

  it("every entry has both languages, a licence and a way to get it", () => {
    for (const s of HUB_SKILLS) {
      expect(s.description.en.trim(), s.name).not.toBe("");
      expect(s.description.fr.trim(), s.name).not.toBe("");
      expect(s.license, s.name).not.toBe("");
      expect(!!s.content || !!s.raw || s.install.length > 0, s.name).toBe(true);
      if (s.raw) expect(s.raw, s.name).toMatch(/^https:\/\/raw\.githubusercontent\.com\/.+\/SKILL\.md$/);
    }
  });

  it("entries are unique per source and the copy uses plain punctuation", () => {
    const keys = HUB_SKILLS.map((s) => `${s.source}/${s.name}`);
    expect(new Set(keys).size).toBe(keys.length);
    for (const s of HUB_SKILLS) expect(s.description.en + s.description.fr, s.name).not.toMatch(/[—–]/);
  });
});
