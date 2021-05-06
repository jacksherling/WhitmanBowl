// setup socket
const socket = io.connect();

let canBuzz = false;
const room = window.location.pathname.substring(1);
const name = prompt("Enter your name");

socket.emit("join", { room: room, name: name });

function buzz() {
    if (canBuzz) {
        socket.emit("buzz");
    }
}
