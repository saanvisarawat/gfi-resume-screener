import raw from "../data/candidates.json";
import type { Scored } from "./types";
export const DATA = raw as unknown as { builtAt: string; candidates: Scored[] };
