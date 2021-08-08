const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http, {
  cors: {
    origin: true,
    methods: ["GET", "POST"],
  },
});

let players = [];

io.on("connection", (socket) => {
  socket.on("join", (name, newRoom) => {
    let playersInRoom = players.filter(player => player.room === newRoom).length;
    let player = players.find((player) => player.name === socket.name);
    if (!player) {
      const isAdmin = playersInRoom === 0;
      const newPlayer = {
        name,
        room: newRoom,
        id: socket.id,
      }
      if (isAdmin) newPlayer.isAdmin = true;
      if (!isAdmin) newPlayer.isAdmin = false;
      players.push(newPlayer);
      socket.join(newPlayer.room);
      playersInRoom = players.filter(player => player.room === newRoom)
      io.to(newPlayer.room).emit("newPlayer", playersInRoom);
      io.to(socket.id).emit("enterRoom", newPlayer);
    } else {
      io.to(socket.id).emit("errorParticipantName");
    }
  });

  socket.on("disconnect", () => {
    const activePlayer = players.find((player) => player.id === socket.id);
    if (activePlayer) {
      const room = activePlayer.room;
      players = players.filter((player) => player.id !== socket.id);
      const playersInRoom = players.filter(player => player.room === room);
      io.to(room).emit("newPlayer", playersInRoom);
    }
  });

  socket.on("sound", (player, sound) => {
    io.to(player.room).emit("newSound", sound);
  } )
});

http.listen(process.env.PORT || 5000, () =>
  console.log(`Listening on port 5000`)
);
