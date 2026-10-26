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
        count = len(numeric_tree.inorder())
    return jsonify(message="Número agregado al árbol.", value=value, count=count), 200


@app.get("/api/tree/inorder")
def get_inorder():
    with state_lock:
        values = numeric_tree.inorder()
    return jsonify(values=values)


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=False)
