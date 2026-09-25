const API = "http://127.0.0.1:8000";
let catalogos = { secciones:[], ubicaciones:[], idiomas:[], autores:[] };
let filtroSeccionActiva = null;
let seleccionados = new Set();
let editandoId = null;
let inventarioAbort = null;
let inventarioTimer = null;
let lecturasCache = null;
let librosLeidosSet = new Set();

// Función auxiliar que llama a la API y ya trae el JSON parseado, o lanza un
// error si la respuesta no fue exitosa.
async function api(path, opts={}) {
  const r = await fetch(API + path, {
    headers: {"Content-Type":"application/json"}, ...opts
  });
  if (!r.ok) throw new Error(await r.text());
  if (r.status === 204) return null;
  return r.json();
}
function esc(s){ return (s ?? "").toString().replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c])); }

// --- Toasts ---
function toast(mensaje, tipo = "info", ms = 3500){
  const cont = document.getElementById("toastContainer");
  const el = document.createElement("div");
  el.className = `toast toast-${tipo}`;
  el.textContent = mensaje;
  cont.appendChild(el);
  requestAnimationFrame(() => el.classList.add("show"));
  setTimeout(() => {
    el.classList.remove("show");
    setTimeout(() => el.remove(), 250);
  }, ms);
}

// Diálogo genérico (confirmar y pedirTexto comparten motor)
function abrirDialogo({ mensaje, valor = null, textoOk = "Aceptar", textoCancelar = "Cancelar", peligro = false }){
  return new Promise((resolve) => {
    const bg = document.getElementById("dialogBg");
    const msg = document.getElementById("dialogMsg");
    const input = document.getElementById("dialogInput");
    const ok = document.getElementById("dialogOk");
    const cancel = document.getElementById("dialogCancel");

    msg.textContent = mensaje;
    ok.textContent = textoOk;
    cancel.textContent = textoCancelar;
    ok.classList.toggle("danger", !!peligro);

    const esTexto = valor !== null;
    input.hidden = !esTexto;
    if (esTexto){ input.value = valor; setTimeout(()=>{input.focus(); input.select();}, 50); }
    else { setTimeout(() => ok.focus(), 50); }

    function cerrar(r){
      bg.classList.remove("show");
      ok.removeEventListener("click", onOk);
      cancel.removeEventListener("click", onCancel);
      bg.removeEventListener("click", onBg);
      document.removeEventListener("keydown", onKey);
      input.removeEventListener("keydown", onInputKey);
      resolve(r);
    }
    function onOk(){ cerrar(esTexto ? input.value.trim() : true); }
    function onCancel(){ cerrar(esTexto ? null : false); }
    function onBg(e){ if (e.target === bg) cerrar(esTexto ? null : false); }
    function onKey(e){ if (e.key === "Escape") cerrar(esTexto ? null : false); }
    function onInputKey(e){ if (e.key === "Enter"){ e.preventDefault(); onOk(); } }

    ok.addEventListener("click", onOk);
    cancel.addEventListener("click", onCancel);
    bg.addEventListener("click", onBg);
    document.addEventListener("keydown", onKey);
    input.addEventListener("keydown", onInputKey);

    bg.classList.add("show");
  });
}
function confirmar(mensaje, opts = {}){
  return abrirDialogo({ mensaje, ...opts }).then(v => v === true);
}
function pedirTexto(mensaje, valorInicial = "", opts = {}){
  return abrirDialogo({ mensaje, valor: valorInicial, ...opts });
}

// Carga inicial de catálogos
// Trae secciones, ubicaciones, idiomas y autores una sola vez al arrancar, y
// llena con ellos todos los <select> que los necesitan (filtros, formulario
// del modal y barra de selección múltiple).
async function cargarCatalogos(){
  const [secciones, ubicaciones, idiomas, autores] = await Promise.all([
    api("/secciones"), api("/ubicaciones"), api("/idiomas"), api("/autores")
  ]);
  catalogos = { secciones, ubicaciones, idiomas, autores };

  llenarSelect("fSeccion", secciones, "Sección");
  llenarSelect("fUbicacion", ubicaciones, "Ubicación");
  llenarSelect("fIdioma", idiomas, "Idioma");
  llenarSelect("fAutor", autores, "Autor");
  llenarSelect("fmSeccion", secciones, "—", false);
  llenarSelect("fmUbicacion", ubicaciones, "—", false);
  llenarSelect("fmIdioma", idiomas, "—", false);
  llenarSelect("bulkUbicacion", ubicaciones, "Mover a ubicación…");
  llenarSelect("bulkSeccion", secciones, "Cambiar sección…");
}
function llenarSelect(id, items, placeholder){
  const el = document.getElementById(id);
  el.innerHTML = `<option value="">${placeholder}</option>` +
    items.map(i => `<option value="${i.id}">${esc(i.nombre)}</option>`).join("");
}

async function cargarLecturasCache(){
  if (lecturasCache) return lecturasCache;
  lecturasCache = await api("/lecturas");
  librosLeidosSet = new Set(lecturasCache.map(l => l.libro_id));
  return lecturasCache;
}

// Resumen
// Trae los totales de /stats/resumen y dibuja tanto el contador grande de
// arriba como las tarjetas de sección, que además sirven de filtro al hacer
// clic sobre ellas.
async function cargarResumen(){
  const r = await api("/stats/resumen");
  document.getElementById("heroCount").innerHTML = `${r.total_fisicos}<small>Libros físicos en el cuarto</small>`;

  const grid = document.getElementById("shelfGrid");
  grid.innerHTML = r.por_seccion.map(s => `
    <button class="shelf-card ${filtroSeccionActiva===s.nombre?'active':''}" data-seccion="${esc(s.nombre)}">
      <span class="n">${s.total}</span><span class="lbl">${esc(s.nombre)}</span>
    </button>`).join("");

  grid.querySelectorAll(".shelf-card").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const nombre = btn.dataset.seccion;
      const match = catalogos.secciones.find(s=>s.nombre===nombre);
      filtroSeccionActiva = (filtroSeccionActiva===nombre) ? null : nombre;
      document.getElementById("fSeccion").value = filtroSeccionActiva ? match.id : "";
      cargarInventario();
      cargarResumen();
    });
  });
}
async function cargarStatsExtras(){
  const [lecturas, deseos] = await Promise.all([api("/lecturas"), api("/deseos?comprado=false")]);
  const anio = new Date().getFullYear();
  document.getElementById("statLeidos").textContent =
    lecturas.filter(l => l.fecha_fin && l.fecha_fin.startsWith(String(anio))).length;
  document.getElementById("statDeseos").textContent = deseos.length;
}

// Inventario con filtros combinables
// Arma los query params solo con los filtros que el usuario haya llenado, así
// que cualquier combinación de ellos se aplica junta en una sola consulta.
function paramsFiltros(){
  const p = new URLSearchParams({ posesion:"Físico" });
  const texto = document.getElementById("fTexto").value.trim();
  const seccion = document.getElementById("fSeccion").value;
  const ubicacion = document.getElementById("fUbicacion").value;
  const idioma = document.getElementById("fIdioma").value;
  const formato = document.getElementById("fFormato").value;
  const autor = document.getElementById("fAutor").value;
  if (texto) p.set("texto", texto);
  if (seccion) p.set("seccion_id", seccion);
  if (ubicacion) p.set("ubicacion_id", ubicacion);
  if (idioma) p.set("idioma_id", idioma);
  if (formato) p.set("formato", formato);
  if (autor) p.set("autor_id", autor);
  return p.toString();
}

function cargarInventarioDebounced(){
  clearTimeout(inventarioTimer);
  inventarioTimer = setTimeout(cargarInventario, 250);
}
async function cargarInventario(){
  if (inventarioAbort) inventarioAbort.abort();
  inventarioAbort = new AbortController();

  const cont = document.getElementById("listaInventario");
  try{
    const libros = await api("/libros?" + paramsFiltros(), { signal: inventarioAbort.signal });
    const estado = document.getElementById("fEstado").value;

    let visibles = libros;
    if (estado === "leido" || estado === "no-leido"){
      await cargarLecturasCache();
      visibles = libros.filter(l => {
        const leido = librosLeidosSet.has(l.id);
        return estado === "leido" ? leido : !leido;
      });
    }

    if (!visibles.length){
      cont.innerHTML = `<div class="empty">No hay libros que coincidan con estos filtros.</div>`;
      return;
    }
    cont.innerHTML = visibles.map(l => filaLibro(l)).join("");
    cont.querySelectorAll("[data-check]").forEach(chk=>{
      chk.addEventListener("change", ()=>{
        const id = Number(chk.dataset.check);
        chk.checked ? seleccionados.add(id) : seleccionados.delete(id);
        actualizarBulkbar();
      });
    });
    cont.querySelectorAll("[data-editar]").forEach(b=>b.addEventListener("click", ()=>abrirModal(Number(b.dataset.editar), visibles)));
    cont.querySelectorAll("[data-eliminar]").forEach(b=>b.addEventListener("click", ()=>eliminarLibro(Number(b.dataset.eliminar))));
  } catch(e){
    if (e.name === "AbortError") return;
    throw e;
  }
}


function filaLibro(l){
  const autores = (l.autores||[]).map(a=>a.nombre).join(", ") || "Autor desconocido";
  const portada = l.isbn
    ? `https://covers.openlibrary.org/b/isbn/${encodeURIComponent(l.isbn)}-S.jpg`
    : null;

  return `
  <div class="book-row">
    <input type="checkbox" data-check="${l.id}" ${seleccionados.has(l.id)?"checked":""}>
    ${portada
      ? `<img class="cover" src="${portada}" alt="" loading="lazy"
              onerror="this.replaceWith(Object.assign(document.createElement('div'),{className:'spine'}))">`
      : `<div class="spine"></div>`}
    <div>
      <div class="titulo">${esc(l.titulo)}</div>
      <div class="autores">${esc(autores)}</div>
    </div>
    <div class="meta">${esc(l.seccion?.nombre || "—")}</div>
    <div class="meta">${esc(l.ubicacion?.nombre || "—")}</div>
    <div class="meta">${esc(l.formato || "—")}</div>
    <div class="meta">${esc(l.idioma?.nombre || "—")}</div>
    <div class="actions">
      <button class="icon-btn" data-editar="${l.id}">Editar</button>
      <button class="icon-btn" data-eliminar="${l.id}">Eliminar</button>
    </div>
  </div>`;
}

// Selección múltiple
// Guarda los ids marcados en un Set y muestra/oculta la barra de acciones en
// lote según si hay algo seleccionado.
function actualizarBulkbar(){
  const bar = document.getElementById("bulkbar");
  document.getElementById("bulkCount").textContent = `${seleccionados.size} seleccionados`;
  bar.classList.toggle("show", seleccionados.size > 0);
}
document.getElementById("bulkCancelar").addEventListener("click", ()=>{
  seleccionados.clear(); actualizarBulkbar(); cargarInventario();
});
document.getElementById("bulkEliminar").addEventListener("click", async ()=>{
  if (!seleccionados.size) return;
  if (!await confirmar(`¿Eliminar ${seleccionados.size} libro(s)? Esta acción no se puede deshacer.`, { peligro: true, textoOk: "Eliminar" })) return;
  await api("/libros/lote/eliminar", { method:"POST", body: JSON.stringify([...seleccionados]) });
  seleccionados.clear(); actualizarBulkbar();
  await refrescarTodo();
});
document.getElementById("bulkUbicacion").addEventListener("change", async (e)=>{
  if (!e.target.value || !seleccionados.size) return;
  await api(`/libros/lote/mover?campo=ubicacion_id&valor=${e.target.value}`, {
    method:"POST", body: JSON.stringify([...seleccionados])
  });
  e.target.value=""; seleccionados.clear(); actualizarBulkbar();
  await refrescarTodo();
});
document.getElementById("bulkSeccion").addEventListener("change", async (e)=>{
  if (!e.target.value || !seleccionados.size) return;
  await api(`/libros/lote/mover?campo=seccion_id&valor=${e.target.value}`, {
    method:"POST", body: JSON.stringify([...seleccionados])
  });
  e.target.value=""; seleccionados.clear(); actualizarBulkbar();
  await refrescarTodo();
});

// Filtros: eventos
// Cualquier cambio en un filtro vuelve a pedir el inventario de inmediato,
// así que no hace falta un botón de "buscar".
["fSeccion","fUbicacion","fIdioma","fFormato","fAutor", "fEstado"].forEach(id=>{
  document.getElementById(id).addEventListener("change", cargarInventario);
});
document.getElementById("fTexto").addEventListener("input", cargarInventarioDebounced);
document.getElementById("btnLimpiar").addEventListener("click", ()=>{
 ["fTexto","fSeccion","fUbicacion","fIdioma","fFormato","fAutor","fEstado"].forEach(id=>document.getElementById(id).value="");
  filtroSeccionActiva = null;
  cargarInventario(); cargarResumen();
});

// Modal para agregar o editar un libro
function limpiarModal(){
  ["fmIsbn","fmTitulo","fmAutores","fmEditorial","fmAnio","fmPaginas","fmNotas"].forEach(id=>document.getElementById(id).value="");
  document.getElementById("fmFormato").value = "";
  document.getElementById("fmSeccion").value = "";
  document.getElementById("fmUbicacion").value = "";
  document.getElementById("fmIdioma").value = "";
  document.getElementById("fmCondicion").value = "";
  document.getElementById("isbnStatus").textContent = "";
  editandoId = null;
}
document.getElementById("btnNuevo").addEventListener("click", ()=>{
  limpiarModal();
  document.getElementById("modalTitulo").textContent = "Agregar libro";
  document.getElementById("modalLibro").classList.add("show");
});
document.getElementById("btnCancelarModal").addEventListener("click", ()=>{
  document.getElementById("modalLibro").classList.remove("show");
});
// Cerrar modal con Esc y clic fuera
const modalBg = document.getElementById("modalLibro");
modalBg.addEventListener("click", (e) => {
  // Solo cierra si el clic fue en el fondo, no dentro del contenido
  if (e.target === modalBg) modalBg.classList.remove("show");
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && modalBg.classList.contains("show")) {
    modalBg.classList.remove("show");
  }
});
// Enter guarda (excepto en el textarea de notas)
modalBg.addEventListener("keydown", (e) => {
  if (e.key !== "Enter") return;
  if (e.target.tagName === "TEXTAREA") return; // permitir saltos de línea en Notas
  if (e.target.tagName === "BUTTON") return;    // no interferir con botones
  e.preventDefault();
  document.getElementById("btnGuardarLibro").click();
});

function abrirModal(id, listaActual){
  const l = listaActual.find(x=>x.id===id);
  if (!l) return;
  limpiarModal();
  editandoId = id;
  document.getElementById("modalTitulo").textContent = "Editar libro";
  document.getElementById("fmTitulo").value = l.titulo || "";
  document.getElementById("fmAutores").value = (l.autores||[]).map(a=>a.nombre).join(", ");
  document.getElementById("fmEditorial").value = l.editorial?.nombre || "";
  document.getElementById("fmFormato").value = l.formato || "";
  document.getElementById("fmSeccion").value = l.seccion_id || "";
  document.getElementById("fmUbicacion").value = l.ubicacion_id || "";
  document.getElementById("fmIdioma").value = l.idioma_id || "";
  document.getElementById("fmCondicion").value = l.condicion || "";
  document.getElementById("fmAnio").value = l.anio_publicacion || "";
  document.getElementById("fmPaginas").value = l.paginas || "";
  document.getElementById("fmNotas").value = l.notas || "";
  document.getElementById("fmIsbn").value = l.isbn || "";
  document.getElementById("modalLibro").classList.add("show");
}

document.getElementById("btnBuscarIsbn").addEventListener("click", async ()=>{
  const isbn = document.getElementById("fmIsbn").value.trim();
  const status = document.getElementById("isbnStatus");
  if (!isbn){ status.textContent = "Escribe o escanea un ISBN primero."; return; }
  status.textContent = "Buscando…";
  try{
    const d = await api("/isbn/" + encodeURIComponent(isbn));
    if (!d.encontrado){ status.textContent = "No se encontró ese ISBN. Llena los datos a mano."; return; }
    if (d.titulo) document.getElementById("fmTitulo").value = d.titulo;
    if (d.autores?.length) document.getElementById("fmAutores").value = d.autores.join(", ");
    if (d.editorial) document.getElementById("fmEditorial").value = d.editorial;
    if (d.anio_publicacion) document.getElementById("fmAnio").value = d.anio_publicacion;
    if (d.paginas) document.getElementById("fmPaginas").value = d.paginas;
    status.textContent = "Datos completados. Revisa antes de guardar.";
  } catch(e){ status.textContent = "Error al consultar el ISBN."; }
});


// Resuelve los nombres de autor escritos en el formulario a sus ids reales;
// si un autor no existe todavía, lo crea en el catálogo antes de continuar.
async function idsAutoresPorNombre(texto){
  const nombres = texto.split(",").map(s=>s.trim()).filter(Boolean);
  const ids = [];
  for (const nombre of nombres){
    let autor = catalogos.autores.find(a=>a.nombre.toLowerCase()===nombre.toLowerCase());
    if (!autor){
      autor = await api("/autores?nombre=" + encodeURIComponent(nombre), { method:"POST" });
      catalogos.autores.push(autor);
    }
    ids.push(autor.id);
  }
  return ids;
}

document.getElementById("btnGuardarLibro").addEventListener("click", async ()=>{
  const titulo = document.getElementById("fmTitulo").value.trim();
  if (!titulo){ toast("El título es obligatorio.", "error"); return; }

  const payload = {
    titulo,
    isbn: document.getElementById("fmIsbn").value.trim() || null,
    posesion: "Físico",
    formato: document.getElementById("fmFormato").value || null,
    seccion_id: Number(document.getElementById("fmSeccion").value) || null,
    ubicacion_id: Number(document.getElementById("fmUbicacion").value) || null,
    idioma_id: Number(document.getElementById("fmIdioma").value) || null,
    condicion: document.getElementById("fmCondicion").value || null,
    anio_publicacion: Number(document.getElementById("fmAnio").value) || null,
    paginas: Number(document.getElementById("fmPaginas").value) || null,
    notas: document.getElementById("fmNotas").value.trim() || null,
    autor_ids: await idsAutoresPorNombre(document.getElementById("fmAutores").value),
  };

  // Detección de duplicados por ISBN (solo al crear, no al editar)
  if (!editandoId && payload.isbn){
    try{
      const candidatos = await api("/libros?texto=" + encodeURIComponent(payload.isbn));
      const dup = candidatos.find(l => l.isbn === payload.isbn);
      if (dup){
        const seguir = await confirmar(
          `Ya tienes un libro con este ISBN: "${dup.titulo}". ¿Quieres añadir otro ejemplar de todas formas?`,
          { textoOk: "Añadir otro" }
        );
        if (!seguir) return;
      }
    } catch { /* si la comprobación falla, no bloqueamos el guardado */ }
  }

  if (editandoId){
    await api(`/libros/${editandoId}`, { method:"PATCH", body: JSON.stringify(payload) });
  } else {
    await api("/libros", { method:"POST", body: JSON.stringify(payload) });
  }
  document.getElementById("modalLibro").classList.remove("show");
  await cargarCatalogos();
  await refrescarTodo();
  toast(editandoId ? "Libro actualizado." : "Libro añadido.", "success");
});

async function eliminarLibro(id){
  if (!await confirmar("¿Eliminar este libro de tu inventario?", { peligro: true, textoOk: "Eliminar" })) return;
  await api(`/libros/${id}`, { method:"DELETE" });
  await refrescarTodo();
}

// Pestañas
// Alterna qué sección se muestra y solo carga los datos de Leídos o Por
// comprar la primera vez que el usuario entra a esa pestaña.
document.querySelectorAll(".tab").forEach(tab=>{
  tab.addEventListener("click", ()=>{
    document.querySelectorAll(".tab").forEach(t=>t.classList.remove("active"));
    tab.classList.add("active");
    const destino = tab.dataset.tab;

    document.getElementById("toolbar").style.display        = destino==="inventario" ? "flex" : "none";
    document.getElementById("toolbarLeidos").style.display   = destino==="leidos"     ? "flex" : "none";
    document.getElementById("toolbarDeseos").style.display   = destino==="deseos"     ? "flex" : "none";

    document.getElementById("listaInventario").style.display = destino==="inventario" ? "block" : "none";
    document.getElementById("listaLeidos").style.display     = destino==="leidos"     ? "block" : "none";
    document.getElementById("listaDeseos").style.display     = destino==="deseos"     ? "block" : "none";

    if (destino === "leidos") cargarLeidos();
    if (destino === "deseos") cargarDeseos();
  });
});

// Leídos
async function cargarLeidos(){
  const lecturas = await api("/lecturas");
  const cont = document.getElementById("listaLeidos");
  if (!lecturas.length){ cont.innerHTML = `<div class="empty">Aún no registras lecturas este año.</div>`; return; }
  cont.innerHTML = lecturas.map(l => `
    <div class="book-row" style="grid-template-columns:5px 1fr 140px 110px auto;">
      <div class="spine" style="background:var(--sage)"></div>
      <div>
        <div class="titulo">${esc(l.libro?.titulo || "Libro #"+l.libro_id)}</div>
        <div class="autores">${esc((l.libro?.autores||[]).map(a=>a.nombre).join(", "))}</div>
      </div>
      <div class="meta">${l.fecha_fin || "—"}</div>
      <div class="meta">${l.calificacion ? "★".repeat(l.calificacion) : "—"}</div>
      <div class="actions"><button class="icon-btn" data-del-lectura="${l.id}">Eliminar</button></div>
    </div>`).join("");
  cont.querySelectorAll("[data-del-lectura]").forEach(b=>b.addEventListener("click", async ()=>{
    await api(`/lecturas/${b.dataset.delLectura}`, { method:"DELETE" });
    lecturasCache = null;             
    librosLeidosSet = new Set();
    cargarLeidos(); cargarStatsExtras();
    if (document.getElementById("fEstado").value) cargarInventario();
}));
}

// Por comprar
async function cargarDeseos(){
  const deseos = await api("/deseos?comprado=false");
  const cont = document.getElementById("listaDeseos");
  if (!deseos.length){ cont.innerHTML = `<div class="empty">Tu lista de compras está vacía.</div>`; return; }
  cont.innerHTML = deseos.map(d => `
    <div class="book-row" style="grid-template-columns:5px 1fr 90px 100px auto;">
      <div class="spine" style="background:var(--burgundy)"></div>
      <div>
        <div class="titulo">${esc(d.titulo || "Libro #"+d.libro_id)}</div>
        <div class="autores">${esc(d.autor_texto || "")}</div>
      </div>
      <div class="meta">${esc(d.prioridad)}</div>
      <div class="meta">${d.precio_estimado ? "$"+d.precio_estimado : "—"}</div>
      <div class="actions"><button class="icon-btn" data-del-deseo="${d.id}">Eliminar</button></div>
    </div>`).join("");
  cont.querySelectorAll("[data-del-deseo]").forEach(b=>b.addEventListener("click", async ()=>{
    await api(`/deseos/${b.dataset.delDeseo}`, { method:"DELETE" });
    cargarDeseos(); cargarStatsExtras();
  }));
}

// Arranque
// Carga catálogos e inventario en cuanto la página abre; si la API no está
// corriendo, lo avisa en vez de dejar la pantalla en blanco.
async function refrescarTodo(){
  await Promise.all([cargarInventario(), cargarResumen(), cargarStatsExtras()]);
}
(async function init(){
  try{
    await cargarCatalogos();
    await refrescarTodo();
  } catch(e){
    document.getElementById("listaInventario").innerHTML =
      `<div class="empty">No se pudo conectar con la API en ${API}.<br>Verifica que esté corriendo (uvicorn app.main:app --reload).</div>`;
  }
})();

// Lógica del Cambio de Tema
(function() {
  const themeToggle = document.getElementById('theme-toggle');
  const htmlElement = document.documentElement;
  const currentTheme = localStorage.getItem('theme');

  // Aplicar el tema guardado o la preferencia del sistema
  if (currentTheme) {
    htmlElement.setAttribute('data-theme', currentTheme);
  } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
    htmlElement.setAttribute('data-theme', 'light');
  } else {
    htmlElement.setAttribute('data-theme', 'dark'); // Por defecto
  }

  // Función para actualizar el icono del botón
  function updateToggleIcon(theme) {
    themeToggle.innerHTML = theme === 'light' ? '🌙' : '☀️';
  }
  updateToggleIcon(htmlElement.getAttribute('data-theme'));

  // Manejador del clic
  themeToggle.addEventListener('click', () => {
    const newTheme = htmlElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    htmlElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme); // Guardar preferencia
    updateToggleIcon(newTheme);
  });
})();

// Frase del día
(function(){
  const elTexto = document.getElementById("dailyQuote");
  const elAutor = document.getElementById("dailyQuoteAuthor");
  if (!elTexto || !elAutor) return;

  // Semilla basada en el día del año → misma frase durante todo el día
  const ahora = new Date();
  const inicio = new Date(ahora.getFullYear(), 0, 0);
  const dia = Math.floor((ahora - inicio) / 86400000);
  const frase = FRASES[Math.floor(Math.random() * FRASES.length)];

  elTexto.textContent = frase.texto;
  elAutor.textContent = "— " + frase.autor;
})();

// Saludo personalizado
(function(){
  const CLAVE = 'nombreUsuario';
  const POR_DEFECTO = 'Edvard Pichardo';

  const badge = document.getElementById('welcomeBadge');
  const nombreEl = document.getElementById('welcomeName');
  if (!badge || !nombreEl) return;

  // Cargar nombre guardado (o el de por defecto)
  let nombre = localStorage.getItem(CLAVE) || POR_DEFECTO;
  nombreEl.textContent = nombre;

  // Editar al hacer clic
  badge.addEventListener('click', async () => {
    const nuevo = await pedirTexto("¿Cómo te llamas?", nombre, { textoOk: "Guardar" });
    if (nuevo === null) return;          // canceló
    const limpio = nuevo.trim();
    if (!limpio) return;                 // vacío, no cambiamos nada
    nombre = limpio;
    localStorage.setItem(CLAVE, nombre);
    nombreEl.textContent = nombre;
  });
})();


// Export / Import de inventario
document.getElementById("btnExportar").addEventListener("click", async () => {
  const libros = await api("/libros?posesion=Físico"); // o sin filtro si quieres todo
  const blob = new Blob([JSON.stringify(libros, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `biblioteca-backup-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
});

document.getElementById("btnImportar").addEventListener("click", () => {
  document.getElementById("fileImportar").click();
});

document.getElementById("fileImportar").addEventListener("change", async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  if (!await confirmar(`¿Importar "${file.name}"? Los libros nuevos se añadirán; no se borra nada existente.`)) return;

  const texto = await file.text();
  let libros;
  try { libros = JSON.parse(texto); }
  catch { toast("El archivo no es un JSON válido.", "error"); return; }
  if (!Array.isArray(libros)) { toast("El JSON debe ser un array de libros.", "error"); return; }

  let ok = 0, fail = 0;
  for (const l of libros){
    try{
      await api("/libros", { method:"POST", body: JSON.stringify({
        titulo: l.titulo,
        isbn: l.isbn || null,
        posesion: l.posesion || "Físico",
        formato: l.formato || null,
        seccion_id: l.seccion_id || null,
        ubicacion_id: l.ubicacion_id || null,
        idioma_id: l.idioma_id || null,
        condicion: l.condicion || null,
        anio_publicacion: l.anio_publicacion || null,
        paginas: l.paginas || null,
        notas: l.notas || null,
        autor_id: (l.autores || []).map(a => a.id).filter(Boolean),
      })});
      ok++;
    } catch { fail++; }
  }
  e.target.value = ""; // permite reimportar el mismo archivo
  await cargarCatalogos();
  await refrescarTodo();
  toast(`Importación terminada: ${ok} añadidos, ${fail} fallidos.`, fail ? "error" : "success");
});


//  Agregar libro leído
document.getElementById("btnNuevoLeido").addEventListener("click", () => {
  ["lmTitulo","lmAutores","lmEditorial","lmPaginas","lmAnio","lmFechaFin"].forEach(id =>
    document.getElementById(id).value = "");
  document.getElementById("lmFormato").value = "";
  document.getElementById("lmCalificacion").value = "";
  document.getElementById("modalLeido").classList.add("show");
});

document.getElementById("btnCancelarModalLeido").addEventListener("click", () => {
  document.getElementById("modalLeido").classList.remove("show");
});

document.getElementById("btnGuardarLeido").addEventListener("click", async () => {
  const titulo = document.getElementById("lmTitulo").value.trim();
  if (!titulo){ toast("El título es obligatorio.", "error"); return; }

  try {
    // Crear libro con posesion='Registrado'. NO aparece en inventario
    const libro = await api("/libros", {
      method: "POST",
      body: JSON.stringify({
        titulo,
        posesion: "Registrado",
        formato: document.getElementById("lmFormato").value || null,
        paginas: Number(document.getElementById("lmPaginas").value) || null,
        anio_publicacion: Number(document.getElementById("lmAnio").value) || null,
        autor_ids: await idsAutoresPorNombre(document.getElementById("lmAutores").value),
      })
    });

    // Crear la lectura
    await api("/lecturas", {
      method: "POST",
      body: JSON.stringify({
        libro_id: libro.id,
        fecha_fin: document.getElementById("lmFechaFin").value || new Date().toISOString().slice(0,10),
        calificacion: Number(document.getElementById("lmCalificacion").value) || null,
      })
    });

    document.getElementById("modalLeido").classList.remove("show");
    lecturasCache = null; librosLeidosSet = new Set();
    await cargarCatalogos();
    await cargarLeidos();
    await cargarStatsExtras();
    toast("Libro leído agregado.", "success");
  } catch(e){
    toast("Error al guardar: " + (e.message || e), "error");
  }
});


//  Agregar a la lista de deseos
document.getElementById("btnNuevoDeseo").addEventListener("click", () => {
  ["dmTitulo","dmAutores","dmEditorial","dmPaginas","dmPrecio","dmMotivo"].forEach(id =>
    document.getElementById(id).value = "");
  document.getElementById("dmFormato").value = "Cualquiera";
  document.getElementById("dmPrioridad").value = "Media";
  document.getElementById("modalDeseo").classList.add("show");
});

document.getElementById("btnCancelarModalDeseo").addEventListener("click", () => {
  document.getElementById("modalDeseo").classList.remove("show");
});

document.getElementById("btnGuardarDeseo").addEventListener("click", async () => {
  const titulo = document.getElementById("dmTitulo").value.trim();
  if (!titulo){ toast("El título es obligatorio.", "error"); return; }

  try {
    await api("/deseos", {
      method: "POST",
      body: JSON.stringify({
        titulo,
        autor_texto: document.getElementById("dmAutores").value.trim() || null,
        editorial_texto: document.getElementById("dmEditorial").value.trim() || null,
        paginas: Number(document.getElementById("dmPaginas").value) || null,
        formato_deseado: document.getElementById("dmFormato").value,
        prioridad: document.getElementById("dmPrioridad").value,
        precio_estimado: Number(document.getElementById("dmPrecio").value) || null,
        motivo: document.getElementById("dmMotivo").value.trim() || null,
        comprado: false,
      })
    });

    document.getElementById("modalDeseo").classList.remove("show");
    await cargarDeseos();
    await cargarStatsExtras();
    toast("Añadido a la lista de deseos.", "success");
  } catch(e){
    toast("Error al guardar: " + (e.message || e), "error");
  }
});