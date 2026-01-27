'use strict';

// Variabili menu
let menuMode = 'main'; // main, solo, multiplayer
let isSoloMode = false;
let menuUI = null;

// Inizializza il menu
function initMenu() {
    createMenuUI();
    showMainMenu();
}

// Crea l'interfaccia del menu
function createMenuUI() {
    menuUI = document.createElement('div');
    menuUI.id = 'main-menu';
    menuUI.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: linear-gradient(135deg, #000000 0%, #1a0033 50%, #330066 100%);
        z-index: 9999;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        font-family: 'Arial Black', Arial, sans-serif;
    `;
    
    menuUI.innerHTML = `
        <div id="menu-content" style="text-align: center; max-width: 600px; width: 90%;">
            <!-- Logo -->
            <div id="game-logo" style="margin-bottom: 50px; animation: pulse 2s infinite;">
                <h1 style="
                    font-size: 4em;
                    margin: 0;
                    background: linear-gradient(45deg, #ff00ff, #00ffff, #ff00ff);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    text-shadow: 0 0 30px rgba(255, 0, 255, 0.5);
                    letter-spacing: 5px;
                ">DR1V3N</h1>
                <h2 style="
                    font-size: 3em;
                    margin: 10px 0 0 0;
                    background: linear-gradient(45deg, #00ffff, #ff00ff, #00ffff);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                    background-clip: text;
                    text-shadow: 0 0 30px rgba(0, 255, 255, 0.5);
                    letter-spacing: 5px;
                ">CRAZY</h2>
                <p style="
                    color: #aaaaaa;
                    font-size: 1.2em;
                    margin-top: 20px;
                    font-family: Arial, sans-serif;
                    font-weight: normal;
                ">Online Racing</p>
            </div>
            
            <!-- Menu principale -->
            <div id="main-menu-buttons" style="display: block;">
                <button onclick="startSoloMode()" class="menu-button" style="
                    width: 100%;
                    padding: 25px;
                    margin: 15px 0;
                    font-size: 2em;
                    font-weight: bold;
                    background: linear-gradient(135deg, #00ff88, #00aa55);
                    border: none;
                    border-radius: 15px;
                    color: white;
                    cursor: pointer;
                    box-shadow: 0 8px 20px rgba(0, 255, 136, 0.4);
                    transition: all 0.3s;
                    text-transform: uppercase;
                    letter-spacing: 3px;
                " onmouseover="this.style.transform='scale(1.05) translateY(-5px)'; this.style.boxShadow='0 12px 30px rgba(0, 255, 136, 0.6)';" 
                   onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 8px 20px rgba(0, 255, 136, 0.4)';">
                    🏁 SOLO
                </button>
                
                <button onclick="startMultiplayerMode()" class="menu-button" style="
                    width: 100%;
                    padding: 25px;
                    margin: 15px 0;
                    font-size: 2em;
                    font-weight: bold;
                    background: linear-gradient(135deg, #0088ff, #0055aa);
                    border: none;
                    border-radius: 15px;
                    color: white;
                    cursor: pointer;
                    box-shadow: 0 8px 20px rgba(0, 136, 255, 0.4);
                    transition: all 0.3s;
                    text-transform: uppercase;
                    letter-spacing: 3px;
                " onmouseover="this.style.transform='scale(1.05) translateY(-5px)'; this.style.boxShadow='0 12px 30px rgba(0, 136, 255, 0.6)';" 
                   onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='0 8px 20px rgba(0, 136, 255, 0.4)';">
                    🌐 MULTIPLAYER
                </button>
                
                <p style="
                    color: #888;
                    font-size: 0.9em;
                    margin-top: 30px;
                    font-family: Arial, sans-serif;
                    font-weight: normal;
                ">Scegli la tua modalità di gioco</p>
            </div>
        </div>
        
        <style>
            @keyframes pulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.05); }
            }
            
            @media (max-width: 768px) {
                #game-logo h1 { font-size: 2.5em !important; }
                #game-logo h2 { font-size: 2em !important; }
                .menu-button { font-size: 1.5em !important; padding: 20px !important; }
            }
        </style>
    `;
    
    document.body.appendChild(menuUI);
}

// Mostra il menu principale
function showMainMenu() {
    if (menuUI) {
        menuUI.style.display = 'flex';
        menuMode = 'main';
    }
}

// Nascondi il menu
function hideMenu() {
    if (menuUI) {
        menuUI.style.display = 'none';
    }
}

// Avvia modalità solo
function startSoloMode() {
    console.log('Modalità Solo avviata');
    isSoloMode = true;
    menuMode = 'solo';
    hideMenu();
    
    // Disabilita la schermata del titolo e avvia direttamente
    titleScreenMode = 0;
    gameStart();
}

// Avvia modalità multiplayer
function startMultiplayerMode() {
    console.log('Modalità Multiplayer avviata');
    isSoloMode = false;
    menuMode = 'multiplayer';
    hideMenu();
    
    // Mostra il menu multiplayer
    showMultiplayerMenu();
}

// Torna al menu principale
function returnToMainMenu() {
    // Resetta lo stato del gioco
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
    
    // Nascondi il menu multiplayer se aperto
    closeMultiplayerUI();
    
    // Mostra il menu principale
    showMainMenu();
    
    // Resetta anche la modalità titolo se necessario
    titleScreenMode = 1;
}
