const express = require('express');
const multer = require('multer');
const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const { Boom } = require('@hapi/boom');
const uuid = require('uuid');
const bodyParser = require('body-parser');
const cors = require('cors');
const qrcode = require('qrcode');

const app = express();
const upload = multer({ dest: 'creds/' });
app.use(cors());
app.use(bodyParser.json());
app.use(express.static('public'));

let stopKey = '';
let intervalObj;
let sock; // store Baileys socket instance
let paired = false;

// Route to generate and return QR Code
app.get('/generate-qr', async (req, res) => {
    const { state, saveCreds } = await useMultiFileAuthState('./creds');
    sock = makeWASocket({
        auth: state,
        printQRInTerminal: false
    });

    sock.ev.on('connection.update', async (update) => {
        const { connection, qr } = update;
        if (qr) {
            const qrImage = await qrcode.toDataURL(qr);
            res.json({ qrImage });
        }
        if (connection === 'open') {
            paired = true;
            console.log('✅ Paired successfully');
        }
    });

    sock.ev.on('creds.update', saveCreds);
});

// Start messaging
app.post('/start', upload.single('creds'), async (req, res) => {
    const { number, message, interval } = req.body;
    stopKey = uuid.v4();

    // Use existing socket if paired
    if (!paired && req.file) {
        const credsPath = req.file.path;
        const { state, saveCreds } = await useMultiFileAuthState(credsPath);
        sock = makeWASocket({ auth: state });
        sock.ev.on('creds.update', saveCreds);
    }

    res.json({ success: true, stopKey });

    intervalObj = setInterval(async () => {
        try {
            await sock.sendMessage(`${number}@s.whatsapp.net`, { text: message });
            console.log(`✅ Message sent to ${number}`);
        } catch (err) {
            console.error('❌ Failed to send message', err);
        }
    }, interval * 1000);
});

// Stop sending
app.post('/stop', (req, res) => {
    const { key } = req.body;
    if (key === stopKey) {
        clearInterval(intervalObj);
        res.json({ success: true, msg: 'Stopped sending messages' });
    } else {
        res.status(403).json({ success: false, msg: 'Invalid stop key' });
    }
});

// Serve app
app.get('/', (req, res) => res.sendFile(__dirname + '/public/index.html'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
