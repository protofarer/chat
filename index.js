'use strict';
const session = require('express-session');
const express=  require('express');
const https = require('https');
const uuid = require('uuid');
const fs = require('fs');
require('dotenv').config();

const { WebSocketServer } = require('ws');
const WebSocket = require('ws');

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
  console.log(`Setup session for user ${id})`);
  req.session.userId = id;
  res.send({ result: 'OK', message: `${Date.now()} [knet] You are logged in as user ${id}.` });
});

app.post('/logout', (req, res) => {
  const ws = sessionUsers.get(req.session.userId);
  console.log(`Destroying session for user ${req.session.userId }`);
  req.session.destroy(() => {
    if (ws) {
      ws.close();
    }
    res.send({ result: 'OK', message: `${Date.now()} [knet] You are logged out.` });
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

server.on('upgrade', (request, socket, head) => {
  console.log('Parsing session from request');
  sessionParser(request, {}, () => {
    if (!request.session.userId) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
      socket.destroy();
      return;
    }
    console.log('Session parsed');

    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  });
});

wss.on('connection', function (ws, request) {
  // Upon connection
  const userId = request.session.userId;
  sessionUsers.set(userId, ws);

  console.log(`user ${userId} connected, current connections: `);
  console.dir(sessionUsers.keys());
  
  const message = {
    type: "system",
    sender: "[room-general]",
    time: Date.now(),
    body: "======== Welcome to kenny.net general chat ========",
  }
  ws.send(JSON.stringify(message));   // this sends to clientws.onmessage


  ws.on('message', function (message) {
    console.log(`Broadcasting message "${message}" from ${userId}`);
    // TODO make this work
  // TODO send msg to update usersList
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    })
  })

  ws.on('close', function () {
    // ws.send('You left the chat.');
    sessionUsers.delete(userId);
    console.log('Client disconnected, current connections: '); 
    console.log(`${sessionUsers.keys()}`);
  })  
})

wss.on('close', function(event) {
  console.log('wss close:', event);
  // TODO broadcast server/room shutting down
})

server.listen(PORT, () => {
  console.log(`listening on https://localhost:${PORT}`)
});