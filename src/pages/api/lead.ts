import type { APIRoute } from 'astro';
import { SITE } from '../../data/site';
import { checkLead } from '../../lib/lead-spam-gate';

export const prerender = false;

const TG_TOKEN = import.meta.env.TG_TOKEN;
const TG_CHAT_ID = import.meta.env.TG_CHAT_ID;
const RESEND_API_KEY = import.meta.env.RESEND_API_KEY || '';
const LEAD_FROM_EMAIL = import.meta.env.LEAD_FROM_EMAIL || `Mexico Invest <${SITE.email}>`;

function escapeHtml(v: string) {
  return v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function sendTelegram(text: string) {
  if (!TG_TOKEN || !TG_CHAT_ID) throw new Error('Telegram not configured');
  const res = await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: TG_CHAT_ID, text, parse_mode: 'HTML' }),
  });
  if (!res.ok) throw new Error(`Telegram ${res.status}`);
}

async function sendAutoReply(to: string, name: string, context: string) {
  if (!RESEND_API_KEY || !to.includes('@')) return;
  const greeting = name ? `Hi ${escapeHtml(name)},` : 'Hi,';
  const topic = context ? escapeHtml(context) : 'your Mexico property enquiry';
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: LEAD_FROM_EMAIL,
      reply_to: SITE.email,
      to: [to],
      subject: 'Your Mexico shortlist request is in',
      html: `<p>${greeting}</p>
<p>Thank you for contacting Mexico Invest. We received your request regarding <strong>${topic}</strong>.</p>
<p>Here is what happens next:</p>
<ol>
<li>A researcher reads your request. During US morning hours that usually takes about 15 minutes.</li>
<li>We come back with 3 to 5 matched options, each with the net yield maths behind it.</li>
<li>If you want to go further, we introduce an AMPI licensed partner. There is no obligation.</li>
</ol>
<p>If anything changes, just reply to this email.</p>
<p><strong>Mexico Invest Editorial</strong><br><a href="${SITE.url}">${SITE.url.replace('https://', '')}</a></p>
<p style="font-size:12px;color:#666;">Independent research. Not financial or legal advice.</p>`,
    }),
  });
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const {
      name, phone, email, contact, budget, goal, message, context, source, page, market,
      timeline, collection, slug, formLocation, landingPage, referrer, aiSource, utm, sessionId,
    } = body;

    const phoneText = String(phone || contact || '').trim();
    const emailText = String(email || '').trim();
    const isHealthcheck =
      String(source || '').toLowerCase().includes('healthcheck') ||
      phoneText === 'healthcheck@bot';

    // Spam gate runs before anything leaves the server. A rejected post gets the same
    // 200 a real one does, so a bot cannot probe which rule it tripped.
    if (!isHealthcheck) {
      const verdict = checkLead(body, request);
      if (!verdict.ok) {
        console.warn(`lead rejected: ${verdict.reason}`);
        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }

    const hasPhone = phoneText.replace(/\D/g, '').length >= 8;
    const hasEmail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(emailText);
    if (!isHealthcheck && !hasPhone && !hasEmail) {
      return new Response(JSON.stringify({ error: 'Email or phone required' }), { status: 400 });
    }

    const utmText = utm && typeof utm === 'object'
      ? Object.entries(utm as Record<string, string>)
          .map(([key, value]) => `${key}=${value}`)
          .join(' · ')
      : '';

    const lines = [
      isHealthcheck ? '🧪 <b>TEST mexico-invest.com</b>' : '🇲🇽 <b>New lead: Mexico Invest</b>',
      '',
      name ? `👤 <b>Name:</b> ${name}` : null,
      phoneText ? `📱 <b>Phone:</b> ${phoneText}` : null,
      emailText ? `✉️ <b>Email:</b> ${emailText}` : null,
      market ? `🌍 <b>Market:</b> ${market}` : null,
      budget ? `💰 <b>Budget:</b> ${budget}` : null,
      timeline ? `⏱ <b>Timeline:</b> ${timeline}` : null,
      goal ? `🎯 <b>Goal:</b> ${goal}` : null,
      message ? `💬 <b>Message:</b> ${message}` : null,
      context ? `📄 <b>Context:</b> ${context}` : null,
      page ? `🌐 <b>Page:</b> ${page}` : null,
      collection || slug ? `🗂 <b>Slug:</b> ${collection || '?'}/${slug || '?'}` : null,
      formLocation ? `📍 <b>Form:</b> ${formLocation}` : null,
      landingPage ? `🚪 <b>Landing:</b> ${landingPage}` : null,
      referrer ? `↩️ <b>Referrer:</b> ${referrer}` : null,
      aiSource ? `🤖 <b>AI source:</b> ${aiSource}` : null,
      utmText ? `📈 <b>UTM:</b> ${utmText}` : null,
      sessionId ? `🆔 <b>Session:</b> ${sessionId}` : null,
      source ? `🔗 <b>Source URL:</b> ${source}` : null,
    ].filter(Boolean).join('\n');

    await sendTelegram(lines);
    // Owner inbox email disabled. Telegram only (no Kommo email ingest).

    if (!isHealthcheck && emailText) {
      try {
        await sendAutoReply(emailText, String(name || ''), String(context || ''));
      } catch (err) {
        console.error('Auto-reply failed:', err);
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('Lead API error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500 });
  }
};
