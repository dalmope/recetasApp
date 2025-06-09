const HOST = 'http://localhost:8090';
const user = JSON.parse(localStorage.getItem('user'));
if (!user) {
    location.href = 'login.html';
}
document.getElementById('nombre-usuario').textContent = user.correo;
document.getElementById('logout-btn').addEventListener('click', () => {
    localStorage.clear();
    location.href = 'login.html'
});

(async () => {
    const q = encodeURIComponent(`receta_id = "${user.id}"`);
    const r = await fetch(`${HOST}/api/collections/recetas/records?filter=${q}&sort=-created`);
    const { items } = await r.json();
    const c = document.getElementById('mis-recetas');
    items.forEach(rec => {
        const a = document.createElement("a");
        a.href = `detalle.html?id=${rec.id}`;
        a.className = 'receta';
        a.innerHTML = `<img src="${HOST}/api/files/recetas/${rec.id}/${rec.image}" alt=""><p>${rec.titulo}</p>`;
        c.appendChild(a);
    });
})();
