const fs = require('fs')
const path = require('path')
const https = require('https')
const express=  require('express')
const cors = require('cors')
const session = require('express-session')
const WebSocket = require('ws')
const { WebSocketServer } = require('ws')
require('dotenv').config()

const app = express()

const sessionParser = session({
  saveUninitialized: false,
  secret: process.env.SECRET,
  resave: false
})

app.use(cors())
app.use(sessionParser)

// app.all('/', function(req, res, next) {
//   res.header("Access-Control-Allow-Origin", "*")
//   res.header("Access-Control-Allow-Headers", "X-Reqed-With")
//   next()
//  })

// * Partial implementation until Kade hookup
app.post('/login', (req, res) => {
  console.log(`IN /login`, )
  
  // const id = uuid.v4()
  // req.session.userId = id

  // TODO (prod) session reload to re-populate req.session
  const message = {
    type: 'SERVER_LOGGEDIN',
    payload: {
      sender: 'knet',
      body: `You logged in.`,
      time: new Date(),
      chatCounter: chatCounter++,
    }
  }
  // res.set("Access-Control-Allow-Origin", "https://192.168.1.200:3000")
  // res.set("Access-Control-Allow-Origin", "*")
  res.send(JSON.stringify(message))
})

// * Partial implementation until Kade hookup
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

    const message = {
      type: 'SERVER_LOGOUT',
      payload: {
        sender: 'knet',
        body: `You are logged out.`,
        time: new Date(),
        chatCounter: chatCounter++,
      }
    }
    res.send(JSON.stringify(message))
  })
})


// ***************************************************
// ** /EXPRESS
// ***************************************************

const server = https.createServer(
  {
    key: fs.readFileSync(path.resolve(__dirname, './.ssl/key.pem')),
    cert: fs.readFileSync(path.resolve(__dirname, './.ssl/cert.pem'))
  }, 
  app
)

const wss = new WebSocketServer({ noServer: true, clientTracking: true })

const sessionUsers = {}    // Dictionary, userId as key

// XPLOR json-server
let handleNamePool = [
  'pikachu',
  // 'bulbasaur',
  'miketyson',
  // 'stevejobs',
  // 'eddie',
  // 'guile',
  'ryu',
  // 'kaztheminotaur',
  // 'raistlyn',
  // 'woolymammoth',
  // 'barney',
  // 'schopenhauer',
  // 'vanhalen',
  // 'lylading',
  // 'scarface'
]

let chatCounter = 0;

// ?
server.on('upgrade', (req, socket, head) => {
  console.log(`IN server.on upgrade`, )
  
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
  if (handleNamePool.length === 0) {
    console.debug(`handleNamePool empty, broadcast room full`, )
    throw new Error(`ran out of assignable usernames aka room full, debugme`)
  } else {
    const handle = getNameFromPool()
    sessionUsers[req.session.id] = { ws, handle }
  
    console.log(`user connected(sess-id:${req.session.id}), connection count: (tmp hidden): `)
    
    // Send welcome message to user entering room
    const usersList = Object.values(sessionUsers).map(user => user.handle)

    const userWelcomeMessage = {
      type: "SERVER_WELCOME",
      payload: {
        sender: "room-general",
        time: new Date(),
        body: `====== Hi <em>${handle}</em>, welcome to kenny.net general chat ======`,
        handle,
        usersList,
        chatCounter: chatCounter++,
      }
    }
    ws.send(JSON.stringify(userWelcomeMessage))   
    
    // Broadcast entering user to clients
    const roomUserEntryMessage = {
      type: "SERVER_BROADCAST_ENTRY",
      payload: {
        sender: "room-general",
        time: new Date(),
        body: `<em>${handle}</em> entered the chat.`,
        handle,
        usersList,
        chatCounter: chatCounter++,
      }
    }
    broadcastMessage(roomUserEntryMessage, ws)

    ws.on('message', function (rawMessage) {
      let message = JSON.parse(rawMessage)
      // TODO handled by Message class, arg msg type
      switch (message.type) {
        case 'userSendChat':
          message.payload.sender = handle
          message.type = 'SERVER_BROADCAST_CHAT'
          message.payload.chatCounter = chatCounter++
          broadcastMessage(message)
          break
        default:
          console.log('Error: Unhandled message type:', message.type)
      }
    })
  }


  ws.on('close', function () {
    const roomUserLeft = {
      type: "SERVER_BROADCAST_LEAVE",
      payload: {
        sender: "room-general",
        time: new Date(),
        body: `<em>${sessionUsers[req.session.id].handle}</em> left the chat.`,
        chatCounter: chatCounter++,
      }
    }
    delete sessionUsers[req.session.id]
    roomUserLeft.payload.usersList = Object.values(sessionUsers).map(o => o.handle)
    broadcastMessage(roomUserLeft)
    console.log(`user ${req.session.id} Client disconnected, current connections(tmp hidden): `)
    // console.log(`${Object.keys(sessionUsers)}`)

    // UNSURE... ws stays in CLOSED readystate on client when DISCONNECT clicked
    // ws.terminate equiv to node socket.destroy()
    // ws.terminate()
  })

  function broadcastMessage(message, ws=null) {
    console.log(`Broadcasting message "${message.payload.body}" from sender ${message.payload.sender}`)
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

const HOST = process.env.HOST
const PORT = process.env.PORT
server.listen(PORT, HOST, () => {
  console.log(`listening on https://${HOST}:${PORT}`)
})

wss.on('listen', () => {
  console.log(`IN wss.on listen`, )
  // console.log(`listening on wss://${HOST}:${PORT}`)
})

function getNameFromPool() {
  return handleNamePool
    .splice(Math.floor(Math.random()*handleNamePool.length), 1)[0]
}