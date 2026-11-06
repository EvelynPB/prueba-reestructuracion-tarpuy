/** Llamadas a /api/admin/* con la clave del panel en la cabecera x-admin-key. Devuelven { ok, j }. */
export function crearApi(obtenerClave) {
  return async function api(url, opts = {}) {
    const r = await fetch(url, { ...opts, headers: { 'Content-Type': 'application/json', 'x-admin-key': obtenerClave() } });
    return { ok: r.ok, j: await r.json().catch(() => ({})) };
  };
}

export const enviarJSON = (method, cuerpo) => ({ method, body: JSON.stringify(cuerpo) });
