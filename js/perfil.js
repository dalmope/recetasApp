const HOST = "https://recetas-app.pockethost.io";
const user = JSON.parse(localStorage.getItem("user"));

// Verificar autenticación
if (!user) {
  location.href = "./../html/login.html";
}

// Aplicar tema guardado
if (localStorage.getItem("tema") === "dark") {
  document.body.classList.add("dark");
}

// Mostrar información del usuario
document.getElementById("nombre-usuario").textContent = user.correo;

// Logout
document.getElementById("logout-btn").addEventListener("click", () => {
  if (confirm("¿Estás seguro de que quieres cerrar sesión?")) {
    localStorage.clear();
    location.href = "./../html/login.html";
  }
});

// Cargar recetas del usuario
(async () => {
  try {
    // Mostrar estado de carga
    const container = document.getElementById("mis-recetas");
    container.innerHTML = '<p class="loading">Cargando tus recetas...</p>';

    // Filtrar recetas por usuario
    const query = encodeURIComponent(`receta_id = "${user.id}"`);
    const response = await fetch(
      `${HOST}/api/collections/recetas/records?filter=${query}&sort=-created`
    );

    if (!response.ok) {
      throw new Error("Error al cargar las recetas");
    }

    const { items } = await response.json();

    // Limpiar contenedor
    container.innerHTML = "";

    // Verificar si hay recetas
    if (items.length === 0) {
      container.innerHTML = `
        <div class="no-recetas">
          <p>Aún no has creado ninguna receta.</p>
          <p><a href="./../html/crear-receta.html">¡Crea tu primera receta!</a></p>
        </div>
      `;

      // Actualizar estadísticas
      actualizarEstadisticas(0);
      return;
    }

    // Mostrar recetas
    items.forEach(rec => {
      const recetaElement = document.createElement("a");
      recetaElement.href = `./../html/detalle.html?id=${rec.id}`;
      recetaElement.className = "receta";

      const imgSrc = rec.image
        ? `${HOST}/api/files/recetas/${rec.id}/${rec.image}`
        : "https://via.placeholder.com/300x200?text=Sin+imagen";

      recetaElement.innerHTML = `
        <img src="${imgSrc}" alt="${rec.titulo}" onerror="this.src='https://via.placeholder.com/300x200?text=Sin+imagen'">
        <p>${rec.titulo}</p>
      `;

      container.appendChild(recetaElement);
    });

    // Actualizar estadísticas
    actualizarEstadisticas(items.length);

    // Contar ingredientes totales
    contarIngredientesTotales(items);

  } catch (err) {
    console.error("Error:", err);
    document.getElementById("mis-recetas").innerHTML =
      '<p class="error">Error al cargar tus recetas. Por favor, recarga la página.</p>';
  }
})();

// Función para actualizar estadísticas
function actualizarEstadisticas(totalRecetas) {
  // Agregar estadísticas al perfil
  const userInfo = document.querySelector(".usuario-info");

  // Verificar si ya existen las estadísticas
  if (!document.querySelector(".user-stats")) {
    const statsDiv = document.createElement("div");
    statsDiv.className = "user-stats";
    statsDiv.innerHTML = `
      <div class="stat">
        <div class="stat-number" id="total-recetas">${totalRecetas}</div>
        <div class="stat-label">Recetas</div>
      </div>
      <div class="stat">
        <div class="stat-number" id="total-ingredientes">-</div>
        <div class="stat-label">Ingredientes</div>
      </div>
      <div class="stat">
        <div class="stat-number">${calcularDias(user.created)}</div>
        <div class="stat-label">Días activo</div>
      </div>
    `;
    userInfo.appendChild(statsDiv);
  } else {
    // Actualizar valores existentes
    document.getElementById("total-recetas").textContent = totalRecetas;
  }
}

// Función para contar ingredientes totales
async function contarIngredientesTotales(recetas) {
  try {
    let totalIngredientes = 0;

    for (const receta of recetas) {
      const response = await fetch(
        `${HOST}/api/collections/ingredientes/records?filter=receta_id="${receta.id}"`
      );
      const { items } = await response.json();
      totalIngredientes += items.length;
    }

    // Actualizar el contador de ingredientes
    const ingredientesElement = document.getElementById("total-ingredientes");
    if (ingredientesElement) {
      ingredientesElement.textContent = totalIngredientes;
    }

  } catch (err) {
    console.error("Error contando ingredientes:", err);
  }
}

// Función para calcular días desde el registro
function calcularDias(fechaRegistro) {
  const ahora = new Date();
  const registro = new Date(fechaRegistro);
  const diferencia = ahora - registro;
  const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));
  return dias || 1; // Mínimo 1 día
}

// Agregar funcionalidad de búsqueda en las recetas del usuario
document.addEventListener("DOMContentLoaded", () => {
  // Crear buscador para las recetas del usuario
  const h3 = document.querySelector("h3");
  if (h3) {
    const buscadorDiv = document.createElement("div");
    buscadorDiv.style.cssText = "margin-bottom: 1rem; display: flex; gap: 0.5rem;";
    buscadorDiv.innerHTML = `
      <input type="text" id="buscar-mis-recetas" 
        placeholder="Buscar en mis recetas..." 
        style="flex: 1; padding: 0.5rem; border-radius: 0.5rem; border: 1px solid var(--color-borde);">
      <button id="btn-buscar-mis" class="btn">Buscar</button>
    `;
    h3.parentNode.insertBefore(buscadorDiv, h3.nextSibling);

    // Evento de búsqueda
    const buscarInput = document.getElementById("buscar-mis-recetas");
    const btnBuscar = document.getElementById("btn-buscar-mis");

    const buscarRecetas = () => {
      const termino = buscarInput.value.toLowerCase().trim();
      const recetas = document.querySelectorAll("#mis-recetas .receta");

      recetas.forEach(receta => {
        const titulo = receta.querySelector("p").textContent.toLowerCase();
        if (titulo.includes(termino)) {
          receta.style.display = "";
        } else {
          receta.style.display = "none";
        }
      });

      // Mostrar mensaje si no hay resultados
      const visibles = Array.from(recetas).filter(r => r.style.display !== "none");
      if (visibles.length === 0 && recetas.length > 0) {
        if (!document.querySelector(".no-resultados")) {
          const msg = document.createElement("p");
          msg.className = "no-resultados no-recetas";
          msg.textContent = "No se encontraron recetas con ese término.";
          document.getElementById("mis-recetas").appendChild(msg);
        }
      } else {
        const noResultados = document.querySelector(".no-resultados");
        if (noResultados) noResultados.remove();
      }
    };

    btnBuscar.addEventListener("click", buscarRecetas);
    buscarInput.addEventListener("keyup", (e) => {
      if (e.key === "Enter") buscarRecetas();
    });
  }
});