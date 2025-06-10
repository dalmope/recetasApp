const HOST = "https://recetas-app.pockethost.io";
const user = JSON.parse(localStorage.getItem("user"));

// Verificar autenticación
if (!user) {
  location.href = "login.html";
}

// Aplicar tema guardado
if (localStorage.getItem("tema") === "dark") {
  document.body.classList.add("dark");
}

// Logout
document.getElementById("logout-btn")?.addEventListener("click", () => {
  if (confirm("¿Estás seguro de que quieres cerrar sesión?")) {
    localStorage.clear();
    location.href = "login.html";
  }
});

// Contenedor de ingredientes
const contenedorIngredientes = document.getElementById("ingredientes-container");
let contadorIngredientes = 0;

// Función para agregar ingrediente
function agregarIngrediente(nombre = "", cantidad = "") {
  contadorIngredientes++;

  const divIngrediente = document.createElement("div");
  divIngrediente.className = "ingrediente";
  divIngrediente.innerHTML = `
    <input type="text" 
           placeholder="Nombre del ingrediente" 
           class="nombre" 
           value="${nombre}"
           required>
    <input type="text" 
           placeholder="Cantidad (ej: 2 tazas)" 
           class="cantidad" 
           value="${cantidad}"
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
  ingrediente.style.animation = "slideOut 0.3s ease-out";
  setTimeout(() => ingrediente.remove(), 300);
}

// Botón agregar ingrediente
document.getElementById("btn-agregar-ingrediente").addEventListener("click", () => {
  agregarIngrediente();
});

// Agregar primer ingrediente por defecto
agregarIngrediente();

// Formulario principal
document.getElementById("form-receta").addEventListener("submit", async (e) => {
  e.preventDefault();

  const mensajeDiv = document.getElementById("mensaje");
  const submitBtn = e.target.querySelector('button[type="submit"]');

  // Limpiar mensaje anterior
  mensajeDiv.textContent = "";
  mensajeDiv.className = "mensaje";

  // Validar ingredientes
  const ingredientes = [...document.querySelectorAll(".ingrediente")];
  if (ingredientes.length === 0) {
    mensajeDiv.textContent = "Debes agregar al menos un ingrediente";
    mensajeDiv.className = "mensaje error";
    return;
  }

  // Validar que todos los campos de ingredientes estén completos
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

  // Deshabilitar botón mientras se procesa
  submitBtn.disabled = true;
  submitBtn.textContent = "Guardando...";

  try {
    // Crear FormData con los datos del formulario
    const formData = new FormData(e.target);
    formData.append("receta_id", user.id);

    // Validar que haya imagen
    const imageInput = e.target.querySelector('input[name="image"]');
    if (!imageInput.files.length) {
      mensajeDiv.textContent = "Por favor selecciona una imagen para la receta";
      mensajeDiv.className = "mensaje error";
      submitBtn.disabled = false;
      submitBtn.textContent = "Guardar receta";
      return;
    }

    // Crear receta
    const response = await fetch(`${HOST}/api/collections/recetas/records`, {
      method: "POST",
      body: formData
    });

    if (!response.ok) {
      throw new Error("No se pudo crear la receta");
    }

    const receta = await response.json();

    // Guardar ingredientes
    const ingredientesData = ingredientes.map(ing => ({
      receta_id: receta.id,
      nombre: ing.querySelector(".nombre").value.trim(),
      cantidad: ing.querySelector(".cantidad").value.trim()
    }));

    await Promise.all(
      ingredientesData.map(ingrediente =>
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
    mensajeDiv.textContent = "¡Receta guardada exitosamente!";
    mensajeDiv.className = "mensaje";

    // Redirigir después de 1 segundo
    setTimeout(() => {
      location.href = `detalle.html?id=${receta.id}`;
    }, 1000);

  } catch (err) {
    console.error("Error:", err);
    mensajeDiv.textContent = err.message || "Error al guardar la receta";
    mensajeDiv.className = "mensaje error";
    submitBtn.disabled = false;
    submitBtn.textContent = "Guardar receta";
  }
});

// Preview de imagen
document.querySelector('input[type="file"]').addEventListener("change", function (e) {
  const file = e.target.files[0];
  if (file && file.type.startsWith("image/")) {
    const reader = new FileReader();
    reader.onload = function (e) {
      // Crear o actualizar preview
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
        e.target.parentElement.appendChild(preview);
      }
      preview.src = e.target.result;
    };
    reader.readAsDataURL(file);
  }
});

// Agregar estilos CSS para la animación de salida
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