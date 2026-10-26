# Árboles binarios - Taller de Estructuras de Datos

Aplicación cliente-servidor para practicar dos árboles binarios de búsqueda: una agenda telefónica organizada por nombre y un árbol numérico recorrido en in-order.

## Requisitos

- Python 3.10 o superior
- `pip`

## Ejecutar localmente

Desde la carpeta del proyecto, crea y activa un entorno virtual:

```powershell
python -m venv .venv
.venv\Scripts\Activate.ps1
```

Instala Flask e inicia el servidor:

```powershell
pip install -r requirements.txt
python app.py
```

Abre [http://127.0.0.1:5000](http://127.0.0.1:5000). Los árboles viven en memoria y se reinician cuando el servidor se detiene.

## API

| Método | Endpoint | Función |
| --- | --- | --- |
| `POST` | `/api/phonebook/insert` | Inserta o actualiza `{ "name": "Laura", "phone": "3001234567" }`. |
| `GET` | `/api/phonebook/search?name=Laura` | Busca un contacto por nombre, sin distinguir mayúsculas. |
| `POST` | `/api/tree/add` | Inserta `{ "value": 42 }`; acepta valores repetidos. |
| `GET` | `/api/tree/inorder` | Devuelve `{ "values": [...] }` en orden ascendente. |

## Estructuras

La agenda compara los nombres alfabéticamente usando `casefold`; si se agrega otra vez el mismo nombre, actualiza su teléfono. El árbol numérico ubica los valores menores a la izquierda y los mayores o iguales a la derecha. El recorrido in-order se implementa iterativamente.
