'''
Archivo: main.py
Proyecto: inventario-biblioteca-personal
Autor: Cristian Eduardo Pichardo Rico
Descripción: Este archivo contiene la definición de la API REST utilizando FastAPI. 
            Se definen los endpoints para interactuar con la base de datos,
            incluyendo operaciones CRUD para libros, catálogos, lecturas y lista de deseos.
            También se incluyen filtros para la búsqueda de libros y la integración con APIs externas.
'''

# API de la biblioteca personal.

# Importamos las bibliotecas necesarias para crear la API REST y manejar las solicitudes HTTP.
from typing import Optional, List
from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from . import crud, models, schemas
from .database import engine, get_db, Base
from .isbn_lookup import buscar_por_isbn

# Creamos las tablas en la base de datos si no existen. Esto asegura que la estructura de la base 
# de datos esté lista antes de que la API comience a recibir solicitudes.
Base.metadata.create_all(bind=engine)  # crea tablas si no existen

app = FastAPI(title="Biblioteca personal de Edvard")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # uso local; ajusta si publicas la app
    allow_methods=["*"],
    allow_headers=["*"],
)


# Catálogos (alimentan los filtros del front)
@app.get("/secciones", response_model=List[schemas.CatalogoOut])
def listar_secciones(db: Session = Depends(get_db)):
    return crud.get_catalogo(db, models.Seccion)


@app.get("/ubicaciones", response_model=List[schemas.CatalogoOut])
def listar_ubicaciones(db: Session = Depends(get_db)):
    return crud.get_catalogo(db, models.Ubicacion)


@app.get("/idiomas", response_model=List[schemas.CatalogoOut])
def listar_idiomas(db: Session = Depends(get_db)):
    return crud.get_catalogo(db, models.Idioma)


@app.get("/autores", response_model=List[schemas.CatalogoOut])
def listar_autores(db: Session = Depends(get_db)):
    return crud.get_catalogo(db, models.Autor)


@app.post("/autores", response_model=schemas.CatalogoOut, status_code=201)
def crear_autor(nombre: str, db: Session = Depends(get_db)):
    """Crea el autor si no existe, o devuelve el existente (evita duplicados)."""
    return crud.get_or_create_autor(db, nombre.strip())


@app.get("/editoriales", response_model=List[schemas.CatalogoOut])
def listar_editoriales(db: Session = Depends(get_db)):
    return crud.get_catalogo(db, models.Editorial)


# Libros
@app.get("/libros", response_model=List[schemas.LibroOut])
def listar_libros(
    posesion: Optional[str] = None,
    seccion_id: Optional[int] = None,
    ubicacion_id: Optional[int] = None,
    idioma_id: Optional[int] = None,
    formato: Optional[str] = None,
    autor_id: Optional[int] = None,
    texto: Optional[str] = None,
    db: Session = Depends(get_db),
):
    # Filtros combinables: cualquier combinación de query params se aplica junta.
    return crud.get_libros(
        db, posesion, seccion_id, ubicacion_id, idioma_id, formato, autor_id, texto
    )


@app.get("/libros/{libro_id}", response_model=schemas.LibroOut)
def obtener_libro(libro_id: int, db: Session = Depends(get_db)):
    libro = crud.get_libro(db, libro_id)
    if not libro:
        raise HTTPException(404, "Libro no encontrado")
    return libro


@app.post("/libros", response_model=schemas.LibroOut, status_code=201)
def crear_libro(libro: schemas.LibroCreate, db: Session = Depends(get_db)):
    return crud.create_libro(db, libro)


@app.patch("/libros/{libro_id}", response_model=schemas.LibroOut)
def editar_libro(libro_id: int, cambios: schemas.LibroUpdate, db: Session = Depends(get_db)):
    libro = crud.update_libro(db, libro_id, cambios)
    if not libro:
        raise HTTPException(404, "Libro no encontrado")
    return libro


@app.delete("/libros/{libro_id}", status_code=204)
def eliminar_libro(libro_id: int, db: Session = Depends(get_db)):
    if not crud.delete_libro(db, libro_id):
        raise HTTPException(404, "Libro no encontrado")


@app.post("/libros/lote/mover")
def mover_lote(libro_ids: List[int], campo: str, valor: str, db: Session = Depends(get_db)):
    # Para seleccionar varios libros y cambiarles sección/ubicación/condición a la vez.
    try:
        n = crud.bulk_update_libros(db, libro_ids, campo, valor)
    except ValueError as e:
        raise HTTPException(400, str(e))
    return {"actualizados": n}


@app.post("/libros/lote/eliminar")
def eliminar_lote(libro_ids: List[int], db: Session = Depends(get_db)):
    n = crud.bulk_delete_libros(db, libro_ids)
    return {"eliminados": n}


# Autocompletar por ISBN (código de barras)
@app.get("/isbn/{isbn}")
def autocompletar_por_isbn(isbn: str):
    return buscar_por_isbn(isbn)


# Lecturas (libros leídos, permite duplicar = releer)
@app.get("/lecturas", response_model=List[schemas.LecturaOut])
def listar_lecturas(anio: Optional[int] = None, db: Session = Depends(get_db)):
    return crud.get_lecturas(db, anio)


@app.post("/lecturas", response_model=schemas.LecturaOut, status_code=201)
def registrar_lectura(lectura: schemas.LecturaCreate, db: Session = Depends(get_db)):
    return crud.create_lectura(db, lectura)


@app.delete("/lecturas/{lectura_id}", status_code=204)
def eliminar_lectura(lectura_id: int, db: Session = Depends(get_db)):
    if not crud.delete_lectura(db, lectura_id):
        raise HTTPException(404, "Lectura no encontrada")


# Lista de deseos (libros por comprar) 
@app.get("/deseos", response_model=List[schemas.DeseoOut])
def listar_deseos(comprado: Optional[bool] = None, db: Session = Depends(get_db)):
    return crud.get_deseos(db, comprado)


@app.post("/deseos", response_model=schemas.DeseoOut, status_code=201)
def agregar_deseo(deseo: schemas.DeseoCreate, db: Session = Depends(get_db)):
    return crud.create_deseo(db, deseo)


@app.delete("/deseos/{deseo_id}", status_code=204)
def eliminar_deseo(deseo_id: int, db: Session = Depends(get_db)):
    if not crud.delete_deseo(db, deseo_id):
        raise HTTPException(404, "Deseo no encontrado")


# Estadísticas para la pantalla de inicio
@app.get("/stats/resumen")
def resumen(db: Session = Depends(get_db)):
    return {
        "total_fisicos": crud.total_libros(db, "Físico"),
        "total_kindle": crud.total_libros(db, "Kindle"),
        "por_seccion": crud.conteo_por_seccion(db),
        "por_ubicacion": crud.conteo_por_ubicacion(db),
    }