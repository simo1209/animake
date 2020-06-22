let express = require('express')
let app = express();
let http = require('http').createServer(app);
let io = require('socket.io')(http);

app.use(express.static('public'))

let word = "cat";

io.on('connection', (socket) => {
    console.log('a user connected');
    let room;
    let nick;

    socket.on('room',(r)=>{
        socket.join(r);
        room = r;
    })
    socket.on('nick',(n)=>{
        nick = n;
    })

    socket.on('line', (msg) => {
        socket.broadcast.to(room).emit("draw",msg);
    });

    socket.on('chat', (msg)=>{
        console.log(nick,msg)
        io.to(room).emit('chat',(nick+": "+msg));
    })

    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
});

http.listen(3000, () => {
    console.log('listening on *:3000');
});

