import { ENV, client } from '../index.js'
import { addChat, addChatFromClient, addChatFromServer } from './ChatBox.js'
import Message from './Message.js'
import Constants from './Constants.js'

export default async function handler(action) {
  console.log(`ACTION: ${action.type}`)

  switch (action.type) {
    case Constants.client.ASK_LOGIN:
      const loginMessage = await client.login()
      handler(loginMessage)
      break

    case Constants.client.ASK_LOGOUT:
      const logoutData = await client.logout()
      client.isLoggedIn = false
      client.isChatConnected = false
      handler(logoutData)
      break

    case Constants.client.SEND_CHAT:
      const chatMessage = {
        type: 'userSendChat',
        payload: {
          body: client.userTextInput.value,
          time: new Date(),
        }
      }
      Message.send(client.ws, chatMessage)
      break
    
    case Constants.client.FAIL_LOGOUT_WHILE_CONNECTED:
      addChatFromClient('\
        You must disconnect from chat before logging out from site. \
        <auto-disconnect will be enable in future release>\
      ')
      break;

    // * Client tried sending message while disconnected
    case Constants.client.FAIL_SEND_WHILE_DISCONNECTED:
      addChatFromClient(`Cannot send message, you are disconnected`)
      break

    case Constants.ws.FAIL_LOGOUT_WHILE_WS_CONNECTED:
      addChatFromClient(`There is no ws connection to close while logged out`)
      break

    case Constants.client.FAIL_CONNECT_WHILE_LOGGEDOUT:
      addChatFromClient(`You must login before connecting to chat`)
      break

    // * From Server

    case Constants.server.LOGGEDIN:
      client.isLoggedIn = true
      addChatFromServer(action)
      break

    case Constants.server.LOGGEDOUT:
      client.isLoggedIn = false
      addChatFromServer(action)
      break

    case Constants.server.WELCOME:
      client.handle = action.payload.handle
      client.usersList = action.payload.usersList
      // action.payload.usersList.forEach(user => {
      //   UsersList.addUsersList(user)
      // })
      addChatFromServer(action)
      break

    case Constants.server.BROADCAST_CHAT:
      addChatFromServer(action)
      break

    case Constants.server.BROADCAST_ENTRY:
      // TODO add to usersList
      addChatFromServer(action)
      client.usersList = action.payload.usersList
      // UsersList.addUsersList(action.payload.userHandle)
      break

    case Constants.server.BROADCAST_LEAVE:
      addChatFromServer(action)
      console.log(`server userslist on leave`, action.payload.usersList)
      client.usersList = action.payload.usersList
      break


    // ***
    // * WebSocket Client Submissions
    // ***

    case Constants.client.ASK_WS_OPEN:
      // CSDR await?
      // ws = new WebSocket(`wss://${location.host}`)
      client.ws = new WebSocket(`wss://${ENV.SERVER_HOST}:${ENV.SERVER_PORT}`)
      client.ws.addEventListener('open', handleWSEvents.bind(this))
      client.ws.addEventListener('message', handleWSEvents.bind(this))
      client.ws.addEventListener('error', handleWSEvents.bind(this))
      client.ws.addEventListener('close', handleWSEvents.bind(this))
      console.log(`ws setup done`, )
      
      break
    
    case Constants.client.ASK_WS_CLOSE:
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

    case Constants.ws.OPEN:
      client.isChatConnected = true
      client.room = 'general'
      break
    case Constants.ws.CLOSE:
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
  console.log('WS EVENT:', event.type)
  switch (event.type) {
    case 'error':
      console.log('error code:', event.code)     
      break
    case 'open':
      // Can only open when logged in
      handler({ type: Constants.ws.OPEN })
      break
    case 'close':
      // WS sends a close event even when a new ws object fails to connect
      // Thus this case block must:
      if (!client.isLoggedIn) {              // handle close events when not logged in
        handler({ type: Constants.ws.FAIL_WS_CLOSE_WHILE_LOGGEDOUT})
      } else if (client.isChatConnected) {   // handle close events when logged in
        handler({ type: Constants.ws.CLOSE })
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