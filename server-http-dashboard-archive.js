const express = require('express');
const app = express();

// ===== MIDDLEWARE =====
app.use(express.json());
app.use(express.text());

// ===== VARIABLES =====
let ledState = "OFF";
let temperature = 0;
let humidity = 0;
let lastSeen = 0;

// ===== CONNECTION CHECK =====
function isESP32Connected() {
    return (Date.now() - lastSeen) < 10000;
}

// ===== UI =====
app.get('/', (req, res) => {
    res.send(`
        <html>
        <head>
            <title>ESP32 Control</title>
            <style>
                body {
                    font-family: Arial;
                    text-align: center;
                    background: #f5f5f5;
                }

                .container {
                    display: flex;
                    justify-content: center;
                    gap: 40px;
                    margin-top: 50px;
                }

                .box {
                    background: white;
                    padding: 30px;
                    border-radius: 15px;
                    box-shadow: 0 5px 15px rgba(0,0,0,0.2);
                    width: 250px;
                }

                h2 {
                    margin-bottom: 20px;
                }

                button {
                    padding: 10px 20px;
                    margin: 10px;
                    font-size: 16px;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                }

                .on {
                    background: green;
                    color: white;
                }

                .off {
                    background: red;
                    color: white;
                }
            </style>
        </head>

        <body>

            <h1>ESP32 Dashboard</h1>
            <h3 id="status">Status: Connecting...</h3>

            <div class="container">

                <!-- BOX 1: LED CONTROL -->
                <div class="box">
                    <h2>LED Control</h2>
                    <h3 id="state">OFF</h3>

                    <button class="on" onclick="setLED('on')">ON</button>
                    <button class="off" onclick="setLED('off')">OFF</button>
                </div>

                <!-- BOX 2: SENSOR DATA -->
                <div class="box">
                    <h2>DHT11 Sensor</h2>
                    <h3 id="temp">Temp: -- °C</h3>
                    <h3 id="hum">Hum: -- %</h3>
                </div>

            </div>

            <script>
                const es = new EventSource('/events');

                es.onmessage = (e) => {
                    const d = JSON.parse(e.data);

                    // LED
                    document.getElementById('state').innerText = d.led;

                    // Sensor
                    document.getElementById('temp').innerText =
                        "Temp: " + d.temp + " °C";

                    document.getElementById('hum').innerText =
                        "Hum: " + d.hum + " %";

                    // Status
                    document.getElementById('status').innerText =
                        d.connected ? "Status: Connected" : "Status: Disconnected";
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

// ===== ESP32 UPDATE (ROBUST PARSING) =====
app.post('/update', (req, res) => {
    lastSeen = Date.now();

    let body = req.body;

    try {
        if (typeof body === "string") {
            body = JSON.parse(body);
        }
    } catch (e) {
        console.log("JSON parse error:", body);
        return res.json({ led: ledState });
    }

    console.log("DATA RECEIVED:", body);

    if (body && body.temp !== undefined && body.hum !== undefined) {
        temperature = Number(body.temp);
        humidity = Number(body.hum);
    }

    console.log("UPDATED:", temperature , humidity);

    res.json({ led: ledState });
});

// ===== REAL-TIME EVENTS (SSE) =====
app.get('/events', (req, res) => {
    res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
    });

    console.log("Client connected");

    const interval = setInterval(() => {
        const data = {
            led: ledState,
            temp: temperature,
            hum: humidity,
            connected: true
        };


        res.write(`data: ${JSON.stringify(data)}\n\n`);
    }, 10000); // ✅ 10 seconds

    req.on('close', () => clearInterval(interval));
});

// ===== START SERVER =====
app.listen(5000, '0.0.0.0', () => {
    console.log("🚀 Server running at http://192.168.29.63:5000");
});