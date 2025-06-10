const HOST = "https://recetas-app.pockethost.io";
const id = new URLSearchParams(location.search).get("id");
if (!id) location.href = "index.html";

const user = JSON.parse(localStorage.getItem("user"));

// Verificar si hay usuario logueado y actualizar navegación
if (!user) {
  const navLinks = document.querySelector(".nav-links");
  navLinks.innerHTML = `
    <li><a href="login.html">Iniciar sesión</a></li>
    <li><a href="register.html">Registro</a></li>
  `;
} else {
  document.getElementById("logout-btn")?.addEventListener("click", () => {
    localStorage.clear();
    location.href = "login.html";
  });
}

(async () => {
  try {
    // Cargar datos de la receta
    const r = await fetch(`${HOST}/api/collections/recetas/records/${id}`);
    if (!r.ok) {
      alert("Receta no encontrada");
      location.href = "index.html";
      return;
    }
    
    const receta = await r.json();
    
    // Mostrar información de la receta
    const imgSrc = receta.image 
      ? `${HOST}/api/files/recetas/${receta.id}/${receta.image}`
      : "https://via.placeholder.com/800x400?text=Sin+imagen";
    
    document.getElementById("info-receta").innerHTML = `
      <img src="${imgSrc}" alt="${receta.titulo}" onerror="this.src='https://via.placeholder.com/800x400?text=Sin+imagen'">
      <h2>${receta.titulo}</h2>
      <p>${receta.descripcion || "Sin descripción"}</p>
      <p class="fecha">Creada: ${new Date(receta.created).toLocaleDateString('es-ES')}</p>
    `;
    
    // Cargar ingredientes
    const ing = await fetch(`${HOST}/api/collections/ingredientes/records?filter=receta_id="${id}"`);
    const { items } = await ing.json();
    
    const ul = document.getElementById("lista-ing");
    ul.innerHTML = "";
    
    if (items.length === 0) {
      ul.innerHTML = "<li>No hay ingredientes registrados</li>";
    } else {
      items.forEach(i => {
        const li = document.createElement("li");
        li.textContent = `${i.cantidad} – ${i.nombre}`;
        ul.appendChild(li);
      });
    }
    
    // Mostrar acciones si es el autor
    if (user && user.id === receta.receta_id) {
      const accionesDiv = document.getElementById("acciones-autor");
      accionesDiv.innerHTML = `
        <button id="btn-editar">Editar receta</button>
        <button id="btn-eliminar" style="background:#e74c3c">Eliminar receta</button>
      `;
      
      // Evento para editar
      document.getElementById("btn-editar").addEventListener("click", () => {
        location.href = `editar-receta.html?id=${receta.id}`;
      });
      
      // Evento para eliminar
      document.getElementById("btn-eliminar").addEventListener("click", async () => {
        if (!confirm("¿Estás seguro de que quieres eliminar esta receta?")) return;
        
        try {
          // Primero eliminar todos los ingredientes
          for (const ingrediente of items) {
            await fetch(`${HOST}/api/collections/ingredientes/records/${ingrediente.id}`, {
              method: "DELETE"
            });
          }
          
          // Luego eliminar la receta
          await fetch(`${HOST}/api/collections/recetas/records/${receta.id}`, {
            method: "DELETE"
          });
          
          alert("Receta eliminada exitosamente");
          location.href = "perfil.html";
        } catch (err) {
          alert("Error al eliminar la receta: " + err.message);
        }
      });
    }
    
    // Agregar botón de volver
    const volverDiv = document.createElement("div");
    volverDiv.id = "acciones";
    volverDiv.innerHTML = `<button onclick="history.back()">← Volver</button>`;
    document.querySelector(".detalle-container").appendChild(volverDiv);
    
    // Agregar botón de favorito
    if (user && window.favoritesService) {
      const favContainer = document.createElement("div");
      favContainer.style.cssText = `
        position: absolute;
        top: 20px;
        right: 20px;
      `;
      document.getElementById("info-receta").style.position = "relative";
      document.getElementById("info-receta").appendChild(favContainer);
      
      window.favoritesService.createFavoriteButton(receta.id, {
        size: 'large',
        showText: true,
        container: favContainer
      });
    }
    
  } catch (err) {
    console.error("Error:", err);
    alert("Error al cargar la receta");
    location.href = "index.html";
  }
})();