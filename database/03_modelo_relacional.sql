/*
Archivo: 03_modelo_relacional.sql
Proyecto: inventario-biblioteca-personal
Autor: Cristian Eduardo Pichardo Rico
Descripción: Este archivo contiene el modelo relacional de la base de datos, 
            que muestra las tablas y sus relaciones. 
*/

USE biblioteca;

-- Tabla de libro-autor
-- Permite que un libro pueda tener más de un autor sin duplicar el registro del libro.
CREATE TABLE libro_autor (
  libro_id INT UNSIGNED NOT NULL,
  autor_id INT UNSIGNED NOT NULL,
  PRIMARY KEY (libro_id, autor_id),
  FOREIGN KEY (libro_id) REFERENCES libros(id)  ON DELETE CASCADE,
  FOREIGN KEY (autor_id) REFERENCES autores(id) ON DELETE CASCADE
);

-- Tabla de libro-género
-- Permite que un libro pueda tener más de un género sin duplicar el registro del libro.
CREATE TABLE libro_genero (
  libro_id  INT UNSIGNED NOT NULL,
  genero_id SMALLINT UNSIGNED NOT NULL,
  PRIMARY KEY (libro_id, genero_id),
  FOREIGN KEY (libro_id)  REFERENCES libros(id)  ON DELETE CASCADE,
  FOREIGN KEY (genero_id) REFERENCES generos(id) ON DELETE CASCADE
);