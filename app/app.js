import UI from './modules/initUI.js'
import handler from './modules/handler.js'
import { addChat } from './modules/chat.js'

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
  ws: null
}

// let ws
export let ui = new UI(handler)

// TODO Use session if exists upon document load
// get handle from session
// dispatch action: client to logged in state

// Non-UI actions upon user loading page
// document.onload = handleLoad

// function handleLoad() {
//   handler({ type: 'LOGIN' })
// }

function notifyLeave(e){
  // Notify WSServer connection is closing
  // so it can in turn notify the room.
  const message = {
    type: 'userLeaveChat',
    body: null,
    time: Date.now(),
    sender: null,
  }
  const rawMessage = JSON.stringify(message)
  state.ws.send(rawMessage)
}

function resetState() {
  state = {
    isLoggedIn: false,
    isChatConnected: false,
    room: '',
    handle: '',
    textInput: ''
  }
}
