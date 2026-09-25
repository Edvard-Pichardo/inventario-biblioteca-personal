/*
Archivo: 05_datos_iniciales.sql
Proyecto: inventario-biblioteca-personal
Autor: Cristian Eduardo Pichardo Rico
Descripción: Este archivo contiene los datos iniciales de la base de datos, 
            que incluyen las secciones, ubicaciones e idiomas ya definidos para la biblioteca, 
            para que la aplicación muestre algo desde el primer arranque.
*/

USE biblioteca;

-- Secciones, ubicaciones e idiomas ya definidos para tu biblioteca.
-- Estos datos son datos de muestra, puedes modificarlos o eliminarlos según tus necesidades.
INSERT INTO secciones (nombre) VALUES
 ('Académico'), ('Divulgación'), ('Novelas'), ('Cómics'), ('Revistas'),
 ('Engargolados'), ('Enciclopedias'), ('Perdida');


INSERT INTO ubicaciones (nombre) VALUES
 ('Escritorio'),('Ropero'),('Mueble'),('Repisa'),('Librero'),
 ('Cajones Mueble'),('Cajones cama'),('Caja1'),('Caja2'),('Caja3');

INSERT INTO idiomas (nombre) VALUES ('Español'),('Inglés');

-- Revisemos que los datos se hayan insertado correctamente.
SELECT * FROM secciones;
SELECT * FROM ubicaciones;
SELECT * FROM idiomas;
