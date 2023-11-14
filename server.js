const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

const ws = require('./websocket');

const obs = require('./obssocket');

app.use(express.static('public'));

let scoreHome = 0;
let scoreGuest = 0;
let setHome = 0;
let setGuest = 0;
let service = "team1";

let team1;
let team2;

let lastEvent = "";
let gameActive = undefined;

// params are: 
//  1. game UUID
//  2. guest team
if(process.argv.length < 4){
    console.error("Invalid amount of parameters. Usage: \nnode server.js \"<game UUID>\" \"<display name>\"");
    process.exit();
}

obs.connect();

let gameUUID = process.argv[2];

// browser connects to server
io.on('connection', (socket) => {
    console.log("\x1b[38;5;243m%s\x1b[0m", "User connected");

    socket.on('disconnect', () => {
        console.log("\x1b[38;5;243m%s\x1b[0m", "User disconnected");
    });

    socket.emit('teamUpdate', {
        // display name for guest team
        guestTeam: process.argv[3]
    });

    if(!gameActive)
        return;
    socket.emit('scoreUpdate', { scoreHome, scoreGuest, setHome, setGuest });
    socket.emit('playersUpdate', {
        team1, team2
    }); 

});

ws.on('message', (data) => {

    const jsonobj = JSON.parse(data);
    let messageType = jsonobj.type;
    switch(messageType){
        case "MATCH_UPDATE":
            if(jsonobj.payload.matchUuid != gameUUID)
                return;
            let newjsonobj = jsonobj.payload;
            updateScore(newjsonobj);
            io.emit('scoreUpdate', { scoreHome, scoreGuest, setHome, setGuest, service });
            handleEventUpdate(newjsonobj);
            console.log("Match Update: " + scoreHome + ":" + scoreGuest + " [" + setHome + ":" + setGuest + "]");
            break;
        case "FETCH_ASSOCIATION_TICKER_RESPONSE":
            if(jsonobj.payload.matchStates[gameUUID] === undefined){
                if(gameActive === undefined){
                    if(isGameRegistered(jsonobj)){
                        console.log("\x1b[33m%s\x1b[0m", "Found registered match, waiting for match start...");
                        gameActive = false;
                    } else {
                        console.error("\x1b[31m%s\x1b[0m", "Error: No match found for UUID");
                        process.exit(1);
                    }
                }
                return;
            }
            console.log("\x1b[32m%s\x1b[0m", "Found match and received game association update");
            reloadTeams(jsonobj.payload.matchStates[gameUUID].eventHistory);
            if(!team1 || !team2)
                return;
            io.emit('playersUpdate', {
                team1, team2
            });
            updateScore(jsonobj.payload.matchStates[gameUUID]);
            if(!scoreHome || !scoreGuest || !service)
                return;
            gameActive = true;
            io.emit('scoreUpdate', { scoreHome, scoreGuest, setHome, setGuest, service });
            break;
        default:
            return;
    }
});

function reloadTeams(jsonobj){
    for(var i = 0; i < jsonobj.length; i++){
        let event = jsonobj[i];
        if(event.type == "CONFIRM_TEAMSQUAD"){
            if(event.teamCode == "team1"){
                team1 = event.teamSquad.players;
            } else {
                team2 = event.teamSquad.players;
            }
        }
    }
}

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
                    console.log(`Special Ball: ${event.type} for ${jsonobj.eventHistory[0].teamCode === "team1" ? "home" : "guest"} team`);
                    if(event.type === "START_TIMEOUT"){
                        obs.showAds();
                        setTimeout(() => {
                            obs.hideAds();
                        }, 30000);
                    }
                    break;
                case "LOCK_STARTING_SIX":
                case "START_SET":
                    io.emit('eventUpdate_lineup', {
                        "team1": event.lineups.team1,
                        "team2": event.lineups.team2 ,
                        "set": (event.setPoints.team1 + event.setPoints.team2 + 1),
                        "service": jsonobj.serving
                    });
                    console.log("Lineup received");
                    break;
                case "CONFIRM_TEAMSQUAD":
                    reloadTeams(jsonobj.eventHistory);
                    io.emit('playersUpdate', {
                        team1, team2
                    });
                    break;
                default:
                    return;
                
            }              
            lastEvent = jsonobj.eventHistory[0].uuid;
    }
}

function isGameRegistered(jsonobj){
    for(matchDay of jsonobj.payload.matchDays){
        for(match of matchDay.matches){
            if(match.id === gameUUID){
                return true;
            }
        }
    }
    return false;
}

http.listen(3000, () => {
    console.log(`Server started on port 3000`);
});
