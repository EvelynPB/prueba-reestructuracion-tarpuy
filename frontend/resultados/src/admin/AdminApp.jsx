import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Cabecera, { Titulo } from '../components/Cabecera.jsx';
import AgregarAlumno from './AgregarAlumno.jsx';
import BuscarAlumno from './BuscarAlumno.jsx';
import CargaPorGrado from './CargaPorGrado.jsx';
import FichaPuntaje from './FichaPuntaje.jsx';
import Importar from './Importar.jsx';
import { crearApi, enviarJSON } from './api.js';
import { angosto } from './estilos.js';

/** Panel del organizador del Sistema de Resultados (/admin). */
export default function AdminApp() {
  const clave = useRef(sessionStorage.getItem('k') || '');
  const api = useMemo(() => crearApi(() => clave.current), []);
  const [entrado, setEntrado] = useState(false);
  const [textoClave, setTextoClave] = useState('');
  const [errorLogin, setErrorLogin] = useState('');
  const [publicado, setPublicado] = useState(false);
  const [aviso, setAviso] = useState({ texto: '', error: false });
  const [ficha, setFicha] = useState(null);          // alumno cuyo puntaje se está editando
  const [version, setVersion] = useState(0);         // al cambiar, la carga por grado vuelve a leer los inscritos
  const refBuscar = useRef(null);

  const entrar = useCallback(async k => {
    clave.current = k;
    const { ok, j } = await api('/api/admin/config');
    if (!ok) { clave.current = ''; sessionStorage.removeItem('k'); return j.error || 'Clave incorrecta'; }
    sessionStorage.setItem('k', k);
    setPublicado(j.publicado); setEntrado(true);
    return '';
  }, [api]);

  useEffect(() => { if (clave.current) entrar(clave.current); }, [entrar]);   // la clave se recuerda mientras la pestaña esté abierta

  const mostrarError = useCallback(texto => setAviso({ texto, error: true }), []);

  async function alternarPublicacion() {
    const { ok, j } = await api('/api/admin/config', enviarJSON('POST', { publicado: !publicado }));
    if (ok) { setPublicado(j.publicado); setAviso({ texto: j.publicado ? 'Resultados publicados' : 'Resultados ocultos', error: false }); }
  }

  function terminarFicha(texto, error, exito) {
    setAviso({ texto, error });
    if (exito) { setFicha(null); setVersion(v => v + 1); refBuscar.current?.focus(); }
  }

  return (
    <main className="relative z-10 mx-auto max-w-[1080px] px-[18px] pt-7 pb-[72px]">
      <Cabecera chica etiqueta="Tarpuy" titulo="Panel de resultados" />

      {!entrado ? (
        <section className={angosto}>
          <Titulo>Panel de resultados</Titulo>
          <form onSubmit={async e => { e.preventDefault(); setErrorLogin(await entrar(textoClave)); }}>
            <label htmlFor="clave">Clave de acceso</label>
            <input id="clave" type="password" autoFocus value={textoClave} onChange={e => setTextoClave(e.target.value)} />
            <p><button className="boton-primario">Entrar</button></p>
            <p className="text-error">{errorLogin}</p>
          </form>
        </section>
      ) : (
        <section>
          <div className={angosto}>
            <Titulo>Cargar resultados</Titulo>
            <div className="my-3 flex flex-wrap items-center justify-between gap-3 text-[.9rem] text-texto-2">
              <span>Estado: <strong>{publicado ? 'Publicado' : 'Oculto'}</strong></span>
              <button type="button" className="px-3.5 py-1.5" onClick={alternarPublicacion}>{publicado ? 'Ocultar resultados' : 'Publicar resultados'}</button>
            </div>
          </div>

          <BuscarAlumno api={api} refBuscar={refBuscar} onError={mostrarError}
            onElegir={a => { setAviso({ texto: '', error: false }); setFicha(a); }} />
          <p role="status" className={aviso.error ? 'text-error' : ''}>{aviso.texto}</p>

          <AgregarAlumno api={api} onAgregado={a => { setFicha(a); setVersion(v => v + 1); }} />

          {ficha && <FichaPuntaje key={ficha.tipo + ficha.id} alumno={ficha} api={api}
            onTerminar={terminarFicha} onCancelar={() => setFicha(null)} />}

          <CargaPorGrado api={api} version={version} />
          <Importar api={api} onImportado={() => setVersion(v => v + 1)} />
        </section>
      )}
    </main>
  );
}
