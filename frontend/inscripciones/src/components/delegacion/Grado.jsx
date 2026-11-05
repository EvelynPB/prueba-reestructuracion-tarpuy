import { MAX_POR_GRADO, aceptaCodigo } from '../../config/concurso.js';
import { soloDigitos } from '../../utils/validacion.js';
import { botonSecundario, claseCampo, cx } from '../comunes/estilos.js';

/** Un grado desplegable con la lista de sus alumnos (máximo 10, RN-02). */
export default function Grado({ indice, grado, alumnos, abierto, onAbrir, onAgregar, onQuitar, onCambiar, errores }) {
  const codigo = aceptaCodigo(grado.n);
  return (
    <details open={abierto} onToggle={e => onAbrir(e.currentTarget.open)}
      className="group mb-2.5 rounded-xl border-[1.5px] border-linea bg-fondo">
      <summary className="flex cursor-pointer list-none items-center justify-between px-3.5 py-3 font-bold group-open:border-b group-open:border-dashed group-open:border-linea">
        {grado.n}
        <span className="rounded-full bg-primario px-2.5 py-0.5 text-xs text-white">{alumnos.length} / {MAX_POR_GRADO}</span>
      </summary>
      <div className="px-3.5 pt-2 pb-3.5">
        {alumnos.map((a, k) => (
          <div key={a.id} className="grid grid-cols-[22px_1fr_34px] items-center gap-2 py-1.5 sm:grid-cols-[26px_150px_1fr_34px]">
            <span className="font-bold text-suave max-sm:row-span-2">{k + 1}</span>
            <input className={claseCampo(errores.has(`alumno-${indice}-${a.id}-dni`))} inputMode="numeric"
              maxLength={codigo ? 14 : 8} placeholder={codigo ? 'DNI / Cód. estud.' : 'DNI'} value={a.dni}
              onChange={e => onCambiar(a.id, 'dni', soloDigitos(e.target.value))} aria-label={`DNI del alumno ${k + 1} de ${grado.n}`} />
            <input className={cx(claseCampo(errores.has(`alumno-${indice}-${a.id}-nombre`)), 'max-sm:col-start-2 max-sm:row-start-2')}
              placeholder="Apellidos y nombres" value={a.nombre}
              onChange={e => onCambiar(a.id, 'nombre', e.target.value)} aria-label={`Nombre del alumno ${k + 1} de ${grado.n}`} />
            <button type="button" title="Quitar" onClick={() => onQuitar(a.id)}
              className="cursor-pointer border-0 bg-transparent pb-2 text-xl text-error max-sm:col-start-3 max-sm:row-span-2 max-sm:row-start-1">×</button>
          </div>
        ))}
        <button type="button" className={cx(botonSecundario, 'mt-2')} disabled={alumnos.length >= MAX_POR_GRADO} onClick={onAgregar}>
          + Agregar alumno
        </button>
      </div>
    </details>
  );
}
