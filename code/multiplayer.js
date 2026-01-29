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

// Crea l'interfaccia UI stile terminale Windows
function createMultiplayerUI() {
    multiplayerUI = document.createElement('div');
    multiplayerUI.id = 'multiplayer-ui';
    multiplayerUI.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: #000080;
        padding: 0;
        border: 4px solid #c0c0c0;
        box-shadow: 
            inset -2px -2px 0 #000000,
            inset 2px 2px 0 #ffffff,
            4px 4px 0 #000000;
        font-family: 'Consolas', 'Courier New', monospace;
        z-index: 1000;
        display: none;
        min-width: 500px;
        max-width: 90%;
    `;
    
    multiplayerUI.innerHTML = `
        <!-- Barra titolo Windows -->
        <div style="
            background: linear-gradient(180deg, #000080 0%, #1084d0 100%);
            padding: 3px 5px;
            color: white;
            font-weight: bold;
            font-size: 14px;
            border-bottom: 2px solid #c0c0c0;
            display: flex;
            align-items: center;
        ">
            <span style="margin-right: 10px;">🌐</span>
            <span>MULTIPLAYER P2P - Connessioni Peer-to-Peer</span>
        </div>
        
        <!-- Contenuto -->
        <div style="background: #c0c0c0; padding: 20px;">
            <div id="menu-screen">
                <pre style="background: #000; color: #0f0; padding: 10px; margin-bottom: 15px; border: 2px inset #808080;">C:\\GAMES\\MULTIPLAYER&gt; SELECT MODE
                
[1] CREATE ROOM - Host a new game
[2] JOIN ROOM - Enter existing game
[3] CANCEL - Return to main menu</pre>
                <button onclick="showCreateRoom()" style="width: 100%; padding: 12px; margin: 8px 0; font-family: 'Consolas', monospace; font-size: 16px; background: #c0c0c0; border: 3px solid; border-color: #fff #000 #000 #fff; color: #000; cursor: pointer; font-weight: bold;" onmouseover="this.style.background='#000080'; this.style.color='#fff';" onmouseout="this.style.background='#c0c0c0'; this.style.color='#000';">
                    [1] CREA STANZA
                </button>
                <button onclick="showJoinRoom()" style="width: 100%; padding: 12px; margin: 8px 0; font-family: 'Consolas', monospace; font-size: 16px; background: #c0c0c0; border: 3px solid; border-color: #fff #000 #000 #fff; color: #000; cursor: pointer; font-weight: bold;" onmouseover="this.style.background='#000080'; this.style.color='#fff';" onmouseout="this.style.background='#c0c0c0'; this.style.color='#000';">
                    [2] ENTRA IN STANZA
                </button>
                <button onclick="closeMultiplayerUI()" style="width: 100%; padding: 12px; margin: 8px 0; font-family: 'Consolas', monospace; font-size: 16px; background: #c0c0c0; border: 3px solid; border-color: #fff #000 #000 #fff; color: #000; cursor: pointer; font-weight: bold;" onmouseover="this.style.background='#800000'; this.style.color='#fff';" onmouseout="this.style.background='#c0c0c0'; this.style.color='#000';">
                    [3] ANNULLA
                </button>
            </div>
            
            <div id="create-room-screen" style="display: none;">
                <pre style="background: #000; color: #0f0; padding: 10px; margin-bottom: 15px; border: 2px inset #808080;">C:\\GAMES\\MULTIPLAYER&gt; CREATE_ROOM.EXE</pre>
                <p id="connection-status" style="text-align: center; padding: 10px; background: #000; color: #ffff00; border: 2px inset #808080;">Connessione al server P2P...</p>
                <div id="create-room-status"></div>
            </div>
            
            <div id="join-room-screen" style="display: none;">
                <pre style="background: #000; color: #0f0; padding: 10px; margin-bottom: 15px; border: 2px inset #808080;">C:\\GAMES\\MULTIPLAYER&gt; JOIN_ROOM.EXE
                
Enter 6-digit room code:</pre>
                <input type="text" id="room-code-input" placeholder="000000" maxlength="6" 
                    style="width: 100%; padding: 15px; margin: 10px 0; font-size: 24px; text-align: center; border: 3px inset #808080; background: #fff; color: #000; font-family: 'Consolas', monospace; font-weight: bold;">
                <button onclick="joinRoom()" style="width: 100%; padding: 12px; margin: 8px 0; font-family: 'Consolas', monospace; font-size: 16px; background: #c0c0c0; border: 3px solid; border-color: #fff #000 #000 #fff; color: #000; cursor: pointer; font-weight: bold;" onmouseover="this.style.background='#008000'; this.style.color='#fff';" onmouseout="this.style.background='#c0c0c0'; this.style.color='#000';">
                    ENTRA
                </button>
                <button onclick="backToMenu()" style="width: 100%; padding: 12px; margin: 8px 0; font-family: 'Consolas', monospace; font-size: 16px; background: #c0c0c0; border: 3px solid; border-color: #fff #000 #000 #fff; color: #000; cursor: pointer; font-weight: bold;" onmouseover="this.style.background='#800000'; this.style.color='#fff';" onmouseout="this.style.background='#c0c0c0'; this.style.color='#000';">
                    INDIETRO
                </button>
                <div id="join-error" style="color: #ff0000; background: #ffff00; padding: 5px; text-align: center; margin-top: 10px; border: 2px solid #000; display: none;"></div>
                <p id="join-status" style="text-align: center; color: #000; margin-top: 10px; font-size: 12px;"></p>
            </div>
            
            <div id="lobby-screen" style="display: none;">
                <pre style="background: #000; color: #0f0; padding: 10px; margin-bottom: 15px; border: 2px inset #808080;">C:\\GAMES\\MULTIPLAYER&gt; LOBBY.EXE

ROOM CODE: <span id="lobby-room-code" style="color: #ffff00;"></span>
YOUR COLOR: <span id="my-color" style="font-weight: bold;"></span>

PLAYERS (<span id="player-count">0</span>/3):</pre>
                <div id="players-list" style="margin: 10px 0; padding: 10px; background: #000; color: #0f0; border: 2px inset #808080; max-height: 150px; overflow-y: auto; font-family: 'Consolas', monospace;"></div>
                
                <!-- Pulsante START per l'host -->
                <div id="host-controls" style="display: none; margin: 10px 0;">
                    <button id="host-start-button" onclick="hostForceStart()" style="width: 100%; padding: 15px; font-family: 'Consolas', monospace; font-size: 18px; background: #ffff00; border: 3px solid; border-color: #fff #000 #000 #fff; color: #000; cursor: pointer; font-weight: bold; animation: blink-button 1s infinite;" onmouseover="this.style.background='#ff0000'; this.style.color='#fff';" onmouseout="this.style.background='#ffff00'; this.style.color='#000';">
                        >>> START PARTITA <<<
                    </button>
                </div>
                
                <button id="ready-button" onclick="playerReady()" style="width: 100%; padding: 12px; margin: 8px 0; font-family: 'Consolas', monospace; font-size: 16px; background: #c0c0c0; border: 3px solid; border-color: #fff #000 #000 #fff; color: #000; cursor: pointer; font-weight: bold;" onmouseover="this.style.background='#008000'; this.style.color='#fff';" onmouseout="this.style.background='#c0c0c0'; this.style.color='#000';">
                    PRONTO
                </button>
                <button onclick="leaveRoom()" style="width: 100%; padding: 12px; margin: 8px 0; font-family: 'Consolas', monospace; font-size: 16px; background: #c0c0c0; border: 3px solid; border-color: #fff #000 #000 #fff; color: #000; cursor: pointer; font-weight: bold;" onmouseover="this.style.background='#800000'; this.style.color='#fff';" onmouseout="this.style.background='#c0c0c0'; this.style.color='#000';">
                    ESCI
                </button>
                <p id="waiting-message" style="text-align: center; background: #000; color: #ffff00; padding: 5px; border: 2px inset #808080; display: none; font-family: 'Consolas', monospace;">In attesa che tutti siano pronti...</p>
            </div>
        </div>
        
        <style>
            @keyframes blink-button {
                0%, 49% { background: #ffff00; }
                50%, 100% { background: #ff0000; color: #fff; }
            }
        </style>
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
        
        // Se è il secondo giocatore, mostra i controlli host
        if (remotePlayers.size === 1 && isRoomHost) {
            const hostControls = document.getElementById('host-controls');
            if (hostControls) hostControls.style.display = 'block';
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
        errorEl.textContent = '⚠ ERROR: Room code must be 6 digits';
        errorEl.style.display = 'block';
        return;
    }
    
    errorEl.textContent = '';
    errorEl.style.display = 'none';
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

// Aggiorna la lista giocatori stile terminale
function updatePlayersListUI() {
    const playersList = document.getElementById('players-list');
    const playerCount = document.getElementById('player-count');
    if (!playersList) return;
    
    const totalPlayers = 1 + remotePlayers.size;
    playerCount.textContent = totalPlayers;
    
    let html = '';
    
    // Aggiungi te stesso
    const myReady = playersReady.get(myPlayerId) || false;
    const myColorCode = myPlayerColor.name === 'Rosso' ? '#ff0000' : 
                        myPlayerColor.name === 'Giallo' ? '#ffff00' : '#0000ff';
    html += `<div style="margin: 2px 0; color: #0f0;">
        > <span style="color: ${myColorCode};">[${myPlayerColor.name.toUpperCase()}]</span> YOU ${isRoomHost ? '(HOST)' : '(CLIENT)'}
        ${myReady ? '  [READY]' : '  [WAITING...]'}
    </div>`;
    
    // Aggiungi gli altri giocatori
    remotePlayers.forEach((remotePlayer, playerId) => {
        const ready = playersReady.get(playerId) || false;
        const colorCode = remotePlayer.color.name === 'Rosso' ? '#ff0000' : 
                         remotePlayer.color.name === 'Giallo' ? '#ffff00' : '#0000ff';
        html += `<div style="margin: 2px 0; color: #0f0;">
            > <span style="color: ${colorCode};">[${remotePlayer.color.name.toUpperCase()}]</span> PLAYER (CLIENT)
            ${ready ? '  [READY]' : '  [WAITING...]'}
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
    
    // Applica il colore corretto al veicolo del giocatore
    setTimeout(() => {
        if (playerVehicle && myPlayerColor) {
            playerVehicle.color = hsl(myPlayerColor.hsl[0], myPlayerColor.hsl[1], myPlayerColor.hsl[2]);
            console.log('Colore applicato al player:', myPlayerColor.name);
        }
        
        // Crea i veicoli remoti e aggiungili all'array vehicles
        remotePlayers.forEach((playerData, playerId) => {
            if (playerData.vehicle) {
                // Aggiungi il veicolo remoto alla lista dei veicoli per renderizzarlo e gestire collisioni
                if (!vehicles.includes(playerData.vehicle)) {
                    vehicles.push(playerData.vehicle);
                    console.log('Veicolo remoto aggiunto:', playerId, 'Colore:', playerData.color.name);
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

// Aggiorna giocatore remoto con il nuovo sistema
function updateRemotePlayer(data) {
    const remotePlayer = remotePlayers.get(data.playerId);
    if (remotePlayer && remotePlayer.vehicle) {
        remotePlayer.vehicle.updateTarget(data);
    }
}

// Invia aggiornamento posizione con alta frequenza e timestamp
let lastUpdateTime = 0;
const updateInterval = 1000 / 60; // 60 aggiornamenti al secondo per massima fluidità

function sendPositionUpdate() {
    if (!multiplayerEnabled || !playerVehicle) return;
    
    const now = Date.now();
    if (now - lastUpdateTime < updateInterval) return;
    lastUpdateTime = now;
    
    const message = {
        type: 'playerUpdate',
        playerId: myPlayerId,
        timestamp: now,
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

// Classe per i veicoli remoti con interpolazione smooth e predizione
class RemoteVehicle extends Vehicle {
    constructor(z, color) {
        super(z, color);
        this.isRemote = true;
        this.collisionSize = vec3(230, 200, 380);
        
        // Sistema di interpolazione avanzato
        this.targetPos = vec3(0, 0, z);
        this.targetVelocity = vec3(0, 0, 0);
        this.lastUpdateTime = Date.now();
        this.interpolationFactor = 0.35; // Valore ottimale per fluidità
        
        // Buffer per smooth rendering
        this.positionHistory = [];
        this.maxHistorySize = 5;
        
        // Latency tracking
        this.latency = 0;
        this.latencySmoothing = 0.9;
    }
    
    updateTarget(data) {
        // Aggiorna posizione target
        this.targetPos.x = data.pos.x;
        this.targetPos.y = data.pos.y;
        this.targetPos.z = data.pos.z;
        this.targetVelocity.x = data.velocity.x;
        this.targetVelocity.y = data.velocity.y;
        this.targetVelocity.z = data.velocity.z;
        this.wheelTurn = data.wheelTurn;
        this.isBraking = data.isBraking;
        
        // Calcola latenza smooth
        if (data.timestamp) {
            const currentLatency = Date.now() - data.timestamp;
            this.latency = this.latency * this.latencySmoothing + currentLatency * (1 - this.latencySmoothing);
        }
        
        // Aggiungi al buffer storico
        this.positionHistory.push({
            pos: this.targetPos.copy(),
            velocity: this.targetVelocity.copy(),
            time: Date.now()
        });
        
        if (this.positionHistory.length > this.maxHistorySize) {
            this.positionHistory.shift();
        }
        
        this.lastUpdateTime = Date.now();
    }
    
    update() {
        // Calcola predizione basata su latenza
        const latencySeconds = Math.min(this.latency, 200) / 1000; // Cap a 200ms
        const predictedX = this.targetPos.x + (this.targetVelocity.x * latencySeconds);
        const predictedZ = this.targetPos.z + (this.targetVelocity.z * latencySeconds);
        
        // Interpolazione smooth verso posizione predetta
        const factor = this.interpolationFactor;
        this.pos.x = lerp(factor, this.pos.x, predictedX);
        this.pos.z = lerp(factor, this.pos.z, predictedZ);
        
        // Interpola anche la velocità per rendering più naturale
        this.velocity.x = lerp(factor, this.velocity.x, this.targetVelocity.x);
        this.velocity.y = lerp(factor, this.velocity.y, this.targetVelocity.y);
        this.velocity.z = lerp(factor, this.velocity.z, this.targetVelocity.z);
        
        // Aggiorna Y basandosi sulla traccia
        const trackInfo = new TrackSegmentInfo(this.pos.z);
        this.pos.y = trackInfo.offset.y;
        
        // Smooth wheel turn per animazione realistica
        if (this.velocity.z > 0) {
            const targetWheelTurn = this.pos.x / 1000;
            this.wheelTurn = lerp(0.2, this.wheelTurn, targetWheelTurn);
        }
        
        // Extrapolazione intelligente se non riceviamo update
        const timeSinceUpdate = Date.now() - this.lastUpdateTime;
        if (timeSinceUpdate > 100 && timeSinceUpdate < 500) {
            // Continua il movimento previsto
            this.pos.x += this.targetVelocity.x * 0.01;
            this.pos.z += this.targetVelocity.z * 0.01;
        }
    }
}

// L'host avvia la partita (senza timer)
function hostForceStart() {
    if (!isRoomHost) return;
    
    // Verifica che ci siano almeno 2 giocatori
    const totalPlayers = 1 + remotePlayers.size;
    if (totalPlayers < 2) {
        alert('Servono almeno 2 giocatori per iniziare!');
        return;
    }
    
    console.log('Host ha avviato la partita');
    
    // Invia il segnale di start a tutti
    broadcast({ type: 'gameStart' });
    
    // Avvia la partita
    startMultiplayerGame();
}

// Controlla se tutti sono pronti
function checkAllReady() {
    if (!isRoomHost) return;
    
    const totalPlayers = 1 + remotePlayers.size;
    if (totalPlayers < 2) return;
    
    let allReady = playersReady.get(myPlayerId) || false;
    remotePlayers.forEach((player, playerId) => {
        if (!playersReady.get(playerId)) allReady = false;
    });
    
    if (allReady) {
        console.log('Tutti pronti! Avvio automatico...');
        setTimeout(() => {
            broadcast({ type: 'gameStart' });
            startMultiplayerGame();
        }, 1000);
    }
}
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
