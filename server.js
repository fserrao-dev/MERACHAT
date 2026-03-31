const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { maxHttpBufferSize: 3e6 });

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

app.get('/api/users', (req, res) => {
  res.json(USERS.map(u => ({ user: u.user, pass: u.pass, name: u.name })));
});

const USERS = [
  { id:'fede',  user:'fede.serrao',   pass:'fede123',  name:'Federico Serrao',    nick:'Jefe de RRHH 👔',               dept:'RRHH',         color:'#2979ff' },
  { id:'mica',  user:'mica.galan',    pass:'mica123',  name:'Micaela Galán',      nick:'Coordinadora Reclutamiento ✨', dept:'RRHH',         color:'#7c3aed' },
  { id:'euca',  user:'euca.rodriguez',pass:'euca123',  name:'Eucarina Rodríguez', nick:'Desarrollo y Formación 📚',     dept:'RRHH',         color:'#059669' },
  { id:'tati',  user:'tati.urso',     pass:'tati123',  name:'Tatiana Urso',       nick:'Administración de Personal 📋', dept:'RRHH',         color:'#d97706' },
  { id:'deni',  user:'deni.krawiec',  pass:'deni123',  name:'Denise Krawiec',     nick:'Legales ⚖️',                    dept:'RRHH',         color:'#dc2626' },
  { id:'lucas', user:'lucas.cabaleri',pass:'lucas123', name:'Lucas Cabaleri',     nick:'Capacitación 🎓',               dept:'Capacitación', color:'#0891b2' },
  { id:'meli',  user:'meli.ayala',    pass:'meli123',  name:'Melina Ayala',       nick:'Capacitación 💡',               dept:'Capacitación', color:'#be185d' },
];

const GROUPS = [
  { id:'grp-rrhh', name:'RRHH General', icon:'👥', color:'#2979ff', members:['fede','mica','euca','tati','deni'] },
  { id:'grp-cap',  name:'Capacitación', icon:'🎓', color:'#059669', members:['fede','lucas','meli'] },
  { id:'grp-all',  name:'MERA — Todos', icon:'🏢', color:'#7c3aed', members:['fede','mica','euca','tati','deni','lucas','meli'] },
];

const socketToUser = {};
const userToSocket = {};
const userStatus = {};
const history = {};

function convKey(a, b) { return [a, b].sort().join('_'); }
function getHistory(key) { if (!history[key]) history[key] = []; return history[key]; }

io.on('connection', (socket) => {

  socket.on('login', ({ username, password }) => {
    const u = USERS.find(x => x.user === username && x.pass === password);
    if (!u) { socket.emit('login_error', 'Usuario o contraseña incorrectos'); return; }
    socketToUser[socket.id] = u.id;
    userToSocket[u.id] = socket.id;
    userStatus[u.id] = 'online';
    socket.emit('login_ok', {
      me: u,
      users: USERS.map(x => ({ ...x, pass: undefined, status: userStatus[x.id] || 'offline' })),
      groups: GROUPS,
    });
    io.emit('user_status', { userId: u.id, status: 'online' });
  });

  socket.on('get_history', ({ key }) => {
    socket.emit('history', { key, messages: getHistory(key) });
  });

  socket.on('direct_message', ({ toId, text, image }) => {
    const fromId = socketToUser[socket.id];
    if (!fromId) return;
    if (image && image.length > 2800000) { socket.emit('error_msg', 'Imagen demasiado grande (máx 2MB)'); return; }
    const msg = { from: fromId, text: text||'', image: image||null, t: new Date().toISOString() };
    const key = convKey(fromId, toId);
    getHistory(key).push(msg);
    socket.emit('new_message', { key, msg });
    const toSocket = userToSocket[toId];
    if (toSocket) io.to(toSocket).emit('new_message', { key, msg });
  });

  socket.on('group_message', ({ groupId, text, image }) => {
    const fromId = socketToUser[socket.id];
    if (!fromId) return;
    const group = GROUPS.find(g => g.id === groupId);
    if (!group || !group.members.includes(fromId)) return;
    if (image && image.length > 2800000) { socket.emit('error_msg', 'Imagen demasiado grande (máx 2MB)'); return; }
    const msg = { from: fromId, text: text||'', image: image||null, t: new Date().toISOString() };
    getHistory(groupId).push(msg);
    group.members.forEach(mid => {
      const s = userToSocket[mid];
      if (s) io.to(s).emit('new_message', { key: groupId, msg });
    });
  });

  socket.on('typing_start', ({ toId }) => {
    const fromId = socketToUser[socket.id];
    if (!fromId) return;
    const toSocket = userToSocket[toId];
    if (toSocket) io.to(toSocket).emit('typing_start', { fromId });
  });

  socket.on('typing_stop', ({ toId }) => {
    const fromId = socketToUser[socket.id];
    if (!fromId) return;
    const toSocket = userToSocket[toId];
    if (toSocket) io.to(toSocket).emit('typing_stop', { fromId });
  });

  socket.on('typing_start_group', ({ groupId }) => {
    const fromId = socketToUser[socket.id];
    if (!fromId) return;
    const group = GROUPS.find(g => g.id === groupId);
    if (!group) return;
    group.members.forEach(mid => {
      if (mid === fromId) return;
      const s = userToSocket[mid];
      if (s) io.to(s).emit('typing_start_group', { fromId, groupId });
    });
  });

  socket.on('typing_stop_group', ({ groupId }) => {
    const fromId = socketToUser[socket.id];
    if (!fromId) return;
    const group = GROUPS.find(g => g.id === groupId);
    if (!group) return;
    group.members.forEach(mid => {
      if (mid === fromId) return;
      const s = userToSocket[mid];
      if (s) io.to(s).emit('typing_stop_group', { fromId, groupId });
    });
  });

  socket.on('set_status', ({ status }) => {
    const userId = socketToUser[socket.id];
    if (!userId) return;
    userStatus[userId] = status;
    io.emit('user_status', { userId, status });
  });

  socket.on('disconnect', () => {
    const userId = socketToUser[socket.id];
    if (userId) {
      delete socketToUser[socket.id];
      delete userToSocket[userId];
      userStatus[userId] = 'offline';
      io.emit('user_status', { userId, status: 'offline' });
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`MERA Chat corriendo en puerto ${PORT}`));
