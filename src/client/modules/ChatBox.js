export default class ChatBox {
  constructor(container) {
    this.element = document.createElement('ul')
    this.element.id = 'chatBox'
    container.appendChild(this.element)
  }

  addChat({ id, time, sender, body }) {
    const fragment = new DocumentFragment()
    
    const chatLine = document.createElement('li')
  
    // ! id unique and calculated differently between server and client senders
    chatLine.id = id;
    chatLine.className = 'chatLine'
  
    if (sender === 'knet') {
      chatLine.className += " chatLineServer"
    } else if (sender === 'cli' || sender === 'room-general') {
      chatLine.className += " chatLineClient"
    }  

    const chatLineTimestamp = document.createElement('span')
    chatLineTimestamp.className = 'chatLineTimestamp'
    chatLineTimestamp.innerHTML = `(${time})`
    chatLine.appendChild(chatLineTimestamp)

    const chatLinePrefix = document.createElement('span')
    chatLinePrefix.className = 'chatLinePrefix'
    chatLinePrefix.innerHTML = ` <strong>[${sender}]</strong>: `
    chatLine.appendChild(chatLinePrefix)
  
    const chatLineBody = document.createElement('span')
    chatLineBody.className = 'chatLineBody'
    chatLineBody.innerHTML = body;
    chatLine.appendChild(chatLineBody)

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
    
    this.addChat({
      id,
      time,
      sender,
      body: lineText,
    })
    // Client appends chatCounter to id, server handles its own
    client.chatCounter++;
  }
  
  addChatFromServer(action) {
    let id = `${new Date(action.payload.time).getTime()}-`
    id += `${action.payload.sender}-`
    id += `${action.payload.chatCounter}`
  
    let time = new Date(action.payload.time).toLocaleTimeString(
          'en-US', 
          { timeZoneName: 'short' }
        )
  
    const sender = action.payload.sender
  
    this.addChat({
      id,
      time,
      sender,
      body: action.payload.body
    })
  }
}