// setup socket
const socket = io();

let canBuzz = false;
const room = window.location.pathname.substring(1);
const name = prompt("Enter your name");

// fetch elements
const playersDiv = document.getElementById("players");
const leaderDiv = document.getElementById("leader");
const buzzer = document.getElementById("visible-buzzer");
const leaderControls = document.getElementById("leader-controls");
const s = new sound("audio/ding.mp3"); // new sound element

// set room information
document.getElementById("room-code").innerText = "Room code: " + room;
document.getElementById(
    "room-link"
).innerHTML = `Join link: ${window.location.href}`;

// send player join event to server
socket.emit("join", { _roomId: room, name: name });

// leader only, clears buzzes
function clear() {
    if (!canBuzz) {
        socket.emit("clear");
    }
}

// when user is first in room they will be granted leader permissions
socket.on("grantLeader", () => {
    // clear button
    buzzer.innerText = "Clear";
    buzzer.onclick = clear;
    document.onkeydown = null;

    // correct/incorrect buttons
    let newRow = leaderControls.insertRow();
    newRow.setAttribute("colspace", 2);
    newRow.insertCell().innerHTML = `<div id="correct">Correct</div>`;
    newRow.insertCell().innerHTML = `<div id="incorrect">Incorrect</div>`;
    document.getElementById("correct").onclick = (e) => {
        socket.emit("scorechange", 1);
    };
    document.getElementById("incorrect").onclick = (e) => {
        socket.emit("scorechange", -1);
    };
});

// information updates for buzzes/score changes/player join events
socket.on("sendInfo", (r) => {
    if (!r.cleared && canBuzz) {
        s.play();
    }
    canBuzz = r.cleared;
    const sortedByScore = r.players.sort((a, b) => b.score - a.score);
    playersDiv.innerHTML = "";
    leaderDiv.innerText = "Leader: " + r.leaderName;
    // adding all players
    playersDiv.innerHTML =
        "<tr><th>Rank</th><th>Name</th><th>Score</th><th>Status</th></tr>";
    sortedByScore.forEach((player, i) => {
        let newRow = playersDiv.insertRow();
        newRow.id = player.id;
        newRow.className = "man";
        newRow.insertCell().innerText = i + 1;
        newRow.insertCell().innerText = player.name;
        newRow.insertCell().innerText = player.score;
        newRow.insertCell().innerHTML = `<div class='buzz-status' buzz-status='${
            r.cleared ? 0 : player.buzzed ? 2 : 1
        }'></div>`;
    });
});

// refresh page if leader leaves
socket.on("restart", () => {
    window.location.reload();
});

// buzzing events
buzzer.onclick = buzz;

document.onkeydown = (e) => {
    if (e.which == 13) {
        socket.emit("buzz");
    }
};

function buzz() {
    if (canBuzz) {
        socket.emit("buzz");
    }
}

// from w3 schools
function sound(src) {
    this.sound = document.createElement("audio");
    this.sound.src = src;
    this.sound.setAttribute("preload", "auto");
    this.sound.setAttribute("controls", "none");
    this.sound.style.display = "none";
    document.body.appendChild(this.sound);
    this.play = function () {
        this.sound.play();
    };
    this.stop = function () {
        this.sound.pause();
    };
}
