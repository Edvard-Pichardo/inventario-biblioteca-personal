'''
Archivo: models.py
Proyecto: inventario-biblioteca-personal
Autor: Cristian Eduardo Pichardo Rico
Descripción: Este archivo contiene los modelos de datos que representan las tablas de la base de datos MySQL
            utilizando SQLAlchemy. Cada clase define una tabla y sus columnas, así como las relaciones entre
            ellas. Estos modelos se utilizan para interactuar con la base de datos en la aplicación FastAPI.
'''

# Modelos SQLAlchemy - reflejan las tablas de schema_biblioteca.sql

# Importamos las bibliotecas necesarias para definir los modelos de datos y las relaciones entre ellos.
from sqlalchemy import (
    Column, Integer, SmallInteger, String, Text, Boolean, Date, DateTime,
    DECIMAL, Enum, ForeignKey, CheckConstraint, func
)
from sqlalchemy.orm import relationship
from .database import Base

# Definimos las clases que representan las tablas de la base de datos, cada una con sus columnas y relaciones.
libro_autor = None  # se define abajo como tabla asociativa real

class Seccion(Base):
    __tablename__ = "secciones"
    id = Column(Integer, primary_key=True)
    nombre = Column(String(40), unique=True, nullable=False)

class Ubicacion(Base):
    __tablename__ = "ubicaciones"
    id = Column(Integer, primary_key=True)
    nombre = Column(String(40), unique=True, nullable=False)
    notas = Column(String(200))

class Idioma(Base):
    __tablename__ = "idiomas"
    id = Column(Integer, primary_key=True)
    nombre = Column(String(30), unique=True, nullable=False)

class Editorial(Base):
    __tablename__ = "editoriales"
    id = Column(Integer, primary_key=True)
    nombre = Column(String(100), unique=True, nullable=False)

class Autor(Base):
    __tablename__ = "autores"
    id = Column(Integer, primary_key=True)
    nombre = Column(String(120), unique=True, nullable=False)

class Genero(Base):
    __tablename__ = "generos"
    id = Column(Integer, primary_key=True)
    nombre = Column(String(50), unique=True, nullable=False)

class Serie(Base):
    __tablename__ = "series"
    id = Column(Integer, primary_key=True)
    nombre = Column(String(120), unique=True, nullable=False)


# Definimos las tablas asociativas para las relaciones muchos a muchos entre libros y autores, y entre libros y géneros.
from sqlalchemy import Table
libro_autor_tbl = Table(
    "libro_autor", Base.metadata,
    Column("libro_id", ForeignKey("libros.id", ondelete="CASCADE"), primary_key=True),
    Column("autor_id", ForeignKey("autores.id", ondelete="CASCADE"), primary_key=True),
)

libro_genero_tbl = Table(
    "libro_genero", Base.metadata,
    Column("libro_id", ForeignKey("libros.id", ondelete="CASCADE"), primary_key=True),
    Column("genero_id", ForeignKey("generos.id", ondelete="CASCADE"), primary_key=True),
)

# Definimos la clase Libro que representa la tabla "libros" en la base de datos, con sus columnas y relaciones.
class Libro(Base):
    __tablename__ = "libros"

    id = Column(Integer, primary_key=True)
    titulo = Column(String(200), nullable=False)
    subtitulo = Column(String(200))
    isbn = Column(String(20))
    posesion = Column(Enum("Físico", "Kindle", "Registrado"), nullable=False, default="Físico")

    editorial_id = Column(Integer, ForeignKey("editoriales.id", ondelete="SET NULL"))
    idioma_id = Column(Integer, ForeignKey("idiomas.id", ondelete="SET NULL"))
    anio_publicacion = Column(SmallInteger)
    edicion = Column(String(40))
    paginas = Column(SmallInteger)
    serie_id = Column(Integer, ForeignKey("series.id", ondelete="SET NULL"))
    numero_serie = Column(SmallInteger)
    portada_url = Column(String(300))

    formato = Column(Enum("Pasta blanda", "Pasta dura"))
    seccion_id = Column(Integer, ForeignKey("secciones.id"))
    ubicacion_id = Column(Integer, ForeignKey("ubicaciones.id"))
    condicion = Column(Enum("Nuevo", "Bueno", "Regular", "Desgastado"))
    firmado = Column(Boolean, default=False)
    fecha_adquisicion = Column(Date)
    precio_compra = Column(DECIMAL(8, 2))
    notas = Column(Text)

    creado_en = Column(DateTime, server_default=func.now())
    actualizado_en = Column(DateTime, server_default=func.now(), onupdate=func.now())

    editorial = relationship("Editorial")
    idioma = relationship("Idioma")
    serie = relationship("Serie")
    seccion = relationship("Seccion")
    ubicacion = relationship("Ubicacion")
    autores = relationship("Autor", secondary=libro_autor_tbl)
    generos = relationship("Genero", secondary=libro_genero_tbl)
    lecturas = relationship("Lectura", back_populates="libro", cascade="all, delete-orphan",
                             passive_deletes=False)


class Lectura(Base):
    __tablename__ = "lecturas"
    id = Column(Integer, primary_key=True)
    libro_id = Column(Integer, ForeignKey("libros.id"), nullable=False)
    fecha_inicio = Column(Date)
    fecha_fin = Column(Date)
    estado = Column(Enum("Leyendo", "Terminado", "Abandonado"), default="Terminado")
    calificacion = Column(SmallInteger)
    resena = Column(Text)

    __table_args__ = (
        CheckConstraint("calificacion BETWEEN 1 AND 5", name="chk_calificacion"),
    )

    libro = relationship("Libro", back_populates="lecturas")

class ListaDeseos(Base):
    __tablename__ = "lista_deseos"
    id = Column(Integer, primary_key=True)
    libro_id = Column(Integer, ForeignKey("libros.id", ondelete="CASCADE"))
    titulo = Column(String(200))
    autor_texto = Column(String(120))
    editorial_texto = Column(String(100))
    paginas = Column(SmallInteger)
    isbn = Column(String(20))
    formato_deseado = Column(Enum("Pasta blanda", "Pasta dura", "Cualquiera"), default="Cualquiera")
    prioridad = Column(Enum("Alta", "Media", "Baja"), default="Media")
    precio_estimado = Column(DECIMAL(8, 2))
    enlace = Column(String(300))
    motivo = Column(String(300))
    comprado = Column(Boolean, default=False)
    agregado_en = Column(Date, server_default=func.current_date())

    libro = relationship("Libro")

class Prestamo(Base):
    __tablename__ = "prestamos"
    id = Column(Integer, primary_key=True)
    libro_id = Column(Integer, ForeignKey("libros.id", ondelete="CASCADE"), nullable=False)
    persona = Column(String(80), nullable=False)
    fecha_prestamo = Column(Date, nullable=False)
    fecha_devolucion = Column(Date)

    libro = relationship("Libro")