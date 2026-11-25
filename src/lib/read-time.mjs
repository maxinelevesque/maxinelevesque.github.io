// The read-time estimate for a piece without a curated one (scripts/generate-content.mjs).
// Words a reader reads, for the read-time estimate: not URLs, image alt text (screen readers aside,
// it isn't read with the text), figure and other HTML comments, fenced code, or the notes'
// definitions (optional reading; a note's marker in the text costs nothing).
export function proseWords(body) {
  return body
    .replace(/^(\s{0,3})(`{3,}|~{3,})[\s\S]*?^\1\2\s*$/gm, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/^\[\^[^\]]+\]:.*(?:\n(?: {2,}|\t).*)*/gm, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w)).length;
}

export const readMinutes = (body) => Math.max(1, Math.round(proseWords(body) / 200));
