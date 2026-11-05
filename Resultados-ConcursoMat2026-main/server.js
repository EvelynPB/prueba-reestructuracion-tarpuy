import express from 'express';
import { neon } from '@neondatabase/serverless';
import { timingSafeEqual } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const app = express();
app.set('trust proxy', 1);
app.use(express.json());

const aqui = path.dirname(fileURLToPath(import.meta.url));
let _lector, _admin;
const sqlLector = () => (_lector ??= neon(process.env.DATABASE_URL_LECTOR));
const sqlAdmin = () => (_admin ??= neon(process.env.DATABASE_URL_ADMIN));

/* ---------- Clave del panel, con límite de intentos ---------- */
const fallos = new Map(); // ip -> { n, hasta }
function autorizado(req, res) {
  const ip = req.ip;
  const f = fallos.get(ip);
  if (f && f.n >= 5 && f.hasta > Date.now()) {
    res.status(429).json({ error: 'Demasiados intentos. Espera 10 minutos.' });
    return false;
  }
  const a = Buffer.from(req.get('x-admin-key') || '');
  const b = Buffer.from(process.env.ADMIN_PASSWORD || '');
  const ok = b.length > 0 && a.length === b.length && timingSafeEqual(a, b);
  if (ok) { fallos.delete(ip); return true; }
  const n = (f && f.hasta > Date.now() ? f.n : 0) + 1;
  fallos.set(ip, { n, hasta: Date.now() + 10 * 60 * 1000 });
  res.status(401).json({ error: 'Clave incorrecta' });
  return false;
}

app.get('/health', (req, res) => res.send('ok'));

/* ---------- Niveles y grados válidos (4 años hasta 5.º de secundaria) ---------- */
const quitarTildes = t => String(t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
const GRADOS_VALIDOS = new Set(['I4', 'I5', 'P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'S1', 'S2', 'S3', 'S4', 'S5']);
function claveGrado(nivel, grado) {
  const n = quitarTildes(nivel), g = quitarTildes(grado);
  const cn = n.includes('inicial') ? 'I' : n.includes('primaria') ? 'P' : n.includes('secundaria') ? 'S' : null;
  const cg = g.includes('secundaria') ? 'S' : g.includes('primaria') ? 'P' : /ano/.test(g) ? 'I' : null;
  const num = (g.match(/\d+/) || [])[0];
  if (!cn || cn !== cg || !num) return null;
  const clave = cn + num;
  return GRADOS_VALIDOS.has(clave) ? clave : null;
}
// Devuelve el nivel y grado tal como ya están escritos en la base (si existen); si no, los enviados
async function resolverNivelGrado(sql, nivel, grado) {
  const clave = claveGrado(nivel, grado);
  if (!clave) return null;
  const pares = await sql`
    SELECT DISTINCT nivel, grado FROM (
      SELECT nivel, grado FROM alumnos
      UNION ALL
      SELECT nivel, grado FROM libres
    ) t`;
  const hit = pares.find(x => claveGrado(x.nivel, x.grado) === clave);
  return hit ? { nivel: hit.nivel, grado: hit.grado } : { nivel, grado };
}
const MEDIOS = ['Yape', 'Plin', 'Transferencia', 'Efectivo'];

/* ---------- API pública (solo lectura) ---------- */
let cache = { t: 0, body: null };
let cacheCol = { t: 0, body: null };

app.get('/api/resultados', async (req, res) => {
  try {
    if (cache.body && Date.now() - cache.t < 8000) return res.json(cache.body);
    const sql = sqlLector();
    const [cfg] = await sql`SELECT publicado FROM config_resultados WHERE id = 1`;
    const filas = await sql`
      SELECT tipo, nombre, colegio, nivel, grado, puntaje, hora_entrega, merito, merito_general,
             rindio, maximo, porcentaje
      FROM vista_resultados
      ORDER BY merito_general NULLS LAST, nombre`;
    cache = {
      t: Date.now(),
      body: {
        publicado: !!cfg?.publicado,
        datos: filas.map(f => ({
          ...f,
          puntaje: f.puntaje === null ? null : Number(f.puntaje),
          merito: f.merito === null ? null : Number(f.merito),
          merito_general: f.merito_general === null ? null : Number(f.merito_general),
          maximo: Number(f.maximo),
          porcentaje: f.porcentaje === null ? null : Number(f.porcentaje),
        })),
      },
    };
    res.json(cache.body);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'No se pudo leer los resultados' });
  }
});

app.get('/api/ranking-colegios', async (req, res) => {
  try {
    if (cacheCol.body && Date.now() - cacheCol.t < 8000) return res.json(cacheCol.body);
    const filas = await sqlLector()`
      SELECT puesto, colegio, inicial, primaria, secundaria, inicial_pts, primaria_pts, secundaria_pts,
             acumulado, promedio, rindieron, inscritos
      FROM vista_ranking_colegios
      ORDER BY puesto, colegio`;
    const num = v => (v === null || v === undefined ? null : Number(v));
    cacheCol = {
      t: Date.now(),
      body: {
        datos: filas.map(f => ({
          puesto: Number(f.puesto), colegio: f.colegio,
          inicial: num(f.inicial), primaria: num(f.primaria), secundaria: num(f.secundaria),
          inicial_pts: num(f.inicial_pts), primaria_pts: num(f.primaria_pts), secundaria_pts: num(f.secundaria_pts),
          acumulado: num(f.acumulado), promedio: num(f.promedio),
          rindieron: Number(f.rindieron), inscritos: Number(f.inscritos),
        })),
      },
    };
    res.json(cacheCol.body);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'No se pudo leer el ranking de delegaciones' });
  }
});

/* ---------- API del panel (protegida por clave) ---------- */
app.get('/api/admin/config', async (req, res) => {
  if (!autorizado(req, res)) return;
  const [c] = await sqlAdmin()`SELECT publicado FROM config_resultados WHERE id = 1`;
  res.json({ publicado: !!c?.publicado });
});

app.post('/api/admin/config', async (req, res) => {
  if (!autorizado(req, res)) return;
  const publicado = !!req.body.publicado;
  await sqlAdmin()`UPDATE config_resultados SET publicado = ${publicado} WHERE id = 1`;
  cache.t = 0; cacheCol.t = 0;
  res.json({ publicado });
});

app.get('/api/admin/buscar', async (req, res) => {
  if (!autorizado(req, res)) return;
  const q = String(req.query.q || '').trim();
  if (q.length < 2) return res.json({ datos: [] });
  const patron = `%${q}%`;
  try {
    const datos = await sqlAdmin()`
      SELECT * FROM (
        SELECT 'DELEGACION' AS tipo, a.id, a.nombre, a.dni, a.nivel, a.grado,
               f.ie AS colegio, r.puntaje, r.hora_entrega
        FROM alumnos a
        JOIN fichas f ON f.id = a.ficha_id
        LEFT JOIN resultados r ON r.alumno_id = a.id
        WHERE unaccent(a.nombre) ILIKE unaccent(${patron}) OR a.dni LIKE ${patron}
        UNION ALL
        SELECT 'LIBRE', l.id, l.nombre, l.dni, l.nivel, l.grado,
               'Alumno libre', r.puntaje, r.hora_entrega
        FROM libres l
        LEFT JOIN resultados r ON r.libre_id = l.id
        WHERE unaccent(l.nombre) ILIKE unaccent(${patron}) OR l.dni LIKE ${patron}
      ) t
      ORDER BY nombre
      LIMIT 20`;
    res.json({ datos: datos.map(d => ({ ...d, puntaje: d.puntaje === null ? null : Number(d.puntaje) })) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error al buscar' });
  }
});

function horaValida(h) {
  const m = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/.exec(h || '');
  if (!m) return null;
  const [hh, mm, ss] = [Number(m[1]), Number(m[2]), Number(m[3] || 0)];
  if (hh > 23 || mm > 59 || ss > 59) return null;
  const p = n => String(n).padStart(2, '0');
  return `${p(hh)}:${p(mm)}:${p(ss)}`;
}

app.post('/api/admin/guardar', async (req, res) => {
  if (!autorizado(req, res)) return;
  const { tipo, id, puntaje, hora } = req.body;
  const pts = Number(puntaje);
  const h = horaValida(hora);
  if (!Number.isInteger(id) || !['DELEGACION', 'LIBRE'].includes(tipo))
    return res.status(400).json({ error: 'Alumno no válido' });
  if (puntaje === '' || !Number.isFinite(pts) || pts < -100)
    return res.status(400).json({ error: 'El puntaje no es válido' });
  if (!h) return res.status(400).json({ error: 'La hora debe tener formato HH:MM o HH:MM:SS' });
  try {
    const sql = sqlAdmin();
    const [al] = tipo === 'DELEGACION'
      ? await sql`SELECT nivel FROM alumnos WHERE id = ${id}`
      : await sql`SELECT nivel FROM libres WHERE id = ${id}`;
    if (!al) return res.status(404).json({ error: 'Alumno no encontrado' });
    const maximo = quitarTildes(al.nivel).includes('inicial') ? 200 : 150;
    if (pts > maximo) return res.status(400).json({ error: `El puntaje máximo en ${al.nivel} es ${maximo}` });
    if (tipo === 'DELEGACION') {
      await sql`INSERT INTO resultados (alumno_id, puntaje, hora_entrega)
                VALUES (${id}, ${pts}, ${h})
                ON CONFLICT (alumno_id) DO UPDATE
                SET puntaje = EXCLUDED.puntaje, hora_entrega = EXCLUDED.hora_entrega`;
    } else {
      await sql`INSERT INTO resultados (libre_id, puntaje, hora_entrega)
                VALUES (${id}, ${pts}, ${h})
                ON CONFLICT (libre_id) DO UPDATE
                SET puntaje = EXCLUDED.puntaje, hora_entrega = EXCLUDED.hora_entrega`;
    }
    cache.t = 0; cacheCol.t = 0;
    res.json({ ok: true, hora: h });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'No se pudo guardar' });
  }
});

app.delete('/api/admin/guardar', async (req, res) => {
  if (!autorizado(req, res)) return;
  const { tipo, id } = req.body;
  if (!Number.isInteger(id)) return res.status(400).json({ error: 'Alumno no válido' });
  try {
    const sql = sqlAdmin();
    if (tipo === 'DELEGACION') await sql`DELETE FROM resultados WHERE alumno_id = ${id}`;
    else if (tipo === 'LIBRE') await sql`DELETE FROM resultados WHERE libre_id = ${id}`;
    else return res.status(400).json({ error: 'Alumno no válido' });
    cache.t = 0; cacheCol.t = 0;
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'No se pudo borrar' });
  }
});

/* ---------- Agregar alumno a una delegación (último momento) ---------- */
app.get('/api/admin/colegios', async (req, res) => {
  if (!autorizado(req, res)) return;
  const q = String(req.query.q || '').trim();
  const patron = `%${q}%`;
  try {
    const datos = await sqlAdmin()`
      SELECT f.id, f.ie, COUNT(a.id)::int AS alumnos
      FROM fichas f
      LEFT JOIN alumnos a ON a.ficha_id = f.id
      WHERE unaccent(f.ie) ILIKE unaccent(${patron})
      GROUP BY f.id, f.ie
      ORDER BY f.ie
      LIMIT 1000`;
    res.json({ datos });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error al buscar colegios' });
  }
});

app.get('/api/admin/opciones', async (req, res) => {
  if (!autorizado(req, res)) return;
  try {
    const datos = await sqlAdmin()`
      SELECT DISTINCT nivel, grado FROM (
        SELECT nivel, grado FROM alumnos
        UNION ALL
        SELECT nivel, grado FROM libres
      ) t`;
    let medios = [];
    try {
      medios = (await sqlAdmin()`SELECT DISTINCT medio FROM libres WHERE medio <> '' ORDER BY medio`).map(m => m.medio);
    } catch { /* si aún no hay permiso, el medio de pago se escribe a mano */ }
    res.json({ datos, medios });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Error al leer niveles y grados' });
  }
});

app.post('/api/admin/alumno', async (req, res) => {
  if (!autorizado(req, res)) return;
  const { ficha_id, nivel, grado } = req.body;
  const monto = Number(req.body.monto);
  let operacion = String(req.body.operacion || '').trim();
  const medio = MEDIOS.find(m => m.toLowerCase() === String(req.body.medio || '').trim().toLowerCase());
  const dni = String(req.body.dni || '').trim();
  const nombre = String(req.body.nombre || '').trim().replace(/\s+/g, ' ');
  if (!Number.isInteger(ficha_id)) return res.status(400).json({ error: 'Elige un colegio' });
  if (!Number.isInteger(monto) || monto < 0 || monto > 100000) return res.status(400).json({ error: 'El monto debe ser un número entero' });
  if (!medio) return res.status(400).json({ error: 'Elige un medio de pago válido' });
  if (!operacion && medio === 'Efectivo') operacion = 'EFECTIVO';
  if (!operacion || operacion.length > 60) return res.status(400).json({ error: 'Escribe el número de operación' });
  if (!nivel || !grado) return res.status(400).json({ error: 'Elige nivel y grado' });
  if (!/^[0-9A-Za-z]{8,12}$/.test(dni)) return res.status(400).json({ error: 'El DNI debe tener entre 8 y 12 caracteres, sin espacios' });
  if (nombre.length < 5 || nombre.length > 120) return res.status(400).json({ error: 'Escribe los apellidos y nombres completos' });
  try {
    const sql = sqlAdmin();
    const [f] = await sql`SELECT ie FROM fichas WHERE id = ${ficha_id}`;
    if (!f) return res.status(400).json({ error: 'Colegio no encontrado' });
    const ng = await resolverNivelGrado(sql, nivel, grado);
    if (!ng) return res.status(400).json({ error: 'El grado no corresponde al nivel elegido' });
    const dup = await sql`
      SELECT nombre FROM alumnos WHERE dni = ${dni}
      UNION ALL
      SELECT nombre FROM libres WHERE dni = ${dni}
      LIMIT 1`;
    if (dup.length) return res.status(409).json({ error: `Ese DNI ya está inscrito (${dup[0].nombre}).` });
    // Una sola instrucción: agrega al alumno, registra su pago y suma el monto a la ficha (todo o nada)
    const [n] = await sql`
      WITH nuevo AS (
        INSERT INTO alumnos (ficha_id, nivel, grado, nro, dni, nombre)
        SELECT ${ficha_id}::int, ${ng.nivel}::text, ${ng.grado}::text,
               COALESCE(MAX(nro), 0) + 1, ${dni}::text, ${nombre}::text
        FROM alumnos WHERE ficha_id = ${ficha_id}::int
        RETURNING id, nro
      ), pago AS (
        INSERT INTO pagos_adicionales (ficha_id, alumno_id, monto, medio, operacion)
        SELECT ${ficha_id}::int, nuevo.id, ${monto}::int, ${medio}::text, ${operacion}::text FROM nuevo
        RETURNING id
      ), ficha AS (
        UPDATE fichas SET monto = monto + ${monto}::int WHERE id = ${ficha_id}::int
        RETURNING monto
      )
      SELECT nuevo.id, nuevo.nro, (SELECT monto FROM ficha) AS monto_ficha FROM nuevo`;
    res.json({ ok: true, id: n.id, nro: n.nro, colegio: f.ie, nombre, dni, monto_ficha: n.monto_ficha });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'No se pudo agregar el alumno' });
  }
});

app.post('/api/admin/libre', async (req, res) => {
  if (!autorizado(req, res)) return;
  const { nivel, grado } = req.body;
  const dni = String(req.body.dni || '').trim();
  const nombre = String(req.body.nombre || '').trim().replace(/\s+/g, ' ');
  const monto = Number(req.body.monto);
  let operacion = String(req.body.operacion || '').trim();
  const medio = MEDIOS.find(m => m.toLowerCase() === String(req.body.medio || '').trim().toLowerCase());
  const pagador = String(req.body.pagador || '').trim().replace(/\s+/g, ' ');
  const telefono = String(req.body.telefono || '').trim();
  const verificado = !!req.body.verificado;
  if (!nivel || !grado) return res.status(400).json({ error: 'Elige nivel y grado' });
  if (!/^[0-9A-Za-z]{8,12}$/.test(dni)) return res.status(400).json({ error: 'El DNI debe tener entre 8 y 12 caracteres, sin espacios' });
  if (nombre.length < 5 || nombre.length > 120) return res.status(400).json({ error: 'Escribe los apellidos y nombres completos' });
  if (!Number.isInteger(monto) || monto < 0) return res.status(400).json({ error: 'El monto debe ser un número entero' });
  if (!medio) return res.status(400).json({ error: 'Elige un medio de pago válido' });
  if (!operacion && medio === 'Efectivo') operacion = 'EFECTIVO';
  if (!operacion || operacion.length > 60) return res.status(400).json({ error: 'Escribe el número de operación' });
  if (pagador.length < 3 || pagador.length > 120) return res.status(400).json({ error: 'Escribe el nombre del pagador' });
  if (!/^[0-9+\-\s]{7,20}$/.test(telefono)) return res.status(400).json({ error: 'Escribe un teléfono válido (solo números, entre 7 y 20 caracteres)' });
  try {
    const sql = sqlAdmin();
    const ng = await resolverNivelGrado(sql, nivel, grado);
    if (!ng) return res.status(400).json({ error: 'El grado no corresponde al nivel elegido' });
    const dup = await sql`
      SELECT nombre FROM alumnos WHERE dni = ${dni}
      UNION ALL
      SELECT nombre FROM libres WHERE dni = ${dni}
      LIMIT 1`;
    if (dup.length) return res.status(409).json({ error: `Ese DNI ya está inscrito (${dup[0].nombre}).` });
    const [n] = await sql`
      INSERT INTO libres (dni, grado, nivel, nombre, monto, operacion, medio, pagador, verificado, created_at, telefono)
      VALUES (${dni}::text, ${ng.grado}::text, ${ng.nivel}::text, ${nombre}::text, ${monto}::int,
              ${operacion}::text, ${medio}::text, ${pagador}::text, ${verificado}::boolean, now(), ${telefono}::text)
      RETURNING id`;
    res.json({ ok: true, id: n.id, nombre, dni });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'No se pudo agregar el alumno libre' });
  }
});

app.get('/api/admin/inscritos', async (req, res) => {
  if (!autorizado(req, res)) return;
  try {
    const filas = await sqlAdmin()`
      SELECT 'DELEGACION' AS tipo, a.id, a.nombre, a.dni, a.nivel, a.grado,
             f.ie AS colegio, r.puntaje, r.hora_entrega
      FROM alumnos a
      JOIN fichas f ON f.id = a.ficha_id
      LEFT JOIN resultados r ON r.alumno_id = a.id
      UNION ALL
      SELECT 'LIBRE', l.id, l.nombre, l.dni, l.nivel, l.grado,
             'Alumno libre', r.puntaje, r.hora_entrega
      FROM libres l
      LEFT JOIN resultados r ON r.libre_id = l.id
      ORDER BY nivel, grado, colegio, nombre`;
    res.json({ datos: filas.map(f => ({ ...f, puntaje: f.puntaje === null ? null : Number(f.puntaje) })) });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'No se pudo leer la lista de inscritos' });
  }
});

app.post('/api/admin/guardar-lote', async (req, res) => {
  if (!autorizado(req, res)) return;
  const items = Array.isArray(req.body.items) ? req.body.items : [];
  if (!items.length) return res.status(400).json({ error: 'No hay puntajes para guardar' });
  if (items.length > 500) return res.status(400).json({ error: 'Demasiados alumnos en un solo envío' });
  try {
    const sql = sqlAdmin();
    const niv = await sql`
      SELECT 'DELEGACION' AS tipo, id, nivel FROM alumnos
      UNION ALL
      SELECT 'LIBRE', id, nivel FROM libres`;
    const nivelDe = new Map(niv.map(r => [r.tipo + ':' + r.id, r.nivel]));
    const errores = [], consultas = [];
    for (const it of items) {
      const nivel = nivelDe.get(`${it.tipo}:${it.id}`);
      const pts = Number(it.puntaje), h = horaValida(it.hora);
      const maximo = nivel && quitarTildes(nivel).includes('inicial') ? 200 : 150;
      let msg = null;
      if (!nivel) msg = 'Alumno no encontrado';
      else if (it.puntaje === '' || it.puntaje === null || it.puntaje === undefined || !Number.isFinite(pts) || pts < -100) msg = 'Puntaje no válido';
      else if (pts > maximo) msg = `El puntaje máximo es ${maximo}`;
      else if (!h) msg = 'Hora no válida';
      if (msg) { errores.push({ tipo: it.tipo, id: it.id, error: msg }); continue; }
      consultas.push(it.tipo === 'DELEGACION'
        ? sql`INSERT INTO resultados (alumno_id, puntaje, hora_entrega) VALUES (${it.id}, ${pts}, ${h})
              ON CONFLICT (alumno_id) DO UPDATE SET puntaje = EXCLUDED.puntaje, hora_entrega = EXCLUDED.hora_entrega`
        : sql`INSERT INTO resultados (libre_id, puntaje, hora_entrega) VALUES (${it.id}, ${pts}, ${h})
              ON CONFLICT (libre_id) DO UPDATE SET puntaje = EXCLUDED.puntaje, hora_entrega = EXCLUDED.hora_entrega`);
    }
    if (errores.length)
      return res.status(400).json({ error: `Hay ${errores.length} alumno(s) con datos incorrectos. No se guardó nada.`, errores });
    await sql.transaction(consultas);            // todo o nada
    cache.t = 0; cacheCol.t = 0;
    res.json({ ok: true, guardados: consultas.length });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'No se pudo guardar. Intenta de nuevo.' });
  }
});

/* ---------- Importar puntajes desde Excel o CSV (se asignan por DNI) ---------- */
const normDni = v => {
  let t = String(v ?? '').trim().replace(/\.0+$/, '').replace(/[\s.\-]/g, '');
  if (/^\d{1,7}$/.test(t)) t = t.padStart(8, '0');          // Excel quita los ceros iniciales
  return t.toUpperCase();
};
function normHora(v) {
  if (v === null || v === undefined || v === '') return null;
  const pad = n => String(n).padStart(2, '0');
  const deSeg = t => `${pad(Math.floor(t / 3600))}:${pad(Math.floor((t % 3600) / 60))}:${pad(t % 60)}`;
  if (typeof v === 'number') {                                // Excel guarda la hora como fracción del día
    if (!Number.isFinite(v) || v < 0) return null;
    return deSeg(Math.round((v % 1) * 86400) % 86400);
  }
  const t = String(v).trim().toLowerCase().replace(/\./g, '').replace(/\s+/g, ' ');
  const m = /^(\d{1,2}):(\d{2})(?::(\d{2}))?(?:\s?(am|pm|a m|p m))?$/.exec(t);
  if (!m) return null;
  let hh = Number(m[1]); const mm = Number(m[2]), ss = Number(m[3] || 0);
  if (m[4]) {
    if (hh < 1 || hh > 12) return null;
    const pm = m[4][0] === 'p';
    if (pm && hh < 12) hh += 12;
    if (!pm && hh === 12) hh = 0;
  }
  if (hh > 23 || mm > 59 || ss > 59) return null;
  return `${pad(hh)}:${pad(mm)}:${pad(ss)}`;
}
const normPuntaje = v => (typeof v === 'number' ? v : (String(v ?? '').trim() === '' ? NaN : Number(String(v).trim().replace(',', '.'))));

async function analizarImportacion(sql, filas) {
  const alumnos = await sql`
    SELECT 'DELEGACION' AS tipo, a.id, a.nombre, a.dni, a.nivel, a.grado, f.ie AS colegio
    FROM alumnos a JOIN fichas f ON f.id = a.ficha_id
    UNION ALL
    SELECT 'LIBRE', l.id, l.nombre, l.dni, l.nivel, l.grado, 'Alumno libre' FROM libres l`;
  const previos = await sql`
    SELECT 'DELEGACION' AS tipo, alumno_id AS id, puntaje, hora_entrega FROM resultados WHERE alumno_id IS NOT NULL
    UNION ALL
    SELECT 'LIBRE', libre_id, puntaje, hora_entrega FROM resultados WHERE libre_id IS NOT NULL`;
  const porDni = new Map(alumnos.map(a => [normDni(a.dni), a]));
  const antes = new Map(previos.map(r => [r.tipo + ':' + r.id, { puntaje: Number(r.puntaje), hora: r.hora_entrega }]));

  const veces = new Map();
  for (const f of filas) { const d = normDni(f.dni); if (d) veces.set(d, [...(veces.get(d) || []), f.fila]); }

  const validas = [], noEncontrados = [], errores = [];
  for (const f of filas) {
    const dni = normDni(f.dni), fila = f.fila;
    if (!dni) { errores.push({ fila, dni: '', error: 'Falta el DNI' }); continue; }
    if (!/^[0-9A-Z]{8,12}$/.test(dni)) { errores.push({ fila, dni: String(f.dni), error: 'DNI no válido' }); continue; }
    if (veces.get(dni).length > 1) { errores.push({ fila, dni, error: `DNI repetido en el archivo (filas ${veces.get(dni).join(', ')})` }); continue; }
    const al = porDni.get(dni);
    if (!al) { noEncontrados.push({ fila, dni }); continue; }
    const pts = normPuntaje(f.puntaje), hora = normHora(f.hora);
    const maximo = quitarTildes(al.nivel).includes('inicial') ? 200 : 150;
    let error = null;
    if (!Number.isFinite(pts)) error = 'Puntaje no válido';
    else if (!Number.isInteger(pts)) error = 'El puntaje debe ser un número entero';
    else if (pts > maximo) error = `El puntaje máximo en ${al.nivel} es ${maximo}`;
    else if (pts < -100) error = 'Puntaje demasiado bajo';
    else if (!hora) error = 'Hora no válida (usa HH:MM:SS)';
    if (error) { errores.push({ fila, dni, error }); continue; }
    validas.push({ fila, tipo: al.tipo, id: al.id, dni, nombre: al.nombre, colegio: al.colegio, nivel: al.nivel, grado: al.grado,
                   puntaje: pts, hora, antes: antes.get(al.tipo + ':' + al.id) || null });
  }
  const enArchivo = new Set(validas.map(v => v.tipo + ':' + v.id));
  const sinResultado = alumnos.filter(a => !antes.has(a.tipo + ':' + a.id) && !enArchivo.has(a.tipo + ':' + a.id)).length;
  return {
    resumen: { leidas: filas.length, listas: validas.length, nuevas: validas.filter(v => !v.antes).length,
               reemplazan: validas.filter(v => v.antes).length, noEncontrados: noEncontrados.length,
               conErrores: errores.length, sinResultado },
    validas, noEncontrados, errores,
  };
}

app.post('/api/admin/importar', async (req, res) => {
  if (!autorizado(req, res)) return;
  const filas = Array.isArray(req.body.filas) ? req.body.filas : [];
  if (!filas.length) return res.status(400).json({ error: 'El archivo no tiene filas con datos' });
  if (filas.length > 3000) return res.status(400).json({ error: 'El archivo tiene demasiadas filas (máximo 3000)' });
  try {
    const sql = sqlAdmin();
    const r = await analizarImportacion(sql, filas);
    if (req.body.modo !== 'guardar') return res.json(r);
    if (r.errores.length) return res.status(400).json({ error: 'El archivo tiene filas con errores. Corrígelo y súbelo otra vez. No se importó nada.', ...r });
    if (!r.validas.length) return res.status(400).json({ error: 'No hay puntajes para importar', ...r });
    const paquete = tipo => JSON.stringify(r.validas.filter(v => v.tipo === tipo).map(v => ({ id: v.id, p: v.puntaje, h: v.hora })));
    const consultas = [];
    if (r.validas.some(v => v.tipo === 'DELEGACION'))
      consultas.push(sql`INSERT INTO resultados (alumno_id, puntaje, hora_entrega)
        SELECT (x->>'id')::int, (x->>'p')::numeric, (x->>'h')::time FROM jsonb_array_elements(${paquete('DELEGACION')}::jsonb) AS x
        ON CONFLICT (alumno_id) DO UPDATE SET puntaje = EXCLUDED.puntaje, hora_entrega = EXCLUDED.hora_entrega`);
    if (r.validas.some(v => v.tipo === 'LIBRE'))
      consultas.push(sql`INSERT INTO resultados (libre_id, puntaje, hora_entrega)
        SELECT (x->>'id')::int, (x->>'p')::numeric, (x->>'h')::time FROM jsonb_array_elements(${paquete('LIBRE')}::jsonb) AS x
        ON CONFLICT (libre_id) DO UPDATE SET puntaje = EXCLUDED.puntaje, hora_entrega = EXCLUDED.hora_entrega`);
    await sql.transaction(consultas);                 // todo o nada
    cache.t = 0; cacheCol.t = 0;
    res.json({ ok: true, guardados: r.validas.length, ...r });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'No se pudo procesar el archivo. Intenta de nuevo.' });
  }
});

/* ---------- Páginas (HTML) ---------- */
// /resultados -> public/resultados.html, /admin -> public/admin.html
app.use(express.static(path.join(aqui, 'public'), { extensions: ['html'] }));

app.listen(process.env.PORT || 3000, '0.0.0.0', () => console.log('Servidor listo'));
