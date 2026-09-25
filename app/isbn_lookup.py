'''
Archivo: isbn_lookup.py
Proyecto: inventario-biblioteca-personal
Autor: Cristian Eduardo Pichardo Rico
Descripción: Este archivo contiene funciones para buscar información de libros a partir de su ISBN 
            utilizando las APIs de Open Library y Google Books.  
'''

# Autocompleta datos de un libro a partir de su ISBN.
# Prueba Open Library primero (sin API key); si no encuentra nada, usa Google Books.

import requests

# Definimos las URLs de las APIs de Open Library y Google Books que se utilizarán para buscar información de libros por ISBN.
OPEN_LIBRARY_URL = "https://openlibrary.org/api/books"
GOOGLE_BOOKS_URL = "https://www.googleapis.com/books/v1/volumes"

# Definimos la función principal que busca información de un libro por su ISBN.
def buscar_por_isbn(isbn: str) -> dict:
    isbn = isbn.strip().replace("-", "")
    datos = _buscar_open_library(isbn)
    if not datos:
        datos = _buscar_google_books(isbn)
    return datos or {"encontrado": False, "isbn": isbn}


def _buscar_open_library(isbn: str) -> dict | None:
    try:
        resp = requests.get(
            OPEN_LIBRARY_URL,
            params={"bibkeys": f"ISBN:{isbn}", "format": "json", "jscmd": "data"},
            timeout=6,
        )
        resp.raise_for_status()
        payload = resp.json().get(f"ISBN:{isbn}")
        if not payload:
            return None
        return {
            "encontrado": True,
            "isbn": isbn,
            "titulo": payload.get("title"),
            "autores": [a["name"] for a in payload.get("authors", [])],
            "editorial": (payload.get("publishers") or [{}])[0].get("name"),
            "anio_publicacion": _extraer_anio(payload.get("publish_date")),
            "paginas": payload.get("number_of_pages"),
            "portada_url": payload.get("cover", {}).get("medium"),
        }
    except requests.RequestException:
        return None


def _buscar_google_books(isbn: str) -> dict | None:
    try:
        resp = requests.get(GOOGLE_BOOKS_URL, params={"q": f"isbn:{isbn}"}, timeout=6)
        resp.raise_for_status()
        items = resp.json().get("items")
        if not items:
            return None
        info = items[0]["volumeInfo"]
        return {
            "encontrado": True,
            "isbn": isbn,
            "titulo": info.get("title"),
            "autores": info.get("authors", []),
            "editorial": info.get("publisher"),
            "anio_publicacion": _extraer_anio(info.get("publishedDate")),
            "paginas": info.get("pageCount"),
            "portada_url": info.get("imageLinks", {}).get("thumbnail"),
            "idioma": info.get("language"),
        }
    except requests.RequestException:
        return None

# Definimos una función auxiliar para extraer el año de publicación a partir de una cadena de fecha.
def _extraer_anio(fecha: str | None) -> int | None:
    if not fecha:
        return None
    for token in fecha.replace("-", " ").split():
        if token.isdigit() and len(token) == 4:
            return int(token)
    return None