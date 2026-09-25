'''
Archivo: schemas.py
Proyecto: inventario-biblioteca-personal
Autor: Cristian Eduardo Pichardo Rico
Descripción: Este archivo contiene los esquemas de datos que definen la estructura de entrada y 
            salida de la API utilizando Pydantic. 
            Cada clase define los campos esperados en las solicitudes y respuestas, así como las 
            validaciones necesarias. 
            Estos esquemas se utilizan para garantizar que los datos enviados y recibidos a través de 
            la API cumplan con los requisitos definidos.
'''

# Esquemas Pydantic: definen qué entra y sale de la API.

# Importamos las bibliotecas necesarias para definir los esquemas de datos y las validaciones.
from datetime import date, datetime
from typing import Optional, List
from pydantic import BaseModel, ConfigDict


# Catálogos simples: Seccion, Ubicacion, Idioma, Editorial, Autor, Genero, Serie
class CatalogoOut(BaseModel):
    id: int
    nombre: str
    model_config = ConfigDict(from_attributes=True)


# Libros: entrada y salida
class LibroBase(BaseModel):
    titulo: str
    subtitulo: Optional[str] = None
    isbn: Optional[str] = None
    posesion: str = "Físico"
    editorial_id: Optional[int] = None
    idioma_id: Optional[int] = None
    anio_publicacion: Optional[int] = None
    edicion: Optional[str] = None
    paginas: Optional[int] = None
    serie_id: Optional[int] = None
    numero_serie: Optional[int] = None
    portada_url: Optional[str] = None
    formato: Optional[str] = None
    seccion_id: Optional[int] = None
    ubicacion_id: Optional[int] = None
    condicion: Optional[str] = None
    firmado: bool = False
    fecha_adquisicion: Optional[date] = None
    precio_compra: Optional[float] = None
    notas: Optional[str] = None


class LibroCreate(LibroBase):
    autor_ids: List[int] = []
    genero_ids: List[int] = []


class LibroUpdate(BaseModel):
    """Todos los campos opcionales: permite editar solo lo que cambie."""
    titulo: Optional[str] = None
    subtitulo: Optional[str] = None
    isbn: Optional[str] = None
    posesion: Optional[str] = None
    editorial_id: Optional[int] = None
    idioma_id: Optional[int] = None
    anio_publicacion: Optional[int] = None
    edicion: Optional[str] = None
    paginas: Optional[int] = None
    serie_id: Optional[int] = None
    numero_serie: Optional[int] = None
    portada_url: Optional[str] = None
    formato: Optional[str] = None
    seccion_id: Optional[int] = None
    ubicacion_id: Optional[int] = None
    condicion: Optional[str] = None
    firmado: Optional[bool] = None
    fecha_adquisicion: Optional[date] = None
    precio_compra: Optional[float] = None
    notas: Optional[str] = None
    autor_ids: Optional[List[int]] = None
    genero_ids: Optional[List[int]] = None


class LibroOut(LibroBase):
    id: int
    autores: List[CatalogoOut] = []
    generos: List[CatalogoOut] = []
    seccion: Optional[CatalogoOut] = None
    ubicacion: Optional[CatalogoOut] = None
    idioma: Optional[CatalogoOut] = None
    editorial: Optional[CatalogoOut] = None
    model_config = ConfigDict(from_attributes=True)


# Lecturas
class LecturaBase(BaseModel):
    libro_id: int
    fecha_inicio: Optional[date] = None
    fecha_fin: Optional[date] = None
    estado: str = "Terminado"
    calificacion: Optional[int] = None
    resena: Optional[str] = None


class LecturaCreate(LecturaBase):
    pass


class LecturaOut(LecturaBase):
    id: int
    libro: Optional[LibroOut] = None
    model_config = ConfigDict(from_attributes=True)


# Lista de deseos
class DeseoBase(BaseModel):
    libro_id: Optional[int] = None
    titulo: Optional[str] = None
    autor_texto: Optional[str] = None
    editorial_texto: Optional[str] = None      
    paginas: Optional[int] = None
    isbn: Optional[str] = None
    formato_deseado: str = "Cualquiera"
    prioridad: str = "Media"
    precio_estimado: Optional[float] = None
    enlace: Optional[str] = None
    motivo: Optional[str] = None
    comprado: bool = False


class DeseoCreate(DeseoBase):
    pass


class DeseoOut(DeseoBase):
    id: int
    agregado_en: Optional[date] = None
    model_config = ConfigDict(from_attributes=True)


# Estadísticas
class ConteoOut(BaseModel):
    nombre: str
    total: int