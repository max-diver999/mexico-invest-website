/**
 * Spam gate for /api/lead and /api/wa-intent.
 *
 * The endpoint accepted any JSON body and forwarded it to Telegram and Resend with no
 * honeypot, no rate limit, no timing check and no validation beyond presence. On a site
 * that actively invites form fills, that gets found.
 *
 * Deliberately conservative: every rule below rejects only what a real enquiry cannot
 * plausibly look like. A false negative costs an unwanted Telegram message; a false
 * positive costs a lead.
 */

export interface SpamVerdict {
  ok: boolean;
  reason?: string;
}

/** Serverless instances are short-lived, so this is a burst limiter, not a quota. */
const RECENT = new Map<string, number[]>();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;

/** A human needs a few seconds to fill the form; a script posts instantly. */
const MIN_FILL_MS = 2500;

const LINK_RE = /https?:\/\/|\[url=|<a\s/i;
const CYRILLIC_OR_CJK_RE = /[Ѐ-ӿ一-鿿]/;
const SPAM_PHRASES = [
  'seo services', 'guest post', 'backlink', 'crypto investment', 'forex',
  'binary option', 'casino', 'viagra', 'loan offer', 'bitcoin doubler',
];

function clientKey(request: Request): string {
  const headers = request.headers;
  return (
    headers.get('x-vercel-forwarded-for') ??
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    headers.get('x-real-ip') ??
    'unknown'
  );
}

function rateLimited(key: string): boolean {
  const now = Date.now();
  const hits = (RECENT.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  hits.push(now);
  RECENT.set(key, hits);
  // Keep the map from growing without bound across a long-lived instance.
  if (RECENT.size > 500) {
    for (const [k, v] of RECENT) {
      if (v.every((t) => now - t >= WINDOW_MS)) RECENT.delete(k);
    }
  }
  return hits.length > MAX_PER_WINDOW;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;

export function checkLead(body: Record<string, any>, request: Request): SpamVerdict {
  // 1. Honeypot — a field hidden from humans, filled by anything that parses the form.
  if (typeof body.company === 'string' && body.company.trim() !== '') {
    return { ok: false, reason: 'honeypot' };
  }

  // 2. Submitted faster than a person can type.
  const elapsed = Number(body.formElapsedMs);
  if (Number.isFinite(elapsed) && elapsed >= 0 && elapsed < MIN_FILL_MS) {
    return { ok: false, reason: 'too-fast' };
  }

  // 3. Something to reply to.
  const email = String(body.email ?? '').trim();
  const phone = String(body.phone ?? '').trim();
  if (!email && !phone) return { ok: false, reason: 'no-contact' };
  if (email && !EMAIL_RE.test(email)) return { ok: false, reason: 'bad-email' };

  // 4. Field lengths a real enquiry stays inside.
  const name = String(body.name ?? '').trim();
  const message = String(body.message ?? '').trim();
  if (name.length > 120 || message.length > 4000) return { ok: false, reason: 'oversized' };

  // 5. Link-stuffed or off-topic message bodies.
  const haystack = `${name} ${message}`.toLowerCase();
  const links = (message.match(/https?:\/\//g) ?? []).length;
  if (links > 1) return { ok: false, reason: 'links' };
  if (LINK_RE.test(name)) return { ok: false, reason: 'link-in-name' };
  if (SPAM_PHRASES.some((p) => haystack.includes(p))) return { ok: false, reason: 'spam-phrase' };
  // The audience is English-speaking US/Canadian buyers; a Cyrillic or CJK body is
  // an outreach bot, not an enquiry. Kept off the name field, which can be anything.
  if (CYRILLIC_OR_CJK_RE.test(message)) return { ok: false, reason: 'off-audience-script' };

  // 6. Burst from one client.
  if (rateLimited(clientKey(request))) return { ok: false, reason: 'rate-limit' };

  return { ok: true };
}
