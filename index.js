'use strict';
const session = require('express-session');
const express=  require('express');
const https = require('https');
const uuid = require('uuid');
require('dotenv')

const { WebSocketServer } = require('ws');

const app = express();
const map = new Map();

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
  console.log('Destroying session');
  request.session.destroy(() => {
    if (ws) ws.close();
    response.send({ result: 'OK', message: 'Session destroyed' });
  });
});

const wss = new WebSocketServer({ PORT });
console.log(`WSS listening on ${PORT}`)
// wss.handleUpgrade(request, socket, head, function (ws) {
//   wss.emit('connection', ws, request);
// });

wss.on('connection', function (ws, request) {
  ws.on('message', function (message) {
    console.log(`Received message: ${message}`);
  })

  ws.on('close', function () {
    console.log('Connection closed. Goodbye!');
  })  

  const message = {
    body: "Welcome to kenny.net chat",
    name: "kenny.net",
    time: Date.now(),
  }
  ws.send(JSON.stringify(message));
})

