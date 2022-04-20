'use strict';
const session = require('express-session');
const express=  require('express');
const https = require('https');
const uuid = require('uuid');
const fs = require('fs');
require('dotenv').config();

const { WebSocketServer } = require('ws');

const app = express();
const sessionUsers = new Map();

const PORT = process.env.PORT;

const sessionParser = session({
  saveUninitialized: false,
  secret: process.env.SECRET,
  resave: false
})

app.use(express.static('public'));
app.use(sessionParser);

app.post('/login', (req, res) => {
  const id = uuid.v4();
  console.log(`Updating session for user $(id})`);
  req.session.userId = id;
  res.send({ result: 'OK', message: 'Session updated' });
});

app.delete('/logout', (req, res) => {
  const ws = map.get(request.session.userId);
  console.log(`Destroying session for user id: ${request.session.userId }`);
  request.session.destroy(() => {
    if (ws) ws.close();
    response.send({ result: 'OK', message: 'Session destroyed' });
  });
});

const server = https.createServer(
  {
    key: fs.readFileSync('key.pem'),
    cert: fs.readFileSync('cert.pem')
  }, 
  app
);

const wss = new WebSocketServer({ noServer: true, clientTracking: true });

// wss.handleUpgrade(request, socket, head, function (ws) {
//   wss.emit('connection', ws, request);
// });

wss.on('connection', function (ws, request) {
  // Upon connection
  const userId = request.session.userId;
  sessionUsers.set(userId, ws);

  console.log(`user ${userId} connected, current connections: `);
  console.table(wss.clients);
  
  const message = {
    body: "Welcome to kenny.net chat",
    name: "kenny.net",
    time: Date.now(),
  }
  ws.send(JSON.stringify(message));

  ws.on('message', function (message) {
    console.log(`Received message: ${message} from ${userId}`);
  })

  ws.on('close', function () {
    sessionUsers.delete(userId);
    console.log('Client disconnected, current connections: '); 
    console.table(wss.clients);
  })  

})

server.listen(PORT, () => {
  console.log(`listening on https://localhost:${PORT}`)
});