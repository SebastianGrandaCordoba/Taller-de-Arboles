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
| `PUT` | `/api/phonebook/update` | Renombra o edita un contacto con `{ "old_name": "Laura", "name": "Laura M.", "phone": "3001234567" }`. |
| `GET` | `/api/phonebook/search?name=Laura` | Busca un contacto por nombre, sin distinguir mayúsculas. |
| `GET` | `/api/phonebook/contacts` | Lista todos los contactos en recorrido in-order. |
| `DELETE` | `/api/phonebook/delete?name=Laura` | Elimina un contacto del árbol. |
| `DELETE` | `/api/phonebook/clear` | Vacía la agenda. |
| `POST` | `/api/tree/add` | Inserta `{ "value": 42 }`; acepta valores repetidos. |
| `POST` | `/api/tree/add-batch` | Inserta `{ "values": [12, 5, 20] }` (máximo 100 valores). |
| `GET` | `/api/tree/inorder` | Devuelve `{ "values": [...] }` en orden ascendente. |
| `GET` | `/api/tree/state` | Devuelve la estructura del árbol y sus métricas. |
| `DELETE` | `/api/tree/clear` | Vacía el árbol numérico. |

## Funcionalidades de la interfaz

- Agrega, busca, filtra, edita y elimina contactos; también permite vaciar la agenda.
- Agrega números de uno en uno, carga lotes o genera cinco valores aleatorios.
- Consulta el recorrido in-order, copia los valores y visualiza gráficamente raíz, ramas y hojas.
- Muestra la cantidad de contactos, nodos numéricos y niveles de altura.

## Estructuras

La agenda compara los nombres alfabéticamente usando `casefold`; si se agrega otra vez el mismo nombre, actualiza su teléfono. El árbol numérico ubica los valores menores a la izquierda y los mayores o iguales a la derecha. El recorrido in-order se implementa iterativamente.
