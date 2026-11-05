'use strict';
/** GET /healthz: comprobación de salud que usa Fly.io. */
const { ping } = require('../repositories/schema.repository');

async function healthz(_req, res) {
  try { await ping(); res.json({ ok: true }); }
  catch { res.status(500).json({ ok: false }); }
}

module.exports = { healthz };
