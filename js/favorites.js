// Servicio de favoritos - Almacenamiento local
class FavoritesService {
  constructor() {
    this.storageKey = 'recipe_favorites';
    this.favorites = this.loadFavorites();
  }

  // Cargar favoritos del localStorage
  loadFavorites() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      return stored ? JSON.parse(stored) : {};
    } catch (e) {
      console.error('Error loading favorites:', e);
      return {};
    }
  }

  // Guardar favoritos en localStorage
  saveFavorites() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.favorites));
    } catch (e) {
      console.error('Error saving favorites:', e);
    }
  }

  // Verificar si una receta es favorita
  isFavorite(recipeId, userId = null) {
    if (!userId) {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user) return false;
      userId = user.id;
    }

    return this.favorites[userId]?.includes(recipeId) || false;
  }

  // Agregar/quitar favorito
  toggleFavorite(recipeId, userId = null) {
    if (!userId) {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user) {
        if (window.Utils) {
          Utils.mostrarNotificacion('Debes iniciar sesión para guardar favoritos', 'warning');
        }
        return false;
      }
      userId = user.id;
    }

    // Inicializar array de favoritos del usuario si no existe
    if (!this.favorites[userId]) {
      this.favorites[userId] = [];
    }

    const index = this.favorites[userId].indexOf(recipeId);

    if (index === -1) {
      // Agregar a favoritos
      this.favorites[userId].push(recipeId);
      this.saveFavorites();
      return true;
    } else {
      // Quitar de favoritos
      this.favorites[userId].splice(index, 1);
      this.saveFavorites();
      return false;
    }
  }

  // Obtener todos los favoritos del usuario
  getUserFavorites(userId = null) {
    if (!userId) {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user) return [];
      userId = user.id;
    }

    return this.favorites[userId] || [];
  }

  // Contar favoritos del usuario
  countUserFavorites(userId = null) {
    return this.getUserFavorites(userId).length;
  }

  // Limpiar favoritos del usuario
  clearUserFavorites(userId = null) {
    if (!userId) {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user) return;
      userId = user.id;
    }

    delete this.favorites[userId];
    this.saveFavorites();
  }

  // Crear botón de favorito
  createFavoriteButton(recipeId, options = {}) {
    const {
      size = 'normal',
      showText = false,
      onToggle = null,
      container = null
    } = options;

    const button = document.createElement('button');
    button.className = 'btn-favorite';
    button.setAttribute('data-recipe-id', recipeId);

    const isFav = this.isFavorite(recipeId);
    this.updateButtonState(button, isFav, showText);

    // Estilos según el tamaño
    const sizes = {
      small: { padding: '0.3rem', fontSize: '1rem' },
      normal: { padding: '0.5rem', fontSize: '1.2rem' },
      large: { padding: '0.7rem', fontSize: '1.5rem' }
    };

    const sizeStyle = sizes[size] || sizes.normal;

    button.style.cssText = `
        background: ${isFav ? 'var(--color-acento)' : 'rgba(255,255,255,0.9)'};
        color: ${isFav ? 'white' : 'var(--color-acento)'};
        border: 2px solid var(--color-acento);
        border-radius: ${showText ? '0.5rem' : '50%'};
        padding: ${sizeStyle.padding};
        font-size: ${sizeStyle.fontSize};
        cursor: pointer;
        transition: all 0.3s;
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      `;

    // Evento click
    button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      const user = JSON.parse(localStorage.getItem('user'));
      if (!user) {
        if (window.Utils) {
          Utils.mostrarNotificacion('Inicia sesión para guardar favoritos', 'warning');
        }
        window.location.href = './../html/login.html';
        return;
      }

      const isNowFavorite = this.toggleFavorite(recipeId);
      this.updateButtonState(button, isNowFavorite, showText);

      // Animación
      button.style.transform = 'scale(1.2)';
      setTimeout(() => {
        button.style.transform = 'scale(1)';
      }, 200);

      // Notificación
      if (window.Utils) {
        Utils.mostrarNotificacion(
          isNowFavorite ? 'Agregado a favoritos' : 'Eliminado de favoritos',
          'success',
          2000
        );
      }

      // Callback personalizado
      if (onToggle) {
        onToggle(isNowFavorite, recipeId);
      }
    });

    // Hover effect
    button.addEventListener('mouseenter', () => {
      button.style.transform = 'scale(1.1)';
    });

    button.addEventListener('mouseleave', () => {
      button.style.transform = 'scale(1)';
    });

    if (container) {
      container.appendChild(button);
    }

    return button;
  }

  // Actualizar estado visual del botón
  updateButtonState(button, isFavorite, showText) {
    const heartFilled = '❤️';
    const heartEmpty = '🤍';

    if (showText) {
      button.innerHTML = isFavorite
        ? `${heartFilled} Guardado`
        : `${heartEmpty} Guardar`;
    } else {
      button.innerHTML = isFavorite ? heartFilled : heartEmpty;
    }

    button.style.background = isFavorite ? 'var(--color-acento)' : 'rgba(255,255,255,0.9)';
    button.style.color = isFavorite ? 'white' : 'var(--color-acento)';
  }

  // Agregar botones de favoritos a una lista de recetas
  addFavoriteButtonsToRecipes(containerSelector = '.grid-recetas') {
    const container = document.querySelector(containerSelector);
    if (!container) return;

    const recetas = container.querySelectorAll('.receta');

    recetas.forEach(receta => {
      // Extraer ID de la URL
      const href = receta.getAttribute('href');
      const match = href.match(/id=([^&]+)/);
      if (!match) return;

      const recipeId = match[1];

      // Verificar si ya tiene botón
      if (receta.querySelector('.btn-favorite')) return;

      // Crear contenedor para el botón
      const btnContainer = document.createElement('div');
      btnContainer.style.cssText = `
          position: absolute;
          top: 10px;
          left: 10px;
          z-index: 10;
        `;

      // Agregar botón
      this.createFavoriteButton(recipeId, {
        size: 'small',
        container: btnContainer
      });

      // Hacer la receta relative si no lo es
      const imgContainer = receta.querySelector('div');
      if (imgContainer) {
        imgContainer.style.position = 'relative';
        imgContainer.appendChild(btnContainer);
      }
    });
  }

  // Filtrar recetas por favoritos
  filterFavoriteRecipes(recipes) {
    const userFavorites = this.getUserFavorites();
    return recipes.filter(recipe => userFavorites.includes(recipe.id));
  }
}

// Instancia global del servicio
window.favoritesService = new FavoritesService();

// Auto-inicializar en páginas con recetas
document.addEventListener('DOMContentLoaded', () => {
  // Esperar un momento para que se carguen las recetas
  setTimeout(() => {
    if (document.querySelector('.grid-recetas')) {
      window.favoritesService.addFavoriteButtonsToRecipes();
    }
  }, 1000);
});

// CSS para los botones de favoritos
if (!document.getElementById('favorites-styles')) {
  const style = document.createElement('style');
  style.id = 'favorites-styles';
  style.textContent = `
      .btn-favorite {
        outline: none;
        position: relative;
        overflow: hidden;
      }
      
      .btn-favorite:active {
        transform: scale(0.95) !important;
      }
      
      .btn-favorite::before {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        width: 0;
        height: 0;
        border-radius: 50%;
        background: rgba(255,255,255,0.3);
        transform: translate(-50%, -50%);
        transition: width 0.6s, height 0.6s;
      }
      
      .btn-favorite:active::before {
        width: 300px;
        height: 300px;
      }
      
      @keyframes heartbeat {
        0% { transform: scale(1); }
        50% { transform: scale(1.3); }
        100% { transform: scale(1); }
      }
      
      .btn-favorite.animate {
        animation: heartbeat 0.6s ease-in-out;
      }
    `;
  document.head.appendChild(style);
}