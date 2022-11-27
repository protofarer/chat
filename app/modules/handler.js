import { 
  ENV,
  client
} from '../index.js'
import { addChat, addChatFromClient, addChatFromServer } from './ChatBox.js'
import Message from './Message.js'

export default async function handler(action) {
  console.log('action.type:', action.type)

  switch (action.type) {

    // ***
    // * From Client
    // ***

    case 'ASK_LOGIN':
      const loginMessage = await login()
      handler(loginMessage)
      break

    case 'ASK_LOGOUT':
      const logoutData = await logout()
      client.isLoggedIn = false
      client.isChatConnected = false
      handler(logoutData)
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
          body: client.userTextInput.value,
          time: new Date(),
        }
      }
      Message.send(client.ws, chatMessage)
      break
    
    case 'DENY_WS_CLOSE_WHILE_LOGGEDOUT':
      addChatFromClient(`You must login to site before connected to chat.`)
      break
    

    // ***
    // * From Server
    // ***

    case 'SERVER_LOGIN':
      client.isLoggedIn = true
      addChatFromServer(action)
      break

    case 'SERVER_LOGOUT':
      client.isLoggedIn = false
      addChatFromServer(action)
      break

    case 'SERVER_WELCOME':
      client.handle = action.payload.handle
      client.usersList = action.payload.usersList
      // action.payload.usersList.forEach(user => {
      //   UsersList.addUsersList(user)
      // })
      addChatFromServer(action)
      break

    case 'SERVER_BROADCAST_CHAT':
      addChatFromServer(action)
      break

    case 'SERVER_BROADCAST_ENTRY':
      // TODO add to usersList
      addChatFromServer(action)
      client.usersList = action.payload.usersList
      // UsersList.addUsersList(action.payload.userHandle)
      break

    case 'SERVER_BROADCAST_LEAVE':
      addChatFromServer(action)
      console.log(`server userslist on leave`, action.payload.usersList)
      client.usersList = action.payload.usersList
      break


    // ***
    // * WebSocket Client Submissions
    // ***

    case 'ASK_WS_OPEN':
      // CSDR await?
      // ws = new WebSocket(`wss://${location.host}`)
      client.ws = new WebSocket(`wss://${ENV.SERVER_HOST}:${ENV.SERVER_PORT}`)
      client.ws.addEventListener('open', handleWSEvents.bind(this))
      client.ws.addEventListener('message', handleWSEvents.bind(this))
      client.ws.addEventListener('error', handleWSEvents.bind(this))
      client.ws.addEventListener('close', handleWSEvents.bind(this))
      console.log(`ws setup done`, )
      
      break
    
    case 'ASK_WS_CLOSE':
      addChatFromClient(`====== You left the chat. Bye! ======`)
      client.isChatConnected = false
      client.room = ''
      client.usersList = []

      // Client closes itself without server response
      client.ws.close(1000, 'user intentionally disconnected')
      client.ws.onerror = client.ws.onopen = client.ws.onclose = null
      client.ws = null
      break

    // ***
    // * WebSocket Server Receipts
    // ***

    case 'WS_OPEN':
      client.isChatConnected = true
      client.room = 'general'
      break
    case 'WS_CLOSE':
      // reachable when server restarts or sends its close signal first
      addChatFromClient(`====== The server closed your connect. Adios! ======`)
      client.isChatConnected = false
      client.room = ''
      
      // server doesn't receive this close event if the ws.close
      // initiated by server
      client.ws.close(1000, 'confirm server ws.close')

      client.ws.onerror = client.ws.onopen = client.ws.onclose = null
      client.ws = null
      break

    default:
      console.log('unhandled action:', action)
  }
  client.update()
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
      if (!client.isLoggedIn) {              // handle close events when not logged in
        handler({ type: 'DENY_WS_CLOSE_WHILE_LOGGEDOUT'})
      } else if (client.isChatConnected) {   // handle close events when logged in
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
  console.log(`IN login`, )
  console.log(`POST ${ENV.URL}/login`)
  console.log(`ENV`, ENV)
  
  try {
    const response = await fetch(
      `${ENV.URL}/login`, 
      { method: 'POST', credentials: 'same-origin' }
    )
    
    return response.ok 
      ? await response.json()
      : new Error('Unexpected login response')

  } catch (err) {

    if (err.name === 'TypeError') {
      console.error(`${err.message}`)
    } else {
      throw new Error(`Unhandled logout error: ${err}`)
    } 

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
    new Error(`Unhandled logout error: ${err.message}`)
  }
}
