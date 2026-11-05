'use strict';
/** Conexión a PostgreSQL (Neon) mediante un pool de conexiones. */
const { Pool } = require('pg');
const { DATABASE_URL } = require('./env');

const pool = new Pool({ connectionString: DATABASE_URL, max: 5, idleTimeoutMillis: 30000 });

module.exports = pool;
