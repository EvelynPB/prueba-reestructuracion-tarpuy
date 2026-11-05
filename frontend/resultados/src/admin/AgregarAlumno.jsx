import { useEffect, useState } from 'react';
import { enviarJSON } from './api.js';
import { acciones, angosto, caja, fila2, resumenCaja } from './estilos.js';

const NIVELES = [
  { nivel: 'Inicial', grados: ['4 años', '5 años'] },
  { nivel: 'Primaria', grados: [1, 2, 3, 4, 5, 6].map(n => `${n}° de Primaria`) },
  { nivel: 'Secundaria', grados: [1, 2, 3, 4, 5].map(n => `${n}° de Secundaria`) },
];
const MEDIOS = ['Yape', 'Plin', 'Transferencia', 'Efectivo'];
const nivelDeGrado = g => NIVELES.find(x => x.grados.includes(g)).nivel;
const etiquetaOperacion = medio => (medio === 'Efectivo' ? 'N.º de operación (opcional en efectivo)' : 'N.º de operación');

function Selector({ id, etiqueta, valor, onCambio, children }) {
  return <div><label htmlFor={id}>{etiqueta}</label><select id={id} value={valor} onChange={e => onCambio(e.target.value)}>{children}</select></div>;
}
function Texto({ id, etiqueta, valor, onCambio, ...props }) {
  return <div><label htmlFor={id}>{etiqueta}</label><input id={id} autoComplete="off" value={valor} onChange={e => onCambio(e.target.value)} {...props} /></div>;
}
const opcionesMedio = MEDIOS.map(m => <option key={m}>{m}</option>);

/** Inscripción de último momento: a una delegación ya registrada o como alumno libre. */
export default function AgregarAlumno({ api, onAgregado }) {
  const [tipo, setTipo] = useState('DELEGACION');
  const [mapaColegios, setMapaColegios] = useState({});
  const [textoColegio, setTextoColegio] = useState('');
  const [colegio, setColegio] = useState(null);
  const [nivel, setNivel] = useState('Inicial');
  const [grado, setGrado] = useState('4 años');
  const [dni, setDni] = useState('');
  const [nombre, setNombre] = useState('');
  const [deleg, setDeleg] = useState({ monto: '13', medio: 'Yape', operacion: '' });
  const [libre, setLibre] = useState({ telefono: '', monto: '15', operacion: '', medio: 'Yape', pagador: '', verificado: false });
  const [msg, setMsg] = useState({ texto: '', error: false });
  const aviso = (texto, error = false) => setMsg({ texto, error });

  useEffect(() => {
    (async () => {
      const { ok, j } = await api('/api/admin/colegios');
      if (!ok) return aviso(j.error || 'No se pudo cargar la lista de colegios', true);
      const repetidos = {};
      j.datos.forEach(c => { repetidos[c.ie] = (repetidos[c.ie] || 0) + 1; });
      const mapa = {};                          // si dos fichas tienen el mismo nombre, se distinguen por su número
      j.datos.forEach(c => { mapa[repetidos[c.ie] > 1 ? `${c.ie} (ficha ${c.id})` : c.ie] = c; });
      setMapaColegios(mapa);
    })();
  }, [api]);

  const esLibre = tipo === 'LIBRE';

  async function agregar() {
    const d = dni.trim(), n = nombre.trim();
    if (!esLibre && !colegio) return aviso('Elige un colegio de la lista (debe estar ya registrado)', true);
    if (!d || !n) return aviso('Escribe el DNI y los apellidos y nombres', true);
    let url, cuerpo, resumen;
    if (esLibre) {
      const operacion = libre.operacion.trim(), telefono = libre.telefono.trim(), pagador = libre.pagador.trim();
      if (!telefono || !pagador) return aviso('El teléfono y el pagador son obligatorios', true);
      if (libre.monto === '') return aviso('Escribe el monto pagado', true);
      if (!operacion && libre.medio !== 'Efectivo') return aviso('Escribe el número de operación', true);
      url = '/api/admin/libre';
      cuerpo = { nivel, grado, dni: d, nombre: n, telefono, monto: Number(libre.monto), operacion, medio: libre.medio, pagador, verificado: libre.verificado };
      resumen = `Agregar como ALUMNO LIBRE:\n\n${n}\nDNI: ${d}\nTeléfono: ${telefono}\nPagador: ${pagador}\n${nivel} · ${grado}\nMonto: S/ ${libre.monto} · ${libre.medio}${operacion ? ' · Op. ' + operacion : ''}\nPago verificado: ${libre.verificado ? 'sí' : 'no'}`;
    } else {
      const operacion = deleg.operacion.trim();
      if (deleg.monto === '') return aviso('Escribe el monto pagado', true);
      if (!operacion && deleg.medio !== 'Efectivo') return aviso('Escribe el número de operación', true);
      url = '/api/admin/alumno';
      cuerpo = { ficha_id: colegio.id, nivel, grado, dni: d, nombre: n, monto: Number(deleg.monto), medio: deleg.medio, operacion };
      resumen = `Agregar a la delegación de ${colegio.ie}:\n\n${n}\nDNI: ${d}\n${nivel} · ${grado}\nPago: S/ ${deleg.monto} · ${deleg.medio}${operacion ? ' · Op. ' + operacion : ''}\nSe sumarán S/ ${deleg.monto} al monto de la ficha.`;
    }
    if (!window.confirm(resumen + '\n\n¿Confirmar?')) return;

    const { ok, j } = await api(url, enviarJSON('POST', cuerpo));
    if (!ok) return aviso(j.error || 'No se pudo agregar', true);
    if (esLibre) {
      aviso(`Agregado como alumno libre: ${j.nombre}. Ya puedes cargarle el puntaje abajo.`);
      setLibre(x => ({ ...x, telefono: '', operacion: '', pagador: '', monto: '15', verificado: false }));
      onAgregado({ tipo: 'LIBRE', id: j.id, nombre: j.nombre, dni: j.dni, nivel, grado, colegio: 'Alumno libre', puntaje: null, hora_entrega: null });
    } else {
      setColegio(c => ({ ...c, alumnos: c.alumnos + 1 }));
      aviso(`Agregado: ${j.nombre} (N.º ${j.nro}) en ${j.colegio}. Monto de la ficha ahora: S/ ${j.monto_ficha}. Ya puedes cargarle el puntaje abajo.`);
      setDeleg(x => ({ ...x, monto: '13', operacion: '' }));
      onAgregado({ tipo: 'DELEGACION', id: j.id, nombre: j.nombre, dni: j.dni, nivel, grado, colegio: j.colegio, puntaje: null, hora_entrega: null });
    }
    setDni(''); setNombre('');
  }

  return (
    <details className={`${caja} ${angosto}`}>
      <summary className={resumenCaja}><strong>Agregar alumno</strong> (inscripción de último momento)</summary>
      <div className="mt-3">
        <Selector id="nTipo" etiqueta="Tipo de participante" valor={tipo} onCambio={v => { setTipo(v); aviso(''); }}>
          <option value="DELEGACION">Alumno de una delegación</option>
          <option value="LIBRE">Alumno libre</option>
        </Selector>

        {!esLibre && (
          <div className="mt-3">
            <label htmlFor="qc">Colegio (escribe para buscar o elige de la lista)</label>
            <input id="qc" list="colegiosLista" placeholder="Escribe o elige el colegio" autoComplete="off" value={textoColegio}
              onChange={e => { setTextoColegio(e.target.value); setColegio(mapaColegios[e.target.value] || null); aviso(''); }} />
            <datalist id="colegiosLista">{Object.keys(mapaColegios).map(v => <option key={v} value={v} />)}</datalist>
            {colegio && <p>Colegio registrado (ficha {colegio.id}): <strong>{colegio.alumnos}</strong> alumno{colegio.alumnos === 1 ? '' : 's'} inscrito{colegio.alumnos === 1 ? '' : 's'}.</p>}
          </div>
        )}

        <div className={fila2}>
          {/* Al elegir un nivel, el grado salta al primero de ese nivel; al elegir un grado, el nivel se ajusta solo */}
          <Selector id="nNivel" etiqueta="Nivel" valor={nivel} onCambio={v => { setNivel(v); setGrado(NIVELES.find(x => x.nivel === v).grados[0]); }}>
            {NIVELES.map(x => <option key={x.nivel}>{x.nivel}</option>)}
          </Selector>
          <Selector id="nGrado" etiqueta="Grado" valor={grado} onCambio={v => { setGrado(v); setNivel(nivelDeGrado(v)); }}>
            {NIVELES.map(x => <optgroup key={x.nivel} label={x.nivel}>{x.grados.map(g => <option key={g} value={g}>{g}</option>)}</optgroup>)}
          </Selector>
        </div>
        <div className={fila2}>
          <Texto id="nDni" etiqueta="DNI" valor={dni} onCambio={setDni} maxLength={12} inputMode="numeric" />
          <Texto id="nNombre" etiqueta="Apellidos y nombres" valor={nombre} onCambio={setNombre} />
        </div>

        {!esLibre ? (
          <div>
            <div className={fila2}>
              <Texto id="dMonto" etiqueta="Monto pagado (S/)" valor={deleg.monto} onCambio={v => setDeleg(x => ({ ...x, monto: v }))} type="number" min="0" step="1" />
              <Selector id="dMedio" etiqueta="Medio de pago" valor={deleg.medio} onCambio={v => setDeleg(x => ({ ...x, medio: v }))}>{opcionesMedio}</Selector>
            </div>
            <div className={fila2}>
              <Texto id="dOperacion" etiqueta={etiquetaOperacion(deleg.medio)} valor={deleg.operacion} onCambio={v => setDeleg(x => ({ ...x, operacion: v }))} maxLength={60} />
              <div />
            </div>
            <p className="mt-0 mb-3 text-[.85rem] opacity-70">Este monto se suma al monto de la ficha del colegio.</p>
          </div>
        ) : (
          <div>
            <div className={fila2}>
              <Texto id="nTelefono" etiqueta="Teléfono" valor={libre.telefono} onCambio={v => setLibre(x => ({ ...x, telefono: v }))} maxLength={20} inputMode="tel" required />
              <Texto id="nMonto" etiqueta="Monto pagado (S/)" valor={libre.monto} onCambio={v => setLibre(x => ({ ...x, monto: v }))} type="number" min="0" step="1" />
            </div>
            <div className={fila2}>
              <Texto id="nOperacion" etiqueta={etiquetaOperacion(libre.medio)} valor={libre.operacion} onCambio={v => setLibre(x => ({ ...x, operacion: v }))} maxLength={60} />
              <Selector id="nMedio" etiqueta="Medio de pago" valor={libre.medio} onCambio={v => setLibre(x => ({ ...x, medio: v }))}>{opcionesMedio}</Selector>
            </div>
            <div className={fila2}>
              <Texto id="nPagador" etiqueta="Pagador" valor={libre.pagador} onCambio={v => setLibre(x => ({ ...x, pagador: v }))} maxLength={120} required />
              <div>
                <label htmlFor="nVerificado">Pago verificado</label>
                <label className="flex items-center gap-2 text-base opacity-100">
                  <input id="nVerificado" type="checkbox" className="w-auto" checked={libre.verificado}
                    onChange={e => setLibre(x => ({ ...x, verificado: e.target.checked }))} /> Sí, ya verifiqué el pago
                </label>
              </div>
            </div>
          </div>
        )}

        <div className={acciones}><button type="button" className="boton-primario" onClick={agregar}>Agregar alumno</button></div>
        <p role="status" className={msg.error ? 'text-error' : ''}>{msg.texto}</p>
      </div>
    </details>
  );
}
