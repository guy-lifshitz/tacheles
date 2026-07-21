/** Word count convention: whitespace-split non-empty tokens. Shared by emDashDensity + measure. */
export function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}
