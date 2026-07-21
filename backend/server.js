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

// Enable CORS (Cross-Origin Resource Sharing) so frontend can connect
// Used to give access to resources
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

// Store valid words once
const validWords = new Set(
  randomWords.generate({ exactly: 1000, minLength: 5, maxLength: 5 })
);

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
  console.log("Current word:", currentWord); // TEMP DEBUG LINE
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

// Assigns colors to each letter in guess as per Wordle rules
function evaluateGuess(guess, solution) {
  const result = Array(5).fill(null);
  const solutionArr = solution.split("");

  // Greens check
  for(let i = 0; i < 5; i++){
    if(guess[i] === solutionArr[i]){
      result[i] = "green";
      solutionArr[i] = null;
    }
  }

  // Yellow and gray check
  for(let i = 0; i<5; i++){
    if(result[i]) continue;// Ignore greens
    const index = solutionArr.indexOf(guess[i]);
    if(index !== -1){// Letter in solution
      result[i] = "yellow";
      solutionArr[i] = null;
    } else {// Letter not in solution
      result[i] = "gray";
    }
  }

  return result;
}


// Check if a guess is correct
function checkGuess(guess, player, socket) {
  // Normalize Guess
  guess = guess.toLowerCase();

  // Reject invalid guesses
  if(!validWords.has(guess)){
    console.log("Invalid word:", guess); // TEMP DEBUG LINE
    return;
  }

  // Evaluate Guess
  const colors = evaluateGuess(guess, currentWord);
  
  // Send results to player
  socket.emit("guessResult", { word: guess, colors: colors });

  if (guess === currentWord) {
    console.log("Correct guess!");

    // Add points
    player.score += 100;

    // Add to leaderboard
    const existingPlayer = leaderboard.find(p => p.id === player.id);
    if (existingPlayer) {
      existingPlayer.score = player.score;
    } else {
      leaderboard.push(player);
    }
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
    checkGuess(guess, player, socket);
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