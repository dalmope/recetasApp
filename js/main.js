const HOST = 'https://recetas-app.pockethost.io';

window.addEventListener('DOMContentLoaded', async () => {
    if (localStorage.getItem('tema') === 'dark') {
        document.body.classList.add('dark');
    }

    document.getElementById('theme-toggle').addEventListener('click', () => {
        document.body.classList.toggle('dark');
        localStorage.setItem('tema',
        document.body.classList.contains('dark') ? 'dark' : 'light');
    });

    const r = await fetch(`${HOST}/api/collections/recetas/records?sort=-created`);
    const { items } = await r.json();
    const c = document.getElementById('contenedor-recetas');
    items.forEach(rec => {
        const a = document.createElement('a');
        a.href = `./html/detalle.html?id=${rec.id}`;
        a.className = 'receta';
        a.innerHTML = `<img src="${HOST}/api/files/recetas/${rec.id}/${rec.image}" alt="${rec.titulo}"><h3>${rec.titulo}</h3>`;
        c.appendChild(a);
    });
});
