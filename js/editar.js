const HOST = "https://recetas-app.pockethost.io";
const id = new URLSearchParams(location.search).get("id");
const user = JSON.parse(localStorage.getItem("user"));

if (!user || !id) location.href = "login.html";
const form = document.getElementById("form-editar");
const cont = document.getElementById("ingredientes-container");

document.getElementById("logout-btn")?.addEventListener("click", () => {
    localStorage.clear(); location.href = "login.html"
});
(async () => {
    const r = await fetch(`${HOST}/api/collections/recetas/records/${id}`);
    const rec = await r.json();
    if (rec.receta_id !== user.id) {
        alert("No autorizado");
        return
    }
    form.titulo.value = rec.titulo;
    form.descripcion.value = rec.descripcion;
    const ing = await fetch(`${HOST}/api/collections/ingredientes/records?filter=receta_id="${id}"`);
    const { items } = await ing.json();
    items.forEach(i => {
        const d = document.createElement("div");
        d.className = "ingrediente";
        d.innerHTML = `
        <input type="text" class="nombre" value="${i.nombre}" required>
        <input type="text" class="cantidad" value="${i.cantidad}" required>`;
        cont.appendChild(d)
    });
})();
document.getElementById("btn-agregar-ingrediente").addEventListener("click", () => {
    const d = document.createElement("div");
    d.className = "ingrediente";
    d.innerHTML = '<input type="text" class="nombre" placeholder="Nombre" required><input type="text" class="cantidad" placeholder="Cantidad" required>';
    cont.appendChild(d);
});
form.addEventListener("submit", async e => {
    e.preventDefault();
    const fd = new FormData(form);
    await fetch(`${HOST}/api/collections/recetas/records/${id}`, { method: "PATCH", body: fd });
    const prev = await fetch(`${HOST}/api/collections/ingredientes/records?filter=receta_id="${id}"`);
    const { items } = await prev.json();
    await Promise.all(items.map(i => fetch(`${HOST}/api/collections/ingredientes/records/${i.id}`, { method: "DELETE" })));
    const nuevos = [...document.querySelectorAll(".ingrediente")].map(i =>
    ({
        receta_id: id,
        nombre: i.querySelector(".nombre").value, cantidad: i.querySelector(".cantidad").value
    }));
    await Promise.all(nuevos.map(i => fetch(`${HOST}/api/collections/ingredientes/records`, {
        method: "POST", headers:
            { "Content-Type": "application/json" }, body: JSON.stringify(i)
    })));
    alert("Receta actualizada");
    location.href = `detalle.html?id=${id}`;
});
