const $ = id => document.getElementById(id);
function ajustarMax(a) {
  const m = /inicial/i.test((a.nivel || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '')) ? 200 : 150;
  $('p').max = m; $('lblP').textContent = `Puntaje (máximo ${m})`;
}
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
let clave = sessionStorage.getItem('k') || '', sel = null, publicado = false, resultados = [], t;

async function api(url, opts = {}) {
  const r = await fetch(url, { ...opts, headers: { 'Content-Type': 'application/json', 'x-admin-key': clave } });
  return { ok: r.ok, j: await r.json().catch(() => ({})) };
}
function aviso(texto, error) { $('msg').textContent = texto; $('msg').className = error ? 'error' : ''; }
function pintarEstado() {
  $('estado').textContent = publicado ? 'Publicado' : 'Oculto';
  $('btnPublicar').textContent = publicado ? 'Ocultar resultados' : 'Publicar resultados';
}

async function entrar(k) {
  clave = k;
  const { ok, j } = await api('/api/admin/config');
  if (!ok) { clave = ''; sessionStorage.removeItem('k'); return j.error || 'Clave incorrecta'; }
  sessionStorage.setItem('k', k);
  publicado = j.publicado; pintarEstado();
  $('login').hidden = true; $('panel').hidden = false;
  cargarColegios();
  return '';
}

$('formLogin').addEventListener('submit', async e => {
  e.preventDefault();
  $('errLogin').textContent = await entrar($('clave').value);
});
if (clave) entrar(clave);

$('btnPublicar').addEventListener('click', async () => {
  const { ok, j } = await api('/api/admin/config', { method: 'POST', body: JSON.stringify({ publicado: !publicado }) });
  if (ok) { publicado = j.publicado; pintarEstado(); aviso(publicado ? 'Resultados publicados' : 'Resultados ocultos'); }
});

$('q').addEventListener('input', () => {
  clearTimeout(t);
  const q = $('q').value.trim();
  if (q.length < 2) { $('lista').hidden = true; return; }
  t = setTimeout(async () => {
    const { ok, j } = await api('/api/admin/buscar?q=' + encodeURIComponent(q));
    if (!ok) return aviso(j.error || 'Error al buscar', true);
    resultados = j.datos;
    $('lista').innerHTML = resultados.map((a, i) =>
      `<li data-i="${i}"><strong>${esc(a.nombre)}</strong> — ${esc(a.colegio)}, ${esc(a.nivel)} ${esc(a.grado)}` +
      (a.puntaje !== null ? ` · ya tiene resultado (${a.puntaje} pts, ${esc(a.hora_entrega)})` : '') + '</li>').join('')
      || '<li>No se encontró ningún alumno.</li>';
    $('lista').hidden = false;
  }, 250);
});

$('lista').addEventListener('click', e => {
  const li = e.target.closest('li[data-i]'); if (!li) return;
  sel = resultados[li.dataset.i];
  $('lista').hidden = true; $('q').value = ''; aviso('');
  $('fNombre').textContent = sel.nombre;
  $('fDatos').textContent = `${sel.colegio} · ${sel.nivel} ${sel.grado} · DNI ${sel.dni}`;
  ajustarMax(sel);
  $('p').value = sel.puntaje ?? ''; $('h').value = sel.hora_entrega ?? '';
  $('btnBorrar').hidden = sel.puntaje === null;
  $('ficha').hidden = false; $('p').focus();
});

$('btnCancelar').addEventListener('click', () => { sel = null; $('ficha').hidden = true; });

$('ficha').addEventListener('submit', async e => {
  e.preventDefault();
  const puntaje = $('p').value, hora = $('h').value;
  if (!confirm(`${sel.nombre}\nPuntaje: ${puntaje}\nHora de entrega: ${hora}\n\n¿Guardar?`)) return;
  const { ok, j } = await api('/api/admin/guardar', { method: 'POST',
    body: JSON.stringify({ tipo: sel.tipo, id: sel.id, puntaje, hora }) });
  if (!ok) return aviso(j.error || 'No se pudo guardar', true);
  aviso(`Guardado: ${sel.nombre}, ${puntaje} pts, ${j.hora}`);
  sel = null; $('ficha').hidden = true; $('q').focus();
});

$('btnBorrar').addEventListener('click', async () => {
  if (!confirm(`¿Borrar el resultado de ${sel.nombre}?`)) return;
  const { ok, j } = await api('/api/admin/guardar', { method: 'DELETE', body: JSON.stringify({ tipo: sel.tipo, id: sel.id }) });
  if (!ok) return aviso(j.error || 'No se pudo borrar', true);
  aviso(`Resultado de ${sel.nombre} borrado`); sel = null; $('ficha').hidden = true;
});

/* ---------- Agregar alumno (delegación o libre) ---------- */
let colegio = null, mapaColegios = {};
const NIVELES = [
  { nivel: 'Inicial', grados: ['4 años', '5 años'] },
  { nivel: 'Primaria', grados: [1, 2, 3, 4, 5, 6].map(n => `${n}° de Primaria`) },
  { nivel: 'Secundaria', grados: [1, 2, 3, 4, 5].map(n => `${n}° de Secundaria`) },
];
function avisoN(texto, error) { $('msgN').textContent = texto; $('msgN').className = error ? 'error' : ''; }

function llenarNivelGrado() {
  $('nNivel').innerHTML = NIVELES.map(x => `<option>${x.nivel}</option>`).join('');
  $('nGrado').innerHTML = NIVELES.map(x =>
    `<optgroup label="${x.nivel}">` + x.grados.map(g => `<option value="${g}" data-nivel="${x.nivel}">${g}</option>`).join('') + '</optgroup>').join('');
  $('nNivel').value = NIVELES[0].nivel;
  $('nGrado').value = NIVELES[0].grados[0];
}
// Al elegir un grado, el nivel se ajusta solo; al elegir un nivel, el grado salta al primero de ese nivel
$('nGrado').addEventListener('change', () => { $('nNivel').value = $('nGrado').selectedOptions[0].dataset.nivel; });
$('nNivel').addEventListener('change', () => {
  $('nGrado').value = NIVELES.find(x => x.nivel === $('nNivel').value).grados[0];
});

function cambiarTipo() {
  const libre = $('nTipo').value === 'LIBRE';
  $('bloqueColegio').hidden = libre;
  $('bloqueLibre').hidden = !libre;
  $('bloquePagoDeleg').hidden = libre;
  avisoN('');
}
$('nTipo').addEventListener('change', cambiarTipo);

$('nMedio').addEventListener('change', () => {
  $('lblOperacion').textContent = $('nMedio').value === 'Efectivo' ? 'N.º de operación (opcional en efectivo)' : 'N.º de operación';
});

$('dMedio').addEventListener('change', () => {
  $('lblDOperacion').textContent = $('dMedio').value === 'Efectivo' ? 'N.º de operación (opcional en efectivo)' : 'N.º de operación';
});

async function cargarColegios() {
  const { ok, j } = await api('/api/admin/colegios');
  if (!ok) return avisoN(j.error || 'No se pudo cargar la lista de colegios', true);
  const repetidos = {};
  j.datos.forEach(c => { repetidos[c.ie] = (repetidos[c.ie] || 0) + 1; });
  mapaColegios = {};
  $('colegiosLista').innerHTML = j.datos.map(c => {
    const v = repetidos[c.ie] > 1 ? `${c.ie} (ficha ${c.id})` : c.ie;
    mapaColegios[v] = c;
    return `<option value="${esc(v)}">`;
  }).join('');
}

function pintarColegio() {
  const el = $('colegioSel');
  if (!colegio) { el.hidden = true; return; }
  el.hidden = false;
  el.innerHTML = `Colegio registrado (ficha ${colegio.id}): <strong>${colegio.alumnos}</strong> alumno${colegio.alumnos === 1 ? '' : 's'} inscrito${colegio.alumnos === 1 ? '' : 's'}.`;
}
$('qc').addEventListener('input', () => { colegio = mapaColegios[$('qc').value] || null; pintarColegio(); avisoN(''); });

function abrirFichaPuntaje(a) {
  sel = a;
  ajustarMax(a);
  $('fNombre').textContent = a.nombre;
  $('fDatos').textContent = `${a.colegio} · ${a.nivel} ${a.grado} · DNI ${a.dni}`;
  $('p').value = ''; $('h').value = ''; $('btnBorrar').hidden = true; $('ficha').hidden = false;
}

$('btnAgregar').addEventListener('click', async () => {
  const libre = $('nTipo').value === 'LIBRE';
  const nivel = $('nNivel').value, grado = $('nGrado').value;
  const dni = $('nDni').value.trim(), nombre = $('nNombre').value.trim();
  if (!libre && !colegio) return avisoN('Elige un colegio de la lista (debe estar ya registrado)', true);
  if (!dni || !nombre) return avisoN('Escribe el DNI y los apellidos y nombres', true);

  let url, cuerpo, resumen;
  if (libre) {
    const monto = $('nMonto').value, operacion = $('nOperacion').value.trim(), medio = $('nMedio').value;
    const telefono = $('nTelefono').value.trim(), pagador = $('nPagador').value.trim();
    if (!telefono || !pagador) return avisoN('El teléfono y el pagador son obligatorios', true);
    if (monto === '') return avisoN('Escribe el monto pagado', true);
    if (!operacion && medio !== 'Efectivo') return avisoN('Escribe el número de operación', true);
    url = '/api/admin/libre';
    cuerpo = { nivel, grado, dni, nombre, telefono, monto: Number(monto), operacion, medio, pagador, verificado: $('nVerificado').checked };
    resumen = `Agregar como ALUMNO LIBRE:\n\n${nombre}\nDNI: ${dni}\nTeléfono: ${telefono}\nPagador: ${pagador}\n${nivel} · ${grado}\nMonto: S/ ${monto} · ${medio}${operacion ? ' · Op. ' + operacion : ''}\nPago verificado: ${$('nVerificado').checked ? 'sí' : 'no'}`;
  } else {
    const monto = $('dMonto').value, medio = $('dMedio').value, operacion = $('dOperacion').value.trim();
    if (monto === '') return avisoN('Escribe el monto pagado', true);
    if (!operacion && medio !== 'Efectivo') return avisoN('Escribe el número de operación', true);
    url = '/api/admin/alumno';
    cuerpo = { ficha_id: colegio.id, nivel, grado, dni, nombre, monto: Number(monto), medio, operacion };
    resumen = `Agregar a la delegación de ${colegio.ie}:\n\n${nombre}\nDNI: ${dni}\n${nivel} · ${grado}\nPago: S/ ${monto} · ${medio}${operacion ? ' · Op. ' + operacion : ''}\nSe sumarán S/ ${monto} al monto de la ficha.`;
  }
  if (!confirm(resumen + '\n\n¿Confirmar?')) return;

  const { ok, j } = await api(url, { method: 'POST', body: JSON.stringify(cuerpo) });
  if (!ok) return avisoN(j.error || 'No se pudo agregar', true);

  if (libre) {
    avisoN(`Agregado como alumno libre: ${j.nombre}. Ya puedes cargarle el puntaje abajo.`);
    ['nTelefono', 'nOperacion', 'nPagador'].forEach(id => $(id).value = '');
    $('nMonto').value = 15; $('nVerificado').checked = false;
    abrirFichaPuntaje({ tipo: 'LIBRE', id: j.id, nombre: j.nombre, dni: j.dni, nivel, grado, colegio: 'Alumno libre', puntaje: null, hora_entrega: null });
  } else {
    colegio.alumnos += 1; pintarColegio();
    avisoN(`Agregado: ${j.nombre} (N.º ${j.nro}) en ${j.colegio}. Monto de la ficha ahora: S/ ${j.monto_ficha}. Ya puedes cargarle el puntaje abajo.`);
    $('dMonto').value = 13; $('dOperacion').value = '';
    abrirFichaPuntaje({ tipo: 'DELEGACION', id: j.id, nombre: j.nombre, dni: j.dni, nivel, grado, colegio: j.colegio, puntaje: null, hora_entrega: null });
  }
  $('nDni').value = ''; $('nNombre').value = '';
});

/* ===== Carga de puntajes por grado ===== */
(function () {
  let inscritos = [], actual = '';
  const borrador = {};                                   // lo escrito y aún no guardado
  const errFila = {};                                    // mensajes de error por alumno
  const natural = (a, b) => String(a).localeCompare(String(b), 'es', { numeric: true });
  const normT = s => (s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const maxNivel = n => (normT(n).includes('inicial') ? 200 : 150);
  const ordNivel = n => { const x = normT(n); return x.includes('inicial') ? 0 : x.includes('primaria') ? 1 : x.includes('secundaria') ? 2 : 3; };
  const claveAl = a => a.tipo + ':' + a.id;
  const claveGr = a => a.nivel + '|' + a.grado;
  // Todos los grados del concurso: aparecen en el selector aunque todavía no tengan alumnos inscritos
  const GRADOS = [['Inicial', '4 años'], ['Inicial', '5 años'],
    ...[1, 2, 3, 4, 5, 6].map(n => ['Primaria', `${n}° de Primaria`]),
    ...[1, 2, 3, 4, 5].map(n => ['Secundaria', `${n}° de Secundaria`])];
  const catNivel = n => { const x = normT(n); return x.includes('inicial') ? 'Inicial' : x.includes('primaria') ? 'Primaria' : x.includes('secundaria') ? 'Secundaria' : n; };
  const claveG = (nivel, grado) => { const num = (normT(grado).match(/\d+/) || [])[0]; return catNivel(nivel)[0] + (num || normT(grado)); };
  const hms = v => (v && v.length === 5 ? v + ':00' : (v || ''));
  const msg = (t, error) => { $('iMsg').textContent = t; $('iMsg').className = 'ins-resumen' + (error ? ' error' : ''); };
  const delGrado = () => inscritos.filter(a => claveGr(a) === actual);
  const sinGuardar = () => Object.keys(borrador).length;

  async function cargar() {
    const { ok, j } = await api('/api/admin/inscritos');
    if (!ok) { $('iResumen').textContent = j.error || 'No se pudo cargar la lista de inscritos'; return; }
    inscritos = j.datos;
    poblarGrados(); pintar();
  }

  function poblarGrados() {
    const mapa = new Map();
    for (const a of inscritos) {
      const k = claveGr(a);
      if (!mapa.has(k)) mapa.set(k, { nivel: a.nivel, grado: a.grado, n: 0, car: 0 });
      const g = mapa.get(k); g.n++; if (a.puntaje !== null) g.car++;
    }
    const cubiertas = new Set([...mapa.values()].map(g => claveG(g.nivel, g.grado)));
    for (const [nivel, grado] of GRADOS)
      if (!cubiertas.has(claveG(nivel, grado))) mapa.set(nivel + '|' + grado, { nivel, grado, n: 0, car: 0 });
    const grupos = [...mapa.entries()].sort((x, y) =>
      ordNivel(x[1].nivel) - ordNivel(y[1].nivel) || natural(x[1].nivel, y[1].nivel) || natural(x[1].grado, y[1].grado));
    const porNivel = new Map();
    for (const [k, g] of grupos) { const c = catNivel(g.nivel); if (!porNivel.has(c)) porNivel.set(c, []); porNivel.get(c).push([k, g]); }
    $('iGrado').innerHTML = '<option value="">Selecciona un grado…</option>' + [...porNivel.entries()].map(([nivel, lista]) =>
      `<optgroup label="${esc(nivel)}">` + lista.map(([k, g]) =>
        `<option value="${esc(k)}">${esc(g.grado)} · ${g.n} inscrito${g.n === 1 ? '' : 's'} · ${g.car} con puntaje</option>`).join('') + '</optgroup>').join('');
    if (mapa.has(actual)) $('iGrado').value = actual; else actual = '';
  }

  function pintar() {
    const col = $('iColegio').value, q = normT($('iBuscar').value);
    if (!actual) {
      const total = inscritos.length, car = inscritos.filter(a => a.puntaje !== null).length;
      $('iResumen').textContent = total
        ? `${total} inscrito${total === 1 ? '' : 's'} hasta el momento · ${car} con puntaje. Elige un grado para empezar.`
        : 'Todavía no hay alumnos inscritos.';
      $('iTabla').innerHTML = ''; $('iAcciones').hidden = true; return;
    }
    const todos = delGrado();
    const [nivel, grado] = actual.split('|');
    const max = maxNivel(nivel);
    if (!todos.length) {
      $('iResumen').textContent = `${nivel} · ${grado}: todavía no hay alumnos inscritos en este grado.`;
      $('iTabla').innerHTML = ''; $('iAcciones').hidden = true; return;
    }
    // colegios de este grado (para el filtro)
    const colegios = [...new Set(todos.map(a => a.colegio))].sort(natural);
    const sc = $('iColegio'), prev = sc.value;
    sc.innerHTML = '<option value="">Todos</option>' + colegios.map(c => `<option>${esc(c)}</option>`).join('');
    sc.value = colegios.includes(col || prev) ? (col || prev) : '';
    const colSel = sc.value;

    const lista = todos.filter(a => (!colSel || a.colegio === colSel) && (!q || normT(a.nombre).includes(q) || String(a.dni).includes(q)))
      .sort((a, b) => natural(a.colegio, b.colegio) || natural(a.nombre, b.nombre));
    const car = todos.filter(a => a.puntaje !== null).length;
    const dirty = todos.filter(a => borrador[claveAl(a)]).length;
    $('iResumen').textContent = `${nivel} · ${grado}: ${todos.length} alumno${todos.length === 1 ? '' : 's'} · ${car} con puntaje · ${dirty} sin guardar. ` +
      '2. Escribe el puntaje y la hora de cada alumno (con Enter avanzas al siguiente campo). 3. Pulsa «Guardar» al terminar.';

    if (!lista.length) { $('iTabla').innerHTML = '<p class="ins-resumen">No hay alumnos con esos filtros.</p>'; }
    else {
      $('iTabla').innerHTML = `<div class="ins-tabla"><table>
        <thead><tr><th>Alumno</th><th>Puntaje (máx. ${max})</th><th>Hora de entrega</th><th></th></tr></thead>
        <tbody>${lista.map(a => {
          const k = claveAl(a), b = borrador[k] || {};
          const pv = b.p !== undefined ? b.p : (a.puntaje ?? '');
          const hv = b.h !== undefined ? b.h : (a.hora_entrega ?? '');
          const cargado = a.puntaje !== null;
          const estado = errFila[k] ? `<span class="estado error">${esc(errFila[k])}</span>`
            : `<span class="estado">${b.p !== undefined || b.h !== undefined ? 'Sin guardar' : (cargado ? '✓ Cargado' : 'Pendiente')}</span>`;
          return `<tr data-k="${k}" class="${cargado ? 'cargado' : ''}${borrador[k] ? ' editado' : ''}">
            <td class="c-n">${esc(a.nombre)}<br><small>DNI ${esc(a.dni)} · ${esc(a.colegio)}</small>${estado}</td>
            <td class="c-p"><input type="number" step="0.01" min="-100" max="${max}" value="${pv}" data-f="p" placeholder="0 a ${max}" aria-label="Puntaje de ${esc(a.nombre)}"></td>
            <td class="c-h"><input type="time" step="1" value="${hv}" data-f="h" aria-label="Hora de entrega de ${esc(a.nombre)}"></td>
            <td class="c-x">${cargado ? '<button type="button" class="peligro" data-a="b" title="Borrar resultado">✕</button>' : ''}</td>
          </tr>`; }).join('')}</tbody></table></div>`;
    }
    $('iAcciones').hidden = false;
  }

  // Elegir grado
  $('iGrado').addEventListener('change', () => {
    const nuevo = $('iGrado').value;
    if (sinGuardar() && !confirm('Tienes puntajes escritos que aún no guardaste. Si cambias de grado se perderán. ¿Cambiar de grado?')) {
      $('iGrado').value = actual; return;
    }
    Object.keys(borrador).forEach(k => delete borrador[k]); Object.keys(errFila).forEach(k => delete errFila[k]);
    actual = nuevo; $('iColegio').value = ''; $('iBuscar').value = ''; msg('');
    pintar();
  });
  $('iColegio').addEventListener('change', pintar);
  $('iBuscar').addEventListener('input', pintar);
  $('iRefrescar').addEventListener('click', cargar);

  // Escribir: se recuerda lo escrito y se marca la fila como "sin guardar"
  $('iTabla').addEventListener('input', e => {
    const tr = e.target.closest('tr'); if (!tr || !e.target.dataset.f) return;
    const k = tr.dataset.k, a = inscritos.find(x => claveAl(x) === k);
    const b = borrador[k] = borrador[k] || {};
    b[e.target.dataset.f] = e.target.value;
    const p = b.p !== undefined ? b.p : (a.puntaje ?? ''), h = b.h !== undefined ? b.h : (a.hora_entrega ?? '');
    const igual = String(p) === String(a.puntaje ?? '') && hms(h) === hms(a.hora_entrega ?? '');
    if (igual) delete borrador[k];
    delete errFila[k]; msg('');
    tr.classList.toggle('editado', !igual);
    const est = tr.querySelector('.estado'); est.className = 'estado';
    est.textContent = igual ? (a.puntaje !== null ? '✓ Cargado' : 'Pendiente') : 'Sin guardar';
  });

  // Enter: pasa al siguiente campo (y, al final, al botón Guardar)
  $('iTabla').addEventListener('keydown', e => {
    if (e.key !== 'Enter' || !e.target.matches('input[data-f]')) return;
    e.preventDefault();
    const campos = [...$('iTabla').querySelectorAll('input[data-f]')], i = campos.indexOf(e.target);
    (campos[i + 1] || $('iGuardar')).focus();
  });

  // Borrar el resultado de un alumno ya cargado
  $('iTabla').addEventListener('click', async e => {
    const btn = e.target.closest('button[data-a="b"]'); if (!btn) return;
    const k = btn.closest('tr').dataset.k, a = inscritos.find(x => claveAl(x) === k);
    if (!confirm(`¿Borrar el resultado de ${a.nombre}?`)) return;
    const { ok, j } = await api('/api/admin/guardar', { method: 'DELETE', body: JSON.stringify({ tipo: a.tipo, id: a.id }) });
    if (!ok) { msg(j.error || 'No se pudo borrar', true); return; }
    a.puntaje = null; a.hora_entrega = null; delete borrador[k]; delete errFila[k];
    msg(`Resultado de ${a.nombre} borrado.`); poblarGrados(); pintar();
  });

  // GUARDAR: un solo botón al terminar de rellenar el grado
  $('iGuardar').addEventListener('click', async () => {
    const max = maxNivel(actual.split('|')[0]);
    const items = []; let problemas = 0, primero = null;
    Object.keys(errFila).forEach(k => delete errFila[k]);
    for (const a of delGrado()) {
      const k = claveAl(a), b = borrador[k]; if (!b) continue;
      const p = b.p !== undefined ? b.p : (a.puntaje ?? ''), h = b.h !== undefined ? b.h : (a.hora_entrega ?? '');
      let error = null;
      if (String(p) === '' && !h) error = 'Para borrar un resultado usa el botón ✕';
      else if (String(p) === '' || !h) error = 'Falta el puntaje o la hora';
      else if (Number(p) < -100 || Number(p) > max) error = `El puntaje máximo es ${max}`;
      if (error) { errFila[k] = error; problemas++; primero = primero || k; } else items.push({ tipo: a.tipo, id: a.id, puntaje: p, hora: h });
    }
    if (problemas) {
      msg(`Revisa ${problemas} alumno${problemas === 1 ? '' : 's'} marcado${problemas === 1 ? '' : 's'}. No se guardó nada.`, true);
      pintar(); const tr = $('iTabla').querySelector(`tr[data-k="${primero}"]`); if (tr) tr.scrollIntoView({ block: 'center' }); return;
    }
    if (!items.length) { msg('No hay cambios para guardar.'); return; }
    $('iGuardar').disabled = true; msg('Guardando…');
    const { ok, j } = await api('/api/admin/guardar-lote', { method: 'POST', body: JSON.stringify({ items }) });
    $('iGuardar').disabled = false;
    if (!ok) {
      (j.errores || []).forEach(x => { errFila[x.tipo + ':' + x.id] = x.error; });
      msg(j.error || 'No se pudo guardar', true); pintar(); return;
    }
    for (const it of items) {
      const a = inscritos.find(x => claveAl(x) === it.tipo + ':' + it.id);
      a.puntaje = Number(it.puntaje); a.hora_entrega = hms(it.hora); delete borrador[it.tipo + ':' + it.id];
    }
    msg(`✓ Se guardaron ${items.length} puntaje${items.length === 1 ? '' : 's'} de ${actual.split('|')[1]}.`);
    poblarGrados(); pintar();
  });

  // Aviso si intentas salir con puntajes sin guardar
  window.addEventListener('beforeunload', e => { if (sinGuardar()) { e.preventDefault(); e.returnValue = ''; } });

  // Se carga sola al entrar al panel y se actualiza cuando agregas un alumno desde los otros formularios
  const panel = document.getElementById('panel');
  const iniciar = () => { if (!panel.hidden) cargar(); };
  new MutationObserver(iniciar).observe(panel, { attributes: true, attributeFilter: ['hidden'] });
  ['msg', 'msgN'].forEach(id => {
    const el = document.getElementById(id);
    if (el) new MutationObserver(() => { if (/^(Guardado|Agregado|Resultado de)/.test(el.textContent)) cargar(); })
      .observe(el, { childList: true, characterData: true, subtree: true });
  });
  window.recargarInscritos = cargar;
  iniciar();
})();

/* ===== Importar puntajes desde Excel o CSV (se asignan por DNI) ===== */
(function () {
  let filas = [], ultimo = null;
  const msgI = (t, error) => { $('impMsg').textContent = t; $('impMsg').className = 'ins-resumen' + (error ? ' error' : ''); };
  const XLSX_URL = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
  const cargarXLSX = () => new Promise((ok, no) => {
    if (window.XLSX) return ok(window.XLSX);
    const s = document.createElement('script'); s.src = XLSX_URL;
    s.onload = () => ok(window.XLSX);
    s.onerror = () => no(new Error('No se pudo cargar el lector de Excel. Guarda el archivo como CSV e inténtalo de nuevo.'));
    document.head.appendChild(s);
  });

  function parseCSV(texto) {
    texto = texto.replace(/^\uFEFF/, '');
    const primera = texto.split(/\r?\n/, 1)[0] || '';
    const n = c => (primera.match(new RegExp(c, 'g')) || []).length;
    const sep = n(';') > n(',') ? ';' : (n('\t') > n(',') ? '\t' : ',');
    const out = []; let fila = [], campo = '', q = false;
    for (let i = 0; i < texto.length; i++) {
      const c = texto[i];
      if (q) { if (c === '"') { if (texto[i + 1] === '"') { campo += '"'; i++; } else q = false; } else campo += c; }
      else if (c === '"') q = true;
      else if (c === sep) { fila.push(campo); campo = ''; }
      else if (c === '\n' || c === '\r') { if (c === '\r' && texto[i + 1] === '\n') i++; fila.push(campo); out.push(fila); fila = []; campo = ''; }
      else campo += c;
    }
    if (campo !== '' || fila.length) { fila.push(campo); out.push(fila); }
    return out;
  }

  // Columnas: dni, puntaje, hora_entrega (con o sin encabezado)
  function aFilas(matriz) {
    const lineas = matriz.map((r, i) => ({ n: i + 1, r })).filter(x => x.r.some(c => String(c ?? '').trim() !== ''));
    if (!lineas.length) return [];
    const cab = lineas[0].r.map(c => String(c ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''));
    const iD = cab.findIndex(c => c.includes('dni')), iP = cab.findIndex(c => /punt|nota/.test(c)), iH = cab.findIndex(c => c.includes('hora'));
    let col, datos;
    if (iD >= 0 && iP >= 0 && iH >= 0) { col = [iD, iP, iH]; datos = lineas.slice(1); }
    else if (iD < 0 && iP < 0 && iH < 0) { col = [0, 1, 2]; datos = lineas; }
    else throw new Error('No encuentro las tres columnas. El encabezado debe tener: dni, puntaje y hora_entrega.');
    return datos.map(x => ({ fila: x.n, dni: x.r[col[0]] ?? '', puntaje: x.r[col[1]] ?? '', hora: x.r[col[2]] ?? '' }));
  }

  async function leer(file) {
    if (/\.(xlsx|xls)$/i.test(file.name)) {
      const X = await cargarXLSX();
      const libro = X.read(await file.arrayBuffer(), { type: 'array' });
      return aFilas(X.utils.sheet_to_json(libro.Sheets[libro.SheetNames[0]], { header: 1, raw: true, defval: '' }));
    }
    return aFilas(parseCSV(await file.text()));
  }

  function reiniciar() { $('impArchivo').value = ''; $('impPrevia').hidden = true; filas = []; ultimo = null; }

  function mostrar(r) {
    ultimo = r; const s = r.resumen;
    $('impPrevia').hidden = false;
    $('impResumen').textContent =
      `${s.leidas} filas leídas · ${s.listas} listas para importar (${s.nuevas} nuevas, ${s.reemplazan} reemplazan un resultado) · ` +
      `${s.noEncontrados} DNI no encontrados · ${s.conErrores} con errores · ${s.sinResultado} inscritos quedarán sin resultado ("No rindió").`;
    const tope = 300;
    $('impListaTxt').innerHTML = `<table><thead><tr><th>Fila</th><th>DNI</th><th>Alumno</th><th>Grado</th><th>Puntaje</th><th>Hora</th><th>Antes</th></tr></thead><tbody>` +
      r.validas.slice(0, tope).map(v => `<tr><td>${v.fila}</td><td>${esc(v.dni)}</td><td>${esc(v.nombre)}<br><small>${esc(v.colegio)}</small></td>
        <td>${esc(v.nivel)} · ${esc(v.grado)}</td><td>${v.puntaje}</td><td>${esc(v.hora)}</td>
        <td>${v.antes ? `reemplaza ${v.antes.puntaje} (${esc(v.antes.hora)})` : 'nuevo'}</td></tr>`).join('') +
      `</tbody></table>` + (r.validas.length > tope ? `<p class="ins-resumen">…y ${r.validas.length - tope} más.</p>` : '');
    $('impListas').hidden = !r.validas.length;
    $('impNoEnc').hidden = !r.noEncontrados.length;
    $('impNoEncTxt').textContent = r.noEncontrados.map(x => `Fila ${x.fila}: DNI ${x.dni}`).join(' · ');
    $('impErr').hidden = !r.errores.length;
    $('impErrTxt').innerHTML = r.errores.map(x => `<div class="error">Fila ${x.fila}${x.dni ? ' (DNI ' + esc(x.dni) + ')' : ''}: ${esc(x.error)}</div>`).join('');
    $('impConfirmar').textContent = `Importar ${s.listas} puntaje${s.listas === 1 ? '' : 's'}`;
    $('impConfirmar').disabled = s.conErrores > 0 || s.listas === 0;
    $('impAviso').textContent = s.conErrores ? 'Corrige las filas con errores en el archivo y súbelo otra vez: no se importa nada mientras haya errores.' : '';
  }

  // Al elegir el archivo se lee y se revisa solo
  $('impArchivo').addEventListener('change', async () => {
    const file = $('impArchivo').files[0];
    $('impPrevia').hidden = true; filas = []; ultimo = null;
    if (!file) { msgI(''); return; }
    msgI('Leyendo el archivo…');
    try { filas = await leer(file); } catch (e) { msgI(e.message, true); return; }
    if (!filas.length) { msgI('El archivo no tiene filas con datos.', true); return; }
    msgI(`Revisando ${filas.length} filas…`);
    const { ok, j } = await api('/api/admin/importar', { method: 'POST', body: JSON.stringify({ modo: 'previa', filas }) });
    if (!ok) { msgI(j.error || 'No se pudo revisar el archivo', true); return; }
    msgI(''); mostrar(j);
  });

  $('impCancelar').addEventListener('click', () => { reiniciar(); msgI(''); });

  $('impConfirmar').addEventListener('click', async () => {
    const s = ultimo.resumen;
    if (!confirm(`Se importarán ${s.listas} puntajes.` +
        (s.reemplazan ? `\n${s.reemplazan} alumno(s) ya tenían resultado y se reemplazará.` : '') +
        (s.noEncontrados ? `\n${s.noEncontrados} DNI no se encontraron y no se importarán.` : '') + '\n\n¿Confirmar?')) return;
    $('impConfirmar').disabled = true; msgI('Importando…');
    const { ok, j } = await api('/api/admin/importar', { method: 'POST', body: JSON.stringify({ modo: 'guardar', filas }) });
    if (!ok) { if (j.resumen) mostrar(j); msgI(j.error || 'No se pudo importar', true); return; }
    reiniciar(); msgI(`✓ Se importaron ${j.guardados} puntajes.`);
    if (window.recargarInscritos) window.recargarInscritos();
  });
})();

llenarNivelGrado();
