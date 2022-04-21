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
  // Upon connection right before clientws.onopen
  const userId = request.session.userId;
  sessionUsers.set(userId, ws);

  console.log(`user ${userId} connected, current connections: `);
  console.log(sessionUsers.keys());
  
  // Send welcome message to user entering room
  const welcomeMessage = {
    type: "system",
    sender: "[room-general]",
    time: Date.now(),
    body: "======== Welcome to kenny.net general chat ========",
    userId,
  }
  ws.send(JSON.stringify(welcomeMessage));   // this sends to clientws.onmessage
  
  // Broadcast entering user to clients
  console.log(`Broadcasting user ${userId} entrance`);
  const userEntryMessage = {
    type: "system",
    sender: "[room-genera]l",
    time: Date.now(),
    body: `User ${userId} entered the chat.`
  }
  broadcastMessage(userEntryMessage, ws);
  // TODO send msg to update usersList


  ws.on('message', function (rawMessage) {
    const message = JSON.parse(rawMessage);
    // console.log(message)
    switch (message.type) {
      case 'userSendChat':
        message.sender = userId;
        console.log(`Broadcasting message "${message.body}" from user ${message.sender}`);  // TODO make this work
        broadcastMessage(message)
        break;
      case 'userLeaveChat':
        // Below doesn't work because ws is destroyed before client receives msg
        // So instead hackily let client generate a leaving chat room message in kind
        // const closeMessage = {
        //   type: "system",
        //   sender: "[room-general]",
        //   time: Date.now(),
        //   body: "======== You have left kenny.net general chat ========",
        //   userId,
        // }
        // console.log('sending closeMessage')
        // ws.send(JSON.stringify(closeMessage));
        message.body = `${userId} has left the chat.`;
        message.sender = "[room-general]";
        broadcastMessage(message);
        // TODO send msg to update usersList
        break;
      default:
        console.log('Error: Unhandled message type:', message.type);
    }

    ws.on('close', function () {
      sessionUsers.delete(userId);
      console.log(`user ${userId} Client disconnected, current connections: `); 
      console.log(`${sessionUsers.keys()}`);
    })

  })
  function broadcastMessage(message, ws=null) {
    // WARN the broadcast is not received by the client initiator
    // despite repo/ws docs stating otherwise, indeed providing
    // an example for excluding the client initiator from receiving broadcast
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN && client !== ws) {
        client.send(JSON.stringify(message));
      }
    })
  }
})

wss.on('close', function(event) {
  console.log('wss close:', event);
  // TODO broadcast server/room shutting down
})

const PORT = process.env.PORT;
const IP = '192.168.1.200';
server.listen(PORT, IP, () => {
  console.log(`listening on https://${IP}:${PORT}`);
});

// WARN make this work
wss.on('listen', () => {
  console.log(`listening on wss://${IP}:${PORT}`);
})