'use strict';
/** Datos fijos del concurso: grados, niveles y límite de alumnos por grado. */
const GRADOS = [
  { n: 'Inicial · 4 años', v: 'Inicial' },
  { n: 'Inicial · 5 años', v: 'Inicial' },
  ...[1, 2, 3, 4, 5, 6].map(i => ({ n: `${i}° de Primaria`, v: 'Primaria' })),
  ...[1, 2, 3, 4, 5].map(i => ({ n: `${i}° de Secundaria`, v: 'Secundaria' })),
];
const GRADO_NIVEL = Object.fromEntries(GRADOS.map(g => [g.n, g.v]));
const NIVELES = ['Inicial', 'Primaria', 'Secundaria'];
const MAX_POR_GRADO = 10; // RN-02

module.exports = { GRADOS, GRADO_NIVEL, NIVELES, MAX_POR_GRADO };
