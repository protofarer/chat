import { ui, state } from '../app.js'

export function addChat({ id, time, sender, body }) {
  const fragment = new DocumentFragment()

  const chatLine = document.createElement('li')
  // id unique and calculated differently between server and client senders
  chatLine.id = id;

  // Set css class according to sender
  if (sender === 'knet') {
    chatLine.className = "chatLineServer"
  } else if (sender === 'cli' || sender === 'room-general') {
    chatLine.className = "chatLineClient"
  } else {
    chatLine.className = "chatLine"
  }

  const chatLinePrefix = document.createElement('span')
  let prefixText = ''
  prefixText += `(${time}) `;
  prefixText += ` <strong>[${sender}]</strong>: `
  chatLinePrefix.innerHTML = prefixText;
  chatLine.appendChild(chatLinePrefix)

  const chatLineText = document.createElement('span')
  chatLineText.className = 'chatLineText'
  let text = body;

  // chatLineText.setHTML(text)    // setHTML is experimental as of 5/5/22
  // Sanitizer.sanitizeFor()    // Sanitizer API is experimental as of 5/5/22

  // VIGIL parse
    // replace html entities
    // sanitize(in vein of Sanitizer API): 
    // strip out XSS-relevant input
    // strip out script tags
    // strip out custom elements
    // strip out comments
  
  chatLineText.textContent = text;

  chatLine.appendChild(chatLineText)
  fragment.appendChild(chatLine)
  ui.chatBox.appendChild(fragment)

  // ui.chatBox.innerHTML += newLine
  ui.chatBox.scrollTop = chatBox.scrollHeight   // sets scrollTop to max value
}

export function addChatFromClient(lineText) {
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
    body: lineText,
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