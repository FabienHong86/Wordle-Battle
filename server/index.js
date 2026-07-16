//imports
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { newRound, checkGuess } = require("./game");
//Server creation
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // or "http://localhost:3000"
    methods: ["GET", "POST"]
  }
});
//Player interaction
io.on("connection", (socket) => {
  const player = { id: socket.id, score: 0 };

  socket.on("guess", (guess) => {
    checkGuess(guess, player, io);
  });
});
//Server start behavior
server.listen(3000, () => {
  console.log("Server running");
  newRound(io);
});