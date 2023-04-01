const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

const ws = require('./websocket');

app.use(express.static('public'));

let scoreHome = 0;
let scoreGuest = 0;
let setHome = 0;
let setGuest = 0;
let service = "team1";

let lastEvent = "";

//console.log(process.argv.length);
if(process.argv.length != 4){
    process.exit();
}

io.on('connection', (socket) => {
  console.log('A user connected');

  socket.emit('scoreUpdate', { scoreHome, scoreGuest, setHome, setGuest });
  socket.emit('teamUpdate', {guestTeam: process.argv[3]});

  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

ws.on('message', (data) => {

    const jsonobj = JSON.parse(data);
    let messageType = jsonobj.type;
    switch(messageType){
        case "MATCH_UPDATE":
            if(jsonobj.payload.matchUuid != process.argv[2])
                return;
            break;
        default:
            return;
    }
    let newjsonobj = jsonobj.payload;
    //console.log("updated");
    updateScore(newjsonobj);
    io.emit('scoreUpdate', { scoreHome, scoreGuest, setHome, setGuest, service });
    handleEventUpdate(newjsonobj);
});

function updateScore(jsonobj){
    scoreHome = jsonobj.matchSets[jsonobj.matchSets.length - 1].setScore.team1;
    scoreGuest = jsonobj.matchSets[jsonobj.matchSets.length - 1].setScore.team2;
    setHome = jsonobj.setPoints.team1;
    setGuest = jsonobj.setPoints.team2;
    service = jsonobj.serving;
}

function handleEventUpdate(jsonobj){
    if(jsonobj.eventHistory[0].uuid == lastEvent)
        return;
    if  (  jsonobj.matchSets[jsonobj.matchSets.length - 1].setScore.team1 == jsonobj.eventHistory[0].setScore.team1
        && jsonobj.matchSets[jsonobj.matchSets.length - 1].setScore.team2 == jsonobj.eventHistory[0].setScore.team2
        && jsonobj.setPoints.team1 == jsonobj.eventHistory[0].setPoints.team1
        && jsonobj.setPoints.team2 == jsonobj.eventHistory[0].setPoints.team2){
            let event = jsonobj.eventHistory[0];
            switch(event.type) {
                case "SET_BALL":
                case "MATCH_BALL":
                case "START_TIMEOUT":
                    io.emit('eventUpdate_specialBall', {
                        "type": event.type,
                        "team": jsonobj.eventHistory[0].teamCode
                    });
                    break;
                case "START_SET":
                case "START_MATCH":
                case "LOCK_STARTING_SIX":
                    let playersTeam1;
                    event.lineups.team1.playerUuids.forEach(element => {
                        
                    });
                    io.emit('eventUpdate_lineup', {
                        "type": event.type,
                        "team": jsonobj.eventHistory[0].teamCode
                    });
                    break;
                
            }
              
            lastEvent = jsonobj.eventHistory[0].uuid;
    }
}

http.listen(3000, () => {
  console.log('Server listening on port 3000');
});
