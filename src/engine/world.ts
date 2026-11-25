import { getProject } from "./projects";
import type { FileMap, World } from "./types";

/** A fresh world for a project: its files committed on main, plus optional extra files (home config, rules…). */
export function projectWorld(projectId = "shop", extra: FileMap = {}): World {
  const project = getProject(projectId);
  const files = { ...project.files(), ...extra };
  const committed = Object.fromEntries(Object.entries(files).filter(([p]) => !p.startsWith("~/")));
  return {
    version: 1,
    project: project.id,
    files,
    session: null,
    runs: [],
    worktrees: [],
    mcp: [],
    git: { branch: "main", head: committed, log: [{ id: "a1b2c3d", message: "Initial commit" }] },
    user: { name: "You" },
    seq: 0,
  };
}

export const emptyWorld = () => projectWorld("shop");
