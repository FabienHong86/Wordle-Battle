import { io } from "socket.io-client";//connects to server
const socket = io("https://your-render-url.onrender.com");//where backend lives
export default socket; //let other files use connection