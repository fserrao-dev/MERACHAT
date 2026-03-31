# MERA Chat — Guía de instalación en Railway

## ¿Qué es esto?
Chat interno en tiempo real para MERA Solutions. Cada miembro del equipo
tiene usuario y contraseña propios. Los mensajes viajan en vivo entre
navegadores usando WebSockets (Socket.IO).

---

## Usuarios y contraseñas

| Nombre             | Usuario          | Contraseña  |
|--------------------|------------------|-------------|
| Federico Serrao    | fede.serrao      | fede123     |
| Micaela Galán      | mica.galan       | mica123     |
| Eucarina Rodríguez | euca.rodriguez   | euca123     |
| Tatiana Urso       | tati.urso        | tati123     |
| Denise Krawiec     | deni.krawiec     | deni123     |
| Lucas Cabaleri     | lucas.cabaleri   | lucas123    |
| Melina Ayala       | meli.ayala       | meli123     |

---

## Cómo publicarlo en Railway (gratis, sin tocar código)

### Paso 1 — Subir el proyecto a GitHub
1. Entrá a https://github.com y creá una cuenta si no tenés
2. Hacé clic en **New repository** → Nombre: `mera-chat` → **Create repository**
3. Subí los archivos de esta carpeta (arrastrá y soltá en la interfaz de GitHub)
   - `server.js`
   - `package.json`
   - `public/index.html`

### Paso 2 — Crear la app en Railway
1. Entrá a https://railway.app y creá una cuenta (podés usar tu cuenta de GitHub)
2. Clic en **New Project** → **Deploy from GitHub repo**
3. Seleccioná el repositorio `mera-chat`
4. Railway detecta automáticamente que es Node.js y arranca el deploy
5. En unos 2 minutos te da una URL pública tipo: `https://mera-chat-xxxx.up.railway.app`

### Paso 3 — Compartir con el equipo
Mandá esa URL a cada compañero. Cada uno entra con su usuario y contraseña.
¡Listo! Los mensajes son en tiempo real entre todos.

---

## Funciones incluidas
- Login con usuario y contraseña por persona
- Mensajes directos en tiempo real (WebSocket)
- Grupos: RRHH General, Capacitación, MERA — Todos
- Indicador "está escribiendo..."
- Notificaciones con sonido
- Cambio de estado: Disponible / Ausente / Ocupado / Invisible
- Panel de miembros del grupo
- Historial de mensajes (mientras el servidor esté corriendo)

---

## Nota técnica
Los mensajes se guardan en memoria mientras el servidor está activo.
Si Railway reinicia el servidor (ej: deploy nuevo), el historial se borra.
Para historial permanente se necesita agregar una base de datos (MongoDB o PostgreSQL),
lo cual Railway también ofrece gratis. Consultá con IT si lo necesitás.
