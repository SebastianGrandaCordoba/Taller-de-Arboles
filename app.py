from __future__ import annotations

import math
from threading import RLock

from flask import Flask, jsonify, request, send_from_directory


app = Flask(__name__)
state_lock = RLock()


class Node:
    def __init__(self, name: str, phone: str) -> None:
        self.name = name
        self.phone = phone
        self.left: Node | None = None
        self.right: Node | None = None


class Phonebook:
    def __init__(self) -> None:
        self.root: Node | None = None

    def insert(self, name: str, phone: str) -> bool:
        if self.root is None:
            self.root = Node(name, phone)
            return True

        current = self.root
        key = name.casefold()
        while True:
            current_key = current.name.casefold()
            if key == current_key:
                current.phone = phone
                current.name = name
                return False
            if key < current_key:
                if current.left is None:
                    current.left = Node(name, phone)
                    return True
                current = current.left
            else:
                if current.right is None:
                    current.right = Node(name, phone)
                    return True
                current = current.right

    def search(self, name: str) -> Node | None:
        current = self.root
        key = name.casefold()
        while current is not None:
            current_key = current.name.casefold()
            if key == current_key:
                return current
            current = current.left if key < current_key else current.right
        return None

    def contacts(self) -> list[dict[str, str]]:
        result: list[dict[str, str]] = []
        stack: list[Node] = []
        current = self.root
        while current is not None or stack:
            while current is not None:
                stack.append(current)
                current = current.left
            current = stack.pop()
            result.append({"name": current.name, "phone": current.phone})
            current = current.right
        return result

    def delete(self, name: str) -> bool:
        key = name.casefold()
        parent: Node | None = None
        current = self.root
        while current is not None and current.name.casefold() != key:
            parent = current
            current = current.left if key < current.name.casefold() else current.right
        if current is None:
            return False

        if current.left is not None and current.right is not None:
            successor_parent = current
            successor = current.right
            while successor.left is not None:
                successor_parent = successor
                successor = successor.left
            current.name, current.phone = successor.name, successor.phone
            parent = successor_parent
            current = successor

        child = current.left if current.left is not None else current.right
        if parent is None:
            self.root = child
        elif parent.left is current:
            parent.left = child
        else:
            parent.right = child
        return True


class NumericNode:
    def __init__(self, value: int | float) -> None:
        self.value = value
        self.left: NumericNode | None = None
        self.right: NumericNode | None = None


class BinaryTree:
    def __init__(self) -> None:
        self.root: NumericNode | None = None

    def add(self, value: int | float) -> None:
        if self.root is None:
            self.root = NumericNode(value)
            return

        current = self.root
        while True:
            if value < current.value:
                if current.left is None:
                    current.left = NumericNode(value)
                    return
                current = current.left
            else:
                if current.right is None:
                    current.right = NumericNode(value)
                    return
                current = current.right

    def inorder(self) -> list[int | float]:
        values: list[int | float] = []
        stack: list[NumericNode] = []
        current = self.root
        while current is not None or stack:
            while current is not None:
                stack.append(current)
                current = current.left
            current = stack.pop()
            values.append(current.value)
            current = current.right
        return values

    def structure(self) -> dict | None:
        if self.root is None:
            return None
        return self._serialize(self.root)

    def _serialize(self, node: NumericNode | None) -> dict | None:
        if node is None:
            return None
        return {
            "value": node.value,
            "left": self._serialize(node.left),
            "right": self._serialize(node.right),
        }

    def metrics(self) -> dict[str, int]:
        if self.root is None:
            return {"count": 0, "height": 0, "leaves": 0}
        count = 0
        leaves = 0
        height = 0
        stack = [(self.root, 1)]
        while stack:
            node, depth = stack.pop()
            count += 1
            height = max(height, depth)
            if node.left is None and node.right is None:
                leaves += 1
            if node.left is not None:
                stack.append((node.left, depth + 1))
            if node.right is not None:
                stack.append((node.right, depth + 1))
        return {"count": count, "height": height, "leaves": leaves}


phonebook = Phonebook()
numeric_tree = BinaryTree()


@app.get("/")
def index():
    return send_from_directory(".", "index.html")


@app.get("/<path:asset>")
def frontend_asset(asset: str):
    if asset in {"styles.css", "script.js"}:
        return send_from_directory(".", asset)
    return jsonify(error="Recurso no encontrado."), 404


@app.post("/api/phonebook/insert")
def insert_contact():
    payload = request.get_json(silent=True) or {}
    name = payload.get("name")
    phone = payload.get("phone")
    if not isinstance(name, str) or not name.strip():
        return jsonify(error="Ingresa un nombre válido."), 400
    if not isinstance(phone, str) or not phone.strip():
        return jsonify(error="Ingresa un teléfono válido."), 400

    clean_name = name.strip()
    with state_lock:
        inserted = phonebook.insert(clean_name, phone.strip())
    message = "Contacto agregado al árbol." if inserted else "Contacto actualizado en el árbol."
    return jsonify(message=message, name=clean_name), 200


@app.get("/api/phonebook/search")
def search_contact():
    name = request.args.get("name", "").strip()
    if not name:
        return jsonify(error="Escribe el nombre que deseas buscar."), 400
    with state_lock:
        contact = phonebook.search(name)
        if contact is None:
            return jsonify(found=False, message=f"No se encontró a {name}.")
        return jsonify(found=True, name=contact.name, phone=contact.phone)


@app.get("/api/phonebook/contacts")
def list_contacts():
    with state_lock:
        contacts = phonebook.contacts()
    return jsonify(contacts=contacts, count=len(contacts))


@app.put("/api/phonebook/update")
def update_contact():
    payload = request.get_json(silent=True) or {}
    old_name = payload.get("old_name")
    name = payload.get("name")
    phone = payload.get("phone")
    if not isinstance(old_name, str) or not old_name.strip():
        return jsonify(error="No se indicó el contacto que deseas editar."), 400
    if not isinstance(name, str) or not name.strip():
        return jsonify(error="Ingresa un nombre válido."), 400
    if not isinstance(phone, str) or not phone.strip():
        return jsonify(error="Ingresa un teléfono válido."), 400

    old_name = old_name.strip()
    clean_name = name.strip()
    with state_lock:
        if phonebook.search(old_name) is None:
            return jsonify(error="El contacto que intentas editar ya no existe."), 404
        existing = phonebook.search(clean_name)
        if existing is not None and existing.name.casefold() != old_name.casefold():
            return jsonify(error="Ya existe otro contacto con ese nombre."), 409
        phonebook.delete(old_name)
        phonebook.insert(clean_name, phone.strip())
    return jsonify(message="Contacto actualizado en el árbol.", name=clean_name)


@app.delete("/api/phonebook/delete")
def delete_contact():
    name = request.args.get("name", "").strip()
    if not name:
        return jsonify(error="Indica el nombre del contacto que deseas eliminar."), 400
    with state_lock:
        deleted = phonebook.delete(name)
        count = len(phonebook.contacts())
    if not deleted:
        return jsonify(error="No se encontró ese contacto."), 404
    return jsonify(message=f"Se eliminó a {name}.", count=count)


@app.delete("/api/phonebook/clear")
def clear_phonebook():
    with state_lock:
        phonebook.root = None
    return jsonify(message="La agenda quedó vacía.")


@app.post("/api/tree/add")
def add_number():
    payload = request.get_json(silent=True) or {}
    value = payload.get("value")
    if isinstance(value, bool) or not isinstance(value, (int, float)):
        return jsonify(error="El valor debe ser un número."), 400
    if isinstance(value, float) and not math.isfinite(value):
        return jsonify(error="El valor debe ser un número finito."), 400
    with state_lock:
        numeric_tree.add(value)
        metrics = numeric_tree.metrics()
    return jsonify(message="Número agregado al árbol.", value=value, **metrics), 200


@app.post("/api/tree/add-batch")
def add_numbers():
    payload = request.get_json(silent=True) or {}
    values = payload.get("values")
    if not isinstance(values, list) or not values or len(values) > 100:
        return jsonify(error="Envía una lista de entre 1 y 100 números."), 400
    if any(isinstance(value, bool) or not isinstance(value, (int, float)) for value in values):
        return jsonify(error="Todos los valores deben ser números."), 400
    if any(isinstance(value, float) and not math.isfinite(value) for value in values):
        return jsonify(error="Todos los valores deben ser finitos."), 400
    with state_lock:
        for value in values:
            numeric_tree.add(value)
        metrics = numeric_tree.metrics()
    return jsonify(message=f"Se agregaron {len(values)} números.", **metrics), 200


@app.get("/api/tree/inorder")
def get_inorder():
    with state_lock:
        values = numeric_tree.inorder()
    return jsonify(values=values)


@app.get("/api/tree/state")
def get_tree_state():
    with state_lock:
        structure = numeric_tree.structure()
        metrics = numeric_tree.metrics()
    return jsonify(root=structure, **metrics)


@app.delete("/api/tree/clear")
def clear_tree():
    with state_lock:
        numeric_tree.root = None
    return jsonify(message="El árbol numérico quedó vacío.", count=0, height=0, leaves=0)


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=False)
