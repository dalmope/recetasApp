const HOST = 'https://recetas-app.pockethost.io';

const regForm = document.getElementById('register-form');

const regError = document.getElementById('register-error');

regForm?.addEventListener('submit', async e => {
    e.preventDefault();
    const correo = regForm.correo.value.trim();
    const contrasena = regForm.contrasena.value;
    const confirm = regForm['confirm-password'].value;
    if (contrasena !== confirm) {
        regError.textContent = 'Las contraseñas no coinciden';
        return
    }
    try {
        const r = await fetch(`${HOST}/api/collections/usuarios/records`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ correo, contrasena })
            });
        if (!r.ok) {
            throw new Error('No se pudo crear el usuario');
        }
        alert('Cuenta creada. Inicia sesión.');
        location.href = 'login.html'
    }
    catch (err) { regError.textContent = err.message }
});

const loginForm = document.getElementById('login-form');

const loginError = document.getElementById('login-error');

loginForm?.addEventListener('submit', async e => {
    e.preventDefault();
    const correo = loginForm.correo.value.trim();
    const contrasena = loginForm.contrasena.value;
    try {
        const q = encodeURIComponent(`correo = '${correo}'`);
        const r = await fetch(`${HOST}/api/collections/usuarios/records?filter=${q}&limit=1`);
        if (!r.ok) {
            throw new Error('Error de conexión');
        }
        const { items } = await r.json();
        if (!items.length || items[0].contrasena !== contrasena) {
            throw new Error('Credenciales inválidas');
        }
        localStorage.setItem('user', JSON.stringify(items[0]));
        location.href = 'index.html'
    } catch (err) { loginError.textContent = err.message }
});
