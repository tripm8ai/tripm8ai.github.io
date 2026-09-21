/**
 * POST /api/waitlist — records one AI Glasses waitlist signup.
 *
 * Needs a D1 database bound as WAITLIST_DB in the Pages project. Without the
 * binding the endpoint fails loudly rather than silently dropping signups.
 * Responds with JSON to fetch and with an HTML page to a plain form post, so
 * the form still works when JavaScript is unavailable.
 */

const ROLES = ['traveler', 'business', 'both'];
const KEENNESS = ['day-one', 'interested', 'curious'];

const MAX_EMAIL = 254;
const MAX_NOTE = 280;

// Deliberately permissive: the point is to catch typos, not to police syntax.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function pick(value, allowed) {
  const v = String(value || '').trim().toLowerCase();
  return allowed.indexOf(v) === -1 ? null : v;
}

function json(body, status) {
  return new Response(JSON.stringify(body), {
    status: status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

function page(title, message, status) {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title} — TripM8</title>
<meta name="robots" content="noindex">
<link rel="icon" href="/favicon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/assets/css/styles.css">
</head>
<body>
<main class="wrap nf">
  <div>
    <h1>${title}</h1>
    <p>${message}</p>
    <a class="btn btn--dark" href="/">Back to home <span class="arw">&rarr;</span></a>
  </div>
</main>
</body>
</html>`;
  return new Response(html, {
    status: status,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  const wantsJson = (request.headers.get('Accept') || '').indexOf('application/json') !== -1;
  const fail = (status, msg) =>
    wantsJson ? json({ ok: false, error: msg }, status) : page('Something went wrong', msg, status);

  let form;
  try {
    const type = request.headers.get('Content-Type') || '';
    if (type.indexOf('application/json') !== -1) {
      const body = await request.json();
      form = { get: (k) => (body == null ? null : body[k]) };
    } else {
      form = await request.formData();
    }
  } catch (err) {
    return fail(400, 'We could not read that submission.');
  }

  // Bots fill every field they find; people never see this one.
  if (String(form.get('company') || '').trim() !== '') {
    return wantsJson
      ? json({ ok: true, message: "You're on the list." }, 200)
      : page("You're on the list", 'Thanks for your interest in TripM8 AI Glasses.', 200);
  }

  const email = String(form.get('email') || '').trim().toLowerCase();
  if (!email || email.length > MAX_EMAIL || !EMAIL.test(email)) {
    return fail(400, 'Please enter a valid email address.');
  }

  const role = pick(form.get('role'), ROLES);
  const keenness = pick(form.get('keenness'), KEENNESS);
  const note = String(form.get('note') || '').trim().slice(0, MAX_NOTE) || null;
  const country = (request.cf && request.cf.country) || null;

  if (!env.WAITLIST_DB) {
    console.error('WAITLIST_DB binding missing — signup not stored:', email);
    return fail(503, 'The waitlist is not accepting signups right now. Please try again shortly.');
  }

  try {
    await env.WAITLIST_DB.prepare(
      `INSERT INTO waitlist (email, role, keenness, note, country)
       VALUES (?1, ?2, ?3, ?4, ?5)
       ON CONFLICT(email) DO UPDATE SET
         role     = COALESCE(excluded.role, waitlist.role),
         keenness = COALESCE(excluded.keenness, waitlist.keenness),
         note     = COALESCE(excluded.note, waitlist.note),
         updated_at = datetime('now')`
    ).bind(email, role, keenness, note, country).run();
  } catch (err) {
    console.error('waitlist insert failed:', err && err.message);
    return fail(500, 'We could not save that just now. Please try again.');
  }

  return wantsJson
    ? json({ ok: true, message: "You're on the list — we'll be in touch." }, 200)
    : page("You're on the list", "Thanks — we'll email you when TripM8 AI Glasses are ready.", 200);
}

export function onRequest() {
  return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'POST' } });
}
