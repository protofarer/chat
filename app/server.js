'use strict';
const fs = require('fs');
const path = require('path');
const https = require('https');
const express=  require('express');
const cors = require('cors');
const session = require('express-session');
const uuid = require('uuid');
const WebSocket = require('ws');
const { WebSocketServer } = require('ws');
require('dotenv').config();
// require('vite/modulepreload-polyfill');
const app = express();

app.use(cors());
// app.use(express.static(path.resolve(__dirname, '.')));

const sessionParser = session({
  saveUninitialized: false,
  secret: process.env.SECRET,
  resave: false
})
app.use(sessionParser);

app.post('/login', (req, res) => {
  const id = uuid.v4();
  console.log(`Setup session for user ${id})`);
  req.session.userId = id;
  // res.set('Access-Control-Allow-Origin', '*');
  res.send(JSON.stringify({ 
    result: 'OK', 
    type: 'system',
    sender: 'knet',
    body: `You logged in as user ${id}.`,
    time: new Date()
  }));
});



app.post('/logout', (req, res) => {
  const ws = sessionUsers[req.session.userId];
  console.log(`Destroying session for user ${req.session.userId }`);
  req.session.destroy(() => {
    if (ws) {
      ws.close();
    }
    res.send(JSON.stringify({ 
      result: 'OK', 
      type: 'system',
      sender: 'knet',
      body: `You are logged out.`,
      time: new Date(),
    }));
  });
});

const server = https.createServer(
  {
    key: fs.readFileSync(path.resolve(__dirname, '../key.pem')),
    cert: fs.readFileSync(path.resolve(__dirname, '../cert.pem'))
  }, 
  app
);
const wss = new WebSocketServer({ noServer: true, clientTracking: true });

// const sessionUsers = new Map();
const sessionUsers = {};    // Dictionary, userId as key
let handleNamePool = [
  'pikachu',
  'bulbasaur',
  'charmander',
  'mewtwo',
  'miketyson',
  'ghostofstevejobs',
  'kira',
  'eddie',
  'guile',
  'kaztheminotaur',
  'raistlyn',
  'woolymammoth',
  'barney',
  'ghostofschopenhauer',
  'ghostofvanhalen'
];

server.on('upgrade', (request, socket, head) => {
  console.log('Parsing session from request');
  sessionParser(request, {}, () => {
    if (!request.session.userId) {
      // console.log('apparent no userId..:', request)
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


wss.on('connection', function (ws, request, client) {
  // Upon connection right before client ws opens
  const userId = request.session.userId;
  const handle = handleNamePool.splice(Math.floor(Math.random()*handleNamePool.length),1)[0];
  sessionUsers[userId] = { ws, handle };

  console.log(`user ${handle} connected, current connections: `);
  console.log(Object.keys(sessionUsers));
  
  // Send welcome message to user entering room
  const userWelcomeMessage = {
    type: "system",
    sender: "room-general",
    time: new Date(),
    body: "======== Welcome to kenny.net general chat ========",
  };
  ws.send(JSON.stringify(userWelcomeMessage));   // this sends to clientws.onmessage
  
  // Broadcast entering user to clients
  // console.log(`Broadcasting user ${userId} entrance`);
  const userEntryMessage = {
    type: "system",
    sender: "room-general",
    time: new Date(),
    body: `${handle} entered the chat.`
  }
  broadcastMessage(userEntryMessage, ws);
  
  // TODO send msg to update usersList

  ws.on('message', function (rawMessage) {
    const message = JSON.parse(rawMessage);
    switch (message.type) {
      case 'userSendChat':
        message.sender = userId;
        console.log(`Broadcasting message "${message.body}" from user ${message.sender}`);  // TODO make this work
        broadcastMessage(message)
        break;
      default:
        console.log('Error: Unhandled message type:', message.type);
    }

    
  })

  ws.on('close', function () {
    const roomUserLeft = {
      type: "system",
      sender: "room-general",
      time: new Date(),
      body: `${handle} left the chat.`
    };
    broadcastMessage(roomUserLeft);

    // TODO send msg to update usersList
    delete sessionUsers[userId];
    console.log(`user ${userId} Client disconnected, current connections: `);
    console.log(`${Object.keys(sessionUsers)}`);
  })

  function broadcastMessage(message, ws=null) {
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN && client !== ws) {
        client.send(JSON.stringify(message));
      }
    })
  }
})

wss.on('close', function(event) {
  console.log('wss close:', event);
  // TODO find a way to broadcast server/room shutting down
})

const PORT = process.env.PORT;
const IP = '0.0.0.0';
server.listen(PORT, () => {
  console.log(`listening on https://${IP}:${PORT}`);
});

// WARN make this work
wss.on('listen', () => {
  console.log(`listening on wss://${IP}:${PORT}`);
})