import { useEffect, useRef, useState } from 'react';
import { angosto } from './estilos.js';

/** Busca alumnos por nombre o DNI (desde 2 letras) y devuelve el elegido con `onElegir`. */
export default function BuscarAlumno({ api, onElegir, onError, refBuscar }) {
  const [q, setQ] = useState('');
  const [resultados, setResultados] = useState(null);
  const temporizador = useRef(null);

  useEffect(() => {
    clearTimeout(temporizador.current);
    const texto = q.trim();
    if (texto.length < 2) { setResultados(null); return undefined; }
    temporizador.current = setTimeout(async () => {
      const { ok, j } = await api('/api/admin/buscar?q=' + encodeURIComponent(texto));
      if (!ok) return onError(j.error || 'Error al buscar');
      setResultados(j.datos);
    }, 250);
    return () => clearTimeout(temporizador.current);
  }, [q, api, onError]);

  function elegir(a) { setResultados(null); setQ(''); onElegir(a); }

  return (
    <div className={angosto}>
      <label htmlFor="q">Buscar alumno por nombre o DNI</label>
      <input id="q" ref={refBuscar} placeholder="Escribe al menos 2 letras" autoComplete="off" value={q} onChange={e => setQ(e.target.value)} />
      {resultados && (
        <ul className="my-2 list-none overflow-hidden rounded-xl border border-linea bg-[rgba(8,20,48,.85)] p-0">
          {resultados.length ? resultados.map(a => (
            <li key={a.tipo + a.id} onClick={() => elegir(a)}
              className="cursor-pointer border-b border-[rgba(120,220,255,.1)] px-3.5 py-2.5 transition-colors last:border-b-0 hover:bg-[rgba(120,220,255,.12)]">
              <strong>{a.nombre}</strong> — {a.colegio}, {a.nivel} {a.grado}
              {a.puntaje !== null && ` · ya tiene resultado (${a.puntaje} pts, ${a.hora_entrega})`}
            </li>
          )) : <li className="px-3.5 py-2.5">No se encontró ningún alumno.</li>}
        </ul>
      )}
    </div>
  );
}
