/*
Archivo: 04_vistas.sql
Proyecto: inventario-biblioteca-personal
Autor: Cristian Eduardo Pichardo Rico
Descripción: Este archivo contiene las vistas de la base de datos, que permiten consultar la información de los libros físicos, 
            el conteo de libros por sección y el conteo de libros por ubicación.
*/

USE biblioteca;

-- Vista de inventario
-- Muestra la información de los libros físicos, incluyendo título, ISBN, formato, condición, 
-- año de publicación, sección, ubicación, idioma, editorial y autores.
CREATE VIEW v_inventario AS
SELECT l.id, l.titulo, l.isbn, l.formato, l.condicion, l.anio_publicacion,
       s.nombre AS seccion, u.nombre AS ubicacion, i.nombre AS idioma,
       e.nombre AS editorial,
       GROUP_CONCAT(a.nombre ORDER BY a.nombre SEPARATOR ', ') AS autores
FROM libros l
LEFT JOIN secciones s    ON s.id = l.seccion_id
LEFT JOIN ubicaciones u  ON u.id = l.ubicacion_id
LEFT JOIN idiomas i      ON i.id = l.idioma_id
LEFT JOIN editoriales e  ON e.id = l.editorial_id
LEFT JOIN libro_autor la ON la.libro_id = l.id
LEFT JOIN autores a      ON a.id = la.autor_id
WHERE l.posesion = 'Físico'
GROUP BY l.id;

-- Vista de conteo por sección
-- Muestra el conteo de libros físicos por sección, incluyendo el nombre de la sección y el total de 
-- libros en esa sección.
CREATE VIEW v_conteo_seccion AS
SELECT s.nombre AS seccion, COUNT(l.id) AS total
FROM secciones s
LEFT JOIN libros l ON l.seccion_id = s.id AND l.posesion = 'Físico'
GROUP BY s.id;

-- Vista de conteo por ubicación
-- Muestra el conteo de libros físicos por ubicación, incluyendo el nombre de la ubicación y el total de 
-- libros en esa ubicación.
CREATE VIEW v_conteo_ubicacion AS
SELECT u.nombre AS ubicacion, COUNT(l.id) AS total
FROM ubicaciones u
LEFT JOIN libros l ON l.ubicacion_id = u.id AND l.posesion = 'Físico'
GROUP BY u.id;
