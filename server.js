require('dotenv').config();

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const nodemailer = require('nodemailer');

const app = express();

const server = http.createServer(app);

const wss = new WebSocket.Server({ server });

// ==========================
// VARIABLES
// ==========================
let temperature = 0;

let humidity = 0;

let ledState = "OFF";

let lastSeen = 0;

let emailSent = false;

// ==========================
// EMAIL SETUP
// ==========================
const transporter =
nodemailer.createTransport({

    host: "smtp.gmail.com",

    port: 465,

    secure: true,

    auth: {

        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
    }
});

// ==========================
// VERIFY EMAIL
// ==========================
if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
    transporter.verify((err) => {
        if (err) {
            console.log("SMTP configuration error:", err.message);
        } else {
            console.log("Email service ready");
        }
    });
} else {
    console.log("Email alerts are not configured. Add credentials to a local .env file to enable them.");
}

// ==========================
// SEND EMAIL
// ==========================
function sendEmail(temp){
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD || !process.env.ALERT_EMAIL) {
        console.log("Email alert skipped: configure GMAIL_USER, GMAIL_APP_PASSWORD, and ALERT_EMAIL in .env");
        return;
    }

    console.log(
    "📧 Sending Email..."
    );

    transporter.sendMail({

        from:
        process.env.GMAIL_USER,

        to:
        process.env.ALERT_EMAIL,

        subject:
        "🔥 Temperature Alert",

        text:
        `Temperature exceeded threshold.

Current Temp: ${temp}°C`

    }, (err) => {

        if(err){

            console.log(
            "❌ EMAIL FAILED"
            );

            console.log(err);

        } else {

            console.log(
            "✅ EMAIL SENT"
            );
        }
    });
}

// ==========================
// WEBSOCKET CONNECTION
// ==========================
wss.on('connection', (ws) => {

    console.log(
    "✅ ESP32 / Client Connected"
    );

    ws.on('message', (message) => {

        try {

            const data =
            JSON.parse(message);

            // ==========================
            // SENSOR DATA
            // ==========================
            if(data.type === "sensor") {

                temperature =
                data.temp;

                humidity =
                data.hum;

                lastSeen =
                Date.now();

                console.log(
                `Temp: ${temperature}`
                );

                console.log(
                `Hum : ${humidity}`
                );

                // ==========================
                // EMAIL ALERT
                // ==========================
                if(
                    temperature >= 34
                    &&
                    !emailSent
                ){

                    console.log(
                    "🚨 ALERT TRIGGERED"
                    );

                    sendEmail(
                        temperature
                    );

                    emailSent = true;
                }

                // ==========================
                // RESET EMAIL FLAG
                // ==========================
                if(
                    temperature < 33
                ){

                    emailSent = false;
                }

                // ==========================
                // SEND LED STATE
                // ==========================
                ws.send(JSON.stringify({

                    led: ledState
                }));
            }

        } catch(err){

            console.log(
            "JSON ERROR"
            );

            console.log(err);
        }
    });

    ws.on('close', () => {

        console.log(
        " Client Disconnected"
        );
    });
});

// ==========================
// UI
// ==========================
app.get('/', (req, res) => {

res.send(`

<!DOCTYPE html>

<html>

<head>

<title>ESP32 WebSocket Dashboard</title>

<meta name="viewport"
content="width=device-width, initial-scale=1.0">

<style>

body{

    background:#0f172a;

    color:white;

    font-family:Arial;

    text-align:center;

    padding:20px;
}

.card{

    background:#1e293b;

    margin:20px auto;

    max-width:400px;

    padding:25px;

    border-radius:20px;
}

button{

    padding:15px 30px;

    margin:10px;

    border:none;

    border-radius:10px;

    color:white;

    font-size:18px;

    cursor:pointer;
}

.on{

    background:green;
}

.off{

    background:red;
}

#status{

    margin-top:20px;

    color:#22c55e;
}

</style>

</head>

<body>

<h1>ESP32 WebSocket Dashboard</h1>

<h2 id="status">

Disconnected

</h2>

<div class="card">

<h2>Sensor Data</h2>

<h3 id="temp">

Temp: --

</h3>

<h3 id="hum">

Hum: --

</h3>

</div>

<div class="card">

<h2>LED</h2>

<h3 id="led">

OFF

</h3>

<button class="on"
onclick="setLED('ON')">

ON

</button>

<button class="off"
onclick="setLED('OFF')">

OFF

</button>

</div>

<script>

async function fetchData(){

    const res =
    await fetch('/data');

    const d =
    await res.json();

    document.getElementById(
    'temp'
    ).innerText =
    "Temp: " + d.temp + " °C";

    document.getElementById(
    'hum'
    ).innerText =
    "Hum : " + d.hum + " %";

    document.getElementById(
    'led'
    ).innerText =
    d.led;

    document.getElementById(
    'status'
    ).innerText =
    d.connected
    ? "Connected"
    : "Disconnected";
}

setInterval(fetchData, 1000);

function setLED(x){

    fetch('/set?led=' + x);
}

</script>

</body>

</html>

`);
});

// ==========================
// LED CONTROL
// ==========================
app.get('/set', (req, res) => {

    ledState =
    req.query.led;

    console.log(
    "LED:",
    ledState
    );

    res.send("OK");
});

// ==========================
// LIVE DATA API
// ==========================
app.get('/data', (req, res) => {

    res.json({

        temp: temperature,

        hum: humidity,

        led: ledState,

        connected:
        (Date.now() - lastSeen)
        < 5000
    });
});

// ==========================
// START SERVER
// ==========================
server.listen(3000, '0.0.0.0', () => {

    console.log(
    "WebSocket Server Running"
    );

    console.log(
    "🌐 http://localhost:3000"
    );
});