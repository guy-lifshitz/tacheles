import { makeWordlistDetector } from "./wordlist.js";

export const bannedVocab = makeWordlistDetector("s-banned-vocab", "HIGH", "AI vocabulary");
