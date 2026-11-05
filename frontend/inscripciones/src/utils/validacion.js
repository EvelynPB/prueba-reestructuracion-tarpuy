/** Validaciones del formulario (las mismas reglas que vuelve a revisar el servidor). */
export const soloDigitos = v => v.replace(/\D/g, '');
export const soloOperaciones = v => v.replace(/[^\d,;\s]/g, '');

/** Separa varios N.° de operación escritos con coma, punto y coma o espacios. */
export const separarOps = v => String(v || '').split(/[,;\s]+/).filter(Boolean);

/** RN-05: al menos un N.° de operación, cada uno de 6 a 12 dígitos. */
export const opsValidas = v => {
  const a = separarOps(v);
  return a.length > 0 && a.every(x => /^\d{6,12}$/.test(x));
};

export const telefonoValido = v => /^\d{6,9}$/.test(v);
export const correoValido = v => /^\S+@\S+\.\S+$/.test(v);

/** RN-04: DNI de 8 dígitos (o código de 14 dígitos cuando se permite). */
export const dniValido = (v, permiteCodigo) => (permiteCodigo ? /^(\d{8}|\d{14})$/ : /^\d{8}$/).test(v);
