// ===============================
// IMPORTS
// ===============================
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const randomWords = require("random-words");

// ===============================
// SETUP SERVER
// ===============================
const app = express();
const server = http.createServer(app);

// Enable CORS so frontend can connect
const io = new Server(server, {
  cors: {
    origin: "*", // allow all (simple for dev)
  },
});

// ===============================
// GAME STATE (global variables)
// ===============================

// Current word players must guess
let currentWord = generateWord();

// List of players and scores
let leaderboard = [];

// Timer (seconds left)
let timer = 30;

// Interval reference (so we can stop it)
let interval = null;

// ===============================
// HELPER FUNCTIONS
// ===============================

// Generate a random 5-letter word
function generateWord() {
  return randomWords.generate({ exactly: 1, minLength: 5, maxLength: 5 })[0];
}

// Start a new round
function startNewRound() {
  console.log("Starting new round...");

  // Reset game state
  currentWord = generateWord();
  timer = 30;

  // Tell all clients a new round started
  io.emit("newRound");

  // Send initial state immediately
  io.emit("gameState", { leaderboard, timer });

  // Stop previous timer if it exists
  if (interval) clearInterval(interval);

  // Start countdown
  interval = setInterval(() => {
    timer--;

    console.log("Timer:", timer);

    // Send updated timer to all clients
    io.emit("gameState", { leaderboard, timer });

    // If time runs out → start new round
    if (timer <= 0) {
      clearInterval(interval);
      startNewRound();
    }
  }, 1000);
}

// Check if a guess is correct
function checkGuess(guess, player) {
  if (guess === currentWord) {
    console.log("Correct guess!");

    // Add points
    player.score += 100;

    // Add to leaderboard
    leaderboard.push(player);

    // Send updated leaderboard
    io.emit("gameState", { leaderboard, timer });

    // Start new round immediately
    startNewRound();
  }
}

// ===============================
// SOCKET CONNECTION
// ===============================
io.on("connection", (socket) => {
  console.log("Player connected:", socket.id);

  // Each player has their own score
  const player = {
    id: socket.id,
    score: 0,
  };

  // When player sends a guess
  socket.on("guess", (guess) => {
    checkGuess(guess, player);
  });

  socket.on("disconnect", () => {
    console.log("Player disconnected:", socket.id);
  });
});

// ===============================
// START SERVER
// ===============================
const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log("Server running on port",PORT);

  // Start the first round
  startNewRound();
});