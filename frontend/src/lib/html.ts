/** Decode common HTML entities for safe display of email/Gmail snippets. */
export function decodeHtmlEntities(text: string): string {
  if (!text) return "";
  if (typeof window !== "undefined" && window.document) {
    const ta = document.createElement("textarea");
    ta.innerHTML = text;
    return ta.value;
  }
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)))
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCharCode(parseInt(h, 16)));
}
