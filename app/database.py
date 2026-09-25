'''
Archivo: database.py
Proyecto: inventario-biblioteca-personal
Autor: Cristian Eduardo Pichardo Rico
Descripción: Este archivo contiene la configuración de la conexión a la base de datos MySQL 
            utilizando SQLAlchemy. Se define la URL de conexión, se crea el motor de base de datos, 
            se configura la sesión y se proporciona una función para obtener una sesión de base de datos 
            que se puede usar como dependencia en FastAPI.
'''

# Conexión a la base de datos MySQL usando SQLAlchemy.

# Importamos las bibliotecas necesarias para la conexión a la base de datos y la gestión de sesiones.
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Cargamos las variables de entorno desde un archivo .env para obtener la configuración de la base de datos.
load_dotenv()

# Definimos las variables de entorno para la conexión a la base de datos, 
# proporcionando valores predeterminados si no se encuentran en el entorno.
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "3306")
DB_USER = os.getenv("DB_USER", "root")
DB_PASSWORD = os.getenv("DB_PASSWORD", "root")
DB_NAME = os.getenv("DB_NAME", "biblioteca")

DATABASE_URL = (
    f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}"
    "?charset=utf8mb4"
)

# Creamos el motor de base de datos utilizando la URL de conexión definida anteriormente.
engine = create_engine(DATABASE_URL, pool_pre_ping=True, echo=False)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# Definimos una función que se puede usar como dependencia en FastAPI para obtener una sesión de base de datos.
def get_db():
    """Dependencia de FastAPI: entrega una sesión y la cierra al terminar."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()