let express = require('express')
let app = express();
let http = require('http').createServer(app);
let io = require('socket.io')(http);

app.use(express.static('public'))

let words = ["dog", "cat", "pikachu", "stickman"];

class Player {
    constructor(socket, nickname) {
        this.socket = socket;
        this.nickname = nickname;
        this.points = 0;
    }
}

class Room {
    constructor(roomId) {
        this.roomId = roomId;
        this.players = [];
        this.inGame = false;
    }

    addPlayer(player) {
        this.players.push(player);
        io.to(this.roomId).emit('chat', { nickname: player.nickname, message: 'has joined', type: 'system' }) // notify the players
        io.to(this.roomId).emit('players', this.players.map((player) => {
            return { nickname: player.nickname, points: player.points }
        })); // emit the current room to everyone in it
    }

    removePlayer(playerName) {
        let index = -1;
        for (let i = 0; i < this.players.length; ++i) {
            if (this.players[i].nickname == playerName) {
                index = i;
            }
        };
        if (index !== -1) this.players.splice(index, 1);

        io.to(this.roomId).emit('players', this.players.map((player) => {
            return { nickname: player.nickname, points: player.points }
        })); // emit the current room to everyone in it
    }

    startGame() {
        this.inGame = true;
        this.generateWord();
        this.guessers = this.players.slice();
        this.guessers.sort(() => Math.random() - 0.5);; // Shuffles the players
        this.drawer = this.guessers.pop(); // Picks random player as the drawer

        io.to(this.roomId).emit('chat', { nickname: this.drawer.nickname, message: "is drawing", type: 'system' });
        this.drawer.socket.emit("chat", { nickname: this.drawer.nickname, message: `You must draw: ${this.guessWord}`, type: 'system' });
        io.to(this.roomId).emit('start', undefined);
    }

    guesserRight(nickname) {
        let index = -1;
        for (let i = 0; i < this.guessers.length; ++i) {
            if (this.guessers[i].nickname == nickname) {
                index = i
            }
        };
        if (index !== -1) {
            this.guessers.splice(index, 1);
            for (let i = 0; i < this.players.length; ++i) {
                if (this.players[i].nickname == nickname) {
                    console.log(this.players[i].nickname);
                    this.players[i].points += 1;
                    io.to(this.roomId).emit('chat', { nickname: nickname, message: "guessed the word", type: 'system' })
                    io.to(this.roomId).emit('players', this.players.map((player) => {
                        return { nickname: player.nickname, points: player.points }
                    }));
                    break;
                }
            }
        }
        if (this.guessers.length == 0) {
            this.startGame();
        }
    }

    generateWord() {
        this.guessWord = words[Math.floor(Math.random() * words.length)];
    }

}

let rooms = {};

io.on('connection', (socket) => {
    console.log('a user connected');
    let room;
    let nick;

    socket.on('nick', (n) => { // When the client emits it's nickname
        nick = n;
        if (!rooms[room]) {
            rooms[room] = new Room(room);
        }
        rooms[room].addPlayer(new Player(socket, nick));

        if (rooms[room].inGame) {
            socket.emit('start', undefined);
        }
    });

    socket.on('room', (r) => { // when someone tries to enter a room
        socket.join(r); // add him to the room
        room = r; // and set the socket pair room
    });

    socket.on('line', (line) => { // When player draws line
        if (rooms[room] && rooms[room].inGame) {
            if (nick == rooms[room].drawer.nickname) {
                socket.broadcast.to(room).emit('draw', line); // Draw it on everyone else's canvas
            }
        }
    });

    socket.on('chat', (msg) => { // When someone sends message to chat 
        if (msg == rooms[room].guessWord && socket != rooms[room].drawer.socket) { // a player(who is not the drawer) guessed the word right
            rooms[room].guesserRight(nick);
        } else {
            io.to(room).emit('chat', { nickname: nick, message: msg, type: 'message' }); // Broadcast it to the room
        }
    });

    socket.on('start', (msg) => { // When someone clicks the start button
        rooms[room].startGame();

    })

    socket.on('disconnect', () => {
        console.log('user disconnected');
        if (rooms[room]) {
            rooms[room].removePlayer(nick);
        }
    });
});

http.listen(3000, () => {
    console.log('listening on *:3000');
});

