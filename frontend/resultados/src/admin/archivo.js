/** Lectura de archivos de puntajes (.csv, .xlsx o .xls) en el navegador. */
const XLSX_URL = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';

/** El lector de Excel solo se descarga si alguien sube un .xlsx o .xls. */
const cargarXLSX = () => new Promise((ok, no) => {
  if (window.XLSX) return ok(window.XLSX);
  const s = document.createElement('script'); s.src = XLSX_URL;
  s.onload = () => ok(window.XLSX);
  s.onerror = () => no(new Error('No se pudo cargar el lector de Excel. Guarda el archivo como CSV e inténtalo de nuevo.'));
  document.head.appendChild(s);
});

/** CSV con separador «,», «;» o tabulación (se detecta solo) y comillas. */
export function parseCSV(texto) {
  texto = texto.replace(/^﻿/, '');
  const primera = texto.split(/\r?\n/, 1)[0] || '';
  const n = c => (primera.match(new RegExp(c, 'g')) || []).length;
  const sep = n(';') > n(',') ? ';' : (n('\t') > n(',') ? '\t' : ',');
  const out = []; let fila = [], campo = '', q = false;
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i];
    if (q) { if (c === '"') { if (texto[i + 1] === '"') { campo += '"'; i++; } else q = false; } else campo += c; }
    else if (c === '"') q = true;
    else if (c === sep) { fila.push(campo); campo = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && texto[i + 1] === '\n') i++; fila.push(campo); out.push(fila); fila = []; campo = ''; }
    else campo += c;
  }
  if (campo !== '' || fila.length) { fila.push(campo); out.push(fila); }
  return out;
}

/** Columnas: dni, puntaje, hora_entrega (con o sin encabezado). */
export function aFilas(matriz) {
  const lineas = matriz.map((r, i) => ({ n: i + 1, r })).filter(x => x.r.some(c => String(c ?? '').trim() !== ''));
  if (!lineas.length) return [];
  const cab = lineas[0].r.map(c => String(c ?? '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''));
  const iD = cab.findIndex(c => c.includes('dni')), iP = cab.findIndex(c => /punt|nota/.test(c)), iH = cab.findIndex(c => c.includes('hora'));
  let col, datos;
  if (iD >= 0 && iP >= 0 && iH >= 0) { col = [iD, iP, iH]; datos = lineas.slice(1); }
  else if (iD < 0 && iP < 0 && iH < 0) { col = [0, 1, 2]; datos = lineas; }
  else throw new Error('No encuentro las tres columnas. El encabezado debe tener: dni, puntaje y hora_entrega.');
  return datos.map(x => ({ fila: x.n, dni: x.r[col[0]] ?? '', puntaje: x.r[col[1]] ?? '', hora: x.r[col[2]] ?? '' }));
}

export async function leerArchivo(file) {
  if (/\.(xlsx|xls)$/i.test(file.name)) {
    const X = await cargarXLSX();
    const libro = X.read(await file.arrayBuffer(), { type: 'array' });
    return aFilas(X.utils.sheet_to_json(libro.Sheets[libro.SheetNames[0]], { header: 1, raw: true, defval: '' }));
  }
  return aFilas(parseCSV(await file.text()));
}
