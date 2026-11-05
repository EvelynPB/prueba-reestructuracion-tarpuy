import { forwardRef } from 'react';

/** Tarjeta con título numerado (pasos 1, 2, 3…) y subtítulo. */
const Tarjeta = forwardRef(function Tarjeta({ numero, titulo, subtitulo, children }, ref) {
  return (
    <section ref={ref} className="mb-[18px] rounded-[18px] border border-linea bg-tarjeta p-6 shadow-[0_8px_30px_rgba(27,31,59,.08)]">
      <h2 className="mt-0 mb-1 flex items-center gap-2.5 font-serif text-[22px]/[normal] font-bold text-tinta">
        {numero !== undefined && (
          <span className="grid size-[30px] place-items-center rounded-full bg-primario font-sans text-[15px] font-bold text-oscuro">{numero}</span>
        )}
        {titulo}
      </h2>
      {subtitulo && <p className="mt-0 mb-[18px] text-sm text-tinta">{subtitulo}</p>}
      {children}
    </section>
  );
});

export default Tarjeta;
