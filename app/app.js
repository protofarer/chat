import UI from './modules/UI.js'
import handler from './modules/handler.js'

export const ENV = new (function() {
  this.PORT =  import.meta.env ? import.meta.env.VITE_PORT : 3000
  this.HTTPS_HOST = import.meta.env ? import.meta.env.VITE_HTTPS_HOST : `https://0.0.0.0`
  this.WSS_HOST = import.meta.env ? import.meta.env.VITE_WSS_HOST : `wss://0.0.0.0`
  this.URL = `${this.HTTPS_HOST}:${this.PORT}`
})()

export let state = {
  isLoggedIn: false,
  isChatConnected: false,
  room: '',
  userHandle: '',
  
  textInput: '',
  chatText: '',
  
  ws: null,

  usersList: [],
}

export function resetState() {
  state = {
    isLoggedIn: false,
    isChatConnected: false,
    room: '',
    handle: '',
    textInput: ''
  }
}

export let ui = new UI(handler)

// TODO Use session if exists upon document load
// get handle from session
// dispatch action: client to logged in state

// Non-UI actions upon user loading page
document.onload = handleLoad()

async function handleLoad() {
  await handler({ type: 'ASK_LOGIN' })
  await handler({ type: 'ASK_WS_OPEN' })
}
