import { useState } from 'react';
import { BANCO, YAPE } from '../../config/concurso.js';
import { soloOperaciones } from '../../utils/validacion.js';
import Campo from './Campo.jsx';
import { cx } from './estilos.js';

function IconoCelular() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#7a2cff" strokeWidth="1.8" strokeLinecap="round"
      strokeLinejoin="round" className="mr-2 inline align-[-5px]" aria-hidden="true">
      <rect x="6" y="2" width="12" height="20" rx="3" /><path d="M10.5 5.5h3" /><path d="M9.5 12.5l2 2 3.5-4" />
      <circle cx="12" cy="18.6" r=".6" fill="#7a2cff" />
    </svg>
  );
}

function BotonCopiar({ texto }) {
  const [copiado, setCopiado] = useState(false);
  const listo = () => { setCopiado(true); setTimeout(() => setCopiado(false), 1500); };
  function copiar() {
    const respaldo = () => {
      const ta = document.createElement('textarea'); ta.value = texto; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); listo(); } catch { /* sin portapapeles */ }
      ta.remove();
    };
    try { navigator.clipboard.writeText(texto).then(listo, respaldo); } catch { respaldo(); }
  }
  return (
    <button type="button" onClick={copiar}
      className="cursor-pointer rounded-lg border-0 bg-yape px-3 py-1 font-sans text-xs font-bold text-white">
      {copiado ? '¡Copiado!' : 'Copiar'}
    </button>
  );
}

const Pasos = ({ children }) => <ol className="mt-1.5 mb-3.5 pl-5 text-sm text-suave">{children}</ol>;

/**
 * Total a pagar, instrucciones de Yape o transferencia, N.° de operación y nombre de quien pagó.
 * `pago` = { medio, operacion, pagador } y `setPago` lo actualiza.
 */
export default function BloquePago({ monto, pago, setPago, errorOperacion }) {
  const metodo = m => cx('cursor-pointer rounded-[10px] border-[1.5px] border-yape p-2.5 font-sans text-sm font-bold',
    pago.medio === m ? 'bg-yape text-white' : 'bg-transparent text-yape-claro');
  const filaBanco = 'flex flex-wrap items-center gap-2 border-b border-dashed border-linea py-2 last:border-0';
  const nombreBanco = 'w-[130px] text-[13px] text-suave';
  const valorBanco = 'font-sans text-base font-bold tracking-[.3px] break-all';

  return (
    <div className="rounded-2xl border-2 border-dashed border-yape bg-[linear-gradient(135deg,rgba(122,44,255,.08),rgba(122,44,255,.02))] p-[18px]">
      <div className="text-suave">Total a pagar</div>
      <div className="font-serif text-4xl font-black text-yape-total">S/ {monto}</div>

      <div className="my-2.5 grid grid-cols-2 gap-2">
        <button type="button" className={metodo('Yape')} onClick={() => setPago({ ...pago, medio: 'Yape' })}>Yape</button>
        <button type="button" className={metodo('Transferencia')} onClick={() => setPago({ ...pago, medio: 'Transferencia' })}>
          Transferencia bancaria
        </button>
      </div>

      {pago.medio === 'Yape' ? (
        <div>
          <div className="my-2.5 flex flex-wrap items-center gap-4">
            {YAPE.qr && <img src={YAPE.qr} alt="QR de Yape" className="size-[170px] rounded-xl bg-white object-contain p-1.5" />}
            <div>
              <div className="font-sans text-[22px] font-bold tracking-[.5px]"><IconoCelular />{YAPE.num}</div>
              {YAPE.titular && <div className="text-suave">A nombre de {YAPE.titular}</div>}
            </div>
          </div>
          <Pasos>
            <li>Abre Yape, escanea el QR o yapea al número y paga el <b>total</b>.</li>
            <li>Copia el <b>N° de operación</b> de tu constancia.</li>
            <li>Escríbelo abajo y envía tu inscripción.</li>
          </Pasos>
        </div>
      ) : (
        <div>
          <div className="my-2.5 rounded-xl border border-linea bg-fondo px-3.5 py-1.5">
            <div className={filaBanco}><span className={nombreBanco}>Banco</span><b className={valorBanco}>{BANCO.banco} · Cuenta en {BANCO.moneda}</b></div>
            <div className={filaBanco}><span className={nombreBanco}>N° de cuenta</span><b className={valorBanco}>{BANCO.cuenta}</b><BotonCopiar texto={BANCO.cuenta} /></div>
            <div className={filaBanco}><span className={nombreBanco}>CCI (otros bancos)</span><b className={valorBanco}>{BANCO.cci}</b><BotonCopiar texto={BANCO.cci} /></div>
            <div className={filaBanco}><span className={nombreBanco}>Titular</span><b className={valorBanco}>{BANCO.titular}</b></div>
          </div>
          <Pasos>
            <li>Transfiere el <b>total</b> desde tu banca móvil (usa el CCI si es de otro banco).</li>
            <li>Copia el <b>N° de operación</b> de la constancia.</li>
            <li>Escríbelo abajo y envía tu inscripción.</li>
          </Pasos>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        <div>
          <Campo etiqueta="N° de operación *" valor={pago.operacion} filtro={soloOperaciones} error={errorOperacion}
            onCambio={v => setPago({ ...pago, operacion: v })} inputMode="numeric" maxLength={60} placeholder="Ej. 12345678" />
          <small className="text-suave">Si pagaste en varias partes, sepáralos con coma.</small>
        </div>
        <Campo etiqueta="Nombre de quien pagó (obligatorio)" valor={pago.pagador}
          onCambio={v => setPago({ ...pago, pagador: v })} placeholder="Nombre de quien hizo el pago" />
      </div>
    </div>
  );
}
