'use strict'
const fs = require('fs')
const path = require('path')
const https = require('https')
const express=  require('express')
const cors = require('cors')
const session = require('express-session')
const WebSocket = require('ws')
const { WebSocketServer } = require('ws')
require('dotenv').config()

// ***************************************************
//                    EXPRESS
// ***************************************************

const app = express()

const sessionParser = session({
  saveUninitialized: false,
  secret: process.env.SECRET,
  resave: false
})

// app.use(cors())
app.use(express.static(path.resolve(__dirname, '.')))
app.use(sessionParser)

// app.all('/', function(req, res, next) {
//   res.header("Access-Control-Allow-Origin", "*")
//   res.header("Access-Control-Allow-Headers", "X-Reqed-With")
//   next()
//  })

app.post('/login', (req, res) => {
  // ********* DEV *********
  // const id = uuid.v4()
  // req.session.userId = id
  // ***********************

  // PROD_TODO session reload to re-populate req.session
  const message = {
    type: 'SERVER_LOGIN',
    payload: {
      sender: 'knet',
      body: `You logged in.`,
      time: new Date()
    }
  }
  res.send(JSON.stringify(message))
})

app.post('/logout', (req, res) => {
  const ws = sessionUsers[req.session.id]?.ws
  console.log(`(IN /logout Destroying session for user ${req.session.id}`)
  req.session.destroy(function () {

    // This block I assume to cover the case when disconnect is skipped
    // CSDR delete from sessionUsers
    if (ws) {
      // CSDR is delete handled by the ws.onclose block?
      delete sessionUsers[req.session.id]
      ws.close()
    }

    res.send(JSON.stringify({ 
      type: 'system',
      payload: {
        sender: 'knet',
        body: `You are logged out.`,
        time: new Date(),
      }
    }))
  })
})


// ***************************************************
// ** /EXPRESS
// ***************************************************

const server = https.createServer(
  {
    key: fs.readFileSync(path.resolve(__dirname, '../.ssl/key.pem')),
    cert: fs.readFileSync(path.resolve(__dirname, '../.ssl/cert.pem'))
  }, 
  app
)

const wss = new WebSocketServer({ noServer: true, clientTracking: true })

const sessionUsers = {}    // Dictionary, userId as key

// XPLOR json-server
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
]

server.on('upgrade', (req, socket, head) => {
  console.log('Parsing session from req')

  sessionParser(req, {}, () => {
    if (!req.session.id) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n')
      socket.destroy()
      return
    }

    console.log('Session parsed:')

    wss.handleUpgrade(req, socket, head, function (ws) {
      wss.emit('connection', ws, req)
    })
  })
})


wss.on('connection', function (ws, req, client) {
  // Upon connection right before client ws opens
  const userHandle = handleNamePool
    .splice(Math.floor(Math.random()*handleNamePool.length), 1)[0]
  sessionUsers[req.session.id] = { ws, userHandle }

  console.log(`user ${req.session.id} connected, current connections (tmp hide dev): `)
  // console.log(Object.keys(sessionUsers))
  
  // Send welcome message to user entering room
  const userWelcomeMessage = {
    type: "SERVER_WELCOME",
    payload: {
      sender: "room-general",
      time: new Date(),
      body: "======== Welcome to kenny.net general chat ========",
      userHandle,
    }
  }
  ws.send(JSON.stringify(userWelcomeMessage))   
  
  // Broadcast entering user to clients
  // console.log(`Broadcasting user ${userId} entrance`)
  const roomUserEntryMessage = {
    type: "SERVER_BROADCAST_ENTRY",
    payload: {
      sender: "room-general",
      time: new Date(),
      body: `${userHandle} entered the chat.`
    }
  }
  broadcastMessage(roomUserEntryMessage, ws)
  
  // TODO send msg to update usersList

  ws.on('message', function (rawMessage) {
    const message = JSON.parse(rawMessage)
    switch (message.type) {
      case 'userSendChat':
        message.sender = userHandle
        message.type = 'SERVER_BROADCAST_CHAT'
        broadcastMessage(message)
        break
      default:
        console.log('Error: Unhandled message type:', message.type)
    }
  })

  ws.on('close', function (close) {
    console.debug('closeEvent', close)
    // console.debug('closeReason', closeReason)
    const roomUserLeft = {
      type: "system",
      sender: "room-general",
      time: new Date(),
      body: `${userHandle} left the chat.`
    }
    broadcastMessage(roomUserLeft)

    // TODO send msg to update usersList
    delete sessionUsers[req.session.id]
    console.log(`user ${req.session.id} Client disconnected, current connections(tmp hide dev): `)
    // console.log(`${Object.keys(sessionUsers)}`)
    // UNSURE... ws stays in CLOSED readystate on client when DISCONNECT clicked
    // ws.termiante equiv to node socket.destroy()
    // ws.terminate()
  })

  function broadcastMessage(message, ws=null) {
    console.log(`Broadcasting message "${message.body}" from user ${message.sender}`)  // TODO make this work
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN && client !== ws) {
        client.send(JSON.stringify(message))
      }
    })
  }
})

wss.on('close', function(event) {
  console.log('wss close:', event)
  // TODO find a way to broadcast server/room shutting down
})

wss.on('error', (event) => {
  console.log('WSS errored: ', event)
})

const HOSTA = 'localhost'
const HOSTB = '0.0.0.0'
const HOSTC = '192.168.1.200'
const PORT = process.env.PORT
const HOST = process.env.EXPRESS_HTTPS_HOST

server.listen(PORT, HOST, () => {
  console.log(`listening on https://${HOST}:${PORT}`)
})

// WARN make this work
wss.on('listen', () => {
  // console.log(`listening on wss://${HOST}:${PORT}`)
})