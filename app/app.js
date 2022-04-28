import UI from './modules/initUI.js';
import handler from './modules/handler.js';

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
  handle: '',
  textInput: '',
  ws: null
};

// let ws;
export let ui = new UI(handler)

// TODO Use session if exists upon document load
// get handle from session
// dispatch action: client to logged in state

// Non-UI actions upon user loading page
// document.onload = handleLoad;

// function handleLoad() {
//   handler({ type: 'LOGIN' });
// }

export function handleMessage(event) {
  // Formats and acts on messages from server

  // TODO check and handle event typeof (server message passing)
  // TODO check and handle object typeof (local message passing)
  const message = JSON.parse(event.data);   // TODO JSON.parse replacer for time property
  console.log('handleMessage event.data', message)
  // Dispatches messages from server
  let { type, sender, time, body } = message;
  time = new Date(time).toLocaleTimeString(
    'en-US', 
    { timeZoneName: 'short' }
  );
  switch (type) {
    case 'system':
      // TODO setup style around here
      addChat(`(${time}) <strong>[${sender}]</strong>: ${body}`);
      break;
    case 'userSendChat':
      // TODO setup style around here
      addChat(`(${time}) <strong>${state.handle}</strong>: ${body}`)
      break;
    case 'connect':
      state.handle = message.handle;
      addChat(`(${time}) <strong>[${state.handle}]</strong>: ${body}`);
    // TMP fix wip
    // case 'userLeaveChat':
    //   addChat(`${time} ${sender}: ${body}`);
      break;
    default:
      console.log('Unhandled message.type:', message.type);
      break;
  }
}

ui.sendButton.addEventListener('click', (e) => {
  sendChatMessage(e);
})
// CSDR better way to do this without making it a form... \
// or should it be a form? eg POST to route with userId and data?...
// how does a form accomplish this?
ui.userTextInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') sendChatMessage(e);
})

export function addChat(body) {
  // TODO concatenates to existing state.chat
  // chatBox.innerHTML updated to state.chat every time this
  // fn invoked.
  ui.chatBox.innerHTML += `${body}<br />`;
  ui.chatBox.scrollTop = chatBox.scrollHeight;   // sets scrollTop to max value
}

export function addChatFromClient(body) {
  addChat(`${Date.now()} [cli] ${body}`)
}

function sendChatMessage(e) {
  if (!state.ws) {
    addChatFromClient(`Cannot send message, you are disconnected`);
    return;
  }
  console.log('IN sendChatMessage, ws:', state.ws)
  if (userTextInput.value.trim().length > 0) {
    const message = {
      type: 'userSendChat',
      body: ui.userTextInput.value,
      time: new Date(),
    }
    const rawMessage = JSON.stringify(message);
    state.ws.send(rawMessage);
  }
  ui.userTextInput.value = '';
}

function notifyLeave(e){
  // Notify WSServer connection is closing
  // so it can in turn notify the room.
  const message = {
    type: 'userLeaveChat',
    body: null,
    time: Date.now(),
    sender: null,
  };
  const rawMessage = JSON.stringify(message);
  state.ws.send(rawMessage);
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
