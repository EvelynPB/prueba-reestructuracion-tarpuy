const DATOS = [
  { texto: <>📅 <b>31 de octubre</b></>, destacado: true },
  { texto: 'Inicial · Primaria · Secundaria' },
  { texto: <>🏆 <b className="text-acento">Grandes premios</b></> },
  { texto: '📍 Urb. Las Nieves, La Gloria, Ate' },
];

export default function Encabezado() {
  return (
    <header className="relative z-10 overflow-hidden px-5 pt-[34px] pb-20 text-white">
      <div className="relative mx-auto max-w-[900px] text-center">
        <img src="/img/logo-tarpuy.webp" alt="Tarpuy · Serere pacis et scientia, beati orbi est"
          className="mx-auto block h-auto w-[min(300px,72%)] animate-logo" />
        <h1 className="mx-0 mt-1.5 mb-3.5 font-exo text-[clamp(20px,4.6vw,38px)]/[1.3] font-extrabold tracking-[.09em] text-cian uppercase [text-shadow:0_0_18px_rgba(80,200,255,.6)]">
          XI Concurso Nacional de<br />Matemática Lima Este 2026
        </h1>
        <div className="mx-auto mb-3.5 h-0.5 max-w-[520px] bg-[linear-gradient(90deg,transparent,#8fe9ff,transparent)] shadow-[0_0_14px_#5bd1ff]" />
        <p className="mx-auto mb-1.5 text-[#e5f1ff] italic">Tarpuy, antigua voz quechua que significa sembrar</p>
        <p className="mx-auto mb-1 max-w-[620px] text-[#a9c6f5]">
          Olimpiada Tarpuyana · Ficha de inscripción. ¡Demuestra tu talento, piensa sin límites!
        </p>
        <div className="mt-[22px] flex flex-wrap justify-center gap-2.5">
          {DATOS.map((d, i) => (
            <span key={i} className={d.destacado
              ? 'rounded-xl bg-acento px-3.5 py-[7px] text-sm font-bold text-[#0a1a5c]'
              : 'rounded-xl border border-white/25 bg-white/12 px-3.5 py-[7px] text-sm text-white'}>
              {d.texto}
            </span>
          ))}
        </div>
      </div>
    </header>
  );
}
