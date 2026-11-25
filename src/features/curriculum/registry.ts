import * as mcp from "./lessons/mcp";
import * as orcaMore from "./lessons/orca-more";
import * as promptingMore from "./lessons/prompting-more";
import * as rulesMore from "./lessons/rules-more";
import * as safety from "./lessons/safety";
import * as ship from "./lessons/ship";
import * as skillsMore from "./lessons/skills-more";
import * as toolsMore from "./lessons/tools-more";
import type { Solution, StoryDef } from "./types";

/** Lesson modules added after the first release: each exports lessons, test solutions and stories. */
export const MODULES = { promptingMore, rulesMore, skillsMore, toolsMore, orcaMore, mcp, safety, ship };

const all = Object.values(MODULES);

/** Story walkthroughs by id (`story:<id>` in a Discover step). */
export const STORIES: Record<string, StoryDef> = Object.assign({}, ...all.map((m) => m.stories));

/** How the lesson tests solve each new challenge. */
export const MODULE_SOLUTIONS: Record<string, Solution> = Object.assign({}, ...all.map((m) => m.solutions));
