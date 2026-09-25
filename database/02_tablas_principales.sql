/*
Archivo: 02_tablas_principales.sql
Proyecto: inventario-biblioteca-personal
Autor: Cristian Eduardo Pichardo Rico
Descripción: Este archivo crea las tablas principales de la base de datos, que contienen los libros, 
            las lecturas, la lista de deseos y los préstamos. 
*/

USE biblioteca;

-- Tabla de libros
-- Contiene la información de cada libro registrado en la biblioteca. 
CREATE TABLE libros (
  id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  titulo           VARCHAR(200) NOT NULL,
  subtitulo        VARCHAR(200),
  isbn             VARCHAR(20),
  posesion         ENUM('Físico','Kindle') NOT NULL DEFAULT 'Físico',
  editorial_id     INT UNSIGNED,
  idioma_id        TINYINT UNSIGNED,
  anio_publicacion SMALLINT,
  edicion          VARCHAR(40),
  paginas          SMALLINT UNSIGNED,
  serie_id         INT UNSIGNED,
  numero_serie     SMALLINT UNSIGNED,
  portada_url      VARCHAR(300),
  formato          ENUM('Pasta blanda','Pasta dura'),
  seccion_id       TINYINT UNSIGNED,
  ubicacion_id     TINYINT UNSIGNED,
  condicion        ENUM('Nuevo','Bueno','Regular','Desgastado'),
  firmado          BOOLEAN NOT NULL DEFAULT FALSE,
  fecha_adquisicion DATE,
  precio_compra    DECIMAL(8,2),
  notas            TEXT,
  creado_en        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  actualizado_en   TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (editorial_id) REFERENCES editoriales(id) ON DELETE SET NULL,
  FOREIGN KEY (idioma_id)    REFERENCES idiomas(id)     ON DELETE SET NULL,
  FOREIGN KEY (serie_id)     REFERENCES series(id)      ON DELETE SET NULL,
  FOREIGN KEY (seccion_id)   REFERENCES secciones(id),
  FOREIGN KEY (ubicacion_id) REFERENCES ubicaciones(id),
  INDEX idx_titulo (titulo),
  INDEX idx_isbn (isbn),
  INDEX idx_filtros (posesion, seccion_id, ubicacion_id, idioma_id)
);

-- Tabla de lecturas
-- Contiene la información de cada lectura registrada en la biblioteca.
CREATE TABLE lecturas (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  libro_id     INT UNSIGNED NOT NULL,
  fecha_inicio DATE,
  fecha_fin    DATE,
  estado       ENUM('Leyendo','Terminado','Abandonado') NOT NULL DEFAULT 'Terminado',
  calificacion TINYINT UNSIGNED,
  resena       TEXT,
  CHECK (calificacion BETWEEN 1 AND 5),
  FOREIGN KEY (libro_id) REFERENCES libros(id) ON DELETE RESTRICT,
  INDEX idx_fecha_fin (fecha_fin)
);

-- Lista de deseos
-- Contiene la información de los libros que se desean adquirir.
CREATE TABLE lista_deseos (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  libro_id        INT UNSIGNED,
  titulo          VARCHAR(200),
  autor_texto     VARCHAR(120),
  isbn            VARCHAR(20),
  formato_deseado ENUM('Pasta blanda','Pasta dura','Cualquiera') DEFAULT 'Cualquiera',
  prioridad       ENUM('Alta','Media','Baja') NOT NULL DEFAULT 'Media',
  precio_estimado DECIMAL(8,2),
  enlace          VARCHAR(300),
  motivo          VARCHAR(300),
  comprado        BOOLEAN NOT NULL DEFAULT FALSE,
  agregado_en     DATE DEFAULT (CURRENT_DATE),
  CHECK (libro_id IS NOT NULL OR titulo IS NOT NULL),
  FOREIGN KEY (libro_id) REFERENCES libros(id) ON DELETE CASCADE
);

-- Tabla de préstamos
-- Registra a quién se le prestó un libro y desde cuándo. Mientras
-- fecha_devolucion esté vacía, el libro sigue prestado.
CREATE TABLE prestamos (
  id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  libro_id         INT UNSIGNED NOT NULL,
  persona          VARCHAR(80) NOT NULL,
  fecha_prestamo   DATE NOT NULL,
  fecha_devolucion DATE,
  FOREIGN KEY (libro_id) REFERENCES libros(id) ON DELETE CASCADE
);