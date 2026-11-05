import { claseCampo, claseEtiqueta, cx } from './estilos.js';

/** Etiqueta + campo de texto. `filtro` limpia lo que se escribe (por ejemplo, solo dígitos). */
export default function Campo({ etiqueta, valor, onCambio, filtro, error, completo, className, ...props }) {
  return (
    <div className={cx(completo && 'col-span-full', className)}>
      <label className={claseEtiqueta}>{etiqueta}</label>
      <input className={claseCampo(error)} value={valor}
        onChange={e => onCambio(filtro ? filtro(e.target.value) : e.target.value)} {...props} />
    </div>
  );
}

/** Mensaje de confirmación o de error bajo un formulario. */
export function Mensaje({ mensaje, refMensaje }) {
  if (!mensaje) return null;
  return (
    <div ref={refMensaje} role="status"
      className={cx('mt-3.5 rounded-xl px-3.5 py-3 text-sm',
        mensaje.tipo === 'ok' ? 'bg-ok/12 text-ok' : 'bg-error/10 text-error')}>
      {mensaje.texto}
    </div>
  );
}
