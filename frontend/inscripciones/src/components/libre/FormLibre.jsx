import { useState } from 'react';
import { GRADOS, PRECIO_LIBRE } from '../../config/concurso.js';
import { inscribirLibre } from '../../services/api.js';
import { opsValidas, separarOps, soloDigitos } from '../../utils/validacion.js';
import BloquePago from '../comunes/BloquePago.jsx';
import Campo, { Mensaje } from '../comunes/Campo.jsx';
import Tarjeta from '../comunes/Tarjeta.jsx';
import { botonAcento, claseCampo, claseEtiqueta } from '../comunes/estilos.js';

const VACIO = { dni: '', grado: '', nombre: '', cel: '' };

/** Inscripción de un alumno que participa sin delegación. */
export default function FormLibre() {
  const [alumno, setAlumno] = useState(VACIO);
  const [pago, setPago] = useState({ medio: 'Yape', operacion: '', pagador: '' });
  const [errores, setErrores] = useState(new Set());
  const [mensaje, setMensaje] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const cambiar = campo => v => setAlumno(x => ({ ...x, [campo]: v }));

  async function enviar() {
    const e = new Set();
    if (!/^\d{8}$/.test(alumno.dni)) e.add('dni');
    if (alumno.grado === '') e.add('grado');
    if (!alumno.nombre.trim()) e.add('nombre');
    if (!opsValidas(pago.operacion)) e.add('operacion');
    setErrores(e);
    if (e.size) return setMensaje({ tipo: 'bad', texto: 'Revisa los campos en rojo.' });

    const g = GRADOS[alumno.grado];
    const data = {
      dni: alumno.dni, grado: g.n, nivel: g.v, nombre: alumno.nombre.trim(), tel: alumno.cel, monto: PRECIO_LIBRE,
      operacion: separarOps(pago.operacion).join(', '), medio: pago.medio, pagador: pago.pagador.trim(), fecha: new Date().toISOString(),
    };
    setEnviando(true);
    try {
      await inscribirLibre(data);
      setMensaje({ tipo: 'ok', texto: `¡Inscripción enviada! ${data.nombre} (${data.grado}). Pago registrado: S/ ${PRECIO_LIBRE}.` });
      setAlumno(VACIO); setPago(p => ({ ...p, operacion: '', pagador: '' }));
    } catch (err) {
      setMensaje({ tipo: 'bad', texto: 'Error al enviar: ' + err.message });
    }
    setEnviando(false);
  }

  return (
    <div>
      <Tarjeta numero={1} titulo="Datos del alumno libre" subtitulo="Para quienes participan sin delegación.">
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <Campo etiqueta="DNI *" valor={alumno.dni} onCambio={cambiar('dni')} filtro={soloDigitos} error={errores.has('dni')}
            inputMode="numeric" maxLength={8} placeholder="8 dígitos" />
          <div>
            <label className={claseEtiqueta} htmlFor="libre-grado">Grado *</label>
            <select id="libre-grado" className={claseCampo(errores.has('grado'))} value={alumno.grado}
              onChange={e => cambiar('grado')(e.target.value)}>
              <option value="">Elegir…</option>
              {GRADOS.map((g, i) => <option key={g.n} value={i}>{g.n}</option>)}
            </select>
          </div>
          <Campo completo etiqueta="Apellidos y nombres *" valor={alumno.nombre} onCambio={cambiar('nombre')} error={errores.has('nombre')}
            placeholder="Apellidos y nombres del alumno" />
          <Campo completo etiqueta="Celular / WhatsApp *" valor={alumno.cel} onCambio={cambiar('cel')} filtro={soloDigitos}
            inputMode="tel" maxLength={9} placeholder="9 dígitos, para comunicarnos por WhatsApp" />
        </div>
      </Tarjeta>
      <Tarjeta numero={2} titulo="Pago de la inscripción" subtitulo="Paga con Yape o transferencia bancaria y registra tu número de operación.">
        <BloquePago monto={PRECIO_LIBRE} pago={pago} setPago={setPago} errorOperacion={errores.has('operacion')} />
        <div className="mt-3.5 flex justify-end">
          <button type="button" className={botonAcento} disabled={enviando} onClick={enviar}>Enviar inscripción ✓</button>
        </div>
        <Mensaje mensaje={mensaje} />
      </Tarjeta>
    </div>
  );
}
