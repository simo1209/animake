let socket = io();
let strokeColor = "black";
let room;

$(function() {
    $('#drawing').hide();
    $('#center').hide();
    $('#start').hide();
    $('#start').click(function(e) {
        e.preventDefault(); // prevents page reloading
        socket.emit('start', undefined);

        return false;
    })

    $('#textbox>form').submit(function(e) {
        e.preventDefault(); // prevents page reloading
        socket.emit('chat', $('#m').val());
        $('#m').val('');
        return false;
    });



    $('#nick-form').submit(function(e) {

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
        $('#start').show();
        return false;
    });
});


socket.on("chat", (msg) => {
    let node;
    if (msg.type == "system") {
        node = createDiv(`<b>${msg.nickname} ${msg.message}</b>`);
    } else if (msg.type == "message") {
        node = createDiv(`<b>${msg.nickname}:</b> ${msg.message}`);
    }
    console.log(msg);
    select("#messages").child(node);
})

socket.on("start", (msg) => {
    $('#start').hide();
    $('#center').show();
    console.log("starting")
});

socket.on("draw", (msg) => {
    // console.log(msg);
    stroke(msg.strokeColor);
    line(msg.pmouseX, msg.pmouseY, msg.mouseX, msg.mouseY);
});

socket.on("players", (players) => {
    console.log(players);
    select("#players").html("");
    players.forEach(player => {
        select("#players").child(createDiv(player.nickname + " " + player.points));
    });
});

function setup() {
    let cnv = createCanvas(640, 480);
    cnv.parent("#center");

}

function draw() {

}

function mouseDragged() {
    stroke(strokeColor);
    line(pmouseX, pmouseY, mouseX, mouseY);
    socket.emit('line', { room, pmouseX, pmouseY, mouseX, mouseY, strokeColor });
}

function createColorTable() {
    let colors = ["black", "red", "yellow", "green", "blue", "white"];
    let btn;
    for (let i = 0; i < 6; i++) {
        btn = $("<button><button>").on("click", (event) => {
            stroke(colors[i]);
            strokeColor = colors[i];
        })
        btn.css("background-color", colors[i]);
        $("#drawing-tools").append(btn);
    }
    // btn.appendTo("#drawing-tools");
}

createColorTable();