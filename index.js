// import libraries
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

    // player joins room
    s.on("join", (data) => {
        let { name, _roomId } = data;
        roomId = _roomId;
        s.join(roomId);
        // if room does not exist
        if (rooms[_roomId] == undefined) {
            rooms[_roomId] = {
                cleared: true,
                players: [],
                leader: id,
                leaderName: name,
            };
            s.emit("grantLeader");
        } else {
            // if room already exists
            rooms[_roomId].players.push({
                name: name,
                id: id,
                score: 0,
                buzzed: false,
            });
        }
        room = rooms[_roomId];
        io.to(roomId).emit("sendInfo", room);
    });

    // clear buzzes event
    s.on("clear", () => {
        if (room.leader !== id || room.cleared) {
            return;
        }
        clear();
    });

    // buzz event
    s.on("buzz", () => {
        if (!room || !room.cleared || room.leader == s.id) {
            return;
        }
        room.cleared = false;
        room.players.find((v) => v.id == id).buzzed = true;
        io.to(roomId).emit("sendInfo", room);
    });

    // change player score
    s.on("scorechange", (value) => {
        if (room.leader !== id || room.cleared) {
            return;
        }
        const buzzedPlayer = room.players.find((v) => v.buzzed);
        buzzedPlayer.score += value;
        clear();
    });

    // clears buzzes
    function clear() {
        room.cleared = true;
        const buzzedPlayer = room.players.find((v) => v.buzzed);
        buzzedPlayer.buzzed = false;
        io.to(roomId).emit("sendInfo", room);
    }

    // when a player leaves
    s.on("disconnect", () => {
        try {
            if (room.leader == id) {
                io.to(roomId).emit("restart");
                delete rooms[roomId];
            } else {
                // io.to(room).emit("player-left", { name: name, id: id });
                // rooms[room].players.filter((player) => player.id !== id);
            }
        } catch {}
    });
});
