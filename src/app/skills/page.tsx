import type { Metadata } from "next";
import { AppNav } from "@/components/app-nav";
import { SkillsHub } from "@/features/skills-hub/hub";

export const metadata: Metadata = { title: "Skills hub", description: "Ready-to-use agent skills for Claude Code, Codex and Antigravity, with install commands and full SKILL.md files." };

export default function SkillsPage() {
  return (
    <>
      <AppNav />
      <main>
        <SkillsHub />
      </main>
    </>
  );
}
