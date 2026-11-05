import { NIVELES } from '../../config/concurso.js';
import { soloDigitos } from '../../utils/validacion.js';
import { claseCampo } from '../comunes/estilos.js';

/** Un asesor (nombre y teléfono) por cada nivel: Inicial, Primaria y Secundaria (RN-03). */
export default function Asesores({ asesores, onCambio, errores }) {
  return NIVELES.map(n => (
    <div key={n} className="mb-2 grid grid-cols-1 items-center gap-2 sm:grid-cols-[110px_1fr_160px]">
      <b>{n}</b>
      <input className={claseCampo(errores.has(`asesor-${n}-nombre`))} placeholder="Apellidos y nombres del asesor(a)"
        value={asesores[n].nombre} onChange={e => onCambio(n, 'nombre', e.target.value)} aria-label={`Asesor de ${n}`} />
      <input className={claseCampo(errores.has(`asesor-${n}-tel`))} inputMode="tel" maxLength={9} placeholder="Teléfono"
        value={asesores[n].tel} onChange={e => onCambio(n, 'tel', soloDigitos(e.target.value))} aria-label={`Teléfono del asesor de ${n}`} />
    </div>
  ));
}
