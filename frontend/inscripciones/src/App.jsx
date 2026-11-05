import { useCallback, useEffect, useRef, useState } from 'react';
import { PRECIO_DELEGACION, PRECIO_LIBRE } from './config/concurso.js';
import { cerrarSesion, iniciarSesion, leerPanel, marcarVerificado } from './services/api.js';
import Encabezado from './components/comunes/Encabezado.jsx';
import FondoAnimado from './components/comunes/FondoAnimado.jsx';
import PiePagina from './components/comunes/PiePagina.jsx';
import { cx } from './components/comunes/estilos.js';
import FormDelegacion from './components/delegacion/FormDelegacion.jsx';
import FormLibre from './components/libre/FormLibre.jsx';
import PanelOrganizador from './components/organizador/PanelOrganizador.jsx';

function BotonModalidad({ activo, titulo, texto, precio, onClick }) {
  return (
    <button type="button" onClick={onClick}
      className={cx('cursor-pointer rounded-2xl border-2 bg-tarjeta px-[18px] py-4 text-left font-sans text-tinta transition duration-200',
        activo ? 'border-acento shadow-[0_0_0_3px_rgba(95,208,255,.45),0_8px_30px_rgba(0,0,0,.2)]' : 'border-linea shadow-[0_8px_30px_rgba(0,0,0,.15)]')}>
      <b className="block font-serif text-lg/[normal] font-bold">{titulo}</b>
      <span className="text-sm text-suave">{texto}</span><br />
      <span className="mt-2 inline-block rounded-full bg-acento px-3 py-0.5 text-sm font-bold text-[#0a1a5c]">{precio}</span>
    </button>
  );
}

export default function App() {
  const [libre, setLibre] = useState(false);
  const [panel, setPanel] = useState(null);           // { fichas, libres } cuando hay sesión de organizador
  const refPanel = useRef(null);

  const cargarPanel = useCallback(async () => {
    const datos = await leerPanel();
    setPanel(datos);
    return !!datos;
  }, []);

  // Si ya hay sesión, el panel aparece solo; luego se actualiza cada 20 s mientras esté visible.
  useEffect(() => { cargarPanel(); }, [cargarPanel]);
  const hayPanel = !!panel;
  useEffect(() => {
    if (!hayPanel) return undefined;
    const t = setInterval(cargarPanel, 20000);
    return () => clearInterval(t);
  }, [hayPanel, cargarPanel]);

  const irAlPanel = () => setTimeout(() => refPanel.current?.scrollIntoView({ behavior: 'smooth' }), 0);

  async function accesoOrganizador() {
    if (await cargarPanel()) return irAlPanel();
    const pw = window.prompt('Contraseña del organizador');
    if (!pw) return;
    try {
      await iniciarSesion(pw);
      await cargarPanel();
      irAlPanel();
    } catch (err) {
      window.alert(err.message);
    }
  }

  async function verificar(tabla, id, valor) {
    try {
      await marcarVerificado(tabla, id, valor);
      cargarPanel();
    } catch (err) {
      window.alert('No se pudo actualizar: ' + err.message);
    }
  }

  async function salir() {
    try { await cerrarSesion(); } catch { /* la sesión ya no existe */ }
    setPanel(null);
  }

  return (
    <>
      <FondoAnimado />
      <Encabezado />
      <main className="relative z-10 mx-auto -mt-[50px] mb-10 max-w-[900px] px-4">
        <div className="mb-[18px] grid grid-cols-1 gap-3 sm:grid-cols-2">
          <BotonModalidad activo={!libre} onClick={() => setLibre(false)} titulo="🏫 Delegación (colegio)"
            texto="Inscribe a tu I.E. con asesores y varios alumnos." precio={`S/ ${PRECIO_DELEGACION} por alumno`} />
          <BotonModalidad activo={libre} onClick={() => setLibre(true)} titulo="🎓 Alumno libre"
            texto="Participa por tu cuenta, sin delegación." precio={`S/ ${PRECIO_LIBRE} por alumno`} />
        </div>

        {/* Los dos formularios se mantienen montados para no perder lo escrito al cambiar de modalidad */}
        <div hidden={libre}><FormDelegacion /></div>
        <div hidden={!libre}><FormLibre /></div>

        {panel && <PanelOrganizador datos={panel} refPanel={refPanel} onVerificar={verificar} onCerrarSesion={salir} />}
      </main>
      <PiePagina onAccesoOrganizador={accesoOrganizador} />
    </>
  );
}
