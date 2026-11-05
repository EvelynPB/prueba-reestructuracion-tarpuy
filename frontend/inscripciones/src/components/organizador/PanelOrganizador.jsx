import { URL_EXCEL } from '../../services/api.js';
import { separarOps } from '../../utils/validacion.js';
import Tarjeta from '../comunes/Tarjeta.jsx';
import { botonPrimario, botonSecundario } from '../comunes/estilos.js';

const celda = 'border-b border-linea px-2.5 py-2 text-left whitespace-nowrap';
const cabecera = celda + ' bg-fondo text-xs tracking-[.5px] text-suave uppercase';

/** Cuántas veces aparece cada N.° de operación entre todas las inscripciones (para alertar repetidos). */
function contarOperaciones(fichas, libres) {
  const veces = {};
  [...fichas, ...libres].forEach(r => separarOps(r.operacion).forEach(o => { veces[o] = (veces[o] || 0) + 1; }));
  return veces;
}

function CeldasPago({ registro, tabla, repetidas, onVerificar }) {
  const repetido = separarOps(registro.operacion).some(o => repetidas[o] > 1);
  return (
    <>
      <td className={celda + (repetido ? ' font-bold text-error' : '')} title={repetido ? 'N° de operación repetido' : undefined}>
        {registro.operacion}{repetido && ' ⚠'}<br />
        <small className="font-normal text-suave">{registro.medio || 'Yape'}</small>
      </td>
      <td className={celda}>
        <label className="m-0 cursor-pointer font-normal">
          <input type="checkbox" checked={registro.verificado} onChange={e => onVerificar(tabla, registro._id, e.target.checked)} />{' '}
          {registro.verificado ? '✓ Verificado' : 'Pendiente'}
        </label>
      </td>
    </>
  );
}

/** Panel del organizador: resumen, fichas, alumnos libres, verificación de pagos y Excel. */
export default function PanelOrganizador({ datos, refPanel, onVerificar, onCerrarSesion }) {
  const { fichas, libres } = datos;
  const repetidas = contarOperaciones(fichas, libres);
  const recaudado = fichas.reduce((s, r) => s + (r.monto || 0), 0) + libres.reduce((s, r) => s + (r.monto || 0), 0);
  const kpis = [
    [fichas.length, 'instituciones'],
    [fichas.reduce((s, r) => s + r.alumnos.length, 0), 'alumnos en delegaciones'],
    [libres.length, 'alumnos libres'],
    ['S/ ' + recaudado, 'recaudado'],
  ];

  return (
    <Tarjeta ref={refPanel} titulo="📊 Panel del organizador" subtitulo="Solo visible con tu contraseña. Se actualiza solo cada 20 segundos.">
      <div className="mb-3.5 flex flex-wrap gap-3">
        {kpis.map(([valor, texto]) => (
          <div key={texto} className="rounded-xl bg-fondo px-[18px] py-2.5">
            <b className="block font-serif text-[26px]/[normal] font-black">{valor}</b>{texto}
          </div>
        ))}
      </div>
      <div className="mb-3 flex flex-wrap items-center gap-2.5">
        <button type="button" className={botonPrimario} onClick={() => { window.location = URL_EXCEL; }}>⬇ Descargar Excel</button>
        <button type="button" className={botonSecundario} onClick={onCerrarSesion}>Cerrar sesión</button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead><tr>{['I.E.', 'Tipo', 'Director', 'Teléfono', 'Alumnos', 'Monto', 'N° operación', 'Pago'].map(t => <th key={t} className={cabecera}>{t}</th>)}</tr></thead>
          <tbody>
            {fichas.map(r => (
              <tr key={r._id}>
                <td className={celda}>{r.ie}</td><td className={celda}>{r.tipo}</td><td className={celda}>{r.director}</td>
                <td className={celda}>{r.tel}</td><td className={celda}>{r.alumnos.length}</td><td className={celda}>S/ {r.monto || ''}</td>
                <CeldasPago registro={r} tabla="fichas" repetidas={repetidas} onVerificar={onVerificar} />
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 className="mt-[18px] mb-2 font-bold">Alumnos libres</h3>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead><tr>{['DNI', 'Grado', 'Apellidos y nombres', 'Celular', 'Monto', 'N° operación', 'Pago'].map(t => <th key={t} className={cabecera}>{t}</th>)}</tr></thead>
          <tbody>
            {libres.map(r => (
              <tr key={r._id}>
                <td className={celda}>{r.dni}</td><td className={celda}>{r.grado}</td><td className={celda}>{r.nombre}</td>
                <td className={celda}>{r.tel}</td><td className={celda}>S/ {r.monto || ''}</td>
                <CeldasPago registro={r} tabla="libres" repetidas={repetidas} onVerificar={onVerificar} />
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Tarjeta>
  );
}
