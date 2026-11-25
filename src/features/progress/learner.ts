import type { World } from "@/engine";

/** The terminal prompt and the simulated user carry the learner's name. */
export function withLearner(world: World, name: string): World {
  const n = name.trim();
  if (!n || world.user.name === n) return world;
  return { ...world, user: { name: n } };
}
