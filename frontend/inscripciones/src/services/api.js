/** Llamadas a la API REST del Sistema de Inscripciones (mismo dominio, con la cookie de sesión). */
async function enviar(url, body, method = 'POST') {
  const r = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    credentials: 'same-origin',
  });
  let j = {};
  try { j = await r.json(); } catch { /* respuesta sin JSON */ }
  if (!r.ok) throw new Error(j.error || 'Error ' + r.status);
  return j;
}

export const inscribirDelegacion = data => enviar('/api/fichas', data);
export const inscribirLibre = data => enviar('/api/libres', data);

export const iniciarSesion = password => enviar('/api/admin/login', { password });
export const cerrarSesion = () => enviar('/api/admin/logout', {});
export const marcarVerificado = (t, id, v) => enviar('/api/admin/verify', { t, id, v }, 'PATCH');
export const URL_EXCEL = '/api/admin/export.xlsx';

/** Devuelve { fichas, libres }, o null si no hay sesión (401) o falla la red. */
export async function leerPanel() {
  try {
    const r = await fetch('/api/admin/data', { credentials: 'same-origin' });
    if (r.status === 401) return null;
    return await r.json();
  } catch {
    return null;
  }
}
