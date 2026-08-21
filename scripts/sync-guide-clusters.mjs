#!/usr/bin/env node
/**
 * Mirror src/data/guide-clusters.ts into scripts/lib/ so node scripts can import it.
 * Astro compiles the .ts; plain node cannot, and duplicating the cluster list by
 * hand is how the two drift apart.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = fs.readFileSync(path.join(ROOT, 'src/data/guide-clusters.ts'), 'utf8');
const body = src
  .split('export const GUIDE_CLUSTERS: GuideCluster[] =')[1]
  .split('/** Slugs that carry')[0]
  .trimEnd()
  .replace(/;$/, '');

const out = `/**
 * Generated view of src/data/guide-clusters.ts for node scripts.
 * Astro imports the .ts file; plain node cannot, so this mirrors it. Kept out of
 * src/data/ so it never shadows the .ts in an extensionless import.
 * Regenerate with scripts/sync-guide-clusters.mjs after editing the .ts.
 */
export const GUIDE_CLUSTERS =${body};
`;
fs.writeFileSync(path.join(ROOT, 'scripts/lib/guide-clusters.mjs'), out);
console.log('scripts/lib/guide-clusters.mjs regenerated');
