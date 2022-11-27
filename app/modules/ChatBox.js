export default class ChatBox {
  constructor(container) {
    this.element = document.createElement('ul')
    this.element.id = 'chatBox'
    container.appendChild(this.element)
  }

  addChat(client, { id, time, sender, body }) {
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
    this.element.appendChild(fragment)
  
    // this.element.innerHTML += newLine
    this.element.scrollTop = this.element.scrollHeight   // sets scrollTop to max value
  }
  
  addChatFromClient(client, lineText) {
    const id = `${Date.now()}-cli-${client.chatCounter}`
  
    const time = new Date().toLocaleTimeString(
          'en-US', 
          { timeZoneName: 'short' }
        )
  
    const sender = 'cli'
    
    this.addChat(client, {
      id,
      time,
      sender,
      body: lineText,
    })
    // Client appends chatCounter to id, server handles its own
    client.chatCounter++;
  }
  
  addChatFromServer(client, action) {
    let id = `${new Date(action.payload.time).getTime()}-`
    id += `${action.payload.sender}-`
    id += `${action.payload.chatCounter}`
  
    let time = new Date(action.payload.time).toLocaleTimeString(
          'en-US', 
          { timeZoneName: 'short' }
        )
  
    const sender = action.payload.sender
  
    this.addChat(client, {
      id,
      time,
      sender,
      body: action.payload.body
    })
  }
}