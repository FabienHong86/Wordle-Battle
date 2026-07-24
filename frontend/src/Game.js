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
      alert("Not a valid word");
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
    setCurrentGuess("");
  };

  // ===============================
  // HELPER FUNCTIONS
  // ===============================

  // Format the colors correctly
  function getColor(color) {
    if (color === "green") return "rgb(83, 141, 78)";
    if (color === "yellow") return "rgb(181, 159, 59)";
    if (color == "gray") return "rgb(58, 58, 60)"
    return "#121213";
  }

  // Border color should be gray when there is no letter
  function getBorderColor(color) {
    if (!color) return "rgb(58, 58, 60)";
    if (color === "green") return "rgb(83, 141, 78)";
    if (color === "yellow") return "rgb(181, 159, 59)";
    return "rgb(58, 58, 60)"
  }

  // ===============================
  // UI
  // ===============================
  const maxRows = 6;
  return (
    <div>
      <h1>Wordle Battle</h1>

      <p>Time left: {timer}</p>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center"}}>
        {Array.from({ length: maxRows }).map((_, rowIndex) => {
          const guess = guesses[rowIndex];

          return (
            <div key={rowIndex} style={{ display: "flex" }}>
              {Array.from({ length: 5 }).map((_, colIndex) => {
                let letter = "";
                let color = "";

                // Past guesses
                if (guess) {
                  letter = guess.word[colIndex];
                  color = guess.colors[colIndex];
                }

                // Current typing row
                else if (rowIndex === guesses.length) {
                  letter = currentGuess[colIndex] || "";
                }

                // Individual boxes
                return (
                  <div
                    key={colIndex}
                    style={{
                      width: "60px",
                      height: "60px",
                      border: `2px solid ${getBorderColor(color)}`,
                      margin: "0px 2px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: getColor(color),
                      color: "white",
                      fontWeight: "bold",
                      fontSize: "30px",
                    }}
                  >
                    {letter.toUpperCase()}
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