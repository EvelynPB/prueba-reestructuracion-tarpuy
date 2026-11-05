import { useEffect, useRef, useState } from 'react';
import { maxNivel } from '../utils/texto.js';
import { enviarJSON } from './api.js';
import { acciones, angosto, caja, fila2 } from './estilos.js';

/** Formulario para guardar o borrar el puntaje y la hora de entrega de un alumno. */
export default function FichaPuntaje({ alumno, api, onTerminar, onCancelar }) {
  const [puntaje, setPuntaje] = useState(alumno.puntaje ?? '');
  const [hora, setHora] = useState(alumno.hora_entrega ?? '');
  const refPuntaje = useRef(null);
  const max = maxNivel(alumno.nivel);

  useEffect(() => { refPuntaje.current?.focus(); }, []);

  async function guardar(e) {
    e.preventDefault();
    if (!window.confirm(`${alumno.nombre}\nPuntaje: ${puntaje}\nHora de entrega: ${hora}\n\n¿Guardar?`)) return;
    const { ok, j } = await api('/api/admin/guardar', enviarJSON('POST', { tipo: alumno.tipo, id: alumno.id, puntaje, hora }));
    if (!ok) return onTerminar(j.error || 'No se pudo guardar', true, false);
    onTerminar(`Guardado: ${alumno.nombre}, ${puntaje} pts, ${j.hora}`, false, true);
  }

  async function borrar() {
    if (!window.confirm(`¿Borrar el resultado de ${alumno.nombre}?`)) return;
    const { ok, j } = await api('/api/admin/guardar', enviarJSON('DELETE', { tipo: alumno.tipo, id: alumno.id }));
    if (!ok) return onTerminar(j.error || 'No se pudo borrar', true, false);
    onTerminar(`Resultado de ${alumno.nombre} borrado`, false, true);
  }

  return (
    <form className={`${caja} ${angosto}`} onSubmit={guardar}>
      <strong>{alumno.nombre}</strong>
      <div>{alumno.colegio} · {alumno.nivel} {alumno.grado} · DNI {alumno.dni}</div>
      <div className={fila2}>
        <div>
          <label htmlFor="p">Puntaje (máximo {max})</label>
          <input id="p" ref={refPuntaje} type="number" step="0.01" min="-100" max={max} required value={puntaje} onChange={e => setPuntaje(e.target.value)} />
        </div>
        <div>
          <label htmlFor="h">Hora de entrega (con segundos)</label>
          <input id="h" type="time" step="1" required value={hora} onChange={e => setHora(e.target.value)} />
        </div>
      </div>
      <div className={acciones}>
        <button className="boton-primario">Guardar resultado</button>
        <button type="button" onClick={onCancelar}>Cancelar</button>
        {alumno.puntaje !== null && <button type="button" className="boton-peligro" onClick={borrar}>Borrar resultado</button>}
      </div>
    </form>
  );
}
