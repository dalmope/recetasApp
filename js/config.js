// Configuración global de la aplicación
const CONFIG = {
  // API
  API_URL: "https://recetas-app.pockethost.io",
  API_TIMEOUT: 10000, // 10 segundos

  // Paginación
  ITEMS_PER_PAGE: 12,

  // Validaciones
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_MAX_LENGTH: 12,
  IMAGE_MAX_SIZE: 5 * 1024 * 1024, // 5MB
  IMAGE_ALLOWED_TYPES: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],

  // Caché
  CACHE_DURATION: 5, // minutos

  // UI
  NOTIFICATION_DURATION: 3000, // milisegundos
  DEBOUNCE_DELAY: 300, // milisegundos
  ANIMATION_DURATION: 300, // milisegundos

  // Almacenamiento
  STORAGE_KEYS: {
    USER: 'user',
    THEME: 'tema',
    RECENT_SEARCHES: 'recent_searches',
    FAVORITES: 'favorites'
  },

  // Mensajes
  MESSAGES: {
    ERROR: {
      CONNECTION: "Error de conexión. Por favor, intenta nuevamente.",
      INVALID_CREDENTIALS: "Correo o contraseña incorrectos",
      EMAIL_EXISTS: "Este correo ya está registrado",
      REQUIRED_FIELDS: "Por favor completa todos los campos requeridos",
      IMAGE_SIZE: "La imagen no debe superar los 5MB",
      IMAGE_TYPE: "Tipo de archivo no permitido. Usa: JPG, PNG, GIF o WebP",
      PERMISSION_DENIED: "No tienes permiso para realizar esta acción",
      NOT_FOUND: "No se encontró el recurso solicitado"
    },
    SUCCESS: {
      REGISTER: "¡Cuenta creada exitosamente!",
      LOGIN: "Bienvenido de nuevo",
      RECIPE_CREATED: "¡Receta guardada exitosamente!",
      RECIPE_UPDATED: "¡Receta actualizada exitosamente!",
      RECIPE_DELETED: "Receta eliminada exitosamente",
      LOGOUT: "Sesión cerrada correctamente"
    },
    CONFIRM: {
      DELETE_RECIPE: "¿Estás seguro de que quieres eliminar esta receta?",
      LOGOUT: "¿Estás seguro de que quieres cerrar sesión?",
      CANCEL_EDIT: "¿Estás seguro de que quieres cancelar? Los cambios no guardados se perderán.",
      DELETE_INGREDIENT: "¿Eliminar este ingrediente?"
    }
  },

  // Placeholders
  PLACEHOLDERS: {
    NO_IMAGE: "https://via.placeholder.com/300x200?text=Sin+imagen",
    AVATAR: "https://via.placeholder.com/100?text=Avatar",
    NO_RECIPES: "No hay recetas disponibles",
    NO_INGREDIENTS: "No hay ingredientes registrados"
  },

  // Rutas
  ROUTES: {
    HOME: "index.html",
    LOGIN: "login.html",
    REGISTER: "register.html",
    PROFILE: "perfil.html",
    CREATE_RECIPE: "crear-receta.html",
    EDIT_RECIPE: "editar-receta.html",
    RECIPE_DETAIL: "detalle.html"
  },

  // API Endpoints
  ENDPOINTS: {
    USERS: "/api/collections/usuarios/records",
    RECIPES: "/api/collections/recetas/records",
    INGREDIENTS: "/api/collections/ingredientes/records",
    FILES: "/api/files"
  }
};

// Función helper para construir URLs de API
CONFIG.buildApiUrl = function (endpoint, id = null) {
  let url = this.API_URL + endpoint;
  if (id) {
    url += `/${id}`;
  }
  return url;
};

// Función para obtener URL de imagen
CONFIG.getImageUrl = function (collection, recordId, filename) {
  if (!filename) return this.PLACEHOLDERS.NO_IMAGE;
  return `${this.API_URL}${this.ENDPOINTS.FILES}/${collection}/${recordId}/${filename}`;
};

// Función para validar imagen
CONFIG.validateImage = function (file) {
  const errors = [];

  if (!this.IMAGE_ALLOWED_TYPES.includes(file.type)) {
    errors.push(this.MESSAGES.ERROR.IMAGE_TYPE);
  }

  if (file.size > this.IMAGE_MAX_SIZE) {
    errors.push(this.MESSAGES.ERROR.IMAGE_SIZE);
  }

  return {
    isValid: errors.length === 0,
    errors: errors
  };
};

// Función para formatear fecha
CONFIG.formatDate = function (dateString, options = {}) {
  const defaultOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };

  return new Date(dateString).toLocaleDateString('es-ES', { ...defaultOptions, ...options });
};

// Función para manejar errores de API
CONFIG.handleApiError = function (error) {
  console.error('API Error:', error);

  if (error.message.includes('Failed to fetch')) {
    return this.MESSAGES.ERROR.CONNECTION;
  }

  return error.message || this.MESSAGES.ERROR.CONNECTION;
};

// Hacer CONFIG inmutable en producción
if (typeof Object.freeze === 'function') {
  Object.freeze(CONFIG);
}

// Exportar para uso global
window.CONFIG = CONFIG;