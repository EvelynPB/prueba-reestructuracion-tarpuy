import { useEffect, useRef, useState } from 'react';
import { GRADOS, MAX_POR_GRADO, NIVELES, PRECIO_DELEGACION, aceptaCodigo } from '../../config/concurso.js';
import { inscribirDelegacion } from '../../services/api.js';
import { correoValido, dniValido, opsValidas, separarOps, soloDigitos, telefonoValido } from '../../utils/validacion.js';
import BloquePago from '../comunes/BloquePago.jsx';
import Campo, { Mensaje } from '../comunes/Campo.jsx';
import Tarjeta from '../comunes/Tarjeta.jsx';
import { botonAcento, claseEtiqueta, cx } from '../comunes/estilos.js';
import Asesores from './Asesores.jsx';
import Grado from './Grado.jsx';

const IE_VACIA = { ie: '', director: '', tipo: '', dir: '', tel: '', mail: '' };
const asesoresVacios = () => Object.fromEntries(NIVELES.map(n => [n, { nombre: '', tel: '' }]));
const gradosVacios = () => GRADOS.map(() => []);
let siguienteId = 1;

/** Inscripción por delegación: datos de la I.E., asesores, alumnos por grado y pago. */
export default function FormDelegacion() {
  const [ie, setIe] = useState(IE_VACIA);
  const [asesores, setAsesores] = useState(asesoresVacios);
  const [alumnos, setAlumnos] = useState(gradosVacios);      // un arreglo de alumnos por grado
  const [abiertos, setAbiertos] = useState(() => GRADOS.map(() => false));
  const [pago, setPago] = useState({ medio: 'Yape', operacion: '', pagador: '' });
  const [errores, setErrores] = useState(new Set());
  const [mensaje, setMensaje] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const refMensaje = useRef(null);

  useEffect(() => { refMensaje.current?.scrollIntoView({ block: 'nearest' }); }, [mensaje]);

  const total = alumnos.reduce((s, l) => s + l.length, 0);
  const cambiarIe = campo => v => setIe(x => ({ ...x, [campo]: v }));

  const agregarAlumno = g => setAlumnos(xs => xs.map((l, i) =>
    i === g && l.length < MAX_POR_GRADO ? [...l, { id: siguienteId++, dni: '', nombre: '' }] : l));
  const quitarAlumno = (g, id) => setAlumnos(xs => xs.map((l, i) => (i === g ? l.filter(a => a.id !== id) : l)));
  const cambiarAlumno = (g, id, campo, v) => setAlumnos(xs => xs.map((l, i) =>
    i === g ? l.map(a => (a.id === id ? { ...a, [campo]: v } : a)) : l));
  function abrirGrado(g, abierto) {
    setAbiertos(xs => xs.map((x, i) => (i === g ? abierto : x)));
    if (abierto && alumnos[g].length === 0) agregarAlumno(g);   // al abrir un grado vacío aparece la primera fila
  }

  function validar() {
    const e = new Set();
    let texto = 'Revisa los campos en rojo.';
    ['ie', 'director', 'dir'].forEach(c => { if (!ie[c].trim()) e.add(c); });
    if (!telefonoValido(ie.tel)) e.add('tel');
    if (!correoValido(ie.mail)) e.add('mail');
    if (!ie.tipo) e.add('tipo');

    const lista = [], vistos = new Set(), nivelesUsados = new Set();
    GRADOS.forEach((g, gi) => alumnos[gi].forEach((a, k) => {
      const repetido = vistos.has(a.dni); vistos.add(a.dni);
      if (repetido) texto = 'Hay un DNI repetido.';
      if (!dniValido(a.dni, aceptaCodigo(g.n)) || repetido) e.add(`alumno-${gi}-${a.id}-dni`);
      if (!a.nombre.trim()) e.add(`alumno-${gi}-${a.id}-nombre`);
      lista.push({ nivel: g.v, grado: g.n, n: k + 1, dni: a.dni, nombre: a.nombre.trim() });
      nivelesUsados.add(g.v);
    }));

    const listaAsesores = [];
    NIVELES.forEach(n => {
      const a = asesores[n];
      if (nivelesUsados.has(n) || a.nombre.trim() || a.tel) {
        if (!a.nombre.trim()) e.add(`asesor-${n}-nombre`);
        if (!telefonoValido(a.tel)) e.add(`asesor-${n}-tel`);
        listaAsesores.push({ nivel: n, nombre: a.nombre.trim(), tel: a.tel });
      }
    });
    if (!opsValidas(pago.operacion)) e.add('operacion');
    return { e, texto, lista, listaAsesores };
  }

  async function enviar() {
    const { e, texto, lista, listaAsesores } = validar();
    setErrores(e);
    if (!lista.length) return setMensaje({ tipo: 'bad', texto: 'Agrega al menos un alumno en algún grado.' });
    if (e.size) {
      return setMensaje({ tipo: 'bad', texto: texto + ' (DNI de 8 dígitos; cada nivel con alumnos necesita su asesor; falta el N° de operación del pago).' });
    }
    const data = {
      ie: ie.ie.trim(), director: ie.director.trim(), tipo: ie.tipo, dir: ie.dir.trim(), tel: ie.tel, mail: ie.mail.trim(),
      asesores: listaAsesores, alumnos: lista, monto: lista.length * PRECIO_DELEGACION,
      operacion: separarOps(pago.operacion).join(', '), medio: pago.medio, pagador: pago.pagador.trim(), fecha: new Date().toISOString(),
    };
    setEnviando(true);
    try {
      await inscribirDelegacion(data);
      setMensaje({ tipo: 'ok', texto: `¡Inscripción enviada! ${data.ie} con ${lista.length} alumno(s). Pago registrado: S/ ${data.monto}.` });
      setIe(IE_VACIA); setAsesores(asesoresVacios()); setAlumnos(gradosVacios()); setAbiertos(GRADOS.map(() => false));
      setPago(p => ({ ...p, operacion: '', pagador: '' }));
    } catch (err) {
      setMensaje({ tipo: 'bad', texto: 'Error al enviar: ' + err.message });
    }
    setEnviando(false);
  }

  return (
    <div>
      <Tarjeta numero={1} titulo="Datos de la institución educativa" subtitulo="Los campos con * son obligatorios.">
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <Campo completo etiqueta="Nombre de la I.E. *" valor={ie.ie} onCambio={cambiarIe('ie')} error={errores.has('ie')}
            placeholder="Nombre de la institución educativa" />
          <Campo etiqueta="Director(a) *" valor={ie.director} onCambio={cambiarIe('director')} error={errores.has('director')}
            placeholder="Apellidos y nombres" />
          <div>
            <label className={claseEtiqueta}>Tipo de I.E. *</label>
            <div className={cx('flex gap-2.5 rounded-[10px]', errores.has('tipo') && 'outline-2 outline-error')}>
              {['Estatal', 'Privado'].map(t => (
                <label key={t} className="m-0 flex flex-1 cursor-pointer items-center gap-2 rounded-[10px] border-[1.5px] border-linea bg-fondo px-3 py-2.5 text-[13px] font-bold">
                  <input type="radio" name="tipo" value={t} checked={ie.tipo === t} onChange={() => cambiarIe('tipo')(t)} /> {t}
                </label>
              ))}
            </div>
          </div>
          <Campo completo etiqueta="Dirección de la I.E. *" valor={ie.dir} onCambio={cambiarIe('dir')} error={errores.has('dir')}
            placeholder="Av./Calle, número, distrito" />
          <Campo etiqueta="Teléfono *" valor={ie.tel} onCambio={cambiarIe('tel')} filtro={soloDigitos} error={errores.has('tel')}
            inputMode="tel" maxLength={9} placeholder="Celular o fijo" />
          <Campo etiqueta="Correo *" valor={ie.mail} onCambio={cambiarIe('mail')} error={errores.has('mail')}
            type="email" placeholder="correo@ejemplo.com" />
        </div>
      </Tarjeta>

      <Tarjeta numero={2} titulo="Asesores por nivel" subtitulo="Completa el nivel o niveles con los que participarán.">
        <Asesores asesores={asesores} errores={errores}
          onCambio={(n, campo, v) => setAsesores(x => ({ ...x, [n]: { ...x[n], [campo]: v } }))} />
      </Tarjeta>

      <Tarjeta numero={3} titulo="Relación de alumnos por grados" subtitulo="Máximo 10 alumnos por grado. Abre solo los grados en los que participas.">
        {GRADOS.map((g, gi) => (
          <Grado key={g.n} indice={gi} grado={g} alumnos={alumnos[gi]} abierto={abiertos[gi]} errores={errores}
            onAbrir={v => abrirGrado(gi, v)} onAgregar={() => agregarAlumno(gi)} onQuitar={id => quitarAlumno(gi, id)}
            onCambiar={(id, campo, v) => cambiarAlumno(gi, id, campo, v)} />
        ))}
        <div className="mt-3.5"><b>{total} alumno{total === 1 ? '' : 's'} inscrito{total === 1 ? '' : 's'}</b></div>
      </Tarjeta>

      <Tarjeta numero={4} titulo="Pago de la inscripción" subtitulo="Paga con Yape o transferencia bancaria y registra tu número de operación.">
        <BloquePago monto={total * PRECIO_DELEGACION} pago={pago} setPago={setPago} errorOperacion={errores.has('operacion')} />
        <div className="mt-3.5 flex justify-end">
          <button type="button" className={botonAcento} disabled={enviando} onClick={enviar}>Enviar inscripción ✓</button>
        </div>
        <Mensaje mensaje={mensaje} refMensaje={refMensaje} />
      </Tarjeta>
    </div>
  );
}
