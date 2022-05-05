import { ui, state } from '../app.js'

export function addChat({ id, time, sender, body, }) {
  const chatBox = document.querySelector('#chatBox')
  const line = DocumentFragment.createElement('li')

  // id unique and calculated differently between server and client senders
  line.id = id;

  // Set css class according to sender
  if (payload.sender === 'knet') {
    line.className = "chatLineServer"
  } else if (payload.sender === 'cli' || payload.sender === 'room-general') {
    line.className = "chatLineClient"
  } else {
    line.className = "chatLine"
  }

  let lineText = ''
  lineText += `(${time}) `;
  lineText += ` <strong>[${sender}]</strong>:`

  // TODO sanitize
  // TODO replace html entities

  ui.chatBox.innerHTML += newLine
  ui.chatBox.scrollTop = chatBox.scrollHeight   // sets scrollTop to max value
}

export function addChatFromClient(lineTextBody) {
  const id = `${Date.now()}-cli-${state.chatCounter}`

  const time = new Date().toLocaleTimeString(
        'en-US', 
        { timeZoneName: 'short' }
      )

  const sender = 'cli'
  
  addChat({
    id,
    time,
    sender,
    body: lineTextBody,
  })
  // Client appends chatCounter to id, server handles its own
  state.chatCounter++;
}

export function addChatFromServer(action) {
  let id = `${new Date(action.payload.time).getTime()}-`
  id += `${action.payload.sender}-`
  id += `${action.payload.chatCounter}`

  let time = new Date(action.payload.time).toLocaleTimeString(
        'en-US', 
        { timeZoneName: 'short' }
      )

  const sender = action.payload.sender

  addChat({
    id,
    time,
    sender,
    body: action.payload.body
  })
}