# ESP32 Temperature & Humidity Dashboard

A Node.js/Express dashboard for monitoring temperature and humidity sent by an ESP32, controlling an LED, and optionally sending an email alert when the temperature reaches the configured threshold.

## Files

- `server.js` — WebSocket-based dashboard and optional email alerts (default start file).
- `server-http-dashboard.js` — HTTP/SSE-style dashboard version with `/update`, `/events`, and `/set` routes.
- `server-http-dashboard-archive.js` — Earlier HTTP dashboard version recovered from `humi.zip`.
- `package.json` and `package-lock.json` — Node.js dependencies.
- `.env.example` — Names of environment variables needed for optional email alerts. Copy this to `.env` and fill it locally; never commit `.env`.

## Requirements

- Node.js 18 or newer
- ESP32 firmware configured to send data using the protocol expected by the selected server version

## Run the default WebSocket server

1. Open a terminal in this folder.
2. Install dependencies:

   ```bash
   npm install
   ```

3. Start the server:

   ```bash
   npm start
   ```

4. Open `http://localhost:3000` in your browser.

The dashboard will show disconnected until an ESP32/client connects to the WebSocket server and sends sensor messages in the expected JSON format.

## Optional email alerts

The default `server.js` uses Gmail SMTP only when configured. Copy `.env.example` to `.env`, then set:

- `GMAIL_USER`
- `GMAIL_APP_PASSWORD`
- `ALERT_EMAIL`

Use a newly generated app password after revoking any credential that was previously hard-coded in the old source. `.env` is ignored by Git and must not be uploaded.

## Important protocol note

The uploaded files contain different server versions and therefore expect different ESP32 communication formats. Check your ESP32 sketch before selecting a server:

- `server.js` expects a WebSocket JSON message with `type: "sensor"`, `temp`, and `hum`.
- `server-http-dashboard.js` expects HTTP `POST /update` with JSON containing `temp` and `hum`.
- `server-http-dashboard-archive.js` is an older HTTP dashboard variant.

These files are preserved separately because the upload alone does not establish which version your ESP32 firmware currently uses.

## Push to GitHub

After placing this folder in your computer and opening it in VS Code:

```bash
git init
git add .
git commit -m "Add ESP32 monitoring dashboard"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.git
git push -u origin main
```

If you are adding these files to an existing repository, do not run `git init` or add a second remote blindly. First check `git status` and `git remote -v`, then commit and push the files from the existing repository.
