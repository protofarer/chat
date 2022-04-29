import { state, ENV } from '../app.js'
import { addChatFromClient } from './chat.js'
import Message from './Message.js'

export default class {
  constructor(handler) {
    this.loginButton = document.querySelector('#login')
    this.connectButton = document.querySelector('#connect')
    this.chatBox = document.querySelector('#chatBox')
    this.usersList = document.querySelector('#chatUsersList')
    this.userTextInput = document.querySelector('#userTextInput')
    this.sendButton = document.querySelector('#send')
    this.setupListeners()

    this.handler = handler
  }

  setupListeners() {
    this.loginButton.addEventListener('click', handleLogin.bind(this))
    this.connectButton.addEventListener('click', handleConnect.bind(this))
    this.sendButton.addEventListener('click', handleSend.bind(this))
    this.userTextInput.addEventListener('keydown', handleTextInput.bind(this))

    function handleTextInput(e) {
      if (e.key === 'Enter') handleSend(e)
    }
    
    function handleSend() {
      if (!state.ws) {
        this.handler({ type: 'SEND_FAIL_WHILE_DISCONNECTED' })
        return
      }
      console.log('IN sendChatMessage, ws:', state.ws)
      if (this.userTextInput.value.trim().length > 0) {
        this.handler({ type: 'SEND_CHAT' })
        this.userTextInput.value = ''
      }
    }

    async function handleLogin() {
      if (!state.isLoggedIn) {
        this.handler({type: 'ASK_LOGIN'})
      } else {
        if (state.isChatConnected) {
          this.handler({ type: 'DENY_LOGOUT' })
        } else {
          this.handler({type: 'ASK_LOGOUT'})
        }
      }
    }
    async function handleConnect() {
      // Is a toggle button, thus cannot attempt a disconnect when already disconnected
      // As a result this condition isn't handled in the event handler 
      if (state.ws) { 
        this.handler({ type: 'ASK_WS_CLOSE' })
        // TMP possible fix
        // Need this in order to trigger server to send the leave chat room message
        // notifyLeave()

        // state.ws.onerror = state.ws.onopen = state.ws.onclose = null
        // state.ws.close(1000, 'user intentionally disconnected')
        // state.room = ''


        // TMP fix wip
        // BUG? using removeEL's causes the client to not receive
        // an event.type close that triggers the "left chat" chatbox msg.
        // ws.removeEventListener('open', handleWSEvents)
        // ws.removeEventListener('message', handleWSEvents)
        // ws.removeEventListener('error', handleWSEvents)
        // ws.removeEventListener('close', handleWSEvents)
        // ws = null
      } else {
        this.handler({ type: 'ASK_WS_OPEN' })
      
      }
    }
  }

  // Handler calls this as its last evaluation.
  update() {
    this.loginButton.innerText = state.isLoggedIn 
      ? 'LOGOUT'
      : 'LOGIN'
    this.userTextInput.value = state.textInput  
    this.connectButton.innerText = state.isChatConnected
      ? 'DISCONNECT'
      : 'CONNECT'
  }

}