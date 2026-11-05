import { cx } from '../utils/texto.js';

/** Colores de los tres primeros puestos (oro, plata, bronce). */
const PODIO = {
  1: '[&>td]:bg-oro [&>td]:text-[#3d2c00] hover:[&>td]:bg-[#ffe35c]! [&>td:first-child]:shadow-[inset_6px_0_0_#b88a00] [&>td:first-child]:animate-pulso',
  2: '[&>td]:bg-plata [&>td]:text-[#16264a] hover:[&>td]:bg-[#f3f8ff]! [&>td:first-child]:shadow-[inset_6px_0_0_#8396b3]',
  3: '[&>td]:bg-bronce [&>td]:text-[#4a2000] hover:[&>td]:bg-[#ffb677]! [&>td:first-child]:shadow-[inset_6px_0_0_#c4601a]',
};
const PODIO_COMUN = '[&>td]:font-bold [&>td]:border-b-black/12 [&>td:first-child]:font-extrabold [&_small]:text-inherit [&_small]:opacity-75';

/** Clase de una fila según su puesto: medalla si está entre los 3 primeros; atenuada si no rindió. */
export const clasePodio = (puesto, rindio = true) => cx(
  rindio && puesto <= 3 && PODIO[puesto] && cx(PODIO[puesto], PODIO_COMUN),
  !rindio && '[&>td]:opacity-78',
);

export const celda = (numerica) => cx('border-b border-[rgba(120,220,255,.1)] px-3.5 py-2.5 text-left transition-colors group-last/fila:border-b-0',
  numerica && 'text-right whitespace-nowrap tabular-nums');

/**
 * Tabla ordenable: al pulsar una cabecera se ordena por esa columna (una segunda vez, al revés).
 * `animar` hace que las filas entren con una pequeña animación escalonada.
 */
export default function Tabla({ columnas, orden, onOrdenar, filas, animar }) {
  return (
    <div className="overflow-x-auto rounded-[14px] border border-linea bg-[rgba(8,20,48,.72)] shadow-[0_14px_44px_rgba(0,0,0,.35)]">
      <table className="w-full min-w-[640px] border-collapse">
        <thead>
          <tr>
            {columnas.map(([k, t, num]) => (
              <th key={k} onClick={() => onOrdenar(k)}
                className={cx('cursor-pointer border-b border-[rgba(120,220,255,.1)] bg-[rgba(120,220,255,.1)] px-3.5 py-2.5 text-left text-[.85rem] font-semibold tracking-[.02em] whitespace-nowrap text-verde-2 transition-colors select-none hover:bg-[rgba(120,220,255,.18)]',
                  num && 'text-right tabular-nums')}>
                {t}{orden.clave === k ? (orden.dir > 0 ? ' ▲' : ' ▼') : ''}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filas.map((f, i) => (
            <tr key={f.clave} className={cx('group/fila transition-colors hover:[&>td]:bg-[rgba(120,220,255,.16)]', f.clase, animar && 'animate-fila')}
              style={animar && i < 14 ? { animationDelay: (i + 1) * 0.04 + 's' } : undefined}>
              {f.celdas.map((c, j) => <td key={j} className={celda(columnas[j][2])}>{c}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
