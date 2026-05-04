// Raspberry Pi bridge: HTTP (from the Lovable PWA) → Serial (to the ESP8266).
//
// The ESP8266 keeps its existing Arduino sketch unchanged. In its loop():
//
//   if (Serial.available()) {
//     String cmd = Serial.readStringUntil('\n');
//     handleCmd(cmd);
//   }
//
// So this server just forwards the {"cmd":"..."} body as a newline-terminated
// string on the USB serial port.
//
// Install on the Pi:
//   sudo apt install nodejs npm
//   cd pi-server && npm install
//   node server.js
//
// Then in the app's Settings, set the device URL to: http://<pi-ip>:3001

const express = require("express");
const cors = require("cors");
const { SerialPort } = require("serialport");

const PORT = process.env.PORT || 3001;
const SERIAL_PATH = process.env.SERIAL_PATH || "/dev/ttyUSB0"; // often /dev/ttyUSB0 or /dev/ttyACM0
const BAUD_RATE = Number(process.env.BAUD_RATE || 115200);

const app = express();
app.use(cors()); // allow the PWA from any origin
app.use(express.json());

// Open the serial link to the ESP8266
const port = new SerialPort({ path: SERIAL_PATH, baudRate: BAUD_RATE }, (err) => {
  if (err) {
    console.error(`[serial] failed to open ${SERIAL_PATH}:`, err.message);
  } else {
    console.log(`[serial] opened ${SERIAL_PATH} @ ${BAUD_RATE}`);
  }
});

port.on("data", (chunk) => {
  process.stdout.write(`[esp] ${chunk.toString()}`);
});

port.on("error", (err) => {
  console.error("[serial] error:", err.message);
});

function writeCommand(cmd) {
  return new Promise((resolve, reject) => {
    if (!port || !port.isOpen) return reject(new Error("Serial port not open"));
    port.write(cmd + "\n", (err) => (err ? reject(err) : resolve()));
  });
}

app.get("/ping", (_req, res) => {
  res.json({
    status: "online",
    serial: port.isOpen ? "open" : "closed",
    path: SERIAL_PATH,
    baud: BAUD_RATE,
  });
});

app.post("/command", async (req, res) => {
  const cmd = (req.body && req.body.cmd ? String(req.body.cmd) : "").trim();
  if (!cmd) return res.status(400).json({ error: "missing cmd" });

  try {
    await writeCommand(cmd);
    console.log(`[http→serial] ${cmd}`);
    res.json({ status: "ok", cmd });
  } catch (err) {
    console.error("[http→serial] failed:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`[http] listening on http://0.0.0.0:${PORT}`);
});
