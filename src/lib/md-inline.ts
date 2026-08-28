/**
 * Inline markdown for strings that reach the page as component props.
 *
 * MDX renders markdown in the document body, but a string passed as a prop,
 * `<TldrBlock text="... [Playa del Carmen](/areas/playa-del-carmen/) ..." />`, or an
 * `answer` in a frontmatter FAQ item, is just a string. Rendered with `{text}` the
 * link markup is printed to the reader verbatim and the link is not crawlable.
 *
 * This converts the inline subset that actually appears in the corpus. It is not a
 * markdown parser: no block elements, no nesting beyond one level, and the output is
 * escaped first so a prop can never inject markup.
 */

const ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ESCAPES[c]);
}

/** Only site-relative paths and https links become anchors. */
function safeHref(href: string): string | null {
  const trimmed = href.trim();
  if (/^\/[^/]/.test(trimmed) || trimmed === '/') return trimmed;
  if (/^https:\/\/[\w.-]+/i.test(trimmed)) return trimmed;
  if (/^mailto:[^\s@]+@[^\s@]+$/i.test(trimmed)) return trimmed;
  return null;
}

export function mdInlineToHtml(input: string | undefined | null): string {
  if (!input) return '';
  let out = escapeHtml(String(input));

  // [text](/url): the href was escaped above, so match on the escaped form too.
  out = out.replace(/\[([^\]\n]+)\]\(([^)\s]+)\)/g, (whole, text, href) => {
    const url = safeHref(href.replace(/&amp;/g, '&'));
    if (!url) return text;
    const isExternal = url.startsWith('https://');
    const attrs = isExternal ? ' rel="noopener" target="_blank"' : '';
    return `<a href="${escapeHtml(url)}"${attrs}>${text}</a>`;
  });

  // **bold**, then *italic* / _italic_, then `code`.
  out = out.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
  out = out.replace(/(^|[\s(])\*([^*\n]+)\*(?=[\s.,;:)!?]|$)/g, '$1<em>$2</em>');
  out = out.replace(/(^|[\s(])_([^_\n]+)_(?=[\s.,;:)!?]|$)/g, '$1<em>$2</em>');
  out = out.replace(/`([^`\n]+)`/g, '<code>$1</code>');

  return out;
}

/** Same conversion, stripped back to text, for schema fields that take no markup. */
export function mdInlineToText(input: string | undefined | null): string {
  if (!input) return '';
  return String(input)
    .replace(/\[([^\]\n]+)\]\([^)\s]+\)/g, '$1')
    .replace(/\*\*([^*\n]+)\*\*/g, '$1')
    .replace(/(^|[\s(])\*([^*\n]+)\*/g, '$1$2')
    .replace(/`([^`\n]+)`/g, '$1')
    .trim();
}
