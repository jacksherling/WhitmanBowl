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

document.getElementById("room-code").innerText = "Room code: " + room;
document.getElementById(
    "room-link"
).innerHTML = `Join link: ${window.location.href}`;

socket.emit("join", { room: room, name: name });

// leader only
function clear() {
    if (!canBuzz) {
        socket.emit("clear");
    }
}

socket.on("grantLeader", () => {
    buzzer.innerText = "Clear";
    buzzer.onclick = clear;
    document.onkeydown = null;
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

socket.on("sendInfo", (r) => {
    canBuzz = r.cleared;
    // leaderDiv.innerHTML = `
    // Leader: ${r.leaderName} Room ID: ${room} Join link: ${window.location.href}
    // `;
    const sortedByScore = r.players.sort((a, b) => b.score - a.score);
    playersDiv.innerHTML = "";
    // sortedByScore.forEach((player) => {
    //     playersDiv.innerHTML += `
    //     <div class="player">
    //         ${player.name} ${player.score} ${player.buzzed ? "BUZZ" : ""}
    //     </div>
    //     `;
    // });
    leaderDiv.innerText = "Leader: " + r.leaderName;
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

socket.on("restart", () => {
    window.location.reload();
});

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
