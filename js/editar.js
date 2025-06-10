const HOST = "https://recetas-app.pockethost.io";
const id = new URLSearchParams(location.search).get("id");
const user = JSON.parse(localStorage.getItem("user"));

// Verificar autenticación y parámetros
if (!user || !id) {
  location.href = "./../html/login.html";
}

// Aplicar tema guardado
if (localStorage.getItem("tema") === "dark") {
  document.body.classList.add("dark");
}

// Variables globales
const form = document.getElementById("form-editar");
const contenedorIngredientes = document.getElementById("ingredientes-container");
const mensajeDiv = document.getElementById("mensaje");
let recetaActual = null;
let ingredientesOriginales = [];

// Logout
document.getElementById("logout-btn")?.addEventListener("click", () => {
  if (confirm("¿Estás seguro de que quieres cerrar sesión?")) {
    localStorage.clear();
    location.href = "./../html/login.html";
  }
});

// Función para agregar ingrediente
function agregarIngrediente(nombre = "", cantidad = "") {
  const divIngrediente = document.createElement("div");
  divIngrediente.className = "ingrediente";
  divIngrediente.innerHTML = `
    <input type="text" 
           class="nombre" 
           value="${nombre}" 
           placeholder="Nombre del ingrediente"
           required>
    <input type="text" 
           class="cantidad" 
           value="${cantidad}" 
           placeholder="Cantidad (ej: 2 tazas)"
           required>
    <button type="button" 
            class="btn-eliminar" 
            style="background: #e74c3c; color: white; border: none; padding: 0.5rem 1rem; border-radius: 0.5rem; cursor: pointer;"
            onclick="eliminarIngrediente(this)">
      ✕
    </button>
  `;
  contenedorIngredientes.appendChild(divIngrediente);
}

// Función para eliminar ingrediente
function eliminarIngrediente(boton) {
  const ingrediente = boton.parentElement;
  if (contenedorIngredientes.children.length > 1) {
    ingrediente.style.animation = "slideOut 0.3s ease-out";
    setTimeout(() => ingrediente.remove(), 300);
  } else {
    alert("La receta debe tener al menos un ingrediente");
  }
}

// Cargar datos de la receta
(async () => {
  try {
    // Mostrar estado de carga
    mensajeDiv.textContent = "Cargando receta...";
    
    // Obtener receta
    const response = await fetch(`${HOST}/api/collections/recetas/records/${id}`);
    if (!response.ok) {
      throw new Error("Receta no encontrada");
    }
    
    recetaActual = await response.json();
    
    // Verificar que el usuario sea el autor
    if (recetaActual.receta_id !== user.id) {
      alert("No tienes permiso para editar esta receta");
      location.href = "./../html/perfil.html";
      return;
    }
    
    // Llenar el formulario con los datos actuales
    form.titulo.value = recetaActual.titulo;
    form.descripcion.value = recetaActual.descripcion || "";
    
    // Mostrar imagen actual si existe
    if (recetaActual.image) {
      const previewDiv = document.createElement("div");
      previewDiv.innerHTML = `
        <p style="margin-top: 0.5rem; font-size: 0.9rem; opacity: 0.8;">
          Imagen actual:
        </p>
        <img id="imagen-actual" 
             src="${HOST}/api/files/recetas/${recetaActual.id}/${recetaActual.image}" 
             alt="Imagen actual"
             style="max-width: 200px; max-height: 200px; margin-top: 0.5rem; border-radius: 0.5rem; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
      `;
      form.image.parentElement.appendChild(previewDiv);
    }
    
    // Cargar ingredientes
    const ingResponse = await fetch(
      `${HOST}/api/collections/ingredientes/records?filter=receta_id="${id}"`
    );
    const { items } = await ingResponse.json();
    ingredientesOriginales = items;
    
    // Mostrar ingredientes
    contenedorIngredientes.innerHTML = "";
    if (items.length > 0) {
      items.forEach(ing => {
        agregarIngrediente(ing.nombre, ing.cantidad);
      });
    } else {
      agregarIngrediente(); // Agregar uno vacío si no hay ninguno
    }
    
    // Limpiar mensaje de carga
    mensajeDiv.textContent = "";
    
  } catch (err) {
    console.error("Error:", err);
    mensajeDiv.textContent = err.message;
    mensajeDiv.className = "mensaje error";
    setTimeout(() => {
      location.href = "./../html/perfil.html";
    }, 2000);
  }
})();

// Botón agregar ingrediente
document.getElementById("btn-agregar-ingrediente").addEventListener("click", () => {
  agregarIngrediente();
});

// Preview de nueva imagen
form.image.addEventListener("change", function(e) {
  const file = e.target.files[0];
  if (file && file.type.startsWith("image/")) {
    const reader = new FileReader();
    reader.onload = function(e) {
      let preview = document.getElementById("imagen-preview");
      if (!preview) {
        preview = document.createElement("img");
        preview.id = "imagen-preview";
        preview.style.cssText = `
          max-width: 200px;
          max-height: 200px;
          margin-top: 0.5rem;
          border-radius: 0.5rem;
          box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        `;
        const label = document.createElement("p");
        label.textContent = "Nueva imagen:";
        label.style.cssText = "margin-top: 0.5rem; font-size: 0.9rem; opacity: 0.8;";
        e.target.parentElement.appendChild(label);
        e.target.parentElement.appendChild(preview);
      }
      preview.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }
});

// Enviar formulario
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  
  const submitBtn = form.querySelector('button[type="submit"]');
  
  // Limpiar mensaje
  mensajeDiv.textContent = "";
  mensajeDiv.className = "mensaje";
  
  // Validar ingredientes
  const ingredientes = [...document.querySelectorAll(".ingrediente")];
  if (ingredientes.length === 0) {
    mensajeDiv.textContent = "Debes agregar al menos un ingrediente";
    mensajeDiv.className = "mensaje error";
    return;
  }
  
  // Validar que todos los campos estén completos
  const ingredientesIncompletos = ingredientes.some(ing => {
    const nombre = ing.querySelector(".nombre").value.trim();
    const cantidad = ing.querySelector(".cantidad").value.trim();
    return !nombre || !cantidad;
  });
  
  if (ingredientesIncompletos) {
    mensajeDiv.textContent = "Por favor completa todos los campos de ingredientes";
    mensajeDiv.className = "mensaje error";
    return;
  }
  
  // Deshabilitar botón
  submitBtn.disabled = true;
  submitBtn.textContent = "Actualizando...";
  
  try {
    // Actualizar receta
    const formData = new FormData(form);
    
    // Si no se seleccionó nueva imagen, no enviar el campo
    if (!form.image.files.length) {
      formData.delete("image");
    }
    
    await fetch(`${HOST}/api/collections/recetas/records/${id}`, {
      method: "PATCH",
      body: formData
    });
    
    // Eliminar ingredientes anteriores
    await Promise.all(
      ingredientesOriginales.map(ing =>
        fetch(`${HOST}/api/collections/ingredientes/records/${ing.id}`, {
          method: "DELETE"
        })
      )
    );
    
    // Crear nuevos ingredientes
    const nuevosIngredientes = ingredientes.map(ing => ({
      receta_id: id,
      nombre: ing.querySelector(".nombre").value.trim(),
      cantidad: ing.querySelector(".cantidad").value.trim()
    }));
    
    await Promise.all(
      nuevosIngredientes.map(ingrediente =>
        fetch(`${HOST}/api/collections/ingredientes/records`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(ingrediente)
        })
      )
    );
    
    // Éxito
    mensajeDiv.textContent = "¡Receta actualizada exitosamente!";
    mensajeDiv.className = "mensaje";
    
    // Redirigir
    setTimeout(() => {
      location.href = `./../html/detalle.html?id=${id}`;
    }, 1000);
    
  } catch (err) {
    console.error("Error:", err);
    mensajeDiv.textContent = "Error al actualizar la receta";
    mensajeDiv.className = "mensaje error";
    submitBtn.disabled = false;
    submitBtn.textContent = "Actualizar receta";
  }
});

// Agregar botón de cancelar
const cancelarBtn = document.createElement("button");
cancelarBtn.type = "button";
cancelarBtn.textContent = "Cancelar";
cancelarBtn.style.cssText = `
  background: #6c757d;
  color: white;
  padding: 1rem;
  border: none;
  border-radius: 0.5rem;
  cursor: pointer;
  font-weight: 600;
  font-size: 1.05rem;
  margin-top: 0.5rem;
  transition: all 0.2s;
`;
cancelarBtn.addEventListener("click", () => {
  if (confirm("¿Estás seguro de que quieres cancelar? Los cambios no guardados se perderán.")) {
    location.href = `./../html/detalle.html?id=${id}`;
  }
});
form.appendChild(cancelarBtn);

// Estilos para animación
const style = document.createElement("style");
style.textContent = `
  @keyframes slideOut {
    from {
      opacity: 1;
      transform: translateX(0);
    }
    to {
      opacity: 0;
      transform: translateX(-100%);
    }
  }
`;
document.head.appendChild(style);