/**
 * Wrap every article table in a horizontal scroller.
 *
 * A three-column comparison table does not fit 390px, so it scrolls. The table
 * scrolled fine before this plugin — but nothing said so, and a static view of
 * "Factor | Akumal | Tul…" reads as data lost rather than data offscreen. The
 * shadow has to live on a wrapper: painted on the table itself it sits under the
 * opaque cells and is never seen.
 */
export function rehypeTableScroll() {
  return (tree) => {
    const walk = (node) => {
      if (!node.children) return;
      for (let i = 0; i < node.children.length; i += 1) {
        const child = node.children[i];
        if (child.type === 'element' && child.tagName === 'table') {
          node.children[i] = {
            type: 'element',
            tagName: 'div',
            properties: { className: ['table-scroll'], tabIndex: 0, role: 'region' },
            children: [child],
          };
        } else {
          walk(child);
        }
      }
    };
    walk(tree);
  };
}
