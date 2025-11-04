let io;

function initSocket(server) {
  io = require('socket.io')(server);
  
  io.on('connection', (socket) => {
    console.log('A user connected');
    socket.on('join', function(room) {
      socket.join(room);
      console.log('User join: ', room)
  });
 
});
}
function on(event, callback) {
  if (io) {
    io.on(event, callback);
  } else {
    console.error('Socket server is not initialized');
  }
}
function emitMessage(event, data) {
  if (io) {
    io.emit(event, data);
 
  } else {
    console.error('Socket server is not initialized');
  }
}
function emitRoomMessage(room, event, data) {
  if (io) {
    io.to(room).emit(event, data); // Emit to specific room
  } else {
    console.error('Socket server is not initialized');
  }
}
module.exports = {
  on,
  initSocket,
  emitMessage,
  emitRoomMessage
};