var socket = io();

isPlaying = false;
playerNumber = null;
waitingForPlayer = false;

$("#joinRoomForm").submit(function(){
    if(!isPlaying){
        roomName = $("#roomName").val();
        socket.emit("connectToRoom", roomName);
        $("#intro").hide();
        $("#game").toggleClass("hidden");
    }
    return false;
});


function updateTable(board,playerN){
    $("#tableContainer").empty();
    tableCode = "<table id='gameBoard'>";
    for(i=0; i<3;i++)
    {
        tableCode += "<tr class='row'>";
        for(j=0;j<3;j++){
                classString = "";
                if(board[j][i]==-1){
                    classString += "free ";
                    if(playerN!=playerNumber || playerN == -1)
                        classString += "notTurn ";
                    else
                        classString += "player" + playerNumber + " ";
                }else{
                    classString += "filled "
                    classString += "player" + board[j][i] + " ";
                }
            console.log(classString);
            tableCode += "<td data-y='" + i + "' data-x='" + j + "'class='" + classString + "'><span></span></td>";
        }
        tableCode += "</tr>";
    }
    tableCode += "</table>";

    $("#tableContainer").append(tableCode)
}

socket.on("youArePlayer", function(player){
    isPlaying = true;
    playerNumber = player;
    
    if(player==0){
        $("#gameStatus").text("Waiting for player 2");
    }else{
        $("#gameStatus").text("All players connected, game will be starting soon");
    }

    socket.on("startTurn",function(info){
        if(info.playerNumber==playerNumber){
            $("#gameStatus").text("Your turn!");
        }else{
            $("#gameStatus").text("Player " + (info.playerNumber+1) + " turn!");
        }
        board = info.board;
        updateTable(board,info.playerNumber);

        $("#gameBoard .row td").click(function(){
            socket.emit("doMove", $(this).attr("data-x"), $(this).attr("data-y"));
        });
    })

    socket.on("gameEnded",function(info){
        //{ "winner" : -1, "board" : room.board.board }
        winner = info.winner+1;
        board = info.board;
        if(winner==0){
            $("#gameStatus").text("Draw!");
        }else{
            $("#gameStatus").text("Player " + winner + " wins!");
        }

        $("#rematch").toggleClass("hidden");
        updateTable(board,-1);
    });
});

$("#yesRematch").click(function(){
    socket.emit("rematch",true);
    $("#gameStatus").text("Waiting for the other player");
    $("#rematch").toggleClass("hidden");
});

$("#noRematch").click(function(){
    socket.emit("rematch",false);
    $("#rematch").toggleClass("hidden");
    $("#gameStatus").text("You refused to play again!");
});

socket.on("noRematch",function(playerN){
    if(!$("#rematch").hasClass("hidden")){
         $("#rematch").toggleClass("hidden");
    }
    if(playerN!=playerNumber){
        $("#gameStatus").text("The other player refused to play again!");
    }
});
    

socket.on("alert",function(what){
    alert(what);
});