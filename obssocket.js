const { default: OBSWebSocket } = require('obs-websocket-js');

const obs = new OBSWebSocket();

async function connect() {
    obs.connect(
        "ws://127.0.0.1:4455"
    ).then(
        () => console.log("Connected to OBS") // Success callback
    ).catch((error) => {
        console.error("Error while connecting to OBS, is OBS running?");
    });
}

async function showAds(){
    obs.call('GetSceneItemId', {
        sceneName: "Spiel",
        sourceName: "Werbegruppe",
        searchOffset: 0
    }).then((result) => {
        if(result === undefined){
            return;
        }
        obs.call('SetSceneItemEnabled', {
            sceneName: "Spiel",
            sceneItemId: result.sceneItemId,
            sceneItemEnabled: true
        }).then(() => {
            //console.log("Successfully enabled ads");
        })
    }).catch((error) => {
        console.error("Error enabling ad scene: " + error);
    });
}

async function hideAds(){
    obs.call('GetSceneItemId', {
        sceneName: "Spiel",
        sourceName: "Werbegruppe",
        searchOffset: 0
    }).then((result) => {
        if(result === undefined){
            return;
        }
        obs.call('SetSceneItemEnabled', {
            sceneName: "Spiel",
            sceneItemId: result.sceneItemId,
            sceneItemEnabled: false
        }).then(() => {
            //console.log("Successfully disabled ads");
        })
    }).catch((error) => {
        console.error("Error disabling ad scene: " + error);
    });
}

async function rampVolumeUp(){
    let errorHappened = false;
    for(let i = 0; i < 9; i++){
        obs.call('SetInputVolume', {
            inputName: "Desktop-Audio",
            inputVolumeDb: (-95 + (45 * i / 8)) 
        }).then(() => {        
            //console.log("Successfully disabled ads");
        }).catch((error) => {
            console.error("Error ramping volume up: " + error);
            errorHappened = true;
        });
        if(errorHappened) break;
        await new Promise(r => setTimeout(r, 120));
    }
}

module.exports.connect = connect;
module.exports.showAds = showAds;
module.exports.hideAds = hideAds;
module.exports.rampVolumeUp = rampVolumeUp;

