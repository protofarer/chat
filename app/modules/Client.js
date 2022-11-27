// import handler from './handler.js'
import { ENV } from '../index.js'
import Constants from './Constants.js'
import Message from './Message.js'
import { addChatFromClient, addChatFromServer } from './ChatBox.js'
export default class Client {
  isLoggedIn = false
  isChatConnected = false
  room
  handle
  textInput = ''
  ws
  usersList = []
  chatCounter = 0

  loginButton = document.querySelector('#login')
  connectButton = document.querySelector('#connect')
  chatBox = document.querySelector('#chatBox')
  usersListComponent = document.querySelector('#chatUsersList')
  userTextInput = document.querySelector('#userTextInput')
  sendButton = document.querySelector('#send')

  constructor() {
    this.activateListeners()
  }

  async connect() {
    await this.handler({ type: 'ASK_LOGIN' })
    await this.handler({ type: 'ASK_WS_OPEN' })
  }

  async login() {
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

  async logout() {
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

  reset() {
    this.isLoggedIn = false
    this.isChatConnected = false
    this.room = null
    this.handle = ''
    this.textInput = ''
    this.chatCounter = 0
  }

  activateListeners() {
    const handleSend = (e) => {
      if (!this.ws) {
        this.handler({ type: 'SEND_FAIL_WHILE_DISCONNECTED' })
      } else {
        if (e.target.id === 'send') {
          if (this.userTextInput.value.trim().length > 0) {
            this.handler({ type: 'SEND_CHAT' })
            this.userTextInput.value = ''
          }
        } else if (e.target.id === 'userTextInput') {
          if (e.target.value.trim().length > 0) {
            this.handler({ type: 'SEND_CHAT' })
            e.target.value = ''
          }
        } else {
          console.error('Unhandled send event')
        }
      }
    }

    const handleTextInput = (e) => {
      e.key === 'Enter' && handleSend(e)
    }
    
    async function handleLogin() {
      if (!this.isLoggedIn) {
        this.handler({ type: Constants.client.ASK_LOGIN})
      } else {
        if (this.isChatConnected) {
          this.handler({ type: Constants.client.FAIL_LOGOUT_WHILE_CONNECTED })
        } else {
          this.handler({type: 'ASK_LOGOUT'})
        }
      }
      console.log(`ahoy there!`, )
      
    }
    
    async function handleConnect() {
      if (this.isLoggedIn) {
        if (this.isChatConnected) {
          this.handler({ type: Constants.client.ASK_WS_CLOSE })
        } else {
          this.handler({ type: Constants.client.ASK_WS_OPEN })
        }
      } else {
        this.handler({ type: Constants.client.FAIL_CONNECT_WHILE_LOGGEDOUT})
      }
    }

    this.loginButton.addEventListener('click', handleLogin.bind(this))
    this.connectButton.addEventListener('click', handleConnect.bind(this))
    this.sendButton.addEventListener('click', handleSend.bind(this))
    this.userTextInput.addEventListener('keydown', handleTextInput.bind(this))
  }

  // Update UI after state change
  update() {
    this.loginButton.innerText = this.isLoggedIn 
      ? '🟢 | LOGOUT'
      : '🔴 | LOGIN'

    this.userTextInput.value = this.textInput  

    this.connectButton.innerText = this.isChatConnected
      ? '🟢 | DISCONNECT'
      : '🔴 | CONNECT'

    this.usersListComponent.innerHTML = this.renderUsersList()
  }

  renderUsersList() {
    const colors = ['red', 'orange', 'yellow', 'green', 'blue', 'purple', 'cyan']
    const html = this.usersList.reduce((html, handle, i) => (
        html 
        + `<li `
        + `id=${i} `
        + `style="color: ${colors[Math.floor(Math.random() * colors.length)]}">`
        + `${
          handle === this.handle 
            ? '<strong>(you) ' + handle + '</strong>' 
            : handle
        }`
        + `</li>`
      )
    , "")

    return html
  }

  async handler(action) {
    console.log(`ACTION: ${action.type}`)

    switch (action.type) {
      case Constants.client.ASK_LOGIN:
        const loginMessage = await this.login()
        this.handler(loginMessage)
        break

      case Constants.client.ASK_LOGOUT:
        const logoutData = await this.logout()
        this.isLoggedIn = false
        this.isChatConnected = false
        this.handler(logoutData)
        break

      case Constants.client.SEND_CHAT:
        const chatMessage = {
          type: 'userSendChat',
          payload: {
            body: this.userTextInput.value,
            time: new Date(),
          }
        }
        Message.send(this.ws, chatMessage)
        break
      
      case Constants.client.FAIL_LOGOUT_WHILE_CONNECTED:
        addChatFromClient(this, '\
          You must disconnect from chat before logging out from site. \
          <auto-disconnect will be enable in future release>\
        ')
        break;

      // * Client tried sending message while disconnected
      case Constants.client.FAIL_SEND_WHILE_DISCONNECTED:
        addChatFromClient(this, `Cannot send message, you are disconnected`)
        break

      case Constants.ws.FAIL_LOGOUT_WHILE_WS_CONNECTED:
        addChatFromClient(this, `There is no ws connection to close while logged out`)
        break

      case Constants.client.FAIL_CONNECT_WHILE_LOGGEDOUT:
        addChatFromClient(this, `You must login before connecting to chat`)
        break

      // * From Server

      case Constants.server.LOGGEDIN:
        this.isLoggedIn = true
        addChatFromServer(this, action)
        break

      case Constants.server.LOGGEDOUT:
        this.isLoggedIn = false
        addChatFromServer(this, action)
        break

      case Constants.server.WELCOME:
        this.handle = action.payload.handle
        this.usersList = action.payload.usersList
        // action.payload.usersList.forEach(user => {
        //   UsersList.addUsersList(user)
        // })
        addChatFromServer(this, action)
        break

      case Constants.server.BROADCAST_CHAT:
        addChatFromServer(this, action)
        break

      case Constants.server.BROADCAST_ENTRY:
        // TODO add to usersList
        addChatFromServer(this, action)
        this.usersList = action.payload.usersList
        // UsersList.addUsersList(action.payload.userHandle)
        break

      case Constants.server.BROADCAST_LEAVE:
        addChatFromServer(this, action)
        console.log(`server userslist on leave`, action.payload.usersList)
        this.usersList = action.payload.usersList
        break

      case Constants.client.ASK_WS_OPEN:
        // CSDR await?
        // ws = new WebSocket(`wss://${location.host}`)
        this.ws = new WebSocket(`wss://${ENV.SERVER_HOST}:${ENV.SERVER_PORT}`)
        this.ws.addEventListener('open', handleWSEvents.bind(this))
        this.ws.addEventListener('message', handleWSEvents.bind(this))
        this.ws.addEventListener('error', handleWSEvents.bind(this))
        this.ws.addEventListener('close', handleWSEvents.bind(this))
        console.log(`ws setup done`, )

        function handleWSEvents(event) {
          // Handle incoming server websocket events
          console.log('WS EVENT:', event.type)
          switch (event.type) {
            case 'error':
              console.log('error code:', event.code)     
              break
            case 'open':
              // Can only open when logged in
              this.handler({ type: Constants.ws.OPEN })
              break
            case 'close':
              // WS sends a close event even when a new ws object fails to connect
              // Thus this case block must:
              if (!this.isLoggedIn) {              // handle close events when not logged in
                this.handler({ type: Constants.ws.FAIL_WS_CLOSE_WHILE_LOGGEDOUT})
              } else if (this.isChatConnected) {   // handle close events when logged in
                this.handler({ type: Constants.ws.CLOSE })
              }
              break
            case 'message':
              console.log('raw message event from server', event)
              const message = Message.parseEventData(event)
              this.handler(message)
              break
            default:
              console.log('Unhandled event.type:', event.type)
          }
        }
        break
      
      case Constants.client.ASK_WS_CLOSE:
        addChatFromClient(this, `====== You left the chat. Bye! ======`)
        this.isChatConnected = false
        this.room = ''
        this.usersList = []

        // Client closes itself without server response
        this.ws.close(1000, 'user intentionally disconnected')
        this.ws.onerror = this.ws.onopen = this.ws.onclose = null
        this.ws = null
        break

      // ***
      // * WebSocket Server Receipts
      // ***

      case Constants.ws.OPEN:
        this.isChatConnected = true
        this.room = 'general'
        break
      case Constants.ws.CLOSE:
        // reachable when server restarts or sends its close signal first
        addChatFromClient(this, `====== The server closed your connect. Adios! ======`)
        this.isChatConnected = false
        this.room = ''
        
        // server doesn't receive this close event if the ws.close
        // initiated by server
        this.ws.close(1000, 'confirm server ws.close')

        this.ws.onerror = this.ws.onopen = this.ws.onclose = null
        this.ws = null
        break

      default:
        console.log('unhandled action:', action)
    }
    this.update()
  }
}