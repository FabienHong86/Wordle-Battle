import { io } from "socket.io-client";

// Connect to backend server
const socket = io("https://wordle-battle-dzi5.onrender.com", {
  transports: ["websocket"], // more reliable
});

export default socket;