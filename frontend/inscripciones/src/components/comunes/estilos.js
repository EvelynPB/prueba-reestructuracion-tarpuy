/** Clases de Tailwind reutilizadas en varios componentes (una sola fuente para el estilo de campos y botones). */
export const cx = (...c) => c.filter(Boolean).join(' ');

export const claseCampo = (error) => cx(
  'w-full rounded-[10px] border-[1.5px] bg-fondo px-3 py-[11px] text-tinta outline-none',
  'placeholder:text-suave/60 focus:border-primario focus:shadow-[0_0_0_3px_rgba(59,63,216,.18)]',
  error ? 'border-error' : 'border-linea',
);

export const claseEtiqueta = 'mb-1 block text-[13px] font-bold';

const boton = 'cursor-pointer rounded-xl px-5 py-3 font-sans text-[15px] font-bold disabled:cursor-not-allowed disabled:opacity-60';
export const botonPrimario = cx(boton, 'border-0 bg-primario text-oscuro');
export const botonSecundario = cx(boton, 'border-[1.5px] border-primario bg-transparent text-primario');
export const botonAcento = cx(boton, 'border-0 bg-acento text-[#1b1f3b]');
