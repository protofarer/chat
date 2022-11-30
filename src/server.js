'use strict'    // needed?
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import https from 'https'
import express from 'express'
import cors from 'cors'
import session from 'express-session'
import WebSocket from 'ws'
import { WebSocketServer } from 'ws'
import DOMPurify from 'dompurify'
import { JSDOM } from 'jsdom'

// TODO dev only, direct import; prod build step copies app/modules/Constants.js to server prod dir
import Constants from './client/modules/Constants.js'

import dotenv from 'dotenv'
dotenv.config()
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
    type: Constants.server.LOGGEDIN.word,
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
      type: Constants.server.LOGGEDOUT.word,
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

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const server = https.createServer(
  {
    key: fs.readFileSync(path.resolve(__dirname, './../.ssl/key.pem')),
    cert: fs.readFileSync(path.resolve(__dirname, './../.ssl/cert.pem'))
  }, 
  app
)

const wss = new WebSocketServer({ noServer: true, clientTracking: true })
const sessionUsers = {}    // Dictionary, userId as key
// XPLOR json-server
let chatCounter = 0
const generateHandle = HandleAssigner()

server.on('upgrade', (req, socket, head) => {
  console.log(`IN server.on upgrade`, )
  sessionParser(req, {}, () => {
    console.log('Parsing session from req')
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
    const handle = generateHandle()
    sessionUsers[req.session.id] = { ws, handle }
  
    console.log(`user connected(sess-id:${req.session.id}), connection count: (tmp hidden): `)
    const usersList = Object.values(sessionUsers).map(o => o.handle)
    
    // Send welcome message to user entering room
    const userWelcomeMessage = {
      type: Constants.server.UNICAST_WELCOME.word,
      payload: {
        sender: "room-general",
        time: new Date(),
        body: Constants.server.UNICAST_WELCOME.text`${handle}`,
        usersList,
        chatCounter: chatCounter++,
      }
    }
    ws.send(JSON.stringify(userWelcomeMessage))   

    // Broadcast entering user to clients
    const roomUserEntryMessage = {
      type: Constants.server.BROADCAST_ENTRY.word,
      payload: {
        sender: "room-general",
        time: new Date(),
        body: Constants.server.BROADCAST_ENTRY.text`${handle}`,
        handle,
        chatCounter: chatCounter++,
      }
    }
    broadcastMessage(roomUserEntryMessage, ws)

    ws.on('message', function (rawMessage) {
      let message = JSON.parse(rawMessage)
      switch (message.type) {
        case Constants.client.SEND_CHAT.word:
          message.payload.sender = handle
          message.type = Constants.server.BROADCAST_CHAT.word
          message.payload.chatCounter = chatCounter++
          broadcastMessage(message)
          break
        default:
          console.log('Error: Unhandled message type:', message.type)
      }
    })

  ws.on('close', function () {
    const handle = sessionUsers[req.session.id].handle
    const roomUserLeft = {
      type: Constants.server.BROADCAST_LEAVE.word,
      payload: {
        sender: "room-general",
        time: new Date(),
        body: Constants.server.BROADCAST_LEAVE.text`${sessionUsers[req.session.id].handle}`,
        handle,
        chatCounter: chatCounter++,
      }
    }
    delete sessionUsers[req.session.id]
    broadcastMessage(roomUserLeft)
    console.log(`user ${req.session.id} Client disconnected, current connections(tmp hidden): `)
    // console.log(`${Object.keys(sessionUsers)}`)

    // UNSURE... ws stays in CLOSED readystate on client when DISCONNECT clicked
    // ws.terminate equiv to node socket.destroy()
    // ws.terminate()
  })

  function broadcastMessage(message, ws=null) {
    const dirtyBody = message.payload.body
    const window = new JSDOM('').window;
    // @ts-expect-error window type is mistaken for DOMWindow when it's really Window
    const purify = DOMPurify(window);
    const cleanBody = purify.sanitize(dirtyBody);

    console.log(`Broadcasting message "${cleanBody}" from sender ${message.payload.sender}`)
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
  console.log(`listening on https://${HOST}:${PORT} in ${app.get("env")} mode`)
})

wss.on('listen', () => {
  console.log(`IN wss.on listen`, )
})

function HandleAssigner() {
  let currentFreq = 0
  let freeHandles = new Array(...Constants.server.HANDLE_POOL) // aka list of handles that share lowest frequency
  return () => {
    // get array of lowest freq base used handles, then randomly pick among
    if (freeHandles.length === 0) {
      currentFreq++
      freeHandles = Constants.server.HANDLE_POOL.map(x => `${x}(${currentFreq})`)
    }
    return freeHandles
      .splice(Math.floor(Math.random()*freeHandles.length), 1)[0]
  }
}