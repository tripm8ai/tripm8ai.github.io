/**
 * POST /api/waitlist — records one step of the AI Glasses validation survey.
 *
 * The form saves after every step, keyed by a response_id the browser
 * generates, so abandoned responses still leave their answers behind and
 * last_step shows where people drop out. Step 3 attaches the email and marks
 * the response complete.
 *
 * Needs a D1 database bound as WAITLIST_DB. Without it the endpoint fails
 * loudly rather than dropping answers silently.
 *
 * Responds with JSON to fetch and with an HTML page to a plain form post, so
 * the survey still works when JavaScript is unavailable.
 */

const TRIPS = ['rarely', 'few', 'monthly', 'constantly'];
const ROLES = ['traveler', 'business', 'both'];
const FRICTIONS = ['language', 'food', 'getting-around', 'booking', 'context', 'none'];
const FIRST_USE = ['see', 'ask', 'navigate', 'book'];
const PRICES = ['free-only', 'under-199', '199-349', '350-599', '600-plus'];

const MAX_EMAIL = 254;
const MAX_NOTE = 280;
const RESPONSE_ID = /^[a-z0-9-]{8,64}$/;

// Deliberately permissive: this catches typos, it does not police RFC 5322.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const one = (value, allowed) => {
  const v = String(value == null ? '' : value).trim().toLowerCase();
  return allowed.indexOf(v) === -1 ? null : v;
};

const many = (values, allowed) => {
  const seen = [];
  for (const raw of values) {
    const v = one(raw, allowed);
    if (v && seen.indexOf(v) === -1) seen.push(v);
  }
  return seen.length ? seen.join(',') : null;
};

function json(body, status) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
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
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

export async function onRequestPost(context) {
  const { request, env } = context;

  const wantsJson = (request.headers.get('Accept') || '').indexOf('application/json') !== -1;
  const fail = (status, msg) =>
    wantsJson ? json({ ok: false, error: msg }, status) : page('Something went wrong', msg, status);

  let get, getAll;
  try {
    const type = request.headers.get('Content-Type') || '';
    if (type.indexOf('application/json') !== -1) {
      const body = (await request.json()) || {};
      get = (k) => body[k];
      getAll = (k) => (Array.isArray(body[k]) ? body[k] : body[k] == null ? [] : [body[k]]);
    } else {
      const form = await request.formData();
      get = (k) => form.get(k);
      getAll = (k) => form.getAll(k);
    }
  } catch {
    return fail(400, 'We could not read that submission.');
  }

  // Bots fill every field they find; people never see this one.
  if (String(get('company') || '').trim() !== '') {
    return wantsJson
      ? json({ ok: true, message: 'Thanks — that helps.' }, 200)
      : page('Thank you', 'Thanks for your interest in TripM8 AI Glasses.', 200);
  }

  // The browser mints this so the three steps land on one row. A post without
  // JavaScript arrives complete and in one piece, so it gets a fresh id here.
  const sent = String(get('response_id') || '').trim().toLowerCase();
  const responseId = RESPONSE_ID.test(sent) ? sent : crypto.randomUUID();

  // No step means a no-JS post of the whole form at once.
  const step = Math.min(3, Math.max(1, parseInt(get('step'), 10) || 3));
  const final = step === 3;

  const email = String(get('email') || '').trim().toLowerCase();
  if (final && (!email || email.length > MAX_EMAIL || !EMAIL.test(email))) {
    return fail(400, 'Please enter a valid email address.');
  }

  const row = {
    trips: one(get('trips'), TRIPS),
    role: one(get('role'), ROLES),
    frictions: many(getAll('frictions'), FRICTIONS),
    first_use: one(get('first_use'), FIRST_USE),
    price: one(get('price'), PRICES),
    beta: String(get('beta') || '') !== '' ? 1 : 0,
    note: String(get('note') || '').trim().slice(0, MAX_NOTE) || null,
    country: (request.cf && request.cf.country) || null,
  };

  if (!env.WAITLIST_DB) {
    console.error('WAITLIST_DB binding missing — response not stored:', responseId);
    return fail(503, 'The waitlist is not accepting signups right now. Please try again shortly.');
  }

  // COALESCE keeps answers from earlier steps: a later step sends only its own
  // fields, and nulls must not wipe what is already recorded.
  const upsert = `
    INSERT INTO waitlist
      (response_id, email, trips, role, frictions, first_use, price, beta, note,
       country, last_step, completed)
    VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12)
    ON CONFLICT(response_id) DO UPDATE SET
      email      = COALESCE(excluded.email, waitlist.email),
      trips      = COALESCE(excluded.trips, waitlist.trips),
      role       = COALESCE(excluded.role, waitlist.role),
      frictions  = COALESCE(excluded.frictions, waitlist.frictions),
      first_use  = COALESCE(excluded.first_use, waitlist.first_use),
      price      = COALESCE(excluded.price, waitlist.price),
      beta       = MAX(waitlist.beta, excluded.beta),
      note       = COALESCE(excluded.note, waitlist.note),
      last_step  = MAX(waitlist.last_step, excluded.last_step),
      completed  = MAX(waitlist.completed, excluded.completed),
      updated_at = datetime('now')`;

  const bind = [
    responseId, final ? email : null, row.trips, row.role, row.frictions,
    row.first_use, row.price, row.beta, row.note, row.country, step, final ? 1 : 0,
  ];

  try {
    await env.WAITLIST_DB.prepare(upsert).bind(...bind).run();
  } catch (err) {
    const msg = String((err && err.message) || err);

    // Someone answered again with an address already on the list. Fold the new
    // answers into the row that owns the email and drop this duplicate.
    if (final && msg.indexOf('UNIQUE') !== -1 && msg.indexOf('email') !== -1) {
      try {
        await env.WAITLIST_DB.batch([
          env.WAITLIST_DB.prepare(
            `UPDATE waitlist SET
               trips      = COALESCE(?2, trips),
               role       = COALESCE(?3, role),
               frictions  = COALESCE(?4, frictions),
               first_use  = COALESCE(?5, first_use),
               price      = COALESCE(?6, price),
               beta       = MAX(beta, ?7),
               note       = COALESCE(?8, note),
               last_step  = 3,
               completed  = 1,
               updated_at = datetime('now')
             WHERE email = ?1`
          ).bind(email, row.trips, row.role, row.frictions, row.first_use, row.price, row.beta, row.note),
          env.WAITLIST_DB.prepare(
            'DELETE FROM waitlist WHERE response_id = ?1 AND (email IS NULL OR email <> ?2)'
          ).bind(responseId, email),
        ]);
      } catch (mergeErr) {
        console.error('waitlist merge failed:', (mergeErr && mergeErr.message) || mergeErr);
        return fail(500, 'We could not save that just now. Please try again.');
      }
    } else {
      console.error('waitlist upsert failed:', msg);
      return fail(500, 'We could not save that just now. Please try again.');
    }
  }

  const message = final
    ? "You're on the list — we'll email you when there's something to try."
    : 'Saved.';

  return wantsJson
    ? json({ ok: true, step, done: final, message }, 200)
    : page("You're on the list", message, 200);
}

export function onRequest() {
  return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'POST' } });
}
