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


// Toasts
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


//  Helpers de ordenación y filtros
const ORDEN_COLLATOR = new Intl.Collator("es", { sensitivity: "base" });

function ordenarLibros(lista, orden){
  const copia = [...lista];
  switch(orden){
    case "fecha-desc":  return copia.sort((a,b) => (b.id || 0) - (a.id || 0));
    case "fecha-asc":   return copia.sort((a,b) => (a.id || 0) - (b.id || 0));
    case "titulo-asc":  return copia.sort((a,b) => ORDEN_COLLATOR.compare(a.titulo||"", b.titulo||""));
    case "titulo-desc": return copia.sort((a,b) => ORDEN_COLLATOR.compare(b.titulo||"", a.titulo||""));
    case "autor-asc":   return copia.sort((a,b) => {
      const an = (a.autores||[]).map(x=>x.nombre).join(", ");
      const bn = (b.autores||[]).map(x=>x.nombre).join(", ");
      return ORDEN_COLLATOR.compare(an, bn);
    });
    default: return copia;
  }
}

function ordenarLecturas(lista, orden){
  const copia = [...lista];
  switch(orden){
    case "fecha-desc":  return copia.sort((a,b) => (b.fecha_fin||"").localeCompare(a.fecha_fin||""));
    case "fecha-asc":   return copia.sort((a,b) => (a.fecha_fin||"").localeCompare(b.fecha_fin||""));
    case "titulo-asc":  return copia.sort((a,b) => ORDEN_COLLATOR.compare(a.libro?.titulo||"", b.libro?.titulo||""));
    case "titulo-desc": return copia.sort((a,b) => ORDEN_COLLATOR.compare(b.libro?.titulo||"", a.libro?.titulo||""));
    case "calif-desc":  return copia.sort((a,b) => (b.calificacion||0) - (a.calificacion||0));
    default: return copia;
  }
}

function ordenarDeseos(lista, orden){
  const copia = [...lista];
  const pesoPrioridad = { Alta: 0, Media: 1, Baja: 2 };
  switch(orden){
    case "fecha-desc":  return copia.sort((a,b) => (b.agregado_en||"").localeCompare(a.agregado_en||""));
    case "fecha-asc":   return copia.sort((a,b) => (a.agregado_en||"").localeCompare(b.agregado_en||""));
    case "titulo-asc":  return copia.sort((a,b) => ORDEN_COLLATOR.compare(a.titulo||"", b.titulo||""));
    case "titulo-desc": return copia.sort((a,b) => ORDEN_COLLATOR.compare(b.titulo||"", a.titulo||""));
    case "prioridad":   return copia.sort((a,b) => (pesoPrioridad[a.prioridad]??9) - (pesoPrioridad[b.prioridad]??9));
    default: return copia;
  }
}

// Rellena el <select> de años en "Libros leídos" con los años detectados
function llenarAniosLeidos(lecturas){
  const sel = document.getElementById("lAnio");
  const actual = sel.value;
  const anios = [...new Set(
    lecturas
      .map(l => l.fecha_fin ? l.fecha_fin.slice(0,4) : null)
      .filter(Boolean)
  )].sort((a,b) => b.localeCompare(a)); // años descendentes

  sel.innerHTML = `<option value="">Todos los años</option>` +
    anios.map(a => `<option value="${a}">${a}</option>`).join("");

  // Restaura la selección previa si sigue existiendo
  if (actual && anios.includes(actual)) sel.value = actual;
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

    // Ordenamiento (siempre que haya un criterio elegido)
    const ordenInv = document.getElementById("fOrden").value;
    if (ordenInv) visibles = ordenarLibros(visibles, ordenInv);

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
  librosFisicosCache = null;
  await refrescarTodo();
});
document.getElementById("bulkUbicacion").addEventListener("change", async (e)=>{
  if (!e.target.value || !seleccionados.size) return;
  await api(`/libros/lote/mover?campo=ubicacion_id&valor=${e.target.value}`, {
    method:"POST", body: JSON.stringify([...seleccionados])
  });
  e.target.value=""; seleccionados.clear(); actualizarBulkbar();
  librosFisicosCache = null;
  await refrescarTodo();
});
document.getElementById("bulkSeccion").addEventListener("change", async (e)=>{
  if (!e.target.value || !seleccionados.size) return;
  await api(`/libros/lote/mover?campo=seccion_id&valor=${e.target.value}`, {
    method:"POST", body: JSON.stringify([...seleccionados])
  });
  e.target.value=""; seleccionados.clear(); actualizarBulkbar();
  librosFisicosCache = null;
  await refrescarTodo();
});

// Filtros: eventos
// Cualquier cambio en un filtro vuelve a pedir el inventario de inmediato,
// así que no hace falta un botón de "buscar".
["fSeccion","fUbicacion","fIdioma","fFormato","fAutor","fEstado","fOrden"].forEach(id=>{
  document.getElementById(id).addEventListener("change", cargarInventario);
});
document.getElementById("fTexto").addEventListener("input", cargarInventarioDebounced);
document.getElementById("btnLimpiar").addEventListener("click", ()=>{
 ["fTexto","fSeccion","fUbicacion","fIdioma","fFormato","fEstado","fOrden"].forEach(id=>document.getElementById(id).value="");
  limpiarAutor();            
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
  librosFisicosCache = null;
  await refrescarTodo();
  toast(editandoId ? "Libro actualizado." : "Libro añadido.", "success");
});

async function eliminarLibro(id){
  if (!await confirmar("¿Eliminar este libro de tu inventario?", { peligro: true, textoOk: "Eliminar" })) return;
  await api(`/libros/${id}`, { method:"DELETE" });
  librosFisicosCache = null;
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

// Libros leídos
let librosFisicosCache = null;

async function cargarLibrosFisicos(){
  if (librosFisicosCache) return librosFisicosCache;
  librosFisicosCache = await api("/libros?posesion=Físico");
  return librosFisicosCache;
}

async function cargarLeidos(){
  const lecturas = await api("/lecturas");
  llenarAniosLeidos(lecturas);

  const texto = (document.getElementById("lTexto").value || "").toLowerCase().trim();
  const formato = document.getElementById("lFormato").value;
  const calif = document.getElementById("lCalificacion").value;
  const anio = document.getElementById("lAnio").value;
  const orden = document.getElementById("lOrden").value;

  let visibles = lecturas;
  if (texto) visibles = visibles.filter(l => (l.libro?.titulo || "").toLowerCase().includes(texto));
  if (formato) visibles = visibles.filter(l => l.libro?.formato === formato);
  if (calif) visibles = visibles.filter(l => String(l.calificacion || "") === calif);
  if (anio) visibles = visibles.filter(l => (l.fecha_fin || "").startsWith(anio));
  if (orden) visibles = ordenarLecturas(visibles, orden);

  const cont = document.getElementById("listaLeidos");
  if (!visibles.length){
    cont.innerHTML = `<div class="empty">No hay lecturas que coincidan.</div>`;
    return;
  }
  cont.innerHTML = visibles.map(l => `
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
    lecturasCache = null; librosLeidosSet = new Set();
    cargarLeidos(); cargarStatsExtras();
  }));
}

// Filtros de leídos
["lTexto","lFormato","lCalificacion","lAnio","lOrden"].forEach(id=>{
  document.getElementById(id).addEventListener("input", cargarLeidos);
  document.getElementById(id).addEventListener("change", cargarLeidos);
});
document.getElementById("btnLimpiarLeidos").addEventListener("click", ()=>{
  ["lTexto","lFormato","lCalificacion","lAnio","lOrden"].forEach(id=>document.getElementById(id).value="");
  cargarLeidos();
});

// Export / Import de leídos
document.getElementById("btnExportarLeidos").addEventListener("click", async () => {
  const lecturas = await api("/lecturas");
  const blob = new Blob([JSON.stringify(lecturas, null, 2)], { type:"application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `lecturas-backup-${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
});
document.getElementById("btnImportarLeidos").addEventListener("click", ()=>{
  document.getElementById("fileImportarLeidos").click();
});
document.getElementById("fileImportarLeidos").addEventListener("change", async (e)=>{
  const file = e.target.files?.[0];
  if (!file) return;
  if (!await confirmar(`¿Importar "${file.name}"? Los libros y lecturas nuevas se añadirán.`)) return;
  const texto = await file.text();
  let data;
  try { data = JSON.parse(texto); } catch { toast("JSON inválido.", "error"); return; }
  if (!Array.isArray(data)){ toast("El JSON debe ser un array.", "error"); return; }
  let ok = 0, fail = 0;
  for (const item of data){
    try {
      // Si no trae libro_id, crea el libro primero
      let libroId = item.libro_id;
      if (!libroId && item.libro){
        const l = item.libro;
        const nuevo = await api("/libros", { method:"POST", body: JSON.stringify({
          titulo: l.titulo, posesion:"Registrado", isbn: l.isbn || null,
          formato: l.formato || null, paginas: l.paginas || null,
          anio_publicacion: l.anio_publicacion || null,
          autor_ids: (l.autores||[]).map(a=>a.id).filter(Boolean),
        })});
        libroId = nuevo.id;
      }
      if (!libroId) { fail++; continue; }
      await api("/lecturas", { method:"POST", body: JSON.stringify({
        libro_id: libroId,
        fecha_inicio: item.fecha_inicio || null,
        fecha_fin: item.fecha_fin || null,
        calificacion: item.calificacion || null,
        resena: item.resena || null,
      })});
      ok++;
    } catch { fail++; }
  }
  e.target.value = "";
  lecturasCache = null;
  await cargarLeidos(); await cargarStatsExtras();
  toast(`Importación: ${ok} añadidos, ${fail} fallidos.`, fail ? "error" : "success");
});

// Modal Leído: abrir / cerrar
async function abrirModalLeido(){
  // Limpiar
  ["lmIsbn","lmTitulo","lmAutores","lmEditorial","lmPaginas","lmAnio","lmFechaFin","lmOpinion"].forEach(id =>
    document.getElementById(id).value = "");
  document.getElementById("lmFormato").value = "";
  document.getElementById("lmCalificacion").value = "";
  document.getElementById("lmIsbnStatus").textContent = "";

  // Reset del autocompletado
  lmLibrosDisponibles = await cargarLibrosFisicos();
  lmBuscar.value = "";
  lmHidden.value = "";
  lmClear.hidden = true;
  lmDropdown.hidden = true;
  actualizarCamposManualesLeido(false);

  document.getElementById("modalLeido").classList.add("show");
}
document.getElementById("btnNuevoLeido").addEventListener("click", abrirModalLeido);
document.getElementById("btnCancelarModalLeido").addEventListener("click", ()=>{
  document.getElementById("modalLeido").classList.remove("show");
});

//  Autocompletado de libros existentes en el modal Leído
const lmBuscar  = document.getElementById("lmBuscarLibro");
const lmDropdown = document.getElementById("lmDropdown");
const lmHidden  = document.getElementById("lmLibroExistente");
const lmClear   = document.getElementById("lmClearLibro");

let lmLibrosDisponibles = [];
let lmIndexActivo = -1;

function abrirAutocompleteLeido(){
  // Si ya hay un libro seleccionado, limpiar al enfocar
  if (lmHidden.value){
    lmBuscar.value = "";
    lmHidden.value = "";
    actualizarCamposManualesLeido(false);
    lmClear.hidden = true;
  }
  if (!lmLibrosDisponibles.length){
    lmDropdown.innerHTML = `<div class="ac-empty">No tienes libros físicos registrados todavía.</div>`;
    lmDropdown.hidden = false;
    return;
  }
  renderDropdownLeido(lmLibrosDisponibles);
}

function renderDropdownLeido(lista, vacio = "Sin coincidencias"){
  if (!lista.length){
    lmDropdown.innerHTML = `<div class="ac-empty">${vacio}</div>`;
    lmDropdown.hidden = false;
    lmIndexActivo = -1;
    return;
  }

  const MAX = 8;                               
  const visibles = lista.slice(0, MAX);
  const restantes = lista.length - visibles.length;

  lmDropdown.innerHTML = visibles.map((l, i) => `
      <div class="ac-item" data-id="${l.id}" data-index="${i}">
        <div class="ac-title">${esc(l.titulo)}</div>
        <div class="ac-sub">${esc((l.autores||[]).map(a=>a.nombre).join(", ") || "Autor desconocido")}</div>
      </div>`).join("") +
    (restantes > 0
      ? `<div class="ac-empty">Y ${restantes} más… sigue escribiendo para filtrar.</div>`
      : "");

  lmDropdown.hidden = false;
  lmIndexActivo = -1;
  lmDropdown.querySelectorAll(".ac-item").forEach(item=>{
    item.addEventListener("click", ()=>{
      seleccionarLibroLeido(Number(item.dataset.id));
    });
  });
}

function seleccionarLibroLeido(id){
  const libro = lmLibrosDisponibles.find(l => l.id === id);
  if (!libro) return;
  lmHidden.value = String(id);
  lmBuscar.value = libro.titulo;
  lmDropdown.hidden = true;
  lmClear.hidden = false;
  actualizarCamposManualesLeido(true);
}

function actualizarCamposManualesLeido(usarExistente){
  document.getElementById("lmIsbnRow").style.display    = usarExistente ? "none" : "flex";
  document.getElementById("lmTituloField").style.display = usarExistente ? "none" : "";
  document.getElementById("lmAutoresField").style.display = usarExistente ? "none" : "grid";
  document.getElementById("lmFormatoField").style.display = usarExistente ? "none" : "grid";
}

lmBuscar.addEventListener("focus", abrirAutocompleteLeido);

lmBuscar.addEventListener("input", ()=>{
  lmHidden.value = "";      // al escribir, invalida cualquier selección previa
  lmClear.hidden = true;
  actualizarCamposManualesLeido(false);

  const q = lmBuscar.value.toLowerCase().trim();
  if (!q){
    renderDropdownLeido(lmLibrosDisponibles);
    return;
  }
  const filtrados = lmLibrosDisponibles.filter(l => {
    const t = (l.titulo || "").toLowerCase();
    const a = (l.autores||[]).map(x=>x.nombre).join(" ").toLowerCase();
    return t.includes(q) || a.includes(q);
  });
  renderDropdownLeido(filtrados, "Ningún libro coincide con la búsqueda");
});

// Navegación por teclado (↑ ↓ Enter Esc)
lmBuscar.addEventListener("keydown", (e)=>{
  const items = [...lmDropdown.querySelectorAll(".ac-item")];
  if (lmDropdown.hidden || !items.length){
    if (e.key === "Escape") lmDropdown.hidden = true;
    return;
  }
  if (e.key === "ArrowDown"){
    e.preventDefault();
    lmIndexActivo = (lmIndexActivo + 1) % items.length;
    items.forEach((it,i)=>it.classList.toggle("active", i === lmIndexActivo));
    items[lmIndexActivo].scrollIntoView({block:"nearest"});
  } else if (e.key === "ArrowUp"){
    e.preventDefault();
    lmIndexActivo = (lmIndexActivo - 1 + items.length) % items.length;
    items.forEach((it,i)=>it.classList.toggle("active", i === lmIndexActivo));
    items[lmIndexActivo].scrollIntoView({block:"nearest"});
  } else if (e.key === "Enter"){
    e.preventDefault();
    if (lmIndexActivo >= 0){
      seleccionarLibroLeido(Number(items[lmIndexActivo].dataset.id));
    } else if (items.length === 1){
      seleccionarLibroLeido(Number(items[0].dataset.id));
    }
  } else if (e.key === "Escape"){
    lmDropdown.hidden = true;
  }
});

// Cerrar dropdown al hacer clic fuera
document.addEventListener("click", (e)=>{
  if (!document.getElementById("lmAutocomplete").contains(e.target)){
    lmDropdown.hidden = true;
  }
});

// Botón × para deseleccionar
lmClear.addEventListener("click", ()=>{
  lmHidden.value = "";
  lmBuscar.value = "";
  lmClear.hidden = true;
  actualizarCamposManualesLeido(false);
  lmBuscar.focus();
});

// ISBN dentro del modal de leído
document.getElementById("btnBuscarIsbnLeido").addEventListener("click", async ()=>{
  const isbn = document.getElementById("lmIsbn").value.trim();
  const status = document.getElementById("lmIsbnStatus");
  if (!isbn){ status.textContent = "Escribe un ISBN primero."; return; }
  status.textContent = "Buscando…";
  try{
    const d = await api("/isbn/" + encodeURIComponent(isbn));
    if (!d.encontrado){ status.textContent = "No se encontró ese ISBN."; return; }
    if (d.titulo) document.getElementById("lmTitulo").value = d.titulo;
    if (d.autores?.length) document.getElementById("lmAutores").value = d.autores.join(", ");
    if (d.editorial) document.getElementById("lmEditorial").value = d.editorial;
    if (d.anio_publicacion) document.getElementById("lmAnio").value = d.anio_publicacion;
    if (d.paginas) document.getElementById("lmPaginas").value = d.paginas;
    status.textContent = `Datos completados${d.fuente ? ` (vía ${d.fuente})` : ""}.`;
  } catch(e){ status.textContent = "Error: " + (e.message || e); }
});

// Guardar leído
document.getElementById("btnGuardarLeido").addEventListener("click", async ()=>{
  const libroExistenteId = document.getElementById("lmLibroExistente").value;
  const fechaFin = document.getElementById("lmFechaFin").value || new Date().toISOString().slice(0,10);
  const calificacion = Number(document.getElementById("lmCalificacion").value) || null;
  const resena = document.getElementById("lmOpinion").value.trim() || null;

  try{
    let libroId = libroExistenteId ? Number(libroExistenteId) : null;

    if (!libroId){
      const titulo = document.getElementById("lmTitulo").value.trim();
      if (!titulo){ toast("El título es obligatorio.", "error"); return; }
      const libro = await api("/libros", { method:"POST", body: JSON.stringify({
        titulo,
        posesion: "Registrado",
        isbn: document.getElementById("lmIsbn").value.trim() || null,
        formato: document.getElementById("lmFormato").value || null,
        paginas: Number(document.getElementById("lmPaginas").value) || null,
        anio_publicacion: Number(document.getElementById("lmAnio").value) || null,
        autor_ids: await idsAutoresPorNombre(document.getElementById("lmAutores").value),
      })});
      libroId = libro.id;
    }

    await api("/lecturas", { method:"POST", body: JSON.stringify({
      libro_id: libroId, fecha_fin: fechaFin, calificacion, resena
    })});

    document.getElementById("modalLeido").classList.remove("show");
    lecturasCache = null; librosLeidosSet = new Set();
    await cargarCatalogos();
    await cargarLeidos(); await cargarStatsExtras();
    toast("Libro leído agregado.", "success");
  } catch(e){
    toast("Error al guardar: " + (e.message || e), "error");
  }
});

//  Lista de deseos
async function cargarDeseos(){
  const deseos = await api("/deseos?comprado=false");
  const texto = (document.getElementById("dTexto").value || "").toLowerCase().trim();
  const prioridad = document.getElementById("dPrioridad").value;
  const formato = document.getElementById("dFormato").value;
  const orden = document.getElementById("dOrden").value;

  let visibles = deseos;
  if (texto) visibles = visibles.filter(d => (d.titulo || "").toLowerCase().includes(texto));
  if (prioridad) visibles = visibles.filter(d => d.prioridad === prioridad);
  if (formato) visibles = visibles.filter(d => d.formato_deseado === formato);
  if (orden) visibles = ordenarDeseos(visibles, orden);

  const cont = document.getElementById("listaDeseos");
  if (!visibles.length){
    cont.innerHTML = `<div class="empty">Tu lista de compras está vacía o no hay coincidencias.</div>`;
    return;
  }
  cont.innerHTML = visibles.map(d => `
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

["dTexto","dPrioridad","dFormato","dOrden"].forEach(id=>{
  document.getElementById(id).addEventListener("input", cargarDeseos);
  document.getElementById(id).addEventListener("change", cargarDeseos);
});
document.getElementById("btnLimpiarDeseos").addEventListener("click", ()=>{
  ["dTexto","dPrioridad","dFormato","dOrden"].forEach(id=>document.getElementById(id).value="");
  cargarDeseos();
});

// Modal Deseo
document.getElementById("btnNuevoDeseo").addEventListener("click", ()=>{
  ["dmIsbn","dmTitulo","dmAutores","dmEditorial","dmPaginas","dmPrecio","dmMotivo"].forEach(id =>
    document.getElementById(id).value = "");
  document.getElementById("dmIsbnStatus").textContent = "";
  document.getElementById("dmFormato").value = "Cualquiera";
  document.getElementById("dmPrioridad").value = "Media";
  document.getElementById("modalDeseo").classList.add("show");
});
document.getElementById("btnCancelarModalDeseo").addEventListener("click", ()=>{
  document.getElementById("modalDeseo").classList.remove("show");
});

// ISBN dentro del modal de deseo
document.getElementById("btnBuscarIsbnDeseo").addEventListener("click", async ()=>{
  const isbn = document.getElementById("dmIsbn").value.trim();
  const status = document.getElementById("dmIsbnStatus");
  if (!isbn){ status.textContent = "Escribe un ISBN primero."; return; }
  status.textContent = "Buscando…";
  try{
    const d = await api("/isbn/" + encodeURIComponent(isbn));
    if (!d.encontrado){ status.textContent = "No se encontró ese ISBN."; return; }
    if (d.titulo) document.getElementById("dmTitulo").value = d.titulo;
    if (d.autores?.length) document.getElementById("dmAutores").value = d.autores.join(", ");
    if (d.editorial) document.getElementById("dmEditorial").value = d.editorial;
    if (d.paginas) document.getElementById("dmPaginas").value = d.paginas;
    status.textContent = `Datos completados${d.fuente ? ` (vía ${d.fuente})` : ""}.`;
  } catch(e){ status.textContent = "Error: " + (e.message || e); }
});

document.getElementById("btnGuardarDeseo").addEventListener("click", async ()=>{
  const titulo = document.getElementById("dmTitulo").value.trim();
  if (!titulo){ toast("El título es obligatorio.", "error"); return; }
  try{
    await api("/deseos", { method:"POST", body: JSON.stringify({
      titulo,
      autor_texto: document.getElementById("dmAutores").value.trim() || null,
      editorial_texto: document.getElementById("dmEditorial").value.trim() || null,
      paginas: Number(document.getElementById("dmPaginas").value) || null,
      isbn: document.getElementById("dmIsbn").value.trim() || null,
      formato_deseado: document.getElementById("dmFormato").value,
      prioridad: document.getElementById("dmPrioridad").value,
      precio_estimado: Number(document.getElementById("dmPrecio").value) || null,
      motivo: document.getElementById("dmMotivo").value.trim() || null,
      comprado: false,
    })});
    document.getElementById("modalDeseo").classList.remove("show");
    await cargarDeseos(); await cargarStatsExtras();
    toast("Añadido a la lista de deseos.", "success");
  } catch(e){
    toast("Error al guardar: " + (e.message || e), "error");
  }
});

//  Cerrar modales con click afuera
["modalLeido","modalDeseo"].forEach(id=>{
  const bg = document.getElementById(id);
  bg.addEventListener("click", (e)=>{ if (e.target === bg) bg.classList.remove("show"); });
  document.addEventListener("keydown", (e)=>{
    if (e.key === "Escape" && bg.classList.contains("show")) bg.classList.remove("show");
  });
});


//  EXPORTAR / IMPORTAR INVENTARIO
document.getElementById("btnExportar").addEventListener("click", async () => {
  const libros = await api("/libros?posesion=Físico");
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
        posesion: "Físico",
        formato: l.formato || null,
        seccion_id: l.seccion_id || null,
        ubicacion_id: l.ubicacion_id || null,
        idioma_id: l.idioma_id || null,
        condicion: l.condicion || null,
        anio_publicacion: l.anio_publicacion || null,
        paginas: l.paginas || null,
        notas: l.notas || null,
        autor_ids: (l.autores || []).map(a => a.id).filter(Boolean),
      })});
      ok++;
    } catch { fail++; }
  }
  e.target.value = "";
  librosFisicosCache = null;
  await cargarCatalogos();
  await refrescarTodo();
  toast(`Importación: ${ok} añadidos, ${fail} fallidos.`, fail ? "error" : "success");
});


//  Autocompletado para el filtro de Autor
const fAutorBuscar   = document.getElementById("fAutorBuscar");
const fAutorDropdown = document.getElementById("fAutorDropdown");
const fAutorHidden   = document.getElementById("fAutor");
const fAutorClear    = document.getElementById("fAutorClear");

let fAutorIndex = -1;

function renderDropdownAutor(lista, vacio = "Sin coincidencias"){
  if (!lista.length){
    fAutorDropdown.innerHTML = `<div class="ac-empty">${vacio}</div>`;
    fAutorDropdown.hidden = false;
    fAutorIndex = -1;
    return;
  }

  const MAX = 8;
  const visibles = lista.slice(0, MAX);
  const restantes = lista.length - visibles.length;

  fAutorDropdown.innerHTML = visibles.map((a, i) => `
      <div class="ac-item" data-id="${a.id}" data-index="${i}">
        <div class="ac-title">${esc(a.nombre)}</div>
      </div>`).join("") +
    (restantes > 0
      ? `<div class="ac-empty">Y ${restantes} más… sigue escribiendo para filtrar.</div>`
      : "");

  fAutorDropdown.hidden = false;
  fAutorIndex = -1;
  fAutorDropdown.querySelectorAll(".ac-item").forEach(item=>{
    item.addEventListener("click", ()=>{
      seleccionarAutor(Number(item.dataset.id));
    });
  });
}

function seleccionarAutor(id){
  const autor = catalogos.autores.find(a => a.id === id);
  if (!autor) return;
  fAutorHidden.value = String(id);
  fAutorBuscar.value = autor.nombre;
  fAutorDropdown.hidden = true;
  fAutorClear.hidden = false;
  cargarInventario(); // refresca con el filtro aplicado
}

function limpiarAutor(){
  fAutorHidden.value = "";
  fAutorBuscar.value = "";
  fAutorClear.hidden = true;
  cargarInventario();
}

// Abrir el dropdown al enfocar
fAutorBuscar.addEventListener("focus", ()=>{
  if (fAutorHidden.value) return; // ya hay algo seleccionado; no reabrir
  const q = fAutorBuscar.value.toLowerCase().trim();
  if (!q){ renderDropdownAutor(catalogos.autores); return; }
  const filtrados = catalogos.autores.filter(a => a.nombre.toLowerCase().includes(q));
  renderDropdownAutor(filtrados);
});

// Filtrar al escribir
fAutorBuscar.addEventListener("input", ()=>{
  fAutorHidden.value = "";
  fAutorClear.hidden = true;
  const q = fAutorBuscar.value.toLowerCase().trim();
  if (!q){
    renderDropdownAutor(catalogos.autores);
    return;
  }
  const filtrados = catalogos.autores.filter(a => a.nombre.toLowerCase().includes(q));
  renderDropdownAutor(filtrados, "Ningún autor coincide");
});

// Navegación por teclado
fAutorBuscar.addEventListener("keydown", (e)=>{
  const items = [...fAutorDropdown.querySelectorAll(".ac-item")];
  if (fAutorDropdown.hidden || !items.length){
    if (e.key === "Escape") fAutorDropdown.hidden = true;
    return;
  }
  if (e.key === "ArrowDown"){
    e.preventDefault();
    fAutorIndex = (fAutorIndex + 1) % items.length;
    items.forEach((it,i)=>it.classList.toggle("active", i === fAutorIndex));
    items[fAutorIndex].scrollIntoView({block:"nearest"});
  } else if (e.key === "ArrowUp"){
    e.preventDefault();
    fAutorIndex = (fAutorIndex - 1 + items.length) % items.length;
    items.forEach((it,i)=>it.classList.toggle("active", i === fAutorIndex));
    items[fAutorIndex].scrollIntoView({block:"nearest"});
  } else if (e.key === "Enter"){
    e.preventDefault();
    if (fAutorIndex >= 0) seleccionarAutor(Number(items[fAutorIndex].dataset.id));
    else if (items.length === 1) seleccionarAutor(Number(items[0].dataset.id));
  } else if (e.key === "Escape"){
    fAutorDropdown.hidden = true;
  }
});

// Cerrar al hacer clic fuera
document.addEventListener("click", (e)=>{
  if (!document.getElementById("fAutorWrap").contains(e.target)){
    fAutorDropdown.hidden = true;
  }
});

// Botón 
fAutorClear.addEventListener("click", limpiarAutor);

// Cambio de tema (claro / oscuro)
(function() {
  const themeToggle = document.getElementById('theme-toggle');
  const htmlElement = document.documentElement;
  const currentTheme = localStorage.getItem('theme');

  if (currentTheme) {
    htmlElement.setAttribute('data-theme', currentTheme);
  } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
    htmlElement.setAttribute('data-theme', 'light');
  } else {
    htmlElement.setAttribute('data-theme', 'dark');
  }

  function updateToggleIcon(theme) {
    themeToggle.innerHTML = theme === 'light' ? '🌙' : '☀️';
  }
  updateToggleIcon(htmlElement.getAttribute('data-theme'));

  themeToggle.addEventListener('click', () => {
    const newTheme = htmlElement.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    htmlElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateToggleIcon(newTheme);
  });
})();


//  Saludo personalizado
(function(){
  const CLAVE = 'nombreUsuario';
  const POR_DEFECTO = 'Edvard Pichardo';

  const badge = document.getElementById('welcomeBadge');
  const nombreEl = document.getElementById('welcomeName');
  if (!badge || !nombreEl) return;

  let nombre = localStorage.getItem(CLAVE) || POR_DEFECTO;
  nombreEl.textContent = nombre;

  badge.addEventListener('click', async () => {
    const nuevo = await pedirTexto('¿Cómo te llamas?', nombre, { textoOk: 'Guardar' });
    if (nuevo === null) return;
    const limpio = nuevo.trim();
    if (!limpio) return;
    nombre = limpio;
    localStorage.setItem(CLAVE, nombre);
    nombreEl.textContent = nombre;
  });
})();

//  Frase del día
(function(){
  const elTexto = document.getElementById("dailyQuote");
  const elAutor = document.getElementById("dailyQuoteAuthor");
  if (!elTexto || !elAutor) return;

  const ahora = new Date();
  const inicio = new Date(ahora.getFullYear(), 0, 0);
  const dia = Math.floor((ahora - inicio) / 86400000);
  const frase = FRASES[Math.floor(Math.random() * FRASES.length)];

  elTexto.textContent = frase.texto;
  elAutor.textContent = "— " + frase.autor;
})();

//  Arranque
async function refrescarTodo(){
  await Promise.all([cargarInventario(), cargarResumen(), cargarStatsExtras()]);
}

(async function init(){
  try{
    await cargarCatalogos();
    await refrescarTodo();
  } catch(e){
    console.error("Error en init:", e);
    document.getElementById("listaInventario").innerHTML =
      `<div class="empty">No se pudo conectar con la API en ${API}.<br>Verifica que esté corriendo (uvicorn app.main:app --reload).</div>`;
  }
})();