const HOST = "https://recetas-app.pockethost.io";

// Aplicar tema guardado
if (localStorage.getItem("tema") === "dark") {
  document.body.classList.add("dark");
}

// REGISTRO
const regForm = document.getElementById("register-form");
const regError = document.getElementById("register-error");

regForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const correo = regForm.correo.value.trim();
  const contrasena = regForm.contrasena.value;
  const confirm = regForm["confirm-password"].value;

  // Limpiar mensaje de error
  regError.textContent = "";

  // Validaciones
  if (!validarEmail(correo)) {
    regError.textContent = "Por favor ingresa un correo válido";
    return;
  }

  if (contrasena.length < 8) {
    regError.textContent = "La contraseña debe tener al menos 8 caracteres";
    return;
  }

  if (contrasena.length > 12) {
    regError.textContent = "La contraseña no puede tener más de 12 caracteres";
    return;
  }

  if (contrasena !== confirm) {
    regError.textContent = "Las contraseñas no coinciden";
    return;
  }

  // Deshabilitar el botón mientras se procesa
  const submitBtn = regForm.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = "Creando cuenta...";

  try {
    const response = await fetch(`${HOST}/api/collections/usuarios/records`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        correo,
        contrasena
      })
    });

    if (!response.ok) {
      const error = await response.json();
      if (error.data?.correo?.code === "validation_not_unique") {
        throw new Error("Este correo ya está registrado");
      }
      throw new Error("No se pudo crear la cuenta");
    }

    // Éxito
    alert("¡Cuenta creada exitosamente! Ahora puedes iniciar sesión.");
    location.href = "./../html/login.html";

  } catch (err) {
    regError.textContent = err.message;
    submitBtn.disabled = false;
    submitBtn.textContent = "Registrarse";
  }
});

// LOGIN
const loginForm = document.getElementById("login-form");
const loginError = document.getElementById("login-error");

loginForm?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const correo = loginForm.correo.value.trim();
  const contrasena = loginForm.contrasena.value;

  // Limpiar mensaje de error
  loginError.textContent = "";

  // Validación básica
  if (!correo || !contrasena) {
    loginError.textContent = "Por favor completa todos los campos";
    return;
  }

  // Deshabilitar el botón mientras se procesa
  const submitBtn = loginForm.querySelector('button[type="submit"]');
  submitBtn.disabled = true;
  submitBtn.textContent = "Iniciando sesión...";

  try {
    // Buscar usuario por correo
    const query = encodeURIComponent(`correo = "${correo}"`);
    const response = await fetch(`${HOST}/api/collections/usuarios/records?filter=${query}&limit=1`);

    if (!response.ok) {
      throw new Error("Error de conexión con el servidor");
    }

    const { items } = await response.json();

    // Verificar si existe el usuario y la contraseña es correcta
    if (!items.length || items[0].contrasena !== contrasena) {
      throw new Error("Correo o contraseña incorrectos");
    }

    // Guardar datos del usuario en localStorage
    const usuario = {
      id: items[0].id,
      correo: items[0].correo,
      created: items[0].created
    };

    localStorage.setItem("user", JSON.stringify(usuario));

    // Redirigir a la página principal
    location.href = "./../index.html";

  } catch (err) {
    loginError.textContent = err.message;
    submitBtn.disabled = false;
    submitBtn.textContent = "Entrar";
  }
});

// Función para validar email
function validarEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

// Agregar enlaces de navegación entre login y registro
document.addEventListener("DOMContentLoaded", () => {
  const mainElement = document.querySelector("main");

  if (regForm && mainElement) {
    const enlace = document.createElement("div");
    enlace.className = "auth-links";
    enlace.innerHTML = '¿Ya tienes cuenta? <a href="./../html/login.html">Inicia sesión</a>';
    mainElement.appendChild(enlace);
  }

  if (loginForm && mainElement) {
    const enlace = document.createElement("div");
    enlace.className = "auth-links";
    enlace.innerHTML = '¿No tienes cuenta? <a href="./../html/register.html">Regístrate</a>';
    mainElement.appendChild(enlace);
  }
});

// Mostrar/ocultar contraseña (opcional)
document.querySelectorAll('input[type="password"]').forEach(input => {
  const wrapper = document.createElement("div");
  wrapper.style.position = "relative";
  input.parentNode.insertBefore(wrapper, input);
  wrapper.appendChild(input);

  const toggleBtn = document.createElement("button");
  toggleBtn.type = "button";
  toggleBtn.innerHTML = "👁";
  toggleBtn.style.cssText = `
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    cursor: pointer;
    opacity: 0.6;
    font-size: 1.2rem;
  `;

  toggleBtn.addEventListener("click", () => {
    if (input.type === "password") {
      input.type = "text";
      toggleBtn.innerHTML = "👁‍🗨";
    } else {
      input.type = "password";
      toggleBtn.innerHTML = "👁";
    }
  });

  wrapper.appendChild(toggleBtn);
});