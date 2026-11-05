/**
 * Datos fijos del concurso. Para cambiar precios, cuentas o el número de Yape, edita este archivo.
 * (Los precios que cobra de verdad los calcula el servidor: PRECIO_DELEGACION y PRECIO_LIBRE.)
 */
export const NIVELES = ['Inicial', 'Primaria', 'Secundaria'];

export const GRADOS = [
  { n: 'Inicial · 4 años', v: 'Inicial' },
  { n: 'Inicial · 5 años', v: 'Inicial' },
  ...[1, 2, 3, 4, 5, 6].map(i => ({ n: `${i}° de Primaria`, v: 'Primaria' })),
  ...[1, 2, 3, 4, 5].map(i => ({ n: `${i}° de Secundaria`, v: 'Secundaria' })),
];

export const MAX_POR_GRADO = 10;
export const PRECIO_DELEGACION = 13;
export const PRECIO_LIBRE = 15;

/** En 5.° de Primaria se acepta también el código de estudiante (14 dígitos). */
export const aceptaCodigo = grado => grado.startsWith('5° de Primaria');

export const YAPE = {
  num: '991 999 201',
  titular: 'Angela Samantha Taipe Asparrin',
  qr: '/img/qr-yape.png',
};

export const BANCO = {
  banco: 'BCP',
  cuenta: '19117783511041',
  cci: '00219111778351104157',
  titular: 'Ángela S. Taipe A.',
  moneda: 'Soles',
};

export const WHATSAPP = [
  { texto: '991 999 201', url: 'https://wa.me/51991999201' },
  { texto: '995 973 374', url: 'https://wa.me/51995973374' },
];
