// import libraries
const e = require("cors");
const express = require("express");
const socket = require("socket.io");

// setting up express
const app = express();

// fetch port
const PORT = process.env.PORT || 8080;

// random id
rid = (len) => {
    let str = "";
    let options = "QWERTYUIOPASDFGHJKLZXCVBNM";
    for (let i = 0; i < len; i++) {
        str += options[Math.floor(Math.random() * options.length)];
    }
    return str;
};

// ROUTES
app.get("/", (req, res) => {
    res.redirect("/" + rid(6));
});

app.get("/:room", (req, res) => {
    let room = req.params.room;
    res.sendFile(__dirname + "/public/index.html");
});

app.use(express.static(__dirname + "/public"));
app.use("/css", express.static(__dirname + "/public/css"));
app.use("/js", express.static(__dirname + "/public/js"));

// start server
const server = app.listen(PORT, () => {
    console.log(`Listening on port ${PORT}`);
});

// setup socket
const io = socket(server);

let rooms = {};

io.on("connection", (s) => {
    const id = s.id;
    let name;
    let room;
    let roomId;

    // console.log(`Socket (${id}) made!`);
    s.on("join", (data) => {
        let { name, room } = data;
        roomId = room;
        if (!rooms[room]) {
            rooms[room] = {
                cleared: true,
                players: [],
                leader: id,
            };
        } else {
            rooms[room].players.push({
                name: name,
                id: id,
                score: 0,
                buzzed: false,
            });
        }
        s.join(roomId);
        room = rooms[room];
    });

    s.on("clear", () => {
        if (room.leader !== id) {
            return;
        }
        room.cleared = true;
    });

    s.on("buzz", () => {
        if (!room.cleared) {
            return;
        }
        room.cleared = false;
        room.players.find((v) => v.id == id).buzzed = true;
        s.to(roomId).emit("");
    });

    s.on("scorechange", (value) => {
        if (room.leader !== id) {
            return;
        }
        const buzzedPlayer = room.players.find((v) => v.buzzed);
        buzzedPlayer.score += value;
        buzzedPlayer.buzzed = false;
        room.cleared = true;
        s.emit("sendInfo", room);
    });

    s.on("disconnect", () => {});
});
