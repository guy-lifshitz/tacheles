import { makeWordlistDetector } from "./wordlist.js";

export const bannedCopula = makeWordlistDetector("s-banned-copula", "MEDIUM", "Inflated copula");
