import handler from './handler.js'
import { ENV } from '../index.js'
import Constants from './Constants.js'
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
    await handler({ type: 'ASK_LOGIN' })
    await handler({ type: 'ASK_WS_OPEN' })
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
        handler({ type: 'SEND_FAIL_WHILE_DISCONNECTED' })
      } else {
        if (e.target.id === 'send') {
          if (this.userTextInput.value.trim().length > 0) {
            handler({ type: 'SEND_CHAT' })
            this.userTextInput.value = ''
          }
        } else if (e.target.id === 'userTextInput') {
          if (e.target.value.trim().length > 0) {
            handler({ type: 'SEND_CHAT' })
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
        handler({type: Constants.client.ASK_LOGIN})
      } else {
        if (this.isChatConnected) {
          handler({ type: Constants.client.FAIL_LOGOUT_WHILE_CONNECTED })
        } else {
          handler({type: 'ASK_LOGOUT'})
        }
      }
    }
    
    async function handleConnect() {
      if (this.isLoggedIn) {
        if (this.isChatConnected) {
          handler({ type: Constants.client.ASK_WS_CLOSE })
        } else {
          handler({ type: Constants.client.ASK_WS_OPEN })
        }
      } else {
        handler({ type: Constants.client.FAIL_CONNECT_WHILE_LOGGEDOUT})
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
}