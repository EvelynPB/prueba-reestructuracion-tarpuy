import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { cx, maxNivel, natural, nivelCat, nivelOrden, norm } from '../utils/texto.js';
import { enviarJSON } from './api.js';
import { caja, nota, resumenCaja } from './estilos.js';

// Todos los grados del concurso: aparecen en el selector aunque todavía no tengan alumnos inscritos
const GRADOS = [['Inicial', '4 años'], ['Inicial', '5 años'],
  ...[1, 2, 3, 4, 5, 6].map(n => ['Primaria', `${n}° de Primaria`]),
  ...[1, 2, 3, 4, 5].map(n => ['Secundaria', `${n}° de Secundaria`])];
const claveAl = a => a.tipo + ':' + a.id;
const claveGr = a => a.nivel + '|' + a.grado;
const claveG = (nivel, grado) => { const num = (norm(grado).match(/\d+/) || [])[0]; return nivelCat(nivel)[0] + (num || norm(grado)); };
const hms = v => (v && v.length === 5 ? v + ':00' : (v || ''));
const s = (n, uno, varios) => (n === 1 ? uno : varios);

/** Grados disponibles con su cantidad de inscritos y de puntajes ya cargados, agrupados por nivel. */
function agruparGrados(inscritos) {
  const mapa = new Map();
  for (const a of inscritos) {
    const k = claveGr(a);
    if (!mapa.has(k)) mapa.set(k, { nivel: a.nivel, grado: a.grado, n: 0, car: 0 });
    const g = mapa.get(k); g.n++; if (a.puntaje !== null) g.car++;
  }
  const cubiertas = new Set([...mapa.values()].map(g => claveG(g.nivel, g.grado)));
  for (const [nivel, grado] of GRADOS) if (!cubiertas.has(claveG(nivel, grado))) mapa.set(nivel + '|' + grado, { nivel, grado, n: 0, car: 0 });
  const grupos = [...mapa.entries()].sort((x, y) =>
    nivelOrden(x[1].nivel) - nivelOrden(y[1].nivel) || natural(x[1].nivel, y[1].nivel) || natural(x[1].grado, y[1].grado));
  const porNivel = new Map();
  for (const [k, g] of grupos) { const c = nivelCat(g.nivel); if (!porNivel.has(c)) porNivel.set(c, []); porNivel.get(c).push([k, g]); }
  return { claves: new Set(mapa.keys()), porNivel: [...porNivel.entries()] };
}

/** Tabla para escribir puntaje y hora de todos los alumnos de un grado y guardarlos juntos. */
export default function CargaPorGrado({ api, version }) {
  const [inscritos, setInscritos] = useState(null);
  const [errorCarga, setErrorCarga] = useState('');
  const [actual, setActual] = useState('');
  const [colegio, setColegio] = useState('');
  const [buscar, setBuscar] = useState('');
  const [borrador, setBorrador] = useState({});            // lo escrito y aún no guardado
  const [errFila, setErrFila] = useState({});              // mensajes de error por alumno
  const [msg, setMsg] = useState({ texto: '', error: false });
  const [guardando, setGuardando] = useState(false);
  const refTabla = useRef(null), refGuardar = useRef(null);
  const aviso = (texto, error = false) => setMsg({ texto, error });

  const cargar = useCallback(async () => {
    const { ok, j } = await api('/api/admin/inscritos');
    if (!ok) { setErrorCarga(j.error || 'No se pudo cargar la lista de inscritos'); return; }
    setErrorCarga(''); setInscritos(j.datos);
  }, [api]);
  useEffect(() => { cargar(); }, [cargar, version]);      // también se recarga al agregar o guardar en los otros formularios

  const sinGuardar = Object.keys(borrador).length;
  useEffect(() => {                                       // aviso si intentas salir con puntajes sin guardar
    if (!sinGuardar) return undefined;
    const h = e => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', h);
    return () => window.removeEventListener('beforeunload', h);
  }, [sinGuardar]);

  const lista = inscritos || [];
  const grados = useMemo(() => agruparGrados(lista), [lista]);
  const actualValido = grados.claves.has(actual) ? actual : '';
  const delGrado = lista.filter(a => claveGr(a) === actualValido);
  const [nivel, grado] = actualValido.split('|');
  const max = maxNivel(nivel);
  const colegios = [...new Set(delGrado.map(a => a.colegio))].sort(natural);
  const colegioSel = colegios.includes(colegio) ? colegio : '';
  const q = norm(buscar);
  const filas = delGrado
    .filter(a => (!colegioSel || a.colegio === colegioSel) && (!q || norm(a.nombre).includes(q) || String(a.dni).includes(q)))
    .sort((a, b) => natural(a.colegio, b.colegio) || natural(a.nombre, b.nombre));

  function elegirGrado(nuevo) {
    if (sinGuardar && !window.confirm('Tienes puntajes escritos que aún no guardaste. Si cambias de grado se perderán. ¿Cambiar de grado?')) return;
    setBorrador({}); setErrFila({}); setActual(nuevo); setColegio(''); setBuscar(''); aviso('');
  }

  function escribir(a, campo, valor) {
    const k = claveAl(a);
    setBorrador(bs => {
      const b = { ...(bs[k] || {}), [campo]: valor };
      const p = b.p !== undefined ? b.p : (a.puntaje ?? ''), h = b.h !== undefined ? b.h : (a.hora_entrega ?? '');
      const igual = String(p) === String(a.puntaje ?? '') && hms(h) === hms(a.hora_entrega ?? '');
      const copia = { ...bs };
      if (igual) delete copia[k]; else copia[k] = b;
      return copia;
    });
    setErrFila(e => { const c = { ...e }; delete c[k]; return c; });
    aviso('');
  }

  // Enter: pasa al siguiente campo (y, al final, al botón Guardar)
  function alPulsar(e) {
    if (e.key !== 'Enter' || !e.target.matches('input[data-f]')) return;
    e.preventDefault();
    const campos = [...refTabla.current.querySelectorAll('input[data-f]')], i = campos.indexOf(e.target);
    (campos[i + 1] || refGuardar.current).focus();
  }

  const actualizarLocal = cambios => setInscritos(xs => xs.map(a => (cambios[claveAl(a)] ? { ...a, ...cambios[claveAl(a)] } : a)));

  async function borrarResultado(a) {
    if (!window.confirm(`¿Borrar el resultado de ${a.nombre}?`)) return;
    const { ok, j } = await api('/api/admin/guardar', enviarJSON('DELETE', { tipo: a.tipo, id: a.id }));
    if (!ok) return aviso(j.error || 'No se pudo borrar', true);
    const k = claveAl(a);
    actualizarLocal({ [k]: { puntaje: null, hora_entrega: null } });
    setBorrador(bs => { const c = { ...bs }; delete c[k]; return c; });
    setErrFila(es => { const c = { ...es }; delete c[k]; return c; });
    aviso(`Resultado de ${a.nombre} borrado.`);
  }

  async function guardar() {
    const items = [], errores = {}; let primero = null;
    for (const a of delGrado) {
      const k = claveAl(a), b = borrador[k]; if (!b) continue;
      const p = b.p !== undefined ? b.p : (a.puntaje ?? ''), h = b.h !== undefined ? b.h : (a.hora_entrega ?? '');
      let error = null;
      if (String(p) === '' && !h) error = 'Para borrar un resultado usa el botón ✕';
      else if (String(p) === '' || !h) error = 'Falta el puntaje o la hora';
      else if (Number(p) < -100 || Number(p) > max) error = `El puntaje máximo es ${max}`;
      if (error) { errores[k] = error; primero = primero || k; } else items.push({ tipo: a.tipo, id: a.id, puntaje: p, hora: h });
    }
    setErrFila(errores);
    const problemas = Object.keys(errores).length;
    if (problemas) {
      aviso(`Revisa ${problemas} alumno${s(problemas, '', 's')} marcado${s(problemas, '', 's')}. No se guardó nada.`, true);
      setTimeout(() => refTabla.current?.querySelector(`tr[data-k="${primero}"]`)?.scrollIntoView({ block: 'center' }), 0);
      return;
    }
    if (!items.length) return aviso('No hay cambios para guardar.');
    setGuardando(true); aviso('Guardando…');
    const { ok, j } = await api('/api/admin/guardar-lote', enviarJSON('POST', { items }));
    setGuardando(false);
    if (!ok) {
      const es = {}; (j.errores || []).forEach(x => { es[x.tipo + ':' + x.id] = x.error; });
      setErrFila(es); return aviso(j.error || 'No se pudo guardar', true);
    }
    const cambios = {};
    items.forEach(it => { cambios[it.tipo + ':' + it.id] = { puntaje: Number(it.puntaje), hora_entrega: hms(it.hora) }; });
    actualizarLocal(cambios);
    setBorrador(bs => { const c = { ...bs }; Object.keys(cambios).forEach(k => delete c[k]); return c; });
    aviso(`✓ Se guardaron ${items.length} puntaje${s(items.length, '', 's')} de ${grado}.`);
  }

  let resumen;
  if (errorCarga && !inscritos) resumen = errorCarga;
  else if (!inscritos) resumen = 'Cargando inscritos…';
  else if (!actualValido) {
    const total = lista.length, car = lista.filter(a => a.puntaje !== null).length;
    resumen = total ? `${total} inscrito${s(total, '', 's')} hasta el momento · ${car} con puntaje. Elige un grado para empezar.` : 'Todavía no hay alumnos inscritos.';
  } else if (!delGrado.length) resumen = `${nivel} · ${grado}: todavía no hay alumnos inscritos en este grado.`;
  else {
    const car = delGrado.filter(a => a.puntaje !== null).length, dirty = delGrado.filter(a => borrador[claveAl(a)]).length;
    resumen = `${nivel} · ${grado}: ${delGrado.length} alumno${s(delGrado.length, '', 's')} · ${car} con puntaje · ${dirty} sin guardar. ` +
      '2. Escribe el puntaje y la hora de cada alumno (con Enter avanzas al siguiente campo). 3. Pulsa «Guardar» al terminar.';
  }

  const celda = 'border-b border-[rgba(128,160,190,.2)] px-2 py-1.5 text-left align-middle';
  return (
    <details open className={caja}>
      <summary className={resumenCaja}><strong>Cargar puntajes y hora de entrega por grado</strong></summary>
      <div className="my-3 flex flex-wrap items-end gap-2.5">
        <div className="flex-[2_1_260px]">
          <label htmlFor="iGrado">1. Elige el grado que vas a rellenar</label>
          <select id="iGrado" value={actualValido} onChange={e => elegirGrado(e.target.value)}>
            <option value="">Selecciona un grado…</option>
            {grados.porNivel.map(([n, gs]) => (
              <optgroup key={n} label={n}>
                {gs.map(([k, g]) => <option key={k} value={k}>{g.grado} · {g.n} inscrito{s(g.n, '', 's')} · {g.car} con puntaje</option>)}
              </optgroup>
            ))}
          </select>
        </div>
        <div className="flex-[1_1_150px]">
          <label htmlFor="iColegio">Colegio (opcional)</label>
          <select id="iColegio" value={colegioSel} onChange={e => setColegio(e.target.value)}>
            <option value="">Todos</option>{colegios.map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="flex-[1_1_150px]">
          <label htmlFor="iBuscar">Buscar (nombre o DNI)</label>
          <input id="iBuscar" autoComplete="off" placeholder="Escribe para filtrar" value={buscar} onChange={e => setBuscar(e.target.value)} />
        </div>
        <div className="flex-none"><button type="button" onClick={cargar}>Actualizar lista</button></div>
      </div>
      <p className={nota}>{resumen}</p>

      {actualValido && delGrado.length > 0 && (
        <div ref={refTabla} onKeyDown={alPulsar}>
          {!filas.length ? <p className={nota}>No hay alumnos con esos filtros.</p> : (
            <div className="mt-2 overflow-x-auto rounded-lg border border-[rgba(143,240,180,.25)]">
              <table className="w-full min-w-[520px] border-collapse">
                <thead><tr>{['Alumno', `Puntaje (máx. ${max})`, 'Hora de entrega', ''].map((t, i) => (
                  <th key={i} className={cx(celda, 'text-[.85rem] whitespace-nowrap opacity-85')}>{t}</th>))}</tr></thead>
                <tbody>
                  {filas.map(a => {
                    const k = claveAl(a), b = borrador[k] || {}, cargado = a.puntaje !== null;
                    const pv = b.p !== undefined ? b.p : (a.puntaje ?? ''), hv = b.h !== undefined ? b.h : (a.hora_entrega ?? '');
                    return (
                      <tr key={k} data-k={k} className={cx(cargado && '[&>td]:bg-[rgba(143,240,180,.10)]', borrador[k] && '[&>td:first-child]:shadow-[inset_3px_0_0_currentColor]')}>
                        <td className={celda}>
                          {a.nombre}<br /><small className="opacity-70">DNI {a.dni} · {a.colegio}</small>
                          <span className={cx('mt-[3px] block text-[.8rem]', errFila[k] && 'text-error')}>
                            {errFila[k] || (borrador[k] ? 'Sin guardar' : (cargado ? '✓ Cargado' : 'Pendiente'))}
                          </span>
                        </td>
                        <td className={cx(celda, 'w-[110px]')}>
                          <input type="number" step="0.01" min="-100" max={max} value={pv} data-f="p" placeholder={`0 a ${max}`} className="px-2 py-1.5"
                            aria-label={`Puntaje de ${a.nombre}`} onChange={e => escribir(a, 'p', e.target.value)} />
                        </td>
                        <td className={cx(celda, 'w-[160px]')}>
                          <input type="time" step="1" value={hv} data-f="h" className="px-2 py-1.5"
                            aria-label={`Hora de entrega de ${a.nombre}`} onChange={e => escribir(a, 'h', e.target.value)} />
                        </td>
                        <td className={cx(celda, 'w-[52px] text-center')}>
                          {cargado && <button type="button" className="boton-peligro" title="Borrar resultado" onClick={() => borrarResultado(a)}>✕</button>}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
      {actualValido && delGrado.length > 0 && (
        <div className="mt-3.5 flex flex-wrap items-center gap-3">
          <button type="button" ref={refGuardar} className="boton-primario" disabled={guardando} onClick={guardar}>Guardar puntajes de este grado</button>
          <span role="status" className={cx(nota, msg.error && 'text-error')}>{msg.texto}</span>
        </div>
      )}
    </details>
  );
}
