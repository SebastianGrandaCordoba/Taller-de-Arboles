const contactForm = document.querySelector("#contact-form");
const searchForm = document.querySelector("#search-form");
const numberForm = document.querySelector("#number-form");
const searchResult = document.querySelector("#search-result");
const numbersResult = document.querySelector("#numbers-result");
let editingName = null;
let sortedValues = [];

async function requestJson(url, options) {
  const response = await fetch(url, options);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || "No fue posible completar la solicitud.");
  }
  return data;
}

function showFeedback(element, message, isError = false) {
  element.textContent = message;
  element.classList.toggle("error", isError);
}

function setContactMode(isEditing) {
  editingName = isEditing ? editingName : null;
  document.querySelector("#contact-submit").innerHTML = isEditing
    ? "Guardar cambios <span aria-hidden=\"true\">✓</span>"
    : "Agregar al árbol <span aria-hidden=\"true\">↗</span>";
  document.querySelector("#cancel-edit").classList.toggle("hidden", !isEditing);
}

async function loadContacts() {
  const data = await requestJson("/api/phonebook/contacts");
  document.querySelector("#contact-count").textContent = data.count;
  renderContacts(data.contacts);
}

function renderContacts(contacts) {
  const filter = document.querySelector("#contact-filter").value.trim().toLocaleLowerCase();
  const filtered = contacts.filter((contact) =>
    `${contact.name} ${contact.phone}`.toLocaleLowerCase().includes(filter),
  );
  const list = document.querySelector("#contact-list");
  list.replaceChildren();
  if (filtered.length === 0) {
    const empty = document.createElement("p");
    empty.className = "list-empty";
    empty.textContent = filter ? "No hay coincidencias." : "Todavía no hay contactos.";
    list.append(empty);
    return;
  }

  filtered.forEach((contact) => {
    const row = document.createElement("div");
    row.className = "contact-row";
    const details = document.createElement("div");
    details.className = "contact-details";
    const name = document.createElement("strong");
    name.textContent = contact.name;
    const phone = document.createElement("span");
    phone.textContent = contact.phone;
    details.append(name, phone);

    const actions = document.createElement("div");
    actions.className = "contact-actions";
    const editButton = document.createElement("button");
    editButton.className = "icon-button";
    editButton.type = "button";
    editButton.textContent = "Editar";
    editButton.setAttribute("aria-label", `Editar ${contact.name}`);
    editButton.addEventListener("click", () => {
      editingName = contact.name;
      document.querySelector("#contact-name").value = contact.name;
      document.querySelector("#contact-phone").value = contact.phone;
      setContactMode(true);
      document.querySelector("#contact-name").focus();
    });
    const deleteButton = document.createElement("button");
    deleteButton.className = "icon-button delete-contact";
    deleteButton.type = "button";
    deleteButton.textContent = "Eliminar";
    deleteButton.setAttribute("aria-label", `Eliminar ${contact.name}`);
    deleteButton.addEventListener("click", async () => {
      try {
        await requestJson(`/api/phonebook/delete?name=${encodeURIComponent(contact.name)}`, { method: "DELETE" });
        if (editingName?.toLocaleLowerCase() === contact.name.toLocaleLowerCase()) {
          contactForm.reset();
          setContactMode(false);
        }
        await loadContacts();
      } catch (error) {
        showFeedback(document.querySelector("#contact-feedback"), error.message, true);
      }
    });
    actions.append(editButton, deleteButton);
    row.append(details, actions);
    list.append(row);
  });
}

async function loadNumbers() {
  const [tree, inorder] = await Promise.all([
    requestJson("/api/tree/state"),
    requestJson("/api/tree/inorder"),
  ]);
  document.querySelector("#number-count").textContent = tree.count;
  document.querySelector("#tree-height").textContent = tree.height;
  sortedValues = inorder.values;
  renderSortedValues(sortedValues);
  renderTree(tree.root);
}

function renderSortedValues(values) {
  numbersResult.replaceChildren();
  if (values.length === 0) {
    const empty = document.createElement("span");
    empty.className = "empty-state";
    empty.textContent = "Aún no hay números en el árbol.";
    numbersResult.append(empty);
    return;
  }
  values.forEach((value) => {
    const chip = document.createElement("span");
    chip.className = "number-chip";
    chip.textContent = value;
    numbersResult.append(chip);
  });
}

function renderTree(root) {
  const container = document.querySelector("#tree-visual");
  container.replaceChildren();
  if (!root) {
    const empty = document.createElement("span");
    empty.className = "empty-state";
    empty.textContent = "Agrega valores para ver el árbol.";
    container.append(empty);
    return;
  }

  let nextPosition = 0;
  let maxDepth = 0;
  const nodes = [];
  function position(node, depth = 0) {
    if (!node) return null;
    const left = position(node.left, depth + 1);
    const x = nextPosition++;
    maxDepth = Math.max(maxDepth, depth);
    const item = { node, depth, x, left, right: null };
    item.right = position(node.right, depth + 1);
    nodes.push(item);
    return item;
  }
  const positionedRoot = position(root);
  const spacingX = 72;
  const spacingY = 76;
  const width = Math.max(300, nextPosition * spacingX + 40);
  const height = Math.max(110, (maxDepth + 1) * spacingY + 30);
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", `0 0 ${width} ${height}`);
  svg.setAttribute("width", width);
  svg.setAttribute("height", height);
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", `Árbol binario con ${nodes.length} nodos y altura ${maxDepth + 1}`);
  const title = document.createElementNS(svg.namespaceURI, "title");
  title.textContent = "Visualización del árbol binario de búsqueda";
  svg.append(title);
  const coordinates = new Map();
  nodes.forEach((item) => {
    coordinates.set(item, { x: 20 + item.x * spacingX, y: 20 + item.depth * spacingY });
  });
  nodes.forEach((item) => {
    const from = coordinates.get(item);
    [item.left, item.right].filter(Boolean).forEach((child) => {
      const to = coordinates.get(child);
      const edge = document.createElementNS(svg.namespaceURI, "line");
      edge.setAttribute("x1", from.x);
      edge.setAttribute("y1", from.y + 16);
      edge.setAttribute("x2", to.x);
      edge.setAttribute("y2", to.y - 16);
      edge.setAttribute("class", "tree-edge");
      svg.append(edge);
    });
  });
  nodes.forEach((item) => {
    const point = coordinates.get(item);
    const group = document.createElementNS(svg.namespaceURI, "g");
    const circle = document.createElementNS(svg.namespaceURI, "circle");
    const text = document.createElementNS(svg.namespaceURI, "text");
    const isLeaf = !item.node.left && !item.node.right;
    circle.setAttribute("cx", point.x);
    circle.setAttribute("cy", point.y);
    circle.setAttribute("r", "17");
    circle.setAttribute("class", item === positionedRoot ? "tree-root" : isLeaf ? "tree-leaf" : "tree-node");
    text.setAttribute("x", point.x);
    text.setAttribute("y", point.y + 4);
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("class", "tree-label");
    text.textContent = item.node.value;
    group.append(circle, text);
    svg.append(group);
  });
  container.append(svg);
}

contactForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const feedback = document.querySelector("#contact-feedback");
  const formData = new FormData(contactForm);
  try {
    const data = await requestJson(editingName ? "/api/phonebook/update" : "/api/phonebook/insert", {
      method: editingName ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formData.get("name").trim(),
        phone: formData.get("phone").trim(),
        ...(editingName ? { old_name: editingName } : {}),
      }),
    });
    showFeedback(feedback, data.message);
    contactForm.reset();
    setContactMode(false);
    await loadContacts();
  } catch (error) {
    showFeedback(feedback, error.message, true);
  }
});

document.querySelector("#cancel-edit").addEventListener("click", () => {
  contactForm.reset();
  showFeedback(document.querySelector("#contact-feedback"), "Edición cancelada.");
  setContactMode(false);
});

searchForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const name = new FormData(searchForm).get("name").trim();
  searchResult.className = "result-box";
  searchResult.textContent = "Buscando en el árbol…";
  try {
    const data = await requestJson(`/api/phonebook/search?name=${encodeURIComponent(name)}`);
    searchResult.classList.add(data.found ? "success" : "not-found");
    searchResult.textContent = data.found ? `${data.name} · ${data.phone}` : data.message;
  } catch (error) {
    searchResult.classList.add("not-found");
    searchResult.textContent = error.message;
  }
});

document.querySelector("#contact-filter").addEventListener("input", async () => {
  try {
    const data = await requestJson("/api/phonebook/contacts");
    renderContacts(data.contacts);
  } catch (error) {
    document.querySelector("#contact-list").textContent = error.message;
  }
});

document.querySelector("#clear-contacts").addEventListener("click", async () => {
  try {
    const data = await requestJson("/api/phonebook/clear", { method: "DELETE" });
    contactForm.reset();
    setContactMode(false);
    showFeedback(document.querySelector("#contact-feedback"), data.message);
    await loadContacts();
  } catch (error) {
    showFeedback(document.querySelector("#contact-feedback"), error.message, true);
  }
});

numberForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const feedback = document.querySelector("#number-feedback");
  const value = Number(new FormData(numberForm).get("value"));
  try {
    const data = await requestJson("/api/tree/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value }),
    });
    showFeedback(feedback, `${data.message} Total: ${data.count}.`);
    numberForm.reset();
    await loadNumbers();
  } catch (error) {
    showFeedback(feedback, error.message, true);
  }
});

document.querySelector("#batch-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const feedback = document.querySelector("#batch-feedback");
  const rawValues = document.querySelector("#batch-values").value.trim();
  const values = rawValues.split(/[\s,;]+/).filter(Boolean).map(Number);
  if (values.length === 0 || values.length > 100 || values.some((value) => !Number.isFinite(value))) {
    showFeedback(feedback, "Ingresa entre 1 y 100 números válidos.", true);
    return;
  }
  try {
    const data = await requestJson("/api/tree/add-batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ values }),
    });
    showFeedback(feedback, `${data.message} Total: ${data.count}.`);
    document.querySelector("#batch-values").value = "";
    await loadNumbers();
  } catch (error) {
    showFeedback(feedback, error.message, true);
  }
});

document.querySelector("#random-values").addEventListener("click", async () => {
  const values = Array.from({ length: 5 }, () => Math.floor(Math.random() * 99) + 1);
  try {
    const data = await requestJson("/api/tree/add-batch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ values }),
    });
    showFeedback(document.querySelector("#batch-feedback"), `${data.message} (${values.join(", ")})`);
    await loadNumbers();
  } catch (error) {
    showFeedback(document.querySelector("#batch-feedback"), error.message, true);
  }
});

document.querySelector("#clear-numbers").addEventListener("click", async () => {
  try {
    const data = await requestJson("/api/tree/clear", { method: "DELETE" });
    showFeedback(document.querySelector("#batch-feedback"), data.message);
    await loadNumbers();
  } catch (error) {
    showFeedback(document.querySelector("#batch-feedback"), error.message, true);
  }
});

document.querySelector("#show-numbers").addEventListener("click", loadNumbers);
document.querySelector("#copy-sorted").addEventListener("click", async () => {
  const status = document.querySelector("#copy-feedback");
  if (sortedValues.length === 0) {
    status.textContent = "No hay valores para copiar.";
    return;
  }
  try {
    await navigator.clipboard.writeText(sortedValues.join(", "));
    status.textContent = "Copiado.";
  } catch {
    status.textContent = "El navegador no permitió copiar.";
  }
});

Promise.all([loadContacts(), loadNumbers()]).catch((error) => {
  showFeedback(document.querySelector("#contact-feedback"), error.message, true);
});
