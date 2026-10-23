const express = require('express');
const app = express();

app.use(express.json());

app.use(express.text());

// ===== VARIABLES =====
let ledState = "OFF";
let temperature = 0;
let humidity = 0;
let lastSeen = 0;

// ===== CONNECTION CHECK =====
function isESP32Connected() {
    return (Date.now() - lastSeen) < 7000; 
}

// ===== UI =====
app.get('/', (req, res) => {
    res.send(`
        <html>
        <head>
            <title>ESP32 Dashboard</title>
            <style>
                body { text-align:center; font-family:Arial; }
                button { padding:15px; margin:10px; }
                button:disabled { background:gray; }
            </style>
        </head>
        <body>

            <h1>ESP32 Dashboard</h1>
            <h2 id="status">Connecting...</h2>

            <h3 id="state">OFF</h3>
            <h3 id="temp">Temp: --</h3>
            <h3 id="hum">Hum: --</h3>

            <button id="onBtn" onclick="setLED('on')">ON</button>
            <button id="offBtn" onclick="setLED('off')">OFF</button>

            <script>
                const es = new EventSource('/events');

                es.onmessage = (e) => {
                    const d = JSON.parse(e.data);

                    document.getElementById('state').innerText = d.led;
                    document.getElementById('temp').innerText = "Temp: " + d.temp;
                    document.getElementById('hum').innerText = "Hum: " + d.hum;

                    document.getElementById('status').innerText =
                        d.connected ? "Connected" : "Disconnected";

                    onBtn.disabled = !d.connected;
                    offBtn.disabled = !d.connected;
                };

                function setLED(x) {
                    fetch('/set?led=' + x);
                }
            </script>

        </body>
        </html>
    `);
});

// ===== LED CONTROL =====
app.get('/set', (req, res) => {
    ledState = req.query.led === "on" ? "ON" : "OFF";
    console.log("LED:", ledState);
    res.send("OK");
});

// ===== ESP32 UPDATE =====
app.post('/update', (req, res) => {

    console.log("\n📡 ESP32 HIT /update");   // ✅ confirms request reached

    console.log("RAW BODY:", req.body);      // ✅ see actual data

    lastSeen = Date.now();

    const body = req.body;

    if (body && body.temp !== undefined && body.hum !== undefined) {

        temperature = body.temp;
        humidity = body.hum;

        console.log(`🌡️ Temp: ${temperature} °C`);
        console.log(`💧 Hum : ${humidity} %`);

    } else {
        console.log("❌ Data not in expected format");
    }

    res.json({ led: ledState });
});
// ===== EVENTS =====
app.get('/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const interval = setInterval(() => {

        const connected = isESP32Connected();

        res.write(`data: ${JSON.stringify({
            led: connected ? ledState : "OFF",
            temp: connected ? temperature : "--",
            hum: connected ? humidity : "--",
            connected: connected
        })}\n\n`);

    }, 1000); 

    req.on('close', () => clearInterval(interval));
});

// ===== START =====
app.listen(8082, '0.0.0.0', () => {
    console.log("Server running:");
    console.log("http://172.105.39.109:8082");
});