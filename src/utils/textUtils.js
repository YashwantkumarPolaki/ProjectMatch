/**
 * Truncates text to at most `maxWords` words.
 */
export function limitWords(text, maxWords = 150) {
  if (!text) return "";
  const words = text.trim().split(/\s+/);
  if (words.length <= maxWords) return text;
  return words.slice(0, maxWords).join(" ") + "...";
}

/**
 * Counts words in a string.
 */
export function countWords(text) {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}
