const HOST = 'https://recetas-app.pockethost.io';
const user = JSON.parse(localStorage.getItem('user'));

if (!user) {
    location.href = 'login.html';
}

document.getElementById('logout-btn')?.addEventListener('click', () => {
    localStorage.clear();
    location.href = 'login.html'
});

const cont = document.getElementById('ingredientes-container');
document.getElementById('btn-agregar-ingrediente').addEventListener('click', () => {
    const d = document.createElement('div');
    d.className = 'ingrediente';
    d.innerHTML = '<input type="text" placeholder="Nombre" class="nombre" required><input type="text" placeholder="Cantidad" class="cantidad" required>';
    cont.appendChild(d);
});

document.getElementById('form-receta').addEventListener('submit', async e => {
    e.preventDefault();
    const fd = new FormData(e.target);
    fd.append('receta_id', user.id);
    try {
        const r = await fetch(`${HOST}/api/collections/recetas/records`, { method: "POST", body: fd });
        if (!r.ok) {
            throw new Error('No se pudo crear la receta');
        }
        const receta = await r.json();
        const ingr = [...document
            .querySelectorAll('.ingrediente')]
            .map(i => ({
                receta_id: receta.id,
                nombre: i.querySelector('.nombre').value,
                cantidad: i.querySelector('.cantidad').value
            }));
        await Promise.all(
            ingr.map(i => fetch(`${HOST}/api/collections/ingredientes/records`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(i)
                })));
        alert('Receta guardada');
        location.href = `detalle.html?id=${receta.id}`;
    } catch (err) { document.getElementById('mensaje').textContent = err.message }
});
