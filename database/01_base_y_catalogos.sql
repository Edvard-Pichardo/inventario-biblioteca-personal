/*
Archivo: 01_base_y_catalogos.sql
Proyecto: inventario-biblioteca-personal
Autor: Cristian Eduardo Pichardo Rico
Descripción: Este archivo crea la base de datos principal
*/

CREATE DATABASE IF NOT EXISTS biblioteca
  CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
USE biblioteca;

-- Catálogos
-- Se crean tablas que contienen los valores de los catálogos de la aplicación.
-- Estas tablas alimentarán los filtros de la aplicación y deben evitar que un mismo
-- valor se escriba de formas distintas en cada libro (por ejemplo, "novela" en uno y "Novela" en otro).

-- La tabla de secciones contendrá los valores de las secciones de la biblioteca, como "Ficción", "No Ficción", "Ciencia", etc.
CREATE TABLE secciones (
  id     TINYINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(40) NOT NULL UNIQUE
);

-- La tabla de ubicaciones contendrá los valores de las ubicaciones físicas de los libros, como "Estante 1", "Estante 2", "Mesa de lectura", etc.
CREATE TABLE ubicaciones (
  id     TINYINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(40) NOT NULL UNIQUE,
  notas  VARCHAR(200)
);

-- La tabla de idiomas contendrá los valores de los idiomas en los que están escritos los libros, como "Español", "Inglés", "Francés", etc.
CREATE TABLE idiomas (
  id     TINYINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(30) NOT NULL UNIQUE
);

-- La tabla de editoriales contendrá los valores de las editoriales de los libros.
CREATE TABLE editoriales (
  id     INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) NOT NULL UNIQUE
);

-- La tabla de autores contendrá los valores de los autores de los libros.
CREATE TABLE autores (
  id     INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(120) NOT NULL UNIQUE
);

-- La tabla de géneros contendrá los valores de los géneros literarios de los libros, como "Novela", "Cuento", "Poesía", etc.
CREATE TABLE generos (
  id     SMALLINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(50) NOT NULL UNIQUE
);

-- La tabla de series contendrá los valores de las series a las que pertenecen los libros.
CREATE TABLE series (
  id     INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(120) NOT NULL UNIQUE
);