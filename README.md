# ESP32 Temperature & Humidity Dashboard

A Node.js and Express dashboard for monitoring temperature and humidity sent by an ESP32.

## Features
- Displays temperature and humidity readings.
- Provides a web dashboard.
- Supports LED control through an API.
- Supports optional email alerts when temperature reaches a configured threshold.

## Technologies Used
- ESP32
- Temperature and humidity sensor
- Node.js and Express
- JavaScript
- HTML and CSS

## Files
- `server.js` - WebSocket-based dashboard and optional email alerts.
- `server-http-dashboard.js` - HTTP/SSE dashboard version.
- `server-http-dashboard-archive.js` - Archived HTTP dashboard version.
- `package.json` - Project dependencies and start command.

## Setup
1. Install Node.js.
2. Open a terminal in this project folder.
3. Run `npm install`.
4. Configure environment variables using `.env.example`.
5. Run `npm start`.

## Author
Namana P Chowdri