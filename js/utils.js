// Utilidades compartidas para toda la aplicación

const Utils = {
  // Formatear fecha
  formatearFecha(fecha) {
    const opciones = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(fecha).toLocaleDateString('es-ES', opciones);
  },

  // Validar email
  validarEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  },

  // Validar imagen
  validarImagen(archivo) {
    const tiposPermitidos = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const tamañoMaximo = 5 * 1024 * 1024; // 5MB

    if (!tiposPermitidos.includes(archivo.type)) {
      throw new Error('Tipo de archivo no permitido. Usa: JPG, PNG, GIF o WebP');
    }

    if (archivo.size > tamañoMaximo) {
      throw new Error('La imagen no debe superar los 5MB');
    }

    return true;
  },

  // Debounce para búsquedas
  debounce(func, delay) {
    let timeoutId;
    return function (...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
  },

  // Mostrar notificación
  mostrarNotificacion(mensaje, tipo = 'info', duracion = 3000) {
    // Remover notificación anterior si existe
    const notificacionAnterior = document.querySelector('.notificacion-flotante');
    if (notificacionAnterior) {
      notificacionAnterior.remove();
    }

    const notificacion = document.createElement('div');
    notificacion.className = `notificacion-flotante ${tipo}`;
    notificacion.textContent = mensaje;
    notificacion.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 0.5rem;
        color: white;
        font-weight: 500;
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
        max-width: 300px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      `;

    // Colores según tipo
    const colores = {
      info: '#3b82f6',
      success: '#22c55e',
      error: '#ef4444',
      warning: '#f59e0b'
    };

    notificacion.style.backgroundColor = colores[tipo] || colores.info;

    document.body.appendChild(notificacion);

    // Remover después de la duración especificada
    setTimeout(() => {
      notificacion.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => notificacion.remove(), 300);
    }, duracion);
  },

  // Confirmar acción
  async confirmarAccion(mensaje, textoConfirmar = 'Confirmar', textoCancelar = 'Cancelar') {
    return new Promise((resolve) => {
      const modal = document.createElement('div');
      modal.className = 'modal-confirmacion';
      modal.style.cssText = `
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(0,0,0,0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          animation: fadeIn 0.2s ease-out;
        `;

      const contenido = document.createElement('div');
      contenido.style.cssText = `
          background: var(--color-tarjeta, white);
          padding: 2rem;
          border-radius: 1rem;
          max-width: 400px;
          width: 90%;
          box-shadow: 0 10px 25px rgba(0,0,0,0.2);
          animation: scaleIn 0.2s ease-out;
        `;

      contenido.innerHTML = `
          <h3 style="margin-bottom: 1rem; color: var(--color-texto, #111);">${mensaje}</h3>
          <div style="display: flex; gap: 1rem; justify-content: flex-end;">
            <button id="btn-cancelar" style="
              padding: 0.6rem 1.2rem;
              border: 1px solid var(--color-borde, #ccc);
              background: transparent;
              border-radius: 0.5rem;
              cursor: pointer;
              color: var(--color-texto, #111);
            ">${textoCancelar}</button>
            <button id="btn-confirmar" style="
              padding: 0.6rem 1.2rem;
              border: none;
              background: var(--color-acento, #9b59b6);
              color: white;
              border-radius: 0.5rem;
              cursor: pointer;
              font-weight: 500;
            ">${textoConfirmar}</button>
          </div>
        `;

      modal.appendChild(contenido);
      document.body.appendChild(modal);

      // Eventos
      document.getElementById('btn-confirmar').onclick = () => {
        modal.remove();
        resolve(true);
      };

      document.getElementById('btn-cancelar').onclick = () => {
        modal.remove();
        resolve(false);
      };

      modal.onclick = (e) => {
        if (e.target === modal) {
          modal.remove();
          resolve(false);
        }
      };
    });
  },

  // Truncar texto
  truncarTexto(texto, longitud = 100) {
    if (texto.length <= longitud) return texto;
    return texto.substring(0, longitud) + '...';
  },

  // Cargar imagen con fallback
  cargarImagen(src, fallback = 'https://via.placeholder.com/300x200?text=Sin+imagen') {
    const img = new Image();
    img.src = src;

    return new Promise((resolve) => {
      img.onload = () => resolve(src);
      img.onerror = () => resolve(fallback);
    });
  },

  // Generar ID único
  generarId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  },

  // Sanitizar HTML (básico)
  sanitizarHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  },

  // LocalStorage con expiración
  storage: {
    set(key, value, expirationInMinutes = null) {
      const item = {
        value: value,
        timestamp: new Date().getTime()
      };

      if (expirationInMinutes) {
        item.expiration = new Date().getTime() + (expirationInMinutes * 60 * 1000);
      }

      localStorage.setItem(key, JSON.stringify(item));
    },

    get(key) {
      const itemStr = localStorage.getItem(key);

      if (!itemStr) return null;

      try {
        const item = JSON.parse(itemStr);
        const now = new Date().getTime();

        if (item.expiration && now > item.expiration) {
          localStorage.removeItem(key);
          return null;
        }

        return item.value;
      } catch (e) {
        return null;
      }
    },

    remove(key) {
      localStorage.removeItem(key);
    }
  }
};

// Agregar estilos para animaciones
if (!document.getElementById('utils-styles')) {
  const style = document.createElement('style');
  style.id = 'utils-styles';
  style.textContent = `
      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
  
      @keyframes slideOut {
        from {
          transform: translateX(0);
          opacity: 1;
        }
        to {
          transform: translateX(100%);
          opacity: 0;
        }
      }
  
      @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }
  
      @keyframes scaleIn {
        from {
          transform: scale(0.9);
          opacity: 0;
        }
        to {
          transform: scale(1);
          opacity: 1;
        }
      }
  
      .notificacion-flotante {
        transition: all 0.3s ease;
      }
  
      .notificacion-flotante:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(0,0,0,0.2);
      }
    `;
  document.head.appendChild(style);
}

// Exportar para uso global
window.Utils = Utils;