import { state } from '../app.js'
import UsersList from './UsersList.js'

export default class UI {
  constructor(handler) {
    this.loginButton = document.querySelector('#login')
    this.connectButton = document.querySelector('#connect')
    this.chatBox = document.querySelector('#chatBox')
    this.usersList = document.querySelector('#chatUsersList')
    this.userTextInput = document.querySelector('#userTextInput')
    this.sendButton = document.querySelector('#send')

    this.handler = handler
    
    this.setupListeners()
  }

  setupListeners() {
    const handleSend = (e) => {
      if (!state.ws) {
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

    this.loginButton.addEventListener('click', handleLogin.bind(this))
    this.connectButton.addEventListener('click', handleConnect.bind(this))
    this.sendButton.addEventListener('click', handleSend.bind(this))
    this.userTextInput.addEventListener('keydown', handleTextInput.bind(this))

    async function handleLogin() {
      if (!state.isLoggedIn) {
        this.handler({type: 'ASK_LOGIN'})
      } else {
        state.isChatConnected
          ? this.handler({ type: 'DENY_LOGOUT' })
          : this.handler({type: 'ASK_LOGOUT'})
      }
    }
    async function handleConnect() {
      state.ws
        ? this.handler({ type: 'ASK_WS_CLOSE' })
        : this.handler({ type: 'ASK_WS_OPEN' })
    }
  }

  // Update UI after state change
  update() {
    this.loginButton.innerText = state.isLoggedIn 
      ? '🟢 | LOGOUT'
      : '🔴 | LOGIN'

    this.userTextInput.value = state.textInput  

    this.connectButton.innerText = state.isChatConnected
      ? '🟢 | DISCONNECT'
      : '🔴 | CONNECT'

    this.usersList.innerHTML = UsersList.buildHTML()
  }
}