let express = require('express')
let app = express();
let http = require('http').createServer(app);
let io = require('socket.io')(http);

app.use(express.static('public'))

let words = ["dog", "cat", "pikachu", "stickman"];

class Room {
    constructor() {
        this.players = [];
    }

    addPlayer(playerName) {
        this.players.push(playerName);
    }

    removePlayer(playerName) {
        let index = -1;
        for (let i = 0; i < this.players.length; ++i) {
            if (this.players[i].nickname == playerName) {
                index = i;
            }
        };
        if (index !== -1) this.players.splice(index, 1);
    }

    startGame() {
        this.generateWord();
        this.drawer = this.players[Math.floor(Math.random() * this.players.length)];
        console.log("Drawer: ", this.drawer);
        this.guessers = Array.from(this.players);
        let index = -1;
        for (let i = 0; i < this.guessers.length; ++i) {
            if (this.guessers[i].nickname == this.drawer) {
                index = i
            }
        };
        if (index !== -1) this.guessers.splice(index, 1);
    }

    guesserRight(nickname) {
        let index = -1;
        for (let i = 0; i < this.guessers.length; ++i) {
            if (this.guessers[i].nickname == nickname) {
                index = i
            }
        };
        if (index !== -1) this.guessers.splice(index, 1);
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
            rooms[room] = new Room();
        }
        rooms[room].addPlayer(nick);
        io.to(room).emit('chat', { nickname: nick, message: 'has joined', type: 'system' }) // notify the players
        io.to(room).emit('players', rooms[room].players); // emit the current room to everyone in it
    });

    socket.on('room', (r) => { // when someone tries to enter a room
        socket.join(r); // add him to the room
        room = r; // and set the socket pair room
    });

    socket.on('line', (line) => { // When player draws line
        if (rooms[room]) {
            if (nick == rooms[room].drawer) {
                socket.broadcast.to(room).emit('draw', line); // Draw it on everyone else's canvas
            }
        }
    });

    socket.on('chat', (msg) => { // When someone sends message to chat 
        if (msg == rooms[room].guessWord && nick != rooms[room].drawer) { // the player guessed the word right
            io.to(room).emit('chat', { nickname: nick, message: "guessed the word", type: 'system' })
            rooms[room].guesserRight(nick);
        } else {
            io.to(room).emit('chat', { nickname: nick, message: msg, type: 'message' }); // Broadcast it to the room
        }
    });

    socket.on('start', (msg) => { // When someone clicks the start button
        rooms[room].startGame();
        io.to(room).emit('start', undefined);
    })

    socket.on('disconnect', () => {
        console.log('user disconnected');
        if (rooms[room]) {
            rooms[room].removePlayer(nick);
            io.to(room).emit('players', rooms[room].players); // emit the current room to everyone in it
        }
    });
});

http.listen(3000, () => {
    console.log('listening on *:3000');
});

