# Raspberry Pi bridge (HTTP → Serial → ESP8266)

This little Node.js server runs on the Raspberry Pi. It receives commands from
the phone app over HTTP and writes them to the USB serial port that is wired
to the ESP8266. The Arduino sketch on the ESP8266 reads each line from
`Serial` and emits the matching IR code — so **you don't change the Arduino
code at all**.

```
[ Phone PWA ] --HTTP--> [ Raspberry Pi : 3001 ] --USB Serial--> [ ESP8266 ] --IR--> [ TV ]
```

## 1. Wire it up

- Plug the ESP8266 into the Pi with a USB cable.
- Find the device path:
  ```bash
  ls /dev/ttyUSB* /dev/ttyACM* 2>/dev/null
  ```
  It will usually be `/dev/ttyUSB0` (CH340 / CP2102 boards) or `/dev/ttyACM0`.
- Make sure your user can access it:
  ```bash
  sudo usermod -aG dialout $USER
  # then log out and back in
  ```

## 2. Install & run

```bash
cd pi-server
npm install
node server.js
```

Override defaults with environment variables if needed:

```bash
SERIAL_PATH=/dev/ttyACM0 BAUD_RATE=115200 PORT=3001 node server.js
```

You should see:

```
[serial] opened /dev/ttyUSB0 @ 115200
[http] listening on http://0.0.0.0:3001
```

## 3. Run on boot (optional)

Create `/etc/systemd/system/smarthome-bridge.service`:

```ini
[Unit]
Description=Smart Home Pi Bridge
After=network.target

[Service]
ExecStart=/usr/bin/node /home/pi/pi-server/server.js
WorkingDirectory=/home/pi/pi-server
Restart=always
User=pi
Environment=SERIAL_PATH=/dev/ttyUSB0
Environment=BAUD_RATE=115200
Environment=PORT=3001

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable --now smarthome-bridge
```

## 4. Point the app at the Pi

Find the Pi's local IP:

```bash
hostname -I
```

In the app, open **Settings** and set the device URL to e.g.
`http://192.168.1.42:3001`, then tap **Save**. The status indicator should
turn green.

## API

- `GET  /ping`  → `{ "status": "online", "serial": "open", ... }`
- `POST /command` body `{ "cmd": "v+" }` → forwards `v+\n` on the serial port.

The ESP8266 sketch already handles every supported command (`p`, `v+`, `v-`,
`c+`, `c-`, `up`, `ok`, `netflix`, `hdmi1`, …).
