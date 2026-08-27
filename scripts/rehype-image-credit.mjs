/**
 * Turn an image title into a visible credit line.
 *
 *   ![alt](url "Developer marketing material — Bosques de Santa Fe, Mexico City")
 *
 * becomes a <figure> with a <figcaption>, so a frame that came out of a
 * developer's brochure says so under the picture instead of passing as the
 * site's own photography. Markdown's title attribute is the natural place to
 * carry it: it survives the MDX pipeline and needs no custom component.
 */
export function rehypeImageCredit() {
  return (tree) => {
    const walk = (node) => {
      if (!node.children) return;
      for (let i = 0; i < node.children.length; i += 1) {
        const child = node.children[i];

        // an image alone in a paragraph — the shape MDX gives a standalone image
        const lone =
          child.type === 'element' &&
          child.tagName === 'p' &&
          child.children?.length === 1 &&
          child.children[0].type === 'element' &&
          child.children[0].tagName === 'img';
        const img = lone ? child.children[0] : child.type === 'element' && child.tagName === 'img' ? child : null;

        if (img && img.properties?.title) {
          const credit = String(img.properties.title);
          delete img.properties.title;
          node.children[i] = {
            type: 'element',
            tagName: 'figure',
            properties: { className: ['image-credit'] },
            children: [
              img,
              {
                type: 'element',
                tagName: 'figcaption',
                properties: {},
                children: [{ type: 'text', value: credit }],
              },
            ],
          };
          continue;
        }
        walk(child);
      }
    };
    walk(tree);
  };
}
