import { useEffect, useState } from "react";
import socket from "./socket";

function Game() {
  const [wordLength] = useState(5);
  const [guesses, setGuesses] = useState([]);
  const [currentGuess, setCurrentGuess] = useState("");
  const [leaderboard, setLeaderboard] = useState([]);
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    //listen for gameState
    socket.on("gameState", (state) => {
      setLeaderboard(state.leaderboard);
      setTimer(state.timer);
    });
    //listen for newRound
    socket.on("newRound", () => {
      setGuesses([]);
      setCurrentGuess("");
    });

    return () => socket.off();
  }, []);

  const submitGuess = () => {
    socket.emit("guess", currentGuess);
    setGuesses([...guesses, currentGuess]);
    setCurrentGuess("");
  };

    return (
    <div>
      <h1>Wordle Battle</h1>

      <p>Time left: {timer}</p>

      <input
        value={currentGuess}
        onChange={(e) => setCurrentGuess(e.target.value)}
        maxLength={wordLength}
      />

      <button onClick={submitGuess}>Guess</button>

      <div>
        {guesses.map((g, i) => (
          <div key={i}>{g}</div>
        ))}
      </div>

      <h2>Leaderboard</h2>
      {leaderboard.map((p, i) => (
        <div key={i}>
          {p.name}: {p.score}
        </div>
      ))}
    </div>
  );
}

export default Game;