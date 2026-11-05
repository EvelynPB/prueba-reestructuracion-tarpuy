import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Cabecera from '../components/Cabecera.jsx';
import FondoMatematico from '../components/FondoMatematico.jsx';
import { cx, natural, nivelCat, nivelOrden, norm, plural, unicos } from '../utils/texto.js';
import { COLS_COLEGIOS, COLS_GENERAL, COLS_GRADO, conPuestoNivel, ordenar } from './ranking.js';
import Tabla, { clasePodio } from './Tabla.jsx';

const FILTROS_VACIOS = { colegio: '', nivel: '', grado: '', tipo: '' };
const ordenInicial = vista => ({ clave: vista === 'general' ? 'puesto_nivel' : vista === 'colegios' ? 'puesto' : 'merito', dir: 1 });
const VISTAS = [['grado', 'Ranking por grado'], ['general', 'Ranking general'], ['colegios', 'Ranking de delegaciones']];

const NoRindio = () => <span className="italic opacity-75">No rindió</span>;
const puntos = d => <>{d.puntaje.toFixed(2)}{!d.rindio && <> <NoRindio /></>}</>;
const hora = d => (d.rindio ? d.hora_entrega : '—');
const celNivel = (pct, pts) => (pct == null ? '—' : <><strong>{pct.toFixed(1)}%</strong> <small>{pts.toFixed(1)} pts</small></>);

function Selector({ id, etiqueta, valor, opciones, onCambio, todos = true, children }) {
  return (
    <div>
      <label htmlFor={id}>{etiqueta}</label>
      <select id={id} value={valor} onChange={e => onCambio(e.target.value)}>
        {todos && <option value="">Todos</option>}
        {children || opciones.map(v => <option key={v} value={v}>{v}</option>)}
      </select>
    </div>
  );
}

function Grupo({ id, titulo, detalle, nota, children, animar }) {
  return (
    <section id={id} className={cx('my-[30px] scroll-mt-3.5', animar && 'animate-[aparece_.6s_ease_both]')}>
      <h2 className="mt-0 mb-2 font-exo text-[1.35rem] text-verde-2">
        {titulo} <small className="ml-2 font-sans text-[.85rem] font-normal text-texto-2">{detalle}</small>
      </h2>
      {nota && <p className="mt-0 mb-2.5 max-w-[90ch] text-[.85rem] text-texto-2">{nota}</p>}
      {children}
    </section>
  );
}

const resumen = filas => {
  const no = filas.filter(d => !d.rindio).length;
  return plural(filas.length, 'alumno', 'alumnos') + (no ? ` · ${no} no rindieron` : '');
};

export default function ResultadosApp() {
  const [estado, setEstado] = useState({ cargando: true, publicado: false, error: false });
  const [datos, setDatos] = useState([]);
  const [colegios, setColegios] = useState({ ok: false, datos: [] });
  const [actualizado, setActualizado] = useState(null);
  const [errorActualizar, setErrorActualizar] = useState(false);
  const [ahora, setAhora] = useState(Date.now());
  const [vista, setVista] = useState('grado');
  const [orden, setOrden] = useState(ordenInicial('grado'));
  const [f, setF] = useState(FILTROS_VACIOS);
  const [buscar, setBuscar] = useState('');
  const [animar, setAnimar] = useState(false);
  const yaAnimado = useRef(false);
  const tAnimar = useRef(null);

  /** Las filas entran con animación al abrir la página o cambiar de pestaña. */
  const animarEntrada = useCallback(() => {
    setAnimar(false);
    requestAnimationFrame(() => setAnimar(true));
    clearTimeout(tAnimar.current);
    tAnimar.current = setTimeout(() => setAnimar(false), 1700);
  }, []);

  const cargar = useCallback(async () => {
    try {
      const r = await fetch('/api/resultados', { cache: 'no-store' });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      setDatos(conPuestoNivel(j.datos)); setActualizado(Date.now());
      try {
        const r2 = await fetch('/api/ranking-colegios', { cache: 'no-store' });
        const j2 = await r2.json();
        setColegios(c => (r2.ok ? { ok: true, datos: j2.datos } : { ...c, ok: false }));
      } catch { setColegios(c => ({ ...c, ok: false })); }
      setErrorActualizar(false);
      setEstado({ cargando: false, publicado: !!j.publicado, error: false });
      if (j.publicado && !yaAnimado.current) { yaAnimado.current = true; animarEntrada(); }
    } catch {
      setEstado(e => ({ ...e, error: true }));
      setErrorActualizar(true);
    }
  }, [animarEntrada]);

  useEffect(() => {
    cargar();
    const t1 = setInterval(cargar, 20000);
    const t2 = setInterval(() => setAhora(Date.now()), 1000);
    return () => { clearInterval(t1); clearInterval(t2); };
  }, [cargar]);

  // ---------- Opciones de los filtros (solo las que existen en los datos) ----------
  const esColegios = vista === 'colegios';
  const opColegio = useMemo(() => (esColegios ? colegios.datos.map(c => c.colegio).sort(natural) : unicos(datos.map(d => d.colegio))), [esColegios, colegios, datos]);
  const opNivel = useMemo(() => [...new Set(datos.map(d => d.nivel))].sort((a, b) => nivelOrden(a) - nivelOrden(b) || natural(a, b)), [datos]);
  const opGrado = useMemo(() => unicos(datos.filter(d => !f.nivel || d.nivel === f.nivel).map(d => d.grado)), [datos, f.nivel]);

  // Si un filtro elegido ya no existe en los datos, vuelve a «Todos»
  useEffect(() => {
    const ajustado = { ...f };
    if (f.colegio && !opColegio.includes(f.colegio)) ajustado.colegio = '';
    if (!esColegios && f.nivel && !opNivel.includes(f.nivel)) ajustado.nivel = '';
    if (!esColegios && f.grado && !opGrado.includes(f.grado)) ajustado.grado = '';
    if (ajustado.colegio !== f.colegio || ajustado.nivel !== f.nivel || ajustado.grado !== f.grado) setF(ajustado);
  }, [f, opColegio, opNivel, opGrado, esColegios]);

  const cambiarFiltro = (campo, valor) => setF(x => ({ ...x, [campo]: valor, ...(campo === 'nivel' ? { grado: '' } : {}) }));
  const limpiar = () => { setF(FILTROS_VACIOS); setBuscar(''); setOrden(ordenInicial(vista)); };
  const ordenarPor = k => setOrden(o => ({ clave: k, dir: o.clave === k ? -o.dir : 1 }));

  function cambiarVista(v) {
    if (v === 'colegios' || vista === 'colegios') { setF(FILTROS_VACIOS); setBuscar(''); }   // los filtros de alumno no aplican a delegaciones
    setVista(v); setOrden(ordenInicial(v)); animarEntrada();
  }

  // ---------- Alumnos que pasan los filtros ----------
  const nq = norm(buscar);
  const lista = useMemo(() => datos.filter(d =>
    (!f.colegio || d.colegio === f.colegio) && (!f.nivel || d.nivel === f.nivel) &&
    (!f.grado || d.grado === f.grado) && (!f.tipo || d.tipo === f.tipo) &&
    (!nq || norm(d.nombre).includes(nq))), [datos, f, nq]);
  const sugerencias = nq.length >= 2 ? datos.filter(d => norm(d.nombre).includes(nq)).slice(0, 8) : [];

  let grupos = [], chips = [], nota = null, conteo = '', vacio = null;
  if (esColegios) {
    if (!colegios.ok) vacio = 'El ranking de delegaciones aún no está disponible.';
    else {
      const filas = ordenar(colegios.datos.filter(c => !f.colegio || c.colegio === f.colegio), orden);
      conteo = `${filas.length} de ${colegios.datos.length} colegios`;
      if (!filas.length) vacio = 'No hay colegios con esos filtros.';
      else grupos = [{
        id: 'g0', titulo: 'Ranking de delegaciones', detalle: plural(filas.length, 'colegio', 'colegios'), columnas: COLS_COLEGIOS,
        nota: 'Cada nivel se mide como el porcentaje del puntaje máximo (Inicial 200; Primaria y Secundaria 150) que logra, en promedio, el colegio entre todos sus alumnos inscritos en ese nivel; quien no rindió cuenta con 0 puntos. El acumulado suma los tres niveles y el promedio es el acumulado ÷ 3; un nivel sin resultados cuenta como 0 (—). No incluye alumnos libres.',
        filas: filas.map(c => ({
          clave: c.colegio + c.puesto, clase: clasePodio(c.puesto),
          celdas: [c.puesto, c.colegio, celNivel(c.inicial, c.inicial_pts), celNivel(c.primaria, c.primaria_pts),
            celNivel(c.secundaria, c.secundaria_pts), c.acumulado.toFixed(2), <strong>{c.promedio.toFixed(2)}%</strong>, `${c.rindieron} / ${c.inscritos}`],
        })),
      }];
    }
  } else {
    const noRindieron = lista.filter(d => !d.rindio).length;
    conteo = `${lista.length} de ${datos.length} alumnos` + (noRindieron ? ` · ${noRindieron} no rindieron` : '');
    if (!lista.length) vacio = 'No hay alumnos con esos filtros.';
    const mapa = new Map();
    if (vista === 'general') {            // un ranking general por nivel, con todos sus grados juntos
      for (const d of lista) { const k = nivelCat(d.nivel); if (!mapa.has(k)) mapa.set(k, { nivel: k, filas: [] }); mapa.get(k).filas.push(d); }
      const niveles = [...mapa.values()].sort((a, b) => nivelOrden(a.nivel) - nivelOrden(b.nivel) || natural(a.nivel, b.nivel));
      if (niveles.length) nota = 'El ranking general o Cómmputo General se ordena por el porcentaje del puntaje máximo de cada nivel. Quien no rindió figura con 0 puntos y sin puesto, al final. En caso de empate, gana la hora de entrega más temprana. Está separado por nivel: Inicial, Primaria y Secundaria.';
      grupos = niveles.map((g, i) => ({
        id: 'g' + i, titulo: `Ranking general · ${g.nivel}`, detalle: resumen(g.filas), columnas: COLS_GENERAL, chip: g.nivel,
        filas: ordenar(g.filas, orden).map((d, k) => ({
          clave: d.tipo + d.nombre + k, clase: clasePodio(d.puesto_nivel, d.rindio),
          celdas: [d.rindio ? d.puesto_nivel : '—', d.nombre, d.colegio, d.grado,
            <>{puntos(d)} <small className="opacity-60">/ {d.maximo}</small></>, `${d.porcentaje.toFixed(1)}%`, hora(d), d.rindio ? d.merito : '—'],
        })),
      }));
    } else {
      for (const d of lista) { const k = d.nivel + '|' + d.grado; if (!mapa.has(k)) mapa.set(k, { nivel: d.nivel, grado: d.grado, filas: [] }); mapa.get(k).filas.push(d); }
      const lista2 = [...mapa.values()].sort((a, b) => nivelOrden(a.nivel) - nivelOrden(b.nivel) || natural(a.nivel, b.nivel) || natural(a.grado, b.grado));
      grupos = lista2.map((g, i) => ({
        id: 'g' + i, titulo: `${g.nivel} · ${g.grado}`, detalle: resumen(g.filas), columnas: COLS_GRADO, chip: `${g.nivel} · ${g.grado}`,
        filas: ordenar(g.filas, orden).map((d, k) => ({
          clave: d.tipo + d.nombre + k, clase: clasePodio(d.merito, d.rindio),
          celdas: [d.rindio ? d.merito : '—', d.nombre, d.colegio, puntos(d), hora(d)],
        })),
      }));
    }
    chips = grupos.length > 1 ? grupos.map(g => [g.id, g.chip]) : [];
  }
  const hayFiltros = esColegios ? !!f.colegio : !!(nq || Object.values(f).some(Boolean));

  const textoEstado = estado.cargando
    ? (estado.error ? 'No se pudieron cargar los resultados. Se reintentará automáticamente.' : 'Cargando resultados…')
    : 'Los resultados aún no se han publicado. Vuelve más tarde.';

  return (
    <>
      <FondoMatematico />
      <main className="relative z-10 mx-auto max-w-[1180px] px-[18px] pt-7 pb-[72px]">
        <Cabecera titulo="Resultados del concurso" />

        {!estado.publicado ? (
          <div className="animate-respira rounded-[14px] border border-dashed border-[rgba(120,220,255,.35)] bg-vidrio p-[30px] text-center text-texto-2">{textoEstado}</div>
        ) : (
          <div>
            <div role="tablist" aria-label="Tipo de ranking" className="mb-[18px] flex animate-[aparece_.8s_.1s_ease_both] flex-wrap gap-2">
              {VISTAS.map(([v, t]) => (
                <button key={v} type="button" role="tab" aria-selected={vista === v} onClick={() => cambiarVista(v)}
                  className={cx('rounded-full px-5 py-[9px]', vista === v && 'border-transparent bg-[linear-gradient(135deg,var(--color-verde),#4fb8ff)] font-bold text-[#04153a] shadow-[0_6px_22px_rgba(120,220,255,.28)]')}>
                  {t}
                </button>
              ))}
            </div>

            <div className="mb-3.5 grid animate-[aparece_.8s_.15s_ease_both] grid-cols-[repeat(auto-fill,minmax(190px,1fr))] gap-3">
              {!esColegios && (
                <div>
                  <label htmlFor="buscar">Buscar alumno</label>
                  <input id="buscar" list="nombres" placeholder="Escribe un nombre o apellido" autoComplete="off"
                    value={buscar} onChange={e => setBuscar(e.target.value)} />
                  <datalist id="nombres">{sugerencias.map((s, i) => <option key={i} value={s.nombre} />)}</datalist>
                </div>
              )}
              <Selector id="colegio" etiqueta="Colegio" valor={f.colegio} opciones={opColegio} onCambio={v => cambiarFiltro('colegio', v)} />
              {!esColegios && <>
                <Selector id="nivel" etiqueta="Nivel" valor={f.nivel} opciones={opNivel} onCambio={v => cambiarFiltro('nivel', v)} />
                <Selector id="grado" etiqueta="Grado" valor={f.grado} opciones={opGrado} onCambio={v => cambiarFiltro('grado', v)} />
                <Selector id="tipo" etiqueta="Tipo" todos={false} valor={f.tipo} onCambio={v => cambiarFiltro('tipo', v)}>
                  <option value="">Todos</option><option value="DELEGACION">Delegación</option><option value="LIBRE">Alumno libre</option>
                </Selector>
              </>}
            </div>

            <div className="my-3 flex animate-[aparece_.8s_.2s_ease_both] flex-wrap items-center justify-between gap-3 text-[.9rem] text-texto-2">
              <span>{conteo}</span>
              <span>
                <span className={errorActualizar ? 'text-error' : ''}>
                  {errorActualizar ? 'No se pudo actualizar. ' : actualizado && `Actualizado hace ${Math.round((ahora - actualizado) / 1000)} s `}
                </span>
                <button type="button" className="px-3.5 py-1.5" onClick={cargar}>Actualizar</button>
                {hayFiltros && <> <button type="button" className="px-3.5 py-1.5" onClick={limpiar}>Limpiar filtros</button></>}
              </span>
            </div>

            {chips.length > 0 && (
              <nav aria-label="Ir a un grado" className="mt-2 mb-1 flex flex-wrap gap-2">
                {chips.map(([id, t]) => (
                  <a key={id} href={'#' + id}
                    className="rounded-full border border-linea bg-[rgba(120,220,255,.07)] px-3.5 py-1 text-[.85rem] text-verde-2 no-underline transition hover:-translate-y-px hover:border-verde hover:bg-[rgba(120,220,255,.18)]">{t}</a>
                ))}
              </nav>
            )}
            {vacio && <div className="rounded-[14px] border border-dashed border-[rgba(120,220,255,.35)] bg-vidrio p-[30px] text-center text-texto-2">{vacio}</div>}
            {nota && <p className="mt-0 mb-2.5 max-w-[90ch] text-[.85rem] text-texto-2">{nota}</p>}
            <div>
              {grupos.map(g => (
                <Grupo key={g.id} id={g.id} titulo={g.titulo} detalle={g.detalle} nota={g.nota} animar={animar}>
                  <Tabla columnas={g.columnas} orden={orden} onOrdenar={ordenarPor} filas={g.filas} animar={animar} />
                </Grupo>
              ))}
            </div>
          </div>
        )}
      </main>
    </>
  );
}
