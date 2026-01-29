'use strict';

// Configurazione multiplayer P2P con PeerJS
let multiplayerEnabled = false;
let peer = null;
let connections = new Map(); // Map di peerId -> connection
let currentRoomCode = null;
let myPlayerId = null;
let myPlayerColor = null;
let remotePlayers = new Map(); // Map di playerId -> dati giocatore remoto
let isRoomHost = false;
let playersReady = new Map();
let multiplayerUI = null;
let hostConnection = null; // Per i client, connessione all'host
let hostStartTimer = null; // Timer per l'host
let hostStartTime = 0; // Quando è iniziato il timer
let canHostStart = false; // Se l'host può startare

// Colori disponibili
const MULTIPLAYER_COLORS = [
    { name: 'Rosso', hsl: [0, 0.8, 0.5] },
    { name: 'Giallo', hsl: [60, 0.8, 0.5] },
    { name: 'Blu', hsl: [240, 0.8, 0.5] }
];

// Inizializza il multiplayer
function initMultiplayer() {
    createMultiplayerUI();
    console.log('Multiplayer P2P pronto (PeerJS Cloud)');
}

// Crea l'interfaccia UI
function createMultiplayerUI() {
    multiplayerUI = document.createElement('div');
    multiplayerUI.id = 'multiplayer-ui';
    multiplayerUI.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.95);
        padding: 30px;
        border-radius: 10px;
        color: white;
        font-family: Arial, sans-serif;
        z-index: 1000;
        display: none;
        min-width: 400px;
        max-width: 90%;
        box-shadow: 0 0 30px rgba(0, 255, 255, 0.5);
        border: 2px solid rgba(0, 255, 255, 0.3);
    `;
    
    multiplayerUI.innerHTML = `
        <div id="menu-screen">
            <h2 style="text-align: center; margin-top: 0; color: #00ffff;">MULTIPLAYER P2P</h2>
            <p style="text-align: center; font-size: 12px; color: #aaa; margin-bottom: 20px;">Connessioni Peer-to-Peer</p>
            <button onclick="showCreateRoom()" style="width: 100%; padding: 15px; margin: 10px 0; font-size: 18px; cursor: pointer; background: #00ff00; border: none; border-radius: 5px; font-weight: bold;">
                CREA STANZA
            </button>
            <button onclick="showJoinRoom()" style="width: 100%; padding: 15px; margin: 10px 0; font-size: 18px; cursor: pointer; background: #0088ff; border: none; border-radius: 5px; font-weight: bold;">
                ENTRA IN STANZA
            </button>
            <button onclick="closeMultiplayerUI()" style="width: 100%; padding: 15px; margin: 10px 0; font-size: 18px; cursor: pointer; background: #ff0000; border: none; border-radius: 5px; font-weight: bold;">
                ANNULLA
            </button>
        </div>
        
        <div id="create-room-screen" style="display: none;">
            <h2 style="text-align: center;">Crea Stanza</h2>
            <p id="connection-status" style="text-align: center; color: #aaa;">Connessione al server P2P...</p>
            <div id="create-room-status"></div>
        </div>
        
        <div id="join-room-screen" style="display: none;">
            <h2 style="text-align: center;">Entra in Stanza</h2>
            <input type="text" id="room-code-input" placeholder="Codice stanza (6 cifre)" maxlength="6" 
                style="width: 100%; padding: 15px; margin: 10px 0; font-size: 24px; text-align: center; border: 2px solid #00ffff; background: #222; color: white; border-radius: 5px;">
            <button onclick="joinRoom()" style="width: 100%; padding: 15px; margin: 10px 0; font-size: 18px; cursor: pointer; background: #00ff00; border: none; border-radius: 5px; font-weight: bold;">
                ENTRA
            </button>
            <button onclick="backToMenu()" style="width: 100%; padding: 15px; margin: 10px 0; font-size: 18px; cursor: pointer; background: #ff8800; border: none; border-radius: 5px; font-weight: bold;">
                INDIETRO
            </button>
            <div id="join-error" style="color: #ff4444; text-align: center; margin-top: 10px;"></div>
            <p id="join-status" style="text-align: center; color: #aaa; margin-top: 10px; font-size: 12px;"></p>
        </div>
        
        <div id="lobby-screen" style="display: none;">
            <h2 style="text-align: center;">STANZA: <span id="lobby-room-code"></span></h2>
            <p style="text-align: center; color: #00ff00;">Il tuo colore: <span id="my-color"></span></p>
            <h3>Giocatori (<span id="player-count">0</span>/3):</h3>
            <div id="players-list" style="margin: 20px 0; max-height: 200px; overflow-y: auto;"></div>
            
            <!-- Timer e pulsante START per l'host -->
            <div id="host-controls" style="display: none; text-align: center; margin: 20px 0; padding: 15px; background: rgba(255, 170, 0, 0.2); border-radius: 10px; border: 2px solid #ffaa00;">
                <p id="host-timer" style="font-size: 2em; font-weight: bold; color: #ffaa00; margin: 10px 0;"></p>
                <button id="host-start-button" onclick="hostForceStart()" disabled style="width: 100%; padding: 15px; margin: 10px 0; font-size: 18px; cursor: not-allowed; background: #666; border: none; border-radius: 5px; font-weight: bold; color: #aaa;">
                    START PARTITA
                </button>
                <p style="font-size: 0.9em; color: #aaa;">Puoi startare dopo 1 minuto dall'arrivo del secondo giocatore</p>
            </div>
            
            <button id="ready-button" onclick="playerReady()" style="width: 100%; padding: 15px; margin: 10px 0; font-size: 18px; cursor: pointer; background: #00ff00; border: none; border-radius: 5px; font-weight: bold;">
                PRONTO
            </button>
            <button onclick="leaveRoom()" style="width: 100%; padding: 15px; margin: 10px 0; font-size: 18px; cursor: pointer; background: #ff0000; border: none; border-radius: 5px; font-weight: bold;">
                ESCI
            </button>
            <p id="waiting-message" style="text-align: center; color: #ffff00; display: none;">In attesa che tutti siano pronti...</p>
        </div>
    `;
    
    document.body.appendChild(multiplayerUI);
}

function showMultiplayerMenu() {
    if (multiplayerUI) {
        multiplayerUI.style.display = 'block';
        document.getElementById('menu-screen').style.display = 'block';
    }
}

function closeMultiplayerUI() {
    if (multiplayerUI) {
        multiplayerUI.style.display = 'none';
    }
}

function showCreateRoom() {
    document.getElementById('menu-screen').style.display = 'none';
    document.getElementById('create-room-screen').style.display = 'block';
    initPeerAndCreateRoom();
}

function showJoinRoom() {
    document.getElementById('menu-screen').style.display = 'none';
    document.getElementById('join-room-screen').style.display = 'block';
}

function backToMenu() {
    document.getElementById('join-room-screen').style.display = 'none';
    document.getElementById('create-room-screen').style.display = 'none';
    document.getElementById('lobby-screen').style.display = 'none';
    document.getElementById('menu-screen').style.display = 'block';
    document.getElementById('join-error').textContent = '';
    document.getElementById('join-status').textContent = '';
}

// Genera codice stanza a 6 cifre
function generateRoomCode() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

// Inizializza PeerJS e crea una stanza
function initPeerAndCreateRoom() {
    const roomCode = generateRoomCode();
    const statusEl = document.getElementById('connection-status');
    
    statusEl.textContent = 'Connessione al server PeerJS...';
    
    // Usa il server PeerJS cloud ufficiale e gratuito
    peer = new Peer('drive13k-' + roomCode, {
        debug: 2 // Log per debugging
    });
    
    peer.on('open', (id) => {
        console.log('Peer connesso con ID:', id);
        currentRoomCode = roomCode;
        myPlayerId = id;
        myPlayerColor = MULTIPLAYER_COLORS[0]; // Host è sempre rosso
        isRoomHost = true;
        
        document.getElementById('create-room-status').innerHTML = 
            `<p style="color: #00ff00;">✓ Stanza creata!</p>
             <p style="font-size: 32px; font-weight: bold; color: #00ffff; text-align: center; margin: 20px 0;">${roomCode}</p>
             <p style="color: #aaa; text-align: center;">Condividi questo codice con i tuoi amici</p>`;
        
        statusEl.style.display = 'none';
        
        setTimeout(() => showLobby(), 1000);
        
        // Setup listener per connessioni in arrivo
        peer.on('connection', handleIncomingConnection);
    });
    
    peer.on('error', (err) => {
        console.error('Errore Peer:', err);
        let errorMsg = 'Errore sconosciuto';
        
        if (err.type === 'unavailable-id') {
            errorMsg = 'Codice stanza già in uso. Riprova.';
        } else if (err.type === 'network') {
            errorMsg = 'Errore di rete. Controlla la connessione internet.';
        } else if (err.type === 'server-error') {
            errorMsg = 'Server PeerJS non raggiungibile. Riprova tra poco.';
        } else {
            errorMsg = `Errore: ${err.type}`;
        }
        
        document.getElementById('create-room-status').innerHTML = 
            `<p style="color: #ff4444;">${errorMsg}</p>
             <button onclick="backToMenu()" style="padding: 10px 20px; margin-top: 10px; cursor: pointer; background: #ff8800; border: none; border-radius: 5px; color: white; font-weight: bold;">Riprova</button>`;
        statusEl.style.display = 'none';
    });
    
    peer.on('disconnected', () => {
        console.log('Peer disconnesso');
        statusEl.textContent = 'Disconnesso. Tentativo di riconnessione...';
        peer.reconnect();
    });
}

// Gestisce connessioni in arrivo (solo host)
function handleIncomingConnection(conn) {
    if (!isRoomHost) return;
    
    console.log('Nuova connessione da:', conn.peer);
    
    // Verifica che non ci siano già 3 giocatori
    if (remotePlayers.size >= 2) {
        conn.on('open', () => {
            conn.send({ type: 'error', message: 'Stanza piena (max 3 giocatori)' });
            setTimeout(() => conn.close(), 1000);
        });
        return;
    }
    
    connections.set(conn.peer, conn);
    
    conn.on('open', () => {
        // Assegna colore al nuovo giocatore
        const colorIndex = remotePlayers.size + 1;
        const playerColor = MULTIPLAYER_COLORS[colorIndex];
        
        // Invia info iniziali al nuovo giocatore
        conn.send({
            type: 'welcome',
            roomCode: currentRoomCode,
            yourColor: playerColor,
            yourId: conn.peer,
            players: getPlayersList()
        });
        
        // Crea il remote player
        const remotePlayer = createRemotePlayer({
            id: conn.peer,
            color: playerColor,
            pos: { x: 0, y: 0, z: 2000 }
        });
        
        remotePlayers.set(conn.peer, remotePlayer);
        
        // Notifica tutti gli altri giocatori
        broadcastToOthers({
            type: 'playerJoined',
            player: {
                id: conn.peer,
                color: playerColor
            }
        }, conn.peer);
        
        // Se è il secondo giocatore, avvia il timer dell'host
        if (remotePlayers.size === 1 && isRoomHost) {
            startHostTimer();
        }
        
        updatePlayersListUI();
    });
    
    conn.on('data', (data) => handleMessage(data, conn));
    
    conn.on('close', () => {
        console.log('Giocatore disconnesso:', conn.peer);
        handlePlayerDisconnect(conn.peer);
    });
    
    conn.on('error', (err) => {
        console.error('Errore connessione con', conn.peer, ':', err);
    });
}

// Entra in una stanza esistente
function joinRoom() {
    const roomCode = document.getElementById('room-code-input').value.trim();
    const errorEl = document.getElementById('join-error');
    const statusEl = document.getElementById('join-status');
    
    if (roomCode.length !== 6) {
        errorEl.textContent = 'Il codice deve essere di 6 cifre';
        return;
    }
    
    errorEl.textContent = '';
    statusEl.textContent = 'Connessione in corso...';
    
    const peerId = 'drive13k-' + roomCode;
    
    // Crea peer con ID casuale
    peer = new Peer(undefined, {
        debug: 2
    });
    
    peer.on('open', (id) => {
        console.log('Connesso come:', id);
        myPlayerId = id;
        
        statusEl.textContent = 'Connessione alla stanza...';
        
        // Connetti all'host
        hostConnection = peer.connect(peerId, { 
            reliable: true,
            serialization: 'json'
        });
        
        hostConnection.on('open', () => {
            console.log('Connesso all\'host');
            statusEl.textContent = 'Connesso! In attesa dati...';
        });
        
        hostConnection.on('data', (data) => handleMessage(data, hostConnection));
        
        hostConnection.on('close', () => {
            console.log('Connessione all\'host persa');
            alert('Connessione persa con l\'host!');
            leaveRoom();
        });
        
        hostConnection.on('error', (err) => {
            console.error('Errore connessione:', err);
            errorEl.textContent = 'Errore di connessione';
            statusEl.textContent = '';
        });
    });
    
    peer.on('error', (err) => {
        console.error('Errore Peer:', err);
        statusEl.textContent = '';
        
        if (err.type === 'peer-unavailable') {
            errorEl.textContent = 'Stanza non trovata. Verifica il codice.';
        } else if (err.type === 'network') {
            errorEl.textContent = 'Errore di rete. Controlla la connessione.';
        } else if (err.type === 'server-error') {
            errorEl.textContent = 'Server non raggiungibile. Riprova.';
        } else {
            errorEl.textContent = 'Errore: ' + err.type;
        }
    });
}

// Gestisce i messaggi ricevuti
function handleMessage(data, conn) {
    console.log('Messaggio ricevuto:', data.type);
    
    switch (data.type) {
        case 'trackSeed':
            // Ricevi il seed della traccia dall'host
            trackSeed = data.seed;
            console.log('Seed traccia ricevuto dall\'host:', trackSeed);
            break;
            
        case 'welcome':
            currentRoomCode = data.roomCode;
            myPlayerColor = data.yourColor;
            isRoomHost = false;
            
            // Crea i veicoli degli altri giocatori
            if (data.players) {
                data.players.forEach(player => {
                    if (player.id !== myPlayerId) {
                        const remotePlayer = createRemotePlayer(player);
                        remotePlayers.set(player.id, remotePlayer);
                    }
                });
            }
            
            showLobby();
            break;
            
        case 'playerJoined':
            console.log('Nuovo giocatore:', data.player);
            const remotePlayer = createRemotePlayer(data.player);
            remotePlayers.set(data.player.id, remotePlayer);
            updatePlayersListUI();
            break;
            
        case 'playerLeft':
            handlePlayerDisconnect(data.playerId);
            break;
            
        case 'playerUpdate':
            updateRemotePlayer(data);
            break;
            
        case 'playerReady':
            playersReady.set(data.playerId, true);
            updatePlayersListUI();
            checkAllReady();
            break;
            
        case 'gameStart':
            startMultiplayerGame();
            break;
            
        case 'error':
            alert(data.message);
            backToMenu();
            break;
    }
}

// Mostra la lobby
function showLobby() {
    document.getElementById('create-room-screen').style.display = 'none';
    document.getElementById('join-room-screen').style.display = 'none';
    document.getElementById('lobby-screen').style.display = 'block';
    document.getElementById('lobby-room-code').textContent = currentRoomCode;
    document.getElementById('my-color').textContent = myPlayerColor.name;
    document.getElementById('my-color').style.color = `hsl(${myPlayerColor.hsl[0]}, ${myPlayerColor.hsl[1]*100}%, ${myPlayerColor.hsl[2]*100}%)`;
    updatePlayersListUI();
}

// Aggiorna la lista giocatori
function updatePlayersListUI() {
    const playersList = document.getElementById('players-list');
    const playerCount = document.getElementById('player-count');
    if (!playersList) return;
    
    const totalPlayers = 1 + remotePlayers.size;
    playerCount.textContent = totalPlayers;
    
    let html = '';
    
    // Aggiungi te stesso
    const myReady = playersReady.get(myPlayerId) || false;
    html += `<div style="padding: 10px; margin: 5px 0; background: rgba(0, 255, 0, 0.2); border-radius: 5px;">
        <span style="color: hsl(${myPlayerColor.hsl[0]}, ${myPlayerColor.hsl[1]*100}%, ${myPlayerColor.hsl[2]*100}%);">★</span>
        Tu (${myPlayerColor.name}) ${isRoomHost ? '👑' : ''}
        ${myReady ? '<span style="color: #00ff00;">✓ PRONTO</span>' : '<span style="color: #ffff00;">In attesa...</span>'}
    </div>`;
    
    // Aggiungi gli altri giocatori
    remotePlayers.forEach((remotePlayer, playerId) => {
        const ready = playersReady.get(playerId) || false;
        html += `<div style="padding: 10px; margin: 5px 0; background: rgba(255, 255, 255, 0.1); border-radius: 5px;">
            <span style="color: hsl(${remotePlayer.color.hsl[0]}, ${remotePlayer.color.hsl[1]*100}%, ${remotePlayer.color.hsl[2]*100}%);">★</span>
            Giocatore (${remotePlayer.color.name})
            ${ready ? '<span style="color: #00ff00;">✓ PRONTO</span>' : '<span style="color: #ffff00;">In attesa...</span>'}
        </div>`;
    });
    
    playersList.innerHTML = html;
}

// Segna come pronto
function playerReady() {
    playersReady.set(myPlayerId, true);
    
    document.getElementById('ready-button').disabled = true;
    document.getElementById('ready-button').style.background = '#666';
    document.getElementById('ready-button').textContent = 'PRONTO ✓';
    document.getElementById('waiting-message').style.display = 'block';
    
    // Invia a tutti
    broadcast({ type: 'playerReady', playerId: myPlayerId });
    
    updatePlayersListUI();
    checkAllReady();
}

// Controlla se tutti sono pronti
function checkAllReady() {
    if (!isRoomHost) return;
    
    const totalPlayers = 1 + remotePlayers.size;
    if (totalPlayers < 2) return; // Serve almeno 2 giocatori
    
    let allReady = playersReady.get(myPlayerId) || false;
    remotePlayers.forEach((player, playerId) => {
        if (!playersReady.get(playerId)) allReady = false;
    });
    
    if (allReady) {
        console.log('Tutti pronti! Verifica timer...');
        
        // Se l'host non può ancora startare (timer non scaduto), mostra messaggio
        if (isRoomHost && !canHostStart && hostStartTimer) {
            document.getElementById('waiting-message').textContent = 
                'Tutti pronti! Puoi startare quando il timer scade...';
            document.getElementById('waiting-message').style.display = 'block';
            return;
        }
        
        // Altrimenti avvia automaticamente dopo 1 secondo
        console.log('Avvio automatico partita...');
        setTimeout(() => {
            stopHostTimer();
            broadcast({ type: 'gameStart' });
            startMultiplayerGame();
        }, 1000);
    }
}

// Avvia la partita multiplayer
function startMultiplayerGame() {
    console.log('Partita iniziata!');
    
    // L'host genera e condivide il seed della traccia
    if (isRoomHost) {
        trackSeed = Math.floor(Math.random() * 10000);
        console.log('Host ha generato seed traccia:', trackSeed);
        broadcast({ 
            type: 'trackSeed', 
            seed: trackSeed 
        });
    }
    
    closeMultiplayerUI();
    titleScreenMode = 0;
    gameStart();
    multiplayerEnabled = true;
    
    // Dopo l'avvio, crea i veicoli remoti e aggiungili all'array vehicles
    setTimeout(() => {
        remotePlayers.forEach((playerData, playerId) => {
            if (playerData.vehicle) {
                // Aggiungi il veicolo remoto alla lista dei veicoli per renderizzarlo e gestire collisioni
                if (!vehicles.includes(playerData.vehicle)) {
                    vehicles.push(playerData.vehicle);
                    console.log('Veicolo remoto aggiunto per collisioni:', playerId);
                }
            }
        });
    }, 100);
}

// Invia a tutti i giocatori
function broadcast(message) {
    if (isRoomHost) {
        connections.forEach(conn => {
            if (conn.open) {
                try {
                    conn.send(message);
                } catch(e) {
                    console.error('Errore invio messaggio:', e);
                }
            }
        });
    } else if (hostConnection && hostConnection.open) {
        try {
            hostConnection.send(message);
        } catch(e) {
            console.error('Errore invio messaggio a host:', e);
        }
    }
}

// Invia a tutti tranne uno
function broadcastToOthers(message, exceptId) {
    connections.forEach((conn, peerId) => {
        if (peerId !== exceptId && conn.open) {
            try {
                conn.send(message);
            } catch(e) {
                console.error('Errore invio messaggio:', e);
            }
        }
    });
}

// Ottieni lista giocatori
function getPlayersList() {
    const players = [{
        id: myPlayerId,
        color: myPlayerColor
    }];
    
    remotePlayers.forEach((player, id) => {
        players.push({
            id: id,
            color: player.color
        });
    });
    
    return players;
}

// Gestisce disconnessione giocatore
function handlePlayerDisconnect(playerId) {
    const remotePlayer = remotePlayers.get(playerId);
    if (remotePlayer && remotePlayer.vehicle) {
        remotePlayer.vehicle.destroyed = true;
    }
    remotePlayers.delete(playerId);
    playersReady.delete(playerId);
    connections.delete(playerId);
    updatePlayersListUI();
}

// Esci dalla stanza
function leaveRoom() {
    // Ferma il timer dell'host se attivo
    stopHostTimer();
    
    if (peer) {
        peer.destroy();
        peer = null;
    }
    
    connections.clear();
    remotePlayers.clear();
    playersReady.clear();
    currentRoomCode = null;
    myPlayerColor = null;
    isRoomHost = false;
    multiplayerEnabled = false;
    hostConnection = null;
    
    backToMenu();
}

// Crea un giocatore remoto
function createRemotePlayer(playerData) {
    const color = hsl(playerData.color.hsl[0], playerData.color.hsl[1], playerData.color.hsl[2]);
    const vehicle = new RemoteVehicle(playerData.pos ? playerData.pos.z : 2000, color);
    if (playerData.pos) {
        vehicle.pos.x = playerData.pos.x;
        vehicle.pos.y = playerData.pos.y;
    }
    
    return {
        id: playerData.id,
        color: playerData.color,
        vehicle: vehicle
    };
}

// Aggiorna giocatore remoto
function updateRemotePlayer(data) {
    const remotePlayer = remotePlayers.get(data.playerId);
    if (remotePlayer && remotePlayer.vehicle) {
        remotePlayer.vehicle.pos.x = data.pos.x;
        remotePlayer.vehicle.pos.y = data.pos.y;
        remotePlayer.vehicle.pos.z = data.pos.z;
        remotePlayer.vehicle.velocity.x = data.velocity.x;
        remotePlayer.vehicle.velocity.y = data.velocity.y;
        remotePlayer.vehicle.velocity.z = data.velocity.z;
        remotePlayer.vehicle.wheelTurn = data.wheelTurn;
        remotePlayer.vehicle.isBraking = data.isBraking;
    }
}

// Invia aggiornamento posizione (throttled per performance)
let lastUpdateTime = 0;
const updateInterval = 1000 / 20; // 20 aggiornamenti al secondo

function sendPositionUpdate() {
    if (!multiplayerEnabled || !playerVehicle) return;
    
    const now = Date.now();
    if (now - lastUpdateTime < updateInterval) return;
    lastUpdateTime = now;
    
    const message = {
        type: 'playerUpdate',
        playerId: myPlayerId,
        pos: {
            x: playerVehicle.pos.x,
            y: playerVehicle.pos.y,
            z: playerVehicle.pos.z
        },
        velocity: {
            x: playerVehicle.velocity.x,
            y: playerVehicle.velocity.y,
            z: playerVehicle.velocity.z
        },
        wheelTurn: playerVehicle.wheelTurn,
        isBraking: playerVehicle.isBraking
    };
    
    broadcast(message);
}

// Classe per i veicoli remoti
class RemoteVehicle extends Vehicle {
    constructor(z, color) {
        super(z, color);
        this.isRemote = true;
        // Imposta dimensioni collisione identiche ai veicoli normali
        this.collisionSize = vec3(230, 200, 380);
    }
    
    update() {
        // I veicoli remoti ricevono aggiornamenti via P2P
        const trackInfo = new TrackSegmentInfo(this.pos.z);
        this.pos.y = trackInfo.offset.y;
        
        // Mantieni l'angolatura delle ruote per il rendering
        if (this.velocity.z > 0) {
            this.wheelTurn = lerp(.1, this.wheelTurn, this.pos.x / 1000);
        }
    }
    
    // I veicoli remoti devono essere trattati come ostacoli fisici
    // Non sovrascriviamo altri metodi per mantenere la fisica delle collisioni
}

// Avvia il timer per l'host (1 minuto)
function startHostTimer() {
    if (!isRoomHost) return;
    
    console.log('Timer host avviato - 1 minuto prima dello start');
    hostStartTime = Date.now();
    canHostStart = false;
    
    const hostControls = document.getElementById('host-controls');
    const hostTimerEl = document.getElementById('host-timer');
    const hostStartBtn = document.getElementById('host-start-button');
    
    if (hostControls) hostControls.style.display = 'block';
    
    // Aggiorna il timer ogni secondo
    hostStartTimer = setInterval(() => {
        const elapsed = Date.now() - hostStartTime;
        const remaining = Math.max(0, 60000 - elapsed); // 60 secondi = 60000ms
        const seconds = Math.ceil(remaining / 1000);
        
        if (hostTimerEl) {
            if (seconds > 0) {
                hostTimerEl.textContent = `⏱️ Puoi startare tra: ${seconds}s`;
                hostTimerEl.style.color = '#ffaa00';
            } else {
                hostTimerEl.textContent = '✅ Puoi startare la partita!';
                hostTimerEl.style.color = '#00ff00';
                canHostStart = true;
                
                // Abilita il pulsante START
                if (hostStartBtn) {
                    hostStartBtn.disabled = false;
                    hostStartBtn.style.cursor = 'pointer';
                    hostStartBtn.style.background = 'linear-gradient(135deg, #ff8800, #ff4400)';
                    hostStartBtn.style.color = 'white';
                }
                
                // Ferma il timer
                clearInterval(hostStartTimer);
                hostStartTimer = null;
            }
        }
    }, 1000);
}

// Ferma il timer dell'host
function stopHostTimer() {
    if (hostStartTimer) {
        clearInterval(hostStartTimer);
        hostStartTimer = null;
    }
    canHostStart = false;
    hostStartTime = 0;
    
    const hostControls = document.getElementById('host-controls');
    if (hostControls) hostControls.style.display = 'none';
}

// L'host forza lo start della partita
function hostForceStart() {
    if (!isRoomHost) return;
    if (!canHostStart) {
        alert('Devi aspettare 1 minuto dall\'arrivo del secondo giocatore!');
        return;
    }
    
    // Verifica che ci siano almeno 2 giocatori
    const totalPlayers = 1 + remotePlayers.size;
    if (totalPlayers < 2) {
        alert('Servono almeno 2 giocatori per iniziare!');
        return;
    }
    
    console.log('Host ha avviato forzatamente la partita');
    
    // Ferma il timer
    stopHostTimer();
    
    // Invia il segnale di start a tutti
    broadcast({ type: 'gameStart' });
    
    // Avvia la partita
    startMultiplayerGame();
}

// Modifica la funzione checkAllReady per considerare il timer
function checkAllReadyWithTimer() {
    if (!isRoomHost) return;
    
    const totalPlayers = 1 + remotePlayers.size;
    if (totalPlayers < 2) return; // Serve almeno 2 giocatori
    
    let allReady = playersReady.get(myPlayerId) || false;
    remotePlayers.forEach((player, playerId) => {
        if (!playersReady.get(playerId)) allReady = false;
    });
    
    if (allReady) {
        console.log('Tutti pronti! Verifica timer...');
        
        // Se il timer non è ancora scaduto, aspetta
        if (!canHostStart && hostStartTimer) {
            document.getElementById('waiting-message').textContent = 
                'Tutti pronti! L\'host può startare tra poco...';
            document.getElementById('waiting-message').style.display = 'block';
            return;
        }
        
        // Altrimenti avvia direttamente
        setTimeout(() => {
            stopHostTimer();
            broadcast({ type: 'gameStart' });
            startMultiplayerGame();
        }, 1000);
    }
}
