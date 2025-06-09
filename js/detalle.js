const HOST = "http://localhost:8090";
const id = new URLSearchParams(location.search).get("id");
if (!id) location.href = "index.html";
const user = JSON.parse(localStorage.getItem("user"));

document.getElementById("logout-btn")?.addEventListener("click", () => {
    localStorage.clear(); location.href = "login.html"
});

(async () => {
    const r = await fetch(`${HOST}/api/collections/recetas/records/${id}`);
    if (!r.ok) {
        alert("Receta no encontrada");
        return
    }
    const receta = await r.json();
    document.getElementById("info-receta").innerHTML =
        `<img src="${HOST}/api/files/recetas/${receta.id}/${receta.image}" alt="${receta.titulo}">
    <h2>${receta.titulo}</h2>
    <p>${receta.descripcion || ""}</p>`;
    const ing = await fetch(`${HOST}/api/collections/ingredientes/records?filter=receta_id="${id}"`);
    const { items } = await ing.json();
    const ul = document.getElementById("lista-ing");
    items.forEach(i => {
        const li = document.createElement("li");
        li.textContent = `${i.cantidad} – ${i.nombre}`;
        ul.appendChild(li)
    });
    if (user?.id === receta.receta_id) {
        const b = document.createElement("button");
        b.textContent = "Eliminar receta";
        b.onclick = async () => {
            if (!confirm("¿Eliminar?"))
                return; await fetch(`${HOST}/api/collections/recetas/records/${receta.id}`, { method: "DELETE" });
            location.href = "perfil.html"
        };
        document.getElementById("acciones-autor").appendChild(b)
    }
})();
