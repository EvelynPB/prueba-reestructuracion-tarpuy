import { cx } from '../utils/texto.js';

/** Logo Tarpuy y título. `chica` = versión en fila para el panel. */
export default function Cabecera({ titulo, etiqueta, chica }) {
  if (chica) {
    return (
      <header className="mb-5 flex animate-aparece flex-row items-center gap-4 text-left">
        <img src="/img/logo.png" alt="Logo Tarpuy" width="84" height="89" className="block h-auto w-[84px] animate-logo" />
        <div className="min-w-0 flex-[1_1_260px] after:mt-3.5 after:block after:h-px after:max-w-[520px] after:bg-[linear-gradient(90deg,transparent,#8fe4ff,transparent)] after:shadow-[0_0_12px_#5fd0ff] after:content-['']">
          <p className="m-0 mb-1 text-[.8rem] tracking-[.32em] text-verde uppercase">{etiqueta}</p>
          <p className="m-0 font-exo text-[1.3rem] text-verde-2">{titulo}</p>
        </div>
      </header>
    );
  }
  return (
    <header className="mb-[30px] flex animate-aparece flex-col items-center gap-3.5 text-center max-[560px]:gap-4">
      <img src="/img/logo.png" alt="Logo Tarpuy" width="250" height="270" className="block h-auto w-[clamp(170px,26vw,250px)] animate-logo" />
      <div className="w-full min-w-0 after:mx-auto after:mt-3.5 after:block after:h-px after:max-w-[520px] after:bg-[linear-gradient(90deg,transparent,#8fe4ff,transparent)] after:shadow-[0_0_12px_#5fd0ff] after:content-['']">
        <Titulo>{titulo}</Titulo>
      </div>
    </header>
  );
}

export function Titulo({ children, className }) {
  return (
    <h1 className={cx('mt-0 mb-2.5 font-exo text-[clamp(1.5rem,4.2vw,2.5rem)]/[1.15] font-extrabold tracking-[.04em] text-titulo uppercase [text-shadow:0_0_22px_rgba(90,200,255,.45)]', className)}>
      {children}
    </h1>
  );
}
