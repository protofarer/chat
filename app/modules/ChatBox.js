export function addChat(client, { id, time, sender, body }) {
  const fragment = new DocumentFragment()

  const chatLine = document.createElement('li')

  // * id unique and calculated differently between server and client senders
  chatLine.id = id;

  if (sender === 'knet') {
    chatLine.className = "chatLineServer"
  } else if (sender === 'cli' || sender === 'room-general') {
    chatLine.className = "chatLineClient"
  } else {
    chatLine.className = "chatLineGeneral"
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

  // VIGIL parse
    // replace html entities
    // sanitize(in vein of Sanitizer API): 
    // strip out XSS-relevant input
    // strip out script tags
    // strip out custom elements
    // strip out comments
  
  chatLineText.innerHTML = text;

  chatLine.appendChild(chatLineText)
  fragment.appendChild(chatLine)
  client.chatBox.appendChild(fragment)

  // client.chatBox.innerHTML += newLine
  client.chatBox.scrollTop = chatBox.scrollHeight   // sets scrollTop to max value
}

export function addChatFromClient(client, lineText) {
  const id = `${Date.now()}-cli-${client.chatCounter}`

  const time = new Date().toLocaleTimeString(
        'en-US', 
        { timeZoneName: 'short' }
      )

  const sender = 'cli'
  
  addChat(client, {
    id,
    time,
    sender,
    body: lineText,
  })
  // Client appends chatCounter to id, server handles its own
  client.chatCounter++;
}

export function addChatFromServer(client, action) {
  let id = `${new Date(action.payload.time).getTime()}-`
  id += `${action.payload.sender}-`
  id += `${action.payload.chatCounter}`

  let time = new Date(action.payload.time).toLocaleTimeString(
        'en-US', 
        { timeZoneName: 'short' }
      )

  const sender = action.payload.sender

  addChat(client, {
    id,
    time,
    sender,
    body: action.payload.body
  })
}