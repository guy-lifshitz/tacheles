import { makeWordlistDetector } from "./wordlist.js";

export const significanceAnnounce = makeWordlistDetector(
  "r-significance-announce",
  "MEDIUM",
  "Significance announcement"
);
