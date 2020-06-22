let express = require('express')
let app = express();
let http = require('http').createServer(app);
let io = require('socket.io')(http);

app.use(express.static('public'))

let words = ["dog", "cat", "pikachu", "stickamn"];

let rooms = {};

io.on('connection', (socket) => {
    console.log('a user connected');
    let room;
    let nick;

    socket.on('nick', (n) => { // When the client emits it's nickname
        nick = n;
        if (rooms[room]) { // If there are already players in the room
            rooms[room].push({ nickname: n }); // add the current nickname to the room
        } else {
            rooms[room] = [{ nickname: n }]; // or create new room and add the current nick
        }
        io.to(room).emit("joined", rooms[room]); // emit the current room to everyone in it
    })

    socket.on('room', (r) => { // when someone tries to enter a room
        socket.join(r); // add him to the room
        room = r; // and set the socket pair room
    })

    socket.on('line', (line) => { // When player draws line
        socket.broadcast.to(room).emit("draw", line); // Draw it on everyone else's canvas
    });

    socket.on('chat', (msg) => { // When someone sends message to chat 
        io.to(room).emit('chat', { nikname: nick, message: msg }); // Broadcast it to the room
    })

    socket.on('disconnect', () => {
        console.log('user disconnected');
        if (rooms[room]) {
            let index;
            for(let i =0; i<rooms[room].length;++i){
                if(rooms[room][i].nickname == nick){
                    index
                }
            };
            if (index !== -1) rooms[room].splice(index, 1);
            io.to(room).emit("joined", rooms[room]); // emit the current room to everyone in it
            console.log(rooms);
        }
    });
});

http.listen(3000, () => {
    console.log('listening on *:3000');
});

