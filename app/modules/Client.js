export default class Client {
  isLoggedIn = false
  isChatConnected = false
  room
  handle
  textInput = ''
  ws
  usersList = []
  chatCounter = 0

  constructor(handler) {
    this.loginButton = document.querySelector('#login')
    this.connectButton = document.querySelector('#connect')
    this.chatBox = document.querySelector('#chatBox')
    this.usersListComponent = document.querySelector('#chatUsersList')
    this.userTextInput = document.querySelector('#userTextInput')
    this.sendButton = document.querySelector('#send')

    this.handler = handler
    
    this.setupListeners()
  }

  reset() {
    this.isLoggedIn = false
    this.isChatConnected = false
    this.room = null
    this.handle = ''
    this.textInput = ''
    this.chatCounter = 0
  }

  setupListeners() {
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
        this.handler({type: 'ASK_LOGIN'})
      } else {
        this.isChatConnected
          ? this.handler({ type: 'DENY_LOGOUT' })
          : this.handler({type: 'ASK_LOGOUT'})
      }
    }
    
    async function handleConnect() {
      this.ws
        ? this.handler({ type: 'ASK_WS_CLOSE' })
        : this.handler({ type: 'ASK_WS_OPEN' })
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