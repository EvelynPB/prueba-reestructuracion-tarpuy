import { useRef, useState } from 'react';
import { cx } from '../utils/texto.js';
import { enviarJSON } from '../services/adminApi.js';
import { leerArchivo } from './archivo.js';
import { caja, nota, resumenCaja } from './estilos.js';

const TOPE = 300;
const listaCorta = 'my-1.5 max-h-[280px] overflow-auto';
const celda = 'border-b border-[rgba(128,160,190,.2)] px-2 py-1.5 text-left align-middle';

/** Importa puntajes desde un Excel o CSV: primero muestra una vista previa y luego guarda todo junto. */
export default function Importar({ api, onImportado }) {
  const [filas, setFilas] = useState([]);
  const [previa, setPrevia] = useState(null);
  const [msg, setMsg] = useState({ texto: '', error: false });
  const [importando, setImportando] = useState(false);
  const refArchivo = useRef(null);
  const aviso = (texto, error = false) => setMsg({ texto, error });

  function reiniciar() { if (refArchivo.current) refArchivo.current.value = ''; setPrevia(null); setFilas([]); }

  async function alElegir(e) {
    const file = e.target.files[0];
    setPrevia(null); setFilas([]);
    if (!file) return aviso('');
    aviso('Leyendo el archivo…');
    let leidas;
    try { leidas = await leerArchivo(file); } catch (err) { return aviso(err.message, true); }
    if (!leidas.length) return aviso('El archivo no tiene filas con datos.', true);
    aviso(`Revisando ${leidas.length} filas…`);
    const { ok, j } = await api('/api/admin/importar', enviarJSON('POST', { modo: 'previa', filas: leidas }));
    if (!ok) return aviso(j.error || 'No se pudo revisar el archivo', true);
    setFilas(leidas); setPrevia(j); aviso('');
  }

  async function confirmar() {
    const s = previa.resumen;
    if (!window.confirm(`Se importarán ${s.listas} puntajes.` +
        (s.reemplazan ? `\n${s.reemplazan} alumno(s) ya tenían resultado y se reemplazará.` : '') +
        (s.noEncontrados ? `\n${s.noEncontrados} DNI no se encontraron y no se importarán.` : '') + '\n\n¿Confirmar?')) return;
    setImportando(true); aviso('Importando…');
    const { ok, j } = await api('/api/admin/importar', enviarJSON('POST', { modo: 'guardar', filas }));
    setImportando(false);
    if (!ok) { if (j.resumen) setPrevia(j); return aviso(j.error || 'No se pudo importar', true); }
    reiniciar(); aviso(`✓ Se importaron ${j.guardados} puntajes.`);
    onImportado();
  }

  const s = previa?.resumen;
  return (
    <details className={caja}>
      <summary className={resumenCaja}><strong>Importar puntajes desde Excel o CSV</strong>: se asignan automáticamente por DNI</summary>
      <p className={nota}>El archivo debe tener tres columnas: <strong>dni</strong>, <strong>puntaje</strong> y <strong>hora_entrega</strong> (por ejemplo 09:41:12). Si un alumno ya tenía resultado, se reemplaza. Quien no aparezca en el archivo sigue como «No rindió».</p>
      <label htmlFor="impArchivo">Archivo (.xlsx, .xls o .csv)</label>
      <input id="impArchivo" ref={refArchivo} type="file" accept=".csv,.txt,.xlsx,.xls" onChange={alElegir} />
      <p role="status" className={cx(nota, msg.error && 'text-error')}>{msg.texto}</p>

      {previa && (
        <div>
          <p className={nota}>
            {s.leidas} filas leídas · {s.listas} listas para importar ({s.nuevas} nuevas, {s.reemplazan} reemplazan un resultado) · {s.noEncontrados} DNI no encontrados · {s.conErrores} con errores · {s.sinResultado} inscritos quedarán sin resultado ("No rindió").
          </p>
          {previa.validas.length > 0 && (
            <details className="my-2">
              <summary>Alumnos que se importarán</summary>
              <div className={cx(listaCorta, 'mt-2 overflow-x-auto rounded-lg border border-[rgba(143,240,180,.25)]')}>
                <table className="w-full min-w-[520px] border-collapse">
                  <thead><tr>{['Fila', 'DNI', 'Alumno', 'Grado', 'Puntaje', 'Hora', 'Antes'].map(t => <th key={t} className={cx(celda, 'text-[.85rem] opacity-85')}>{t}</th>)}</tr></thead>
                  <tbody>
                    {previa.validas.slice(0, TOPE).map(v => (
                      <tr key={v.fila}>
                        <td className={celda}>{v.fila}</td><td className={celda}>{v.dni}</td>
                        <td className={celda}>{v.nombre}<br /><small>{v.colegio}</small></td>
                        <td className={celda}>{v.nivel} · {v.grado}</td><td className={celda}>{v.puntaje}</td><td className={celda}>{v.hora}</td>
                        <td className={celda}>{v.antes ? `reemplaza ${v.antes.puntaje} (${v.antes.hora})` : 'nuevo'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {previa.validas.length > TOPE && <p className={nota}>…y {previa.validas.length - TOPE} más.</p>}
              </div>
            </details>
          )}
          {previa.noEncontrados.length > 0 && (
            <details className="my-2">
              <summary>DNI que no están en la base (no se importarán)</summary>
              <div className={cx(nota, listaCorta)}>{previa.noEncontrados.map(x => `Fila ${x.fila}: DNI ${x.dni}`).join(' · ')}</div>
            </details>
          )}
          {previa.errores.length > 0 && (
            <details open className="my-2">
              <summary>Filas con errores</summary>
              <div className={cx(nota, listaCorta)}>
                {previa.errores.map((x, i) => <div key={i} className="text-error">Fila {x.fila}{x.dni ? ` (DNI ${x.dni})` : ''}: {x.error}</div>)}
              </div>
            </details>
          )}
          {s.conErrores > 0 && <p className={cx(nota, 'text-error')}>Corrige las filas con errores en el archivo y súbelo otra vez: no se importa nada mientras haya errores.</p>}
          <div className="mt-3.5 flex flex-wrap items-center gap-3">
            <button type="button" className="boton-primario" disabled={importando || s.conErrores > 0 || s.listas === 0} onClick={confirmar}>
              Importar {s.listas} puntaje{s.listas === 1 ? '' : 's'}
            </button>
            <button type="button" onClick={() => { reiniciar(); aviso(''); }}>Cancelar</button>
          </div>
        </div>
      )}
    </details>
  );
}
