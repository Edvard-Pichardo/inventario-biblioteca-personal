'''
Archivo: crud.py
Proyecto: inventario-biblioteca-personal
Autor: Cristian Eduardo Pichardo Rico
Descripción: Este archivo contiene las funciones de operaciones CRUD (Crear, Leer, Actualizar, Eliminar) 
            que interactúan con la base de datos utilizando SQLAlchemy.
            Cada función realiza una operación específica en la base de datos, como obtener registros, 
            crear nuevos registros, actualizar registros existentes o eliminar registros. 
            Estas funciones se utilizan en los endpoints de la API para realizar las acciones solicitadas 
            por los usuarios.
'''

#Operaciones sobre la base de datos.

# Importamos las bibliotecas necesarias para definir las funciones CRUD y realizar consultas a la base de datos.
from typing import Optional, List
from sqlalchemy.orm import Session
from sqlalchemy import select
from . import models, schemas


# Catálogos
def get_catalogo(db: Session, modelo):
    return db.execute(select(modelo)).scalars().all()


def get_or_create_autor(db: Session, nombre: str) -> models.Autor:
    autor = db.execute(select(models.Autor).where(models.Autor.nombre == nombre)).scalar_one_or_none()
    if not autor:
        autor = models.Autor(nombre=nombre)
        db.add(autor)
        db.commit()
        db.refresh(autor)
    return autor


# Libros: filtros combinables
def get_libros(
    db: Session,
    posesion: Optional[str] = None,
    seccion_id: Optional[int] = None,
    ubicacion_id: Optional[int] = None,
    idioma_id: Optional[int] = None,
    formato: Optional[str] = None,
    autor_id: Optional[int] = None,
    texto: Optional[str] = None,
) -> List[models.Libro]:
    query = select(models.Libro).distinct()

    if posesion:
        query = query.where(models.Libro.posesion == posesion)
    if seccion_id:
        query = query.where(models.Libro.seccion_id == seccion_id)
    if ubicacion_id:
        query = query.where(models.Libro.ubicacion_id == ubicacion_id)
    if idioma_id:
        query = query.where(models.Libro.idioma_id == idioma_id)
    if formato:
        query = query.where(models.Libro.formato == formato)
    if autor_id:
        query = query.join(models.libro_autor_tbl).where(
            models.libro_autor_tbl.c.autor_id == autor_id
        )
    if texto:
        like = f"%{texto}%"
        query = query.where(models.Libro.titulo.like(like))

    return db.execute(query).unique().scalars().all()


def get_libro(db: Session, libro_id: int) -> Optional[models.Libro]:
    return db.get(models.Libro, libro_id)


def create_libro(db: Session, data: schemas.LibroCreate) -> models.Libro:
    payload = data.model_dump(exclude={"autor_ids", "genero_ids"})
    libro = models.Libro(**payload)

    if data.autor_ids:
        libro.autores = db.execute(
            select(models.Autor).where(models.Autor.id.in_(data.autor_ids))
        ).scalars().all()
    if data.genero_ids:
        libro.generos = db.execute(
            select(models.Genero).where(models.Genero.id.in_(data.genero_ids))
        ).scalars().all()

    db.add(libro)
    db.commit()
    db.refresh(libro)
    return libro


def update_libro(db: Session, libro_id: int, data: schemas.LibroUpdate) -> Optional[models.Libro]:
    libro = db.get(models.Libro, libro_id)
    if not libro:
        return None

    updates = data.model_dump(exclude_unset=True, exclude={"autor_ids", "genero_ids"})
    for campo, valor in updates.items():
        setattr(libro, campo, valor)

    if data.autor_ids is not None:
        libro.autores = db.execute(
            select(models.Autor).where(models.Autor.id.in_(data.autor_ids))
        ).scalars().all()
    if data.genero_ids is not None:
        libro.generos = db.execute(
            select(models.Genero).where(models.Genero.id.in_(data.genero_ids))
        ).scalars().all()

    db.commit()
    limpiar_autores_huerfanos(db)
    db.refresh(libro)
    return libro


def delete_libro(db: Session, libro_id: int) -> bool:
    libro = db.get(models.Libro, libro_id)
    if not libro:
        return False
    db.delete(libro)
    db.commit()
    limpiar_autores_huerfanos(db)  
    return True


def bulk_update_libros(db: Session, libro_ids: List[int], campo: str, valor) -> int:
    # Para 'seleccionar varios y mover de ubicación/sección' desde la interfaz.
    campos_permitidos = {"seccion_id", "ubicacion_id", "condicion", "posesion"}
    if campo not in campos_permitidos:
        raise ValueError(f"Campo no editable en lote: {campo}")
    libros = db.execute(
        select(models.Libro).where(models.Libro.id.in_(libro_ids))
    ).scalars().all()
    for libro in libros:
        setattr(libro, campo, valor)
    db.commit()
    return len(libros)


def bulk_delete_libros(db: Session, libro_ids: List[int]) -> int:
    libros = db.execute(
        select(models.Libro).where(models.Libro.id.in_(libro_ids))
    ).scalars().all()
    for libro in libros:
        db.delete(libro)
    db.commit()
    limpiar_autores_huerfanos(db) 
    return len(libros)


# Lecturas
def get_lecturas(db: Session, anio: Optional[int] = None) -> List[models.Lectura]:
    query = select(models.Lectura).order_by(models.Lectura.fecha_fin.desc())
    if anio:
        query = query.where(
            models.Lectura.fecha_fin.between(f"{anio}-01-01", f"{anio}-12-31")
        )
    return db.execute(query).scalars().all()


def create_lectura(db: Session, data: schemas.LecturaCreate) -> models.Lectura:
    # Insertar otra fila con el mismo libro_id = releer un libro.
    lectura = models.Lectura(**data.model_dump())
    db.add(lectura)
    db.commit()
    db.refresh(lectura)
    return lectura


def delete_lectura(db: Session, lectura_id: int) -> bool:
    lectura = db.get(models.Lectura, lectura_id)
    if not lectura:
        return False
    db.delete(lectura)
    db.commit()
    return True


# Lista de deseos
def get_deseos(db: Session, comprado: Optional[bool] = None) -> List[models.ListaDeseos]:
    query = select(models.ListaDeseos)
    if comprado is not None:
        query = query.where(models.ListaDeseos.comprado == comprado)
    return db.execute(query.order_by(models.ListaDeseos.prioridad)).scalars().all()


def create_deseo(db: Session, data: schemas.DeseoCreate) -> models.ListaDeseos:
    deseo = models.ListaDeseos(**data.model_dump())
    db.add(deseo)
    db.commit()
    db.refresh(deseo)
    return deseo


def delete_deseo(db: Session, deseo_id: int) -> bool:
    deseo = db.get(models.ListaDeseos, deseo_id)
    if not deseo:
        return False
    db.delete(deseo)
    db.commit()
    return True


# Estadísticas para el dashboard
def conteo_por_seccion(db: Session):
    resultado = []
    for seccion in db.execute(select(models.Seccion)).scalars().all():
        total = db.execute(
            select(models.Libro).where(
                models.Libro.seccion_id == seccion.id,
                models.Libro.posesion == "Físico",
            )
        ).unique().scalars().all()
        resultado.append({"nombre": seccion.nombre, "total": len(total)})
    return resultado


def conteo_por_ubicacion(db: Session):
    resultado = []
    for ubicacion in db.execute(select(models.Ubicacion)).scalars().all():
        total = db.execute(
            select(models.Libro).where(
                models.Libro.ubicacion_id == ubicacion.id,
                models.Libro.posesion == "Físico",
            )
        ).unique().scalars().all()
        resultado.append({"nombre": ubicacion.nombre, "total": len(total)})
    return resultado


def total_libros(db: Session, posesion: str = "Físico") -> int:
    return len(
        db.execute(
            select(models.Libro).where(models.Libro.posesion == posesion)
        ).unique().scalars().all()
    )

def limpiar_autores_huerfanos(db: Session) -> int:
    """Borra los autores que ya no están asociados a ningún libro."""
    huerfanos = db.execute(
        select(models.Autor).where(
            ~models.Autor.id.in_(
                select(models.libro_autor_tbl.c.autor_id)
            )
        )
    ).scalars().all()

    for autor in huerfanos:
        db.delete(autor)
    db.commit()
    return len(huerfanos)