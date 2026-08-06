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

  const [toastMessage, setToastMessage] = useState(null);

  // ===============================
  // HELPER FUNCTIONS
  // ===============================

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2000);
  };

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
      setCurrentGuess("");
    }

    const handleKeyDown = (e) => {
      const key = e.key;

      // Letters
      if (/^[a-zA-Z]$/.test(key)) {
        if (currentGuess.length < 5) {
          setCurrentGuess((prev) => prev + key.toLowerCase());
        }
      }

      // Backspace
      if (key === "Backspace") {
        setCurrentGuess((prev) => prev.slice(0, -1));
      }

      // Enter = submit
      if (key === "Enter") {
        submitGuess();
      }
    };

    const handleInvalidWord = () => {
      showToast("Not in word list");
    };

    socket.on("gameState", handleGameState);
    socket.on("newRound", handleNewRound);
    socket.on("guessResult", handleGuessResult);
    window.addEventListener("keydown", handleKeyDown);
    socket.on("invalidWord", handleInvalidWord);

    // Cleanup (important!)
    return () => {
      socket.off("gameState", handleGameState);
      socket.off("newRound", handleNewRound);
      socket.off("guessResult", handleGuessResult);
      window.removeEventListener("keydown", handleKeyDown);
      socket.off("invalidWord", handleInvalidWord);
    };
  }, [currentGuess]);

  // ===============================
  // SEND GUESS TO SERVER
  // ===============================
  const submitGuess = () => {
    if (currentGuess.length !== 5) return;
  if (guesses.length >= 6) return;

    socket.emit("guess", currentGuess);
    
  };

  // ===============================
  // UI
  // ===============================
  return (
    <div style={{position: "relative"}}>
      <h1>Wordle Battle</h1>

      {toastMessage && (
        <div className="toast-container">
          <div className="toast">{toastMessage}</div>
        </div>
      )}

      <p>Time left: {timer}</p>

      <div className = "column">
        {Array.from({ length: 6 }).map((_, rowIndex) => {
          const guess = guesses[rowIndex];
          
          return (
            <div key={rowIndex} className = "row">
              {Array.from({ length: 5 }).map((_, colIndex) => {
                let letter = "";
                let color = "";
                let anim = "";

                // Past guesses
                if (guess) {
                  letter = guess.word[colIndex];
                  color = guess.colors[colIndex];
                  anim = "flip";
                }

                // Current typing row
                else if (rowIndex === guesses.length) {
                  letter = currentGuess[colIndex] || "";
                  if(letter) anim = "pop";
                }

                // Individual boxes
                return (
                  <div key = {`${rowIndex}-${colIndex}`} className = {`tile ${color} ${anim}`}>
                    {letter}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>

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