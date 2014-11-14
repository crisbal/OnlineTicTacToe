var config = require('./config.json');

var express = require('express')
var app = express()

var http = require('http').Server(app);
var io = require('socket.io')(http);


var Room = require('./room.js');
/*INIT DONE*/

port = process.env.PORT || config.port; 
http.listen(port, function(){
    console.log('listening on localhost:' + port);
});

app.use(express.static('public'));
app.get('/', function (req, res) {
    res.sendFile('index.html');
})

rooms = {}

io.on("connection", function(client){

    console.log("A user connected to the server");

    client.once("connectToRoom", function(roomName){

        console.log("User attemping to connect to '" + roomName + "'");
        
        if(roomExists(roomName)){
            count = rooms[roomName].getConnectedClientsCount();

            if(count == 0){
                rooms[roomName] = new Room(roomName);
                console.log("Created room '" + roomName + "'");
            }
            if(count < 2){
                playersCount = rooms[roomName].addClient(client);
                if(playersCount == 1){
                    console.log("User connected to room '" + roomName + "'. Waiting for player 2");
                }else{
                    console.log("User connected to room '" + roomName + "'. Starting game ASAP");
                    handleGame(rooms[roomName]);
                }
            }else{
                console.log("User attempted to connect to room '" + roomName + "' but it is full");
                client.emit("alert","The room is full!");
            }
        }else{
            rooms[roomName] = new Room(roomName);
            console.log("Created room '" + roomName + "'");
            playersCount = rooms[roomName].addClient(client);
            console.log("User connected to room '" + roomName + "'. Waiting for player 2");
        }

    });

    client.once("disconnect", function(){
        if(client.isConnected){
            console.log("User disconnected from room '" + client.room + "' while playing!");
            rooms[client.room].removeClient(client);
        }else{
            console.log("User disconnected but was not playing");
        }
    })
});



function handleGame(room){
    room.setUpAndStart();
    console.log("Game started");
}


/*function roomExists(roomName){
    room = io.sockets.adapter.rooms[roomName];
    return room == null ? false : true;
}*/

function roomExists(roomName){
    if(roomName in rooms){
        if(rooms[roomName]==null){
            return false
        }else{
            return true;
        }
    }else return false;
}

/*function getRoom(roomName){
    return io.sockets.adapter.rooms[roomName];
}*/

function getRoom(roomName){
    return rooms[roomName];
}

/*
function getClientsInRoom(roomName) {
    var res = [], room = io.sockets.adapter.rooms[roomName];
    if (room) {
        for (var id in room) {
        res.push(io.sockets.adapter.nsp.connected[id]);
        }
    }
    return res;
}
*/