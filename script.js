const contactForm = document.querySelector("#contact-form");
const searchForm = document.querySelector("#search-form");
const numberForm = document.querySelector("#number-form");
const searchResult = document.querySelector("#search-result");
const numbersResult = document.querySelector("#numbers-result");

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

contactForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const feedback = document.querySelector("#contact-feedback");
  const formData = new FormData(contactForm);
  try {
    const data = await requestJson("/api/phonebook/insert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formData.get("name").trim(),
        phone: formData.get("phone").trim(),
      }),
    });
    showFeedback(feedback, data.message);
    contactForm.reset();
  } catch (error) {
    showFeedback(feedback, error.message, true);
  }
});

searchForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const name = new FormData(searchForm).get("name").trim();
  searchResult.className = "result-box";
  searchResult.textContent = "Buscando en el árbol…";
  try {
    const data = await requestJson(`/api/phonebook/search?name=${encodeURIComponent(name)}`);
    searchResult.classList.add(data.found ? "success" : "not-found");
    searchResult.textContent = data.found
      ? `${data.name} · ${data.phone}`
      : data.message;
  } catch (error) {
    searchResult.classList.add("not-found");
    searchResult.textContent = error.message;
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
  } catch (error) {
    showFeedback(feedback, error.message, true);
  }
});

document.querySelector("#show-numbers").addEventListener("click", async () => {
  numbersResult.replaceChildren();
  try {
    const data = await requestJson("/api/tree/inorder");
    if (data.values.length === 0) {
      const empty = document.createElement("span");
      empty.className = "empty-state";
      empty.textContent = "Aún no hay números en el árbol.";
      numbersResult.append(empty);
      return;
    }
    data.values.forEach((value) => {
      const chip = document.createElement("span");
      chip.className = "number-chip";
      chip.textContent = value;
      numbersResult.append(chip);
    });
  } catch (error) {
    const message = document.createElement("span");
    message.className = "empty-state";
    message.textContent = error.message;
    numbersResult.append(message);
  }
});
