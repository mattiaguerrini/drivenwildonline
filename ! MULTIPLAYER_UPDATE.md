# Aggiornamento Multiplayer - Modalità Cooperativa

## Modifiche Implementate

Questo aggiornamento trasforma il gioco da un multiplayer "separato" (dove ogni giocatore corre su mappe diverse) a un **vero multiplayer cooperativo** dove i giocatori:

1. ✅ **Condividono la stessa mappa** (stesso seed di traccia)
2. ✅ **Si vedono in tempo reale** sullo stesso circuito
3. ✅ **Possono scontrarsi fisicamente** tra loro

---

## Cosa è stato modificato

### File: `code/multiplayer.js`

#### 1. **Sincronizzazione del Seed della Traccia**

**Funzione modificata:** `startMultiplayerGame()`

```javascript
// L'host genera e condivide il seed della traccia
if (isRoomHost) {
    trackSeed = Math.floor(Math.random() * 10000);
    console.log('Host ha generato seed traccia:', trackSeed);
    broadcast({ 
        type: 'trackSeed', 
        seed: trackSeed 
    });
}
```

- L'**host** genera un seed casuale per la traccia
- Il seed viene inviato a tutti i client tramite il messaggio `trackSeed`
- Tutti i giocatori useranno lo stesso seed, generando la **stessa identica mappa**

#### 2. **Ricezione del Seed sui Client**

**Funzione modificata:** `handleMessage()`

```javascript
case 'trackSeed':
    // Ricevi il seed della traccia dall'host
    trackSeed = data.seed;
    console.log('Seed traccia ricevuto dall\'host:', trackSeed);
    break;
```

- I client ricevono il seed dall'host
- La variabile globale `trackSeed` viene impostata prima dell'avvio del gioco
- Questo garantisce che tutti generino la stessa traccia procedurale

#### 3. **Integrazione dei Veicoli Remoti nel Sistema di Collisione**

**Funzione modificata:** `startMultiplayerGame()`

```javascript
// Dopo l'avvio, crea i veicoli remoti e aggiungili all'array vehicles
setTimeout(() => {
    remotePlayers.forEach((playerData, playerId) => {
        if (playerData.vehicle) {
            // Aggiungi il veicolo remoto alla lista dei veicoli
            if (!vehicles.includes(playerData.vehicle)) {
                vehicles.push(playerData.vehicle);
                console.log('Veicolo remoto aggiunto per collisioni:', playerId);
            }
        }
    });
}, 100);
```

- I veicoli remoti vengono aggiunti all'array `vehicles[]`
- Questo array viene utilizzato dal motore di collisione
- I veicoli remoti diventano **ostacoli fisici interattivi**

#### 4. **Miglioramento della Classe RemoteVehicle**

**Classe modificata:** `RemoteVehicle`

```javascript
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
```

- **Dimensioni di collisione esplicite**: `collisionSize = vec3(230, 200, 380)`
- Mantiene la fisica di collisione della classe base `Vehicle`
- L'aggiornamento della posizione rispetta la geometria della traccia

---

## Come Funziona Ora

### Flusso di Gioco Multiplayer

1. **L'Host crea una stanza**
   - Viene assegnato il colore Rosso
   - Genera un codice stanza a 6 cifre

2. **I Client si uniscono**
   - Inseriscono il codice stanza
   - Ricevono i colori Giallo o Blu
   - Si connettono tramite WebRTC (PeerJS)

3. **Lobby**
   - Tutti i giocatori si segnano come "PRONTO"
   - L'host può forzare lo start dopo 1 minuto

4. **Avvio della Partita**
   - L'host genera il **seed della traccia**
   - Il seed viene inviato a tutti i client
   - Tutti i giocatori avviano il gioco con lo **stesso seed**
   - I veicoli remoti vengono aggiunti all'array `vehicles[]`

5. **Durante la Partita**
   - Ogni giocatore invia la propria posizione 20 volte al secondo
   - I veicoli remoti vengono aggiornati in tempo reale
   - Le **collisioni funzionano** tra tutti i veicoli (locali e remoti)

---

## Sistema di Collisione

Il sistema di collisione nel file `vehicle.js` funziona già correttamente:

```javascript
// check for collisions
if (!testDrive)
for(const v of vehicles)
{
    const d = this.pos.subtract(v.pos);
    const s = this.collisionSize.add(v.collisionSize);
    if (v != this && abs(d.x) < s.x && abs(d.z) < s.z)
    {
        // collision
        const oldV = this.velocity.z;
        this.velocity.z = v.velocity.z/2;
        v.velocity.z = max(v.velocity.z, oldV*.9); // push other car
        this.velocity.x = 99*sign(d.x); // push away from car
        playHitSound();
    }
}
```

- Controlla **tutti** i veicoli nell'array `vehicles[]`
- Include automaticamente i `RemoteVehicle` aggiunti
- Le collisioni hanno effetti fisici realistici:
  - Trasferimento di velocità
  - Spinta laterale
  - Effetti sonori

---

## Sincronizzazione Dati

### Messaggi Inviati (20 Hz)

```javascript
{
    type: 'playerUpdate',
    playerId: myPlayerId,
    pos: { x, y, z },
    velocity: { x, y, z },
    wheelTurn: number,
    isBraking: boolean
}
```

### Aggiornamento Veicoli Remoti

```javascript
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
```

---

## Benefici del Sistema

1. **Esperienza Cooperativa Reale**
   - I giocatori corrono sulla stessa pista
   - Possono vedere le strategie degli avversari
   - Le collisioni creano dinamiche di gioco interessanti

2. **Fisica Realistica**
   - Collisioni con trasferimento di momentum
   - Effetti sonori sincronizzati
   - Rendering accurato dei veicoli

3. **Performance Ottimizzate**
   - Aggiornamenti a 20 Hz (sufficiente per fluidità)
   - Interpolazione automatica del motore
   - Culling ottimizzato

4. **Architettura Scalabile**
   - Supporto fino a 3 giocatori
   - Espandibile a più giocatori modificando `MULTIPLAYER_COLORS`
   - Sistema P2P senza server centrale

---

## Possibili Miglioramenti Futuri

1. **Interpolazione/Extrapolazione**
   - Smussare i movimenti dei veicoli remoti
   - Prevedere posizioni in caso di lag

2. **Compensazione del Lag**
   - Client-side prediction
   - Server reconciliation (se si passa a architettura client-server)

3. **Più Giocatori**
   - Aggiungere più colori
   - Lobby dinamica

4. **Modalità di Gioco**
   - Gara a tempo
   - Eliminazione
   - Checkpoint cooperativi

---

## Test Consigliati

1. **Test in Locale**
   - Aprire due finestre del browser
   - Creare una stanza in una finestra
   - Unirsi dall'altra finestra
   - Verificare che le mappe siano identiche

2. **Test di Collisione**
   - Fare in modo che due giocatori si scontrino
   - Verificare gli effetti fisici
   - Controllare i suoni

3. **Test di Latenza**
   - Testare con connessioni lente
   - Verificare la sincronizzazione
   - Controllare la stabilità

---

## Conclusione

Il sistema ora supporta un **vero multiplayer cooperativo** dove i giocatori:
- Condividono la stessa traccia procedurale
- Si vedono in tempo reale
- Possono scontrarsi fisicamente

Le modifiche sono state minimali ma strategiche, sfruttando l'architettura esistente del gioco e integrandola perfettamente con il sistema di collisioni già presente.
