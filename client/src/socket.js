import { io } from "socket.io-client";//connects to server
const socket = io("https://wordle-battle-dzi5.onrender.com", { //backend
  transports: ["websocket"],
});
export default socket; //let other files use connection