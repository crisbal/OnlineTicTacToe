// Constructor
function Room(name) {
  this.roomName = name;
  this.clients = {};

  this.numberOfClients = 0;
  this.playing = false;
}

Room.prototype.nextTurn = function(){
    this.turn++;
    playerId = this.clientsKeys[this.turn%this.clientsKeys.length];
    playerNumber = this.clients[playerId].number;
    this.emitToClients("startTurn",{ "turn" : this.turn, "playerNumber" : playerNumber, "board" : this.board.board });
    console.log("New turn started");
}

Room.prototype.setUpAndStart = function(){
    this.turn = -1;
    this.playing = true;
    this.clientsKeys = Object.keys(this.clients);
    this.rematchRequests = 0;
    this.board = new Board();

    this.emitToClients("startGame",null);
    this.nextTurn();
}

Room.prototype.isTurnOf = function(client){
    return (this.turn%this.numberOfClients) == client.number ? true : false;
}

Room.prototype.addClient = function(client) {
    this.clients[client.id] = client;

    client.isConnected = true;
    client.number = this.numberOfClients;
    client.room = this.roomName;

    var room = this;

    client.on("doMove",function(x,y){

        //TURN LOGIC
        if(room.playing){
            if(room.isTurnOf(client))
            {
                if(room.board.isSquareFree(x,y)){
                    result = room.board.doMove(x,y,client.number);
                    console.log(room.roomName + " Attempted move by Player " + client.number + " " + x + " " + y);
                    if(result===true){
                        console.log(room.roomName + " Winner: " + client.number);
                        client.requestedRematch = false;
                        room.playing = false;
                        room.emitToClients("gameEnded",{ "winner" : client.number, "board" : room.board.board });
                    }else if(result===-1){
                        console.log(room.roomName + " Draw: " + room.board.movecount);
                        client.requestedRematch = false;
                        room.playing = false;
                        room.emitToClients("gameEnded",{ "winner" : -1, "board" : room.board.board });
                    }else{
                        room.nextTurn();
                    }
                }else{
                    client.emit("alert","The square you selected is not free");
                }
            }else{
                client.emit("alert","It is not your turn. Don't try to cheat!");
            }
        }else{
            client.emit("alert","The game has already ended or it is yet to start!");
        }
        ////////////////////

    });
    
    client.requestedRematch = false;

    client.on("rematch", function(rematch){
        console.log("Rematch: " + rematch);
        if(!room.playing){
            if(!client.requestedRematch){
                if(rematch){
                    room.rematchRequests++;
                    if(room.rematchRequests == room.numberOfClients){
                        room.setUpAndStart();
                        console.log("Let's rematch");
                    }
                }else{
                    room.emitToClients("noRematch",client.number);
                    console.log("Let's no rematch");
                }
            }else{
                client.emit("alert","You already requested a rematch! Just wait!");
            }
        }else{
            client.emit("alert","Can't request rematch now!");
        }
    });
    client.emit("youArePlayer",this.numberOfClients++);

    return this.numberOfClients;

};
Room.prototype.removeClient = function(client) {
    this.clients[client.id] = null;

    return --this.numberOfClients;
};

Room.prototype.getConnectedClientsCount = function() {
    return this.numberOfClients;
};

Room.prototype.emitToClients = function(event,value){
    for(id in this.clients){
        if(this.clients[id] != null){
            this.clients[id].emit(event,value)
        }
    }
}

// export the class
module.exports = Room;

function Board(){
    this.board = [];
    for(var i=0; i<3; i++) {
        this.board[i] = [];
        for(var j=0; j<3; j++) {
            this.board[i][j] = -1;
        }
    }
    this.movecount = 0;
}

Board.prototype.isSquareFree = function(x,y) {
    return this.board[x][y] == -1 ? true : false;
}

//also returns if there is a winner
Board.prototype.doMove = function(x,y,value) {
    this.board[x][y] = value;
    this.movecount++;

    for(i = 0; i < 3; i++){
        if(this.board[x][i] != value)
            break;
        if(i == 3-1){
            console.log("Colonna");
            return true;
        }
    }

    for(i = 0; i < 3; i++){
        if(this.board[i][y] != value)
            break;
        if(i == 3-1){
            console.log("Riga");
            return true;
        }
    }

    if(x == y){
        //we're on a diagonal
        for(i = 0; i < 3; i++){
            if(this.board[i][i] != value)
                break;
            if(i == 3-1){
                return true;
            }
        }
    }
    for(i = 0; i < 3; i++){
        if(this.board[2-i][i] != value)
            break;
        if(i == 3-1){
            return true;
        }
    }

    if(this.movecount == 9){
        return -1;
    }

    return false;
}
