let socket = io();

let room;

$(function () {
    $('#drawing').hide();

    $('#textbox>form').submit(function (e) {
        e.preventDefault(); // prevents page reloading
        socket.emit('chat', $('#m').val());
        $('#m').val('');
        return false;
    });

    $('#nick-form').submit(function (e) {

        room = window.location.search.split('?')[1];
        if (room) {
            socket.emit('room', room);
            console.log("room:", room);
        }

        e.preventDefault(); // prevents page reloading
        // socket.emit('chat', $('#m').val());
        console.log("sending nick:", $('#nick').val());
        socket.emit('nick', $('#nick').val());
        $('#nickname').hide();
        $('#drawing').show();
        return false;
    });
});


socket.on("chat", (msg) => {
    let node = createP(msg);
    console.log(msg);
    select("#messages").child(node);
})

function setup() {
    let cnv = createCanvas(640, 480);
    cnv.parent("#canvas");

}

function draw() {

}

function mouseDragged() {
    stroke(0, 0, 0);
    line(pmouseX, pmouseY, mouseX, mouseY);
    socket.emit('line', { room, pmouseX, pmouseY, mouseX, mouseY });
}

socket.on("draw", (msg) => {
    // console.log(msg);
    stroke(200, 0, 100);
    line(msg.pmouseX, msg.pmouseY, msg.mouseX, msg.mouseY);
})

socket.on("joined", (players) => {
    console.log(players);
    select("#players").html("");
    players.forEach(player => {
        select("#players").child(createDiv(player.nickname));
    });
})
