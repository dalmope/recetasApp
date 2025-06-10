const HOST = 'https://recetas-app.pockethost.io';
const user = JSON.parse(localStorage.getItem("user"));

// Variables globales
let todasLasRecetas = [];
let recetasFiltradas = [];
let ordenActual = '-created';
let paginaActual = 1;
const recetasPorPagina = 12;

window.addEventListener('DOMContentLoaded', async () => {
  // Aplicar tema guardado
  if (localStorage.getItem('tema') === 'dark') {
    document.body.classList.add('dark');
  }

  // Toggle de tema
  document.getElementById('theme-toggle').addEventListener('click', () => {
    document.body.classList.toggle('dark');
    localStorage.setItem('tema', document.body.classList.contains('dark') ? "dark" : "light");
  });

  // Verificar si el usuario está logueado
  const navLinks = document.querySelector(".nav-links");
  if (!user) {
    navLinks.innerHTML = `
      <li><a href="./../html/login.html">Iniciar sesión</a></li>
      <li><a href="./../html/register.html">Registro</a></li>
      <li><button id="theme-toggle" class="btn">Tema</button></li>
    `;
    // Re-agregar el evento del tema
    document.getElementById("theme-toggle").addEventListener("click", () => {
      document.body.classList.toggle("dark");
      localStorage.setItem("tema", document.body.classList.contains("dark") ? "dark" : "light");
    });
  }

  // Agregar controles de filtrado y ordenamiento
  agregarControles();

  // Cargar todas las recetas
  await cargarRecetas();

  // Implementar búsqueda con debounce
  const searchInput = document.querySelector(".buscador input");
  const searchButton = document.querySelector(".buscador button");

  // Función de búsqueda con debounce
  const buscarConDebounce = debounce(async (termino) => {
    if (termino) {
      await buscarRecetas(termino);
    } else {
      recetasFiltradas = [...todasLasRecetas];
      paginaActual = 1;
      mostrarRecetasPaginadas();
    }
  }, 300);

  searchButton.addEventListener("click", async () => {
    const termino = searchInput.value.trim();
    buscarConDebounce(termino);
  });

  searchInput.addEventListener("input", (e) => {
    const termino = e.target.value.trim();
    buscarConDebounce(termino);
  });

  searchInput.addEventListener("keypress", async (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const termino = searchInput.value.trim();
      buscarConDebounce(termino);
    }
  });
});

// Función para agregar controles de filtrado
function agregarControles() {
  const h2 = document.querySelector("h2");
  const controlesDiv = document.createElement("div");
  controlesDiv.className = "controles-filtros";
  controlesDiv.style.cssText = `
    display: flex;
    gap: 1rem;
    justify-content: center;
    margin: 1rem auto;
    flex-wrap: wrap;
    max-width: 600px;
  `;

  controlesDiv.innerHTML = `
    <select id="ordenar" class="select-filtro" style="
      padding: 0.5rem 1rem;
      border-radius: 0.5rem;
      border: 1px solid var(--color-borde);
      background: var(--color-tarjeta);
      color: var(--color-texto);
      cursor: pointer;
    ">
      <option value="-created">Más recientes</option>
      <option value="created">Más antiguas</option>
      <option value="titulo">Alfabético A-Z</option>
      <option value="-titulo">Alfabético Z-A</option>
    </select>
    
    <button id="mis-recetas-toggle" class="btn" style="
      padding: 0.5rem 1rem;
      font-size: 0.9rem;
    ">
      Solo mis recetas
    </button>
    
    <button id="favoritos-toggle" class="btn" style="
      padding: 0.5rem 1rem;
      font-size: 0.9rem;
    ">
      ❤️ Favoritos
    </button>
  `;

  h2.parentNode.insertBefore(controlesDiv, h2.nextSibling);

  // Eventos de los controles
  document.getElementById("ordenar").addEventListener("change", (e) => {
    ordenActual = e.target.value;
    ordenarRecetas();
  });

  document.getElementById("mis-recetas-toggle").addEventListener("click", (e) => {
    e.target.classList.toggle("active");
    // Desactivar favoritos si está activo
    document.getElementById("favoritos-toggle").classList.remove("active");
    filtrarMisRecetas(e.target.classList.contains("active"));
  });

  document.getElementById("favoritos-toggle").addEventListener("click", (e) => {
    e.target.classList.toggle("active");
    // Desactivar mis recetas si está activo
    document.getElementById("mis-recetas-toggle").classList.remove("active");
    filtrarFavoritos(e.target.classList.contains("active"));
  });
}

async function cargarRecetas() {
  try {
    mostrarEstadoCarga();

    const r = await fetch(`${HOST}/api/collections/recetas/records?perPage=100`);
    const { items } = await r.json();

    todasLasRecetas = items;
    recetasFiltradas = [...todasLasRecetas];

    mostrarRecetasPaginadas();

  } catch (err) {
    console.error("Error cargando recetas:", err);
    document.getElementById("contenedor-recetas").innerHTML =
      "<p style='text-align:center; color: var(--color-error)'>Error al cargar las recetas</p>";
  }
}

async function buscarRecetas(termino) {
  const terminoLower = termino.toLowerCase();

  recetasFiltradas = todasLasRecetas.filter(receta =>
    receta.titulo.toLowerCase().includes(terminoLower) ||
    (receta.descripcion && receta.descripcion.toLowerCase().includes(terminoLower))
  );

  paginaActual = 1;

  if (recetasFiltradas.length === 0) {
    document.getElementById("contenedor-recetas").innerHTML =
      `<p style='text-align:center; grid-column: 1/-1'>No se encontraron recetas con "${termino}"</p>`;
    ocultarPaginacion();
  } else {
    mostrarRecetasPaginadas();
    // Mostrar notificación
    if (window.Utils) {
      Utils.mostrarNotificacion(`${recetasFiltradas.length} recetas encontradas`, 'info');
    }
  }
}

function filtrarMisRecetas(soloMias) {
  if (!user && soloMias) {
    if (window.Utils) {
      Utils.mostrarNotificacion('Debes iniciar sesión para ver tus recetas', 'warning');
    }
    document.getElementById("mis-recetas-toggle").classList.remove("active");
    return;
  }

  if (soloMias && user) {
    recetasFiltradas = todasLasRecetas.filter(receta => receta.receta_id === user.id);
    if (recetasFiltradas.length === 0) {
      document.getElementById("contenedor-recetas").innerHTML =
        `<p style='text-align:center; grid-column: 1/-1'>
          No tienes recetas aún. <a href="./../html/crear-receta.html" style="color: var(--color-acento)">¡Crea una!</a>
        </p>`;
      ocultarPaginacion();
      return;
    }
  } else {
    recetasFiltradas = [...todasLasRecetas];
  }

  paginaActual = 1;
  mostrarRecetasPaginadas();
}

function filtrarFavoritos(soloFavoritos) {
  if (!user && soloFavoritos) {
    if (window.Utils) {
      Utils.mostrarNotificacion('Debes iniciar sesión para ver tus favoritos', 'warning');
    }
    document.getElementById("favoritos-toggle").classList.remove("active");
    return;
  }

  if (soloFavoritos && window.favoritesService) {
    recetasFiltradas = window.favoritesService.filterFavoriteRecipes(todasLasRecetas);
    if (recetasFiltradas.length === 0) {
      document.getElementById("contenedor-recetas").innerHTML =
        `<p style='text-align:center; grid-column: 1/-1'>
          No tienes recetas favoritas aún. ¡Explora y guarda las que más te gusten!
        </p>`;
      ocultarPaginacion();
      return;
    }
  } else {
    recetasFiltradas = [...todasLasRecetas];
  }

  paginaActual = 1;
  mostrarRecetasPaginadas();
}

function ordenarRecetas() {
  const campo = ordenActual.replace('-', '');
  const descendente = ordenActual.startsWith('-');

  recetasFiltradas.sort((a, b) => {
    let valorA = a[campo];
    let valorB = b[campo];

    if (campo === 'titulo') {
      valorA = valorA.toLowerCase();
      valorB = valorB.toLowerCase();
    }

    if (valorA < valorB) return descendente ? 1 : -1;
    if (valorA > valorB) return descendente ? -1 : 1;
    return 0;
  });

  paginaActual = 1;
  mostrarRecetasPaginadas();
}

function mostrarRecetasPaginadas() {
  const inicio = (paginaActual - 1) * recetasPorPagina;
  const fin = inicio + recetasPorPagina;
  const recetasPagina = recetasFiltradas.slice(inicio, fin);

  mostrarRecetas(recetasPagina);
  mostrarPaginacion();

  // Agregar botones de favoritos después de mostrar las recetas
  setTimeout(() => {
    if (window.favoritesService) {
      window.favoritesService.addFavoriteButtonsToRecipes();
    }
  }, 100);
}

function mostrarRecetas(recetas) {
  const c = document.getElementById("contenedor-recetas");
  c.innerHTML = "";

  if (recetas.length === 0) {
    c.innerHTML = "<p style='text-align:center; grid-column: 1/-1'>No hay recetas disponibles</p>";
    return;
  }

  recetas.forEach((rec, index) => {
    const a = document.createElement("a");
    a.href = `./../html/detalle.html?id=${rec.id}`;
    a.className = "receta";
    a.style.animationDelay = `${index * 0.05}s`;

    const imgSrc = rec.image
      ? `${HOST}/api/files/recetas/${rec.id}/${rec.image}`
      : "https://via.placeholder.com/300x200?text=Sin+imagen";

    const fechaFormateada = new Date(rec.created).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short'
    });

    a.innerHTML = `
      <div style="position: relative;">
        <img src="${imgSrc}" alt="${rec.titulo}" 
          onerror="this.src='https://via.placeholder.com/300x200?text=Sin+imagen'"
          loading="lazy">
        <span class="fecha-receta" style="
          position: absolute;
          top: 10px;
          right: 10px;
          background: rgba(0,0,0,0.7);
          color: white;
          padding: 0.2rem 0.5rem;
          border-radius: 0.3rem;
          font-size: 0.8rem;
        ">${fechaFormateada}</span>
      </div>
      <h3>${rec.titulo}</h3>
      ${rec.descripcion ? `<p style="font-size: 0.85rem; opacity: 0.8; padding: 0 0.5rem 0.5rem;">${truncarTexto(rec.descripcion, 50)}</p>` : ''}
    `;
    c.appendChild(a);
  });
}

function mostrarPaginacion() {
  let paginacionDiv = document.getElementById("paginacion");

  const totalPaginas = Math.ceil(recetasFiltradas.length / recetasPorPagina);

  if (totalPaginas <= 1) {
    if (paginacionDiv) paginacionDiv.remove();
    return;
  }

  if (!paginacionDiv) {
    paginacionDiv = document.createElement("div");
    paginacionDiv.id = "paginacion";
    paginacionDiv.style.cssText = `
      display: flex;
      justify-content: center;
      gap: 0.5rem;
      margin: 2rem;
      flex-wrap: wrap;
    `;
    document.getElementById("contenedor-recetas").parentNode.appendChild(paginacionDiv);
  }

  paginacionDiv.innerHTML = "";

  // Botón anterior
  if (paginaActual > 1) {
    const btnAnterior = crearBotonPaginacion("← Anterior", () => {
      paginaActual--;
      mostrarRecetasPaginadas();
      scrollToTop();
    });
    paginacionDiv.appendChild(btnAnterior);
  }

  // Números de página
  let inicio = Math.max(1, paginaActual - 2);
  let fin = Math.min(totalPaginas, paginaActual + 2);

  if (inicio > 1) {
    paginacionDiv.appendChild(crearBotonPaginacion("1", () => cambiarPagina(1)));
    if (inicio > 2) {
      const dots = document.createElement("span");
      dots.textContent = "...";
      dots.style.padding = "0.5rem";
      paginacionDiv.appendChild(dots);
    }
  }

  for (let i = inicio; i <= fin; i++) {
    const btn = crearBotonPaginacion(i, () => cambiarPagina(i));
    if (i === paginaActual) {
      btn.style.background = "var(--color-acento)";
      btn.style.color = "white";
    }
    paginacionDiv.appendChild(btn);
  }

  if (fin < totalPaginas) {
    if (fin < totalPaginas - 1) {
      const dots = document.createElement("span");
      dots.textContent = "...";
      dots.style.padding = "0.5rem";
      paginacionDiv.appendChild(dots);
    }
    paginacionDiv.appendChild(crearBotonPaginacion(totalPaginas, () => cambiarPagina(totalPaginas)));
  }

  // Botón siguiente
  if (paginaActual < totalPaginas) {
    const btnSiguiente = crearBotonPaginacion("Siguiente →", () => {
      paginaActual++;
      mostrarRecetasPaginadas();
      scrollToTop();
    });
    paginacionDiv.appendChild(btnSiguiente);
  }
}

function crearBotonPaginacion(texto, onClick) {
  const btn = document.createElement("button");
  btn.textContent = texto;
  btn.onclick = onClick;
  btn.style.cssText = `
    padding: 0.5rem 1rem;
    border: 1px solid var(--color-borde);
    background: var(--color-tarjeta);
    color: var(--color-texto);
    border-radius: 0.5rem;
    cursor: pointer;
    transition: all 0.2s;
  `;
  btn.onmouseover = () => {
    btn.style.background = "var(--color-acento)";
    btn.style.color = "white";
  };
  btn.onmouseout = () => {
    if (btn.textContent != paginaActual) {
      btn.style.background = "var(--color-tarjeta)";
      btn.style.color = "var(--color-texto)";
    }
  };
  return btn;
}

function cambiarPagina(pagina) {
  paginaActual = pagina;
  mostrarRecetasPaginadas();
  scrollToTop();
}

function ocultarPaginacion() {
  const paginacionDiv = document.getElementById("paginacion");
  if (paginacionDiv) paginacionDiv.remove();
}

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function mostrarEstadoCarga() {
  const c = document.getElementById("contenedor-recetas");
  c.innerHTML = "";

  // Crear skeletons de carga
  for (let i = 0; i < 6; i++) {
    const skeleton = document.createElement("div");
    skeleton.className = "receta-skeleton";
    skeleton.style.cssText = `
      height: 220px;
      background: var(--color-tarjeta);
      border-radius: 1rem;
      animation: pulse 1.5s infinite;
    `;
    c.appendChild(skeleton);
  }
}

// Función debounce
function debounce(func, delay) {
  let timeoutId;
  return function (...args) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(this, args), delay);
  };
}

// Función truncar texto
function truncarTexto(texto, longitud = 100) {
  if (!texto) return '';
  if (texto.length <= longitud) return texto;
  return texto.substring(0, longitud) + '...';
}