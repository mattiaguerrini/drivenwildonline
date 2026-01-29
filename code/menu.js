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

// Crea l'interfaccia del menu stile terminale Windows
function createMenuUI() {
    menuUI = document.createElement('div');
    menuUI.id = 'main-menu';
    menuUI.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: #000080;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        font-family: 'Consolas', 'Courier New', monospace;
    `;
    
    menuUI.innerHTML = `
        <div id="terminal-window" style="
            background: #000080;
            border: 4px solid #c0c0c0;
            box-shadow: 
                inset -2px -2px 0 #000000,
                inset 2px 2px 0 #ffffff,
                4px 4px 0 #000000;
            max-width: 800px;
            width: 90%;
            padding: 0;
        ">
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
                <span style="margin-right: 10px;">📁</span>
                <span>C:\\GAMES\\DR1V3N_CRAZY.EXE</span>
                <div style="margin-left: auto; display: flex; gap: 2px;">
                    <div style="background: #c0c0c0; color: #000; width: 16px; height: 14px; text-align: center; line-height: 14px; border: 1px solid #fff; font-size: 10px; cursor: pointer;">_</div>
                    <div style="background: #c0c0c0; color: #000; width: 16px; height: 14px; text-align: center; line-height: 14px; border: 1px solid #fff; font-size: 10px; cursor: pointer;">□</div>
                    <div style="background: #c0c0c0; color: #000; width: 16px; height: 14px; text-align: center; line-height: 14px; border: 1px solid #fff; font-size: 10px; cursor: pointer;">×</div>
                </div>
            </div>
            
            <!-- Contenuto terminale -->
            <div id="terminal-content" style="
                background: #000000;
                color: #c0c0c0;
                padding: 20px;
                font-size: 16px;
                min-height: 400px;
            ">
                <pre style="margin: 0; line-height: 1.4;">
Microsoft(R) MS-DOS(R) Version 6.22
        (C)Copyright Microsoft Corp 1981-1994.

C:\\GAMES\\DR1V3N_CRAZY&gt;dir

 Volume in drive C is GAMES
 Volume Serial Number is 1337-BEEF

 Directory of C:\\GAMES\\DR1V3N_CRAZY

DR1V3N   CRAZY   EXE    524,288  01-29-26  12:00a
README   TXT         1,024  01-29-26  12:00a
               2 file(s)        525,312 bytes
                             74,448,896 bytes free

C:\\GAMES\\DR1V3N_CRAZY&gt;type README.TXT

╔═══════════════════════════════════════════╗
║     DR1V3N CRAZY - ONLINE RACING         ║
║           Version 3.0                     ║
╚═══════════════════════════════════════════╝

Select game mode:
</pre>
                
                <!-- Menu buttons stile DOS -->
                <div id="main-menu-buttons" style="margin-top: 20px;">
                    <button onclick="startSoloMode()" style="
                        width: 100%;
                        padding: 15px;
                        margin: 10px 0;
                        font-family: 'Consolas', 'Courier New', monospace;
                        font-size: 18px;
                        font-weight: bold;
                        background: #c0c0c0;
                        border: 3px solid;
                        border-color: #ffffff #000000 #000000 #ffffff;
                        color: #000000;
                        cursor: pointer;
                        text-align: left;
                        transition: all 0.1s;
                    " onmouseover="this.style.background='#000080'; this.style.color='#ffffff';" 
                       onmouseout="this.style.background='#c0c0c0'; this.style.color='#000000';">
                        [1] SOLO MODE - Single Player Race
                    </button>
                    
                    <button onclick="startMultiplayerMode()" style="
                        width: 100%;
                        padding: 15px;
                        margin: 10px 0;
                        font-family: 'Consolas', 'Courier New', monospace;
                        font-size: 18px;
                        font-weight: bold;
                        background: #c0c0c0;
                        border: 3px solid;
                        border-color: #ffffff #000000 #000000 #ffffff;
                        color: #000000;
                        cursor: pointer;
                        text-align: left;
                        transition: all 0.1s;
                    " onmouseover="this.style.background='#000080'; this.style.color='#ffffff';" 
                       onmouseout="this.style.background='#c0c0c0'; this.style.color='#000000';">
                        [2] MULTIPLAYER - Online P2P Race
                    </button>
                </div>
                
                <pre style="margin-top: 20px; color: #808080; font-size: 14px;">
C:\\GAMES\\DR1V3N_CRAZY&gt;<span id="cursor" style="background: #c0c0c0; animation: blink 1s infinite;">_</span>
                </pre>
            </div>
        </div>
        
        <style>
            @keyframes blink {
                0%, 49% { opacity: 1; }
                50%, 100% { opacity: 0; }
            }
            
            @media (max-width: 768px) {
                #terminal-content { font-size: 12px !important; padding: 10px !important; }
                #terminal-content button { font-size: 14px !important; padding: 12px !important; }
                #terminal-window { border-width: 2px !important; }
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
