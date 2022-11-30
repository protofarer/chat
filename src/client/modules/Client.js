import { ENV } from '../index.js'
import ChatBox from './ChatBox.js'
import Constants from './Constants.js'

export default class Client {
  isLoggedIn = false
  isChatConnected = false
  room
  handle
  ws
  usersList = new Map()
  chatCounter = 0

  constructor(rootElement) {
    this.makeElements(rootElement)
    this.activateListeners()
  }

  makeElements(rootElement) {
    this.topContainer = document.createElement('div')
    this.topContainer.id = 'topContainer'
    rootElement.appendChild(this.topContainer)

    this.menuContainer = document.createElement('div')
    this.menuContainer.id = 'menuContainer'
    this.topContainer.appendChild(this.menuContainer)

    this.menu = document.createElement('menu')
    this.menu.id = 'menu'
    this.menuContainer.appendChild(this.menu)

    this.loginButt = document.createElement('button')
    this.loginButt.id = 'login'
    this.loginButt.innerText = 'LOGIN'
    this.menu.appendChild(this.loginButt)

    this.connectButt = document.createElement('button')
    this.connectButt.id = 'connect'
    this.connectButt.innerText = 'CONNECT'
    this.menu.appendChild(this.connectButt)

    this.usersListSpacer = document.createElement('div')
    this.usersListSpacer.id = 'usersListSpacer'
    this.menuContainer.appendChild(this.usersListSpacer)

    this.chatContainer = document.createElement('div')
    this.chatContainer.id = 'chatContainer'
    this.topContainer.appendChild(this.chatContainer)

    this.chatbox = new ChatBox(this.chatContainer)

    this.chatUsersList = document.createElement('ul')
    this.chatUsersList.id = 'chatUsersList'
    this.chatContainer.appendChild(this.chatUsersList)

    this.chatBoxSpacer = document.createElement('div')
    this.chatBoxSpacer.id = 'chatBoxSpacer'
    this.topContainer.appendChild(this.chatBoxSpacer)

    this.inputPanel = document.createElement('div')
    this.inputPanel.id = 'inputPanel'
    this.topContainer.appendChild(this.inputPanel)

    this.userTextInput = document.createElement('input')
    this.userTextInput.id = 'userTextInput'
    this.userTextInput.type = 'text'
    this.inputPanel.appendChild(this.userTextInput)

    this.sendButt = document.createElement('button')
    this.sendButt.id = 'send'
    this.sendButt.type = 'submit'
    this.sendButt.innerText = 'SEND'
    this.inputPanel.appendChild(this.sendButt)
  }

  

  async connect() {
    await this.handler({ type: Constants.client.ASK_LOGIN.word })
    await this.handler({ type: Constants.client.ASK_WS_OPEN.word })
  }

  async login() {
    console.log(`IN login`, )
    try {
      const response = await fetch(
        `${ENV.URL}/login`, 
        { method: 'POST', credentials: 'same-origin' }
      )
      return response.ok 
        ? await response.json()
        : new Error('Login failed')
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
      if (response.ok) {
        this.isLoggedIn = false
        this.isChatConnected = false
        return await response.json()
      } else {
        console.log('Logout failed')
      }
    } catch (err) {
      new Error(`Unhandled logout error: ${err.message}`)
    }
  }

  reset() {
    this.isLoggedIn = false
    this.isChatConnected = false
    this.room = null
    this.handle = ''
    this.chatCounter = 0
    this.usersList.clear()
    this.chatCounter = 0
  }

  activateListeners() {
    this.loginButt.addEventListener('click', async () => {
      if (!this.isLoggedIn) {
        this.handler({ type: Constants.client.ASK_LOGIN.word})
      } else {
        if (this.isChatConnected) {
          this.handler({ type: Constants.client.FAIL_LOGOUT_WHILE_CONNECTED.word })
        } else {
          this.handler({type: Constants.client.ASK_LOGOUT.word })
        }
      }
    })
    
    this.connectButt.addEventListener('click', async () => {
      if (this.isLoggedIn) {
        if (this.isChatConnected) {
          this.handler({ type: Constants.client.ASK_WS_CLOSE.word })
        } else {
          this.handler({ type: Constants.client.ASK_WS_OPEN.word })
        }
      } else {
        this.handler({ type: Constants.client.FAIL_CONNECT_WHILE_LOGGEDOUT.word })
      }
    })

    const handleSend = (e) => {
      if (!this.ws) {
        this.handler({ type: Constants.client.FAIL_SEND_WHILE_DISCONNECTED.word })
      } else {
        if (e.target.id === 'send') {
          if (this.userTextInput.value.trim().length > 0) {
            this.handler({ type: Constants.client.SEND_CHAT.word })
            this.userTextInput.value = ''
          }
        } else if (e.target.id === 'userTextInput') {
          if (e.target.value.trim().length > 0) {
            this.handler({ type: Constants.client.SEND_CHAT.word })
            e.target.value = ''
          }
        } else {
          console.error('Unhandled send event')
        }
      }
    }

    this.sendButt.addEventListener('click', handleSend)

    this.userTextInput.addEventListener('keydown', (e) => {
      e.key === 'Enter' && handleSend(e)
    })
  }

  // Update UI after state change
  render() {
    this.loginButt.innerText = this.isLoggedIn 
      ? '🟢 | LOGOUT'
      : '🔴 | LOGIN'

    this.connectButt.innerText = this.isChatConnected
      ? '🟢 | DISCONNECT'
      : '🔴 | CONNECT'

    this.chatUsersList.innerHTML = this.renderUsersList()
  }

  renderUsersList() {
    const colors = ['red', 'orange', 'yellow', 'green', 'blue', 'purple', 'cyan']
    let html = ""
    const iterator = this.usersList.keys()
    let key = iterator.next().value
    while (key) {
      html +=
        `<li `
        + `style="color: ${colors[Math.floor(Math.random() * colors.length)]}">`
        + `${
          key === this.handle 
            ? '<strong>(you) ' + key + '</strong>' 
            : key
        }`
        + `</li>`
      key = iterator.next().value
    }
    return html
  }

  async handler(action) {
    console.log(`ACTION: ${action.type}`)

    switch (action.type) {
      case Constants.client.ASK_LOGIN.word:
        const loginMessage = await this.login()
        this.handler(loginMessage)
        break

      case Constants.client.ASK_LOGOUT.word:
        const logoutData = await this.logout()
        this.handler(logoutData)
        break

      case Constants.client.SEND_CHAT.word:
        const chatMessage = {
          type: Constants.client.SEND_CHAT.word,
          payload: {
            body: this.userTextInput.value,
            time: new Date(),
          }
        }
        this.ws.send(JSON.stringify(chatMessage))
        break
      
      case Constants.client.FAIL_LOGOUT_WHILE_CONNECTED.word:
        this.chatbox.addChatFromClient(this, Constants.client.FAIL_LOGOUT_WHILE_CONNECTED.text)
        break

      // * Client tried sending message while disconnected
      case Constants.client.FAIL_SEND_WHILE_DISCONNECTED.word:
        this.chatbox.addChatFromClient(this, Constants.client.FAIL_SEND_WHILE_DISCONNECTED.text)
        break

      case Constants.ws.FAIL_LOGOUT_WHILE_WS_CONNECTED.word:
        this.chatbox.addChatFromClient(this, Constants.ws.FAIL_LOGOUT_WHILE_WS_CONNECTED.text)
        break

      case Constants.client.FAIL_CONNECT_WHILE_LOGGEDOUT.word:
        this.chatbox.addChatFromClient(this, Constants.client.FAIL_CONNECT_WHILE_LOGGEDOUT.text)
        break

      // * From Server

      case Constants.server.LOGGEDIN.word:
        this.isLoggedIn = true
        this.chatbox.addChatFromServer(action)
        break

      case Constants.server.LOGGEDOUT.word:
        this.isLoggedIn = false
        this.chatbox.addChatFromServer(action)
        break

      case Constants.server.UNICAST_WELCOME.word:
        this.handle = action.payload.handle
        for (let i = 0; i < action.payload.usersList.length; ++i) {
          this.usersList.set(action.payload.usersList[i], null)
        }
        this.chatbox.addChatFromServer(action)
        break

      case Constants.server.BROADCAST_CHAT.word:
        this.chatbox.addChatFromServer(action)
        break

      case Constants.server.BROADCAST_ENTRY.word:
        // TODO add to usersList
        this.chatbox.addChatFromServer(action)
        this.usersList.set(action.payload.handle, null)
        // UsersList.addUsersList(action.payload.userHandle)
        break

      case Constants.server.BROADCAST_LEAVE.word:
        this.chatbox.addChatFromServer(action)
        console.log(`user left:`, action.payload.handle)
        this.usersList.delete(action.payload.handle)
        break

      case Constants.client.ASK_WS_OPEN.word:
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
              this.handler({ type: Constants.ws.OPEN.word })
              break
            case 'close':
              // WS sends a close event even when a new ws object fails to connect
              // Thus this case block must:
              if (!this.isLoggedIn) {              // handle close events when not logged in
                this.handler({ type: Constants.ws.FAIL_WS_CLOSE_WHILE_LOGGEDOUT.word })
              } else if (this.isChatConnected) {   // handle close events when logged in
                this.handler({ type: Constants.ws.CLOSE.word })
              }
              break
            case 'message':
              console.log('raw message event from server', event)
              const message = JSON.parse(event.data)
              this.handler(message)
              break
            default:
              console.log('Unhandled event.type:', event.type)
          }
        }
        break
      
      case Constants.client.ASK_WS_CLOSE.word:
        this.chatbox.addChatFromClient(this, Constants.client.ASK_WS_CLOSE.text)
        this.isChatConnected = false
        this.room = null
        this.handle = null
        this.chatCounter = 0
        this.usersList.clear()
        // Client closes itself without waiting for a response
        this.ws.close(1000, 'user intentionally disconnected')
        this.ws.onerror = this.ws.onopen = this.ws.onclose = null
        this.ws = null
        break

      // * WebSocket Server Receipts

      case Constants.ws.OPEN.word:
        this.isChatConnected = true
        this.room = 'general'
        break
      case Constants.ws.CLOSE.word:
        // reachable when server restarts or sends its close signal first
        this.chatbox.addChatFromClient(this, Constants.ws.CLOSE.text)
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
    this.render()
  }

  syncUsersList() {

  }

  syncChatLines() {

  }
}