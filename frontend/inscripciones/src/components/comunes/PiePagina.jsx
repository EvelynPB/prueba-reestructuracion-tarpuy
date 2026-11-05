import { WHATSAPP } from '../../config/concurso.js';

export default function PiePagina({ onAccesoOrganizador }) {
  const enlace = 'font-bold text-cian no-underline';
  return (
    <footer className="relative z-10 pb-[30px] text-center text-[13px] text-cielo">
      <img src="/img/logo-tarpuy.webp" alt="Tarpuy" className="mx-auto mb-1.5 block h-auto w-[150px] drop-shadow-[0_0_28px_rgba(80,170,255,.55)]" />
      XI Concurso Nacional de Matemática · Lima Este 2026<br />
      Consultas por WhatsApp:{' '}
      {WHATSAPP.map((w, i) => (
        <span key={w.url}>{i > 0 && ' · '}<a className={enlace} href={w.url}>{w.texto}</a></span>
      ))}
      <br />¡La matemática también se vive en equipo!<br />
      <a href="#" className={enlace + ' text-xs opacity-65'} onClick={e => { e.preventDefault(); onAccesoOrganizador(); }}>
        Acceso organizador
      </a>
    </footer>
  );
}
