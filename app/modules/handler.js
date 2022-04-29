// import state
import { 
  state,
  ENV,
  ui
} from '../app.js'
import { addChat, addChatFromClient } from './chat.js'
import Message from './Message.js'

export default async function handler(action) {
  console.log('action.type:', action.type)

  switch (action.type) {

    // ***
    // * Source: Client
    // ***

    case 'ASK_LOGIN':
      const loginMessage = await login()
      handler(loginMessage)
      break

    case 'ASK_LOGOUT':
      const logoutData = await logout()
      state.isLoggedIn = false
      state.isChatConnected = false
      Message.handle(logoutData)
      break

    case 'DENY_LOGOUT':
      addChatFromClient('\
        You must disconnect from chat before logging out. \
        <auto-disconnect will be enable in future release>\
      ')
      break;

    case 'SEND_FAIL_WHILE_DISCONNECTED':
      addChatFromClient(`Cannot send message, you are disconnected`)
      break

    case 'SEND_CHAT':
      const chatMessage = {
        type: 'userSendChat',
        payload: {
          body: ui.userTextInput.value,
          time: new Date(),
        }
      }
      Message.send(state.ws, chatMessage)
      break
    
    case 'WS_CLOSE_WHILE_LOGGEDOUT':
      addChatFromClient(`You must login to site before connected to chat.`)
      break
    

    // ***
    // * Source: Server
    // ***

    case 'SERVER_LOGIN':
      state.isLoggedIn = true
      addChat(`\
        (${action.payload.time}) \
        <strong>[${action.payload.sender}]</strong>: \
        ${action.payload.body}\
      `)
      break

    case 'SERVER_WELCOME':
      state.userHandle = action.payload.userHandle
      addChat(`\
        (${action.payload.time}) \
        <strong>[${state.userHandle}]</strong>: \
        ${action.payload.body}\
      `)
      break

    case 'SERVER_BROADCAST_CHAT':
      addChat(`\
        (${action.payload.time}) \
        <strong>${state.userHandle}</strong>: \
        ${action.payload.body}\
      `)
      break
    case 'SERVER_BROADCAST_ENTRY':
      // TODO add to usersList



    // ***
    // * WebSocket Client Submissions
    // ***

    case 'ASK_WS_OPEN':
      // CSDR await?
      // ws = new WebSocket(`wss://${location.host}`)
      state.ws = new WebSocket(`${ENV.WSS_HOST}:${ENV.PORT}`)
      state.ws.addEventListener('open', handleWSEvents.bind(this))
      state.ws.addEventListener('message', handleWSEvents.bind(this))
      state.ws.addEventListener('error', handleWSEvents.bind(this))
      state.ws.addEventListener('close', handleWSEvents.bind(this))
      break
    
    case 'ASK_WS_CLOSE':
      addChatFromClient(`======== You left the chat. Bye! ========`)
      state.isChatConnected = false
      state.room = ''

      // Client closes itself without server response
      state.ws.close(1000, 'user intentionally disconnected')
      state.ws.onerror = state.ws.onopen = state.ws.onclose = null
      state.ws = null
      break


    // ***
    // * WebSocket Server Receipts
    // ***

    case 'WS_OPEN':
      state.isChatConnected = true
      state.room = 'general'
      break
    case 'WS_CLOSE':
      console.log('ws.close from server, unsure if this case reachable')
      addChatFromClient(`\
        ======== The server closed your connect. Adios! ========\
      `)
      state.isChatConnected = false
      state.room = ''
      state.ws.close(1000, 'confirm server ws.close')
      state.ws.onerror = state.ws.onopen = state.ws.onclose = null
      state.ws = null
      break

    default:
      console.log('unhandled action:', action)
  }
  ui.update()
}

function handleWSEvents(event) {
  // Handle incoming server websocket events
  console.log('ws event.type', event.type)
  switch (event.type) {
    case 'error':
      console.log('WS Error code:', event.code)     
      break
    case 'open':
      // Can only open if already logged in
      handler({ type: 'WS_OPEN' })
      break
    case 'close':
      // WS sends a close event even when a new ws object fails to connect
      // Thus this case block must:
      if (!state.isLoggedIn) {              // handle close events when not logged in
        handler({ type: 'WS_CLOSE_WHILE_LOGGEDOUT'})
      } else if (state.isChatConnected) {   // handle close events when logged in
        handler({ type: 'WS_CLOSE' })
      }
      break
    case 'message':
      console.log('raw message event from server', event)
      const message = Message.parseEventData(event)
      handler(message)
      break
    default:
      console.log('Unhandled event.type:', event.type)
  }
}

async function login() {
  console.log(`POST ${ENV.URL}/login`)
  try {
    const response = await fetch(
      `${ENV.URL}/login`, 
      { method: 'POST', credentials: 'same-origin' }
    )
    
    return response.ok 
      ? await response.json()
      : new Error('Unexpected login response')
  } catch (err) {
    throw new Error(`Unhandled logout error: ${err.message}`)
  }
}

async function logout() {
  try {
    const response = await fetch(
      `${ENV.URL}/logout`,
      { method: 'POST', credentials: 'same-origin' }
    )
    return response.ok
      ? await response.json()
      : new Error('Unexpected logout response')
  } catch (err) {
    throw new Error(`Unhandled logout error: ${err.message}`)
  }
}