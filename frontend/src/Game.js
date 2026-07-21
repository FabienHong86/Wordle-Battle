import { useEffect, useState } from "react";
import socket from "./socket";

function Game() {
  // ===============================
  // STATE (data React tracks)
  // ===============================

  const [timer, setTimer] = useState(30);
  const [guesses, setGuesses] = useState([]);
  const [currentGuess, setCurrentGuess] = useState("");
  const [leaderboard, setLeaderboard] = useState([]);

  // ===============================
  // SOCKET LISTENERS (runs once)
  // ===============================
  useEffect(() => {
    // When server sends game updates
    const handleGameState = (state) => {
      console.log("Timer update:", state.timer);

      setTimer(state.timer);
      setLeaderboard(state.leaderboard);
    };

    // When new round starts
    const handleNewRound = () => {
      setGuesses([]);
      setCurrentGuess("");
    };

    const handleGuessResult = (data) => {
      setGuesses((prev) => [...prev, data]);
    }

    socket.on("gameState", handleGameState);
    socket.on("newRound", handleNewRound);
    socket.on("guessResult", handleGuessResult);

    // Cleanup (important!)
    return () => {
      socket.off("gameState", handleGameState);
      socket.off("newRound", handleNewRound);
      socket.off("guessResult", handleGuessResult)
    };
  }, []);

  // ===============================
  // SEND GUESS TO SERVER
  // ===============================
  const submitGuess = () => {
    if (currentGuess.length !== 5) return;

    socket.emit("guess", currentGuess);

    setCurrentGuess("");
  };

  // ===============================
  // UI
  // ===============================
  return (
    <div>
      <h1>Wordle Battle</h1>

      <p>Time left: {timer}</p>

      <input
        value={currentGuess}
        onChange={(e) => setCurrentGuess(e.target.value)}
        maxLength={5}
      />

      <button onClick={submitGuess}>Guess</button>

      <h3>Your guesses:</h3>
      {guesses.map((g, i) => (
        <div key={i}>
          {g.word} - {g.colors.join(", ")}
        </div>
      ))}

      <h2>Leaderboard</h2>
      {leaderboard.map((p, i) => (
        <div key={i}>
          {p.id}: {p.score}
        </div>
      ))}
    </div>
  );
}

export default Game;