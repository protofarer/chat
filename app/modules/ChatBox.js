import { ui, state } from '../app.js'

export function addChat({body, id, payload=null}) {
  // TODO concatenates to existing state.chat
  // chatBox.innerHTML updated to state.chat every time this
  // fn invoked.
  let newLine = `<li id="${id}" class="chatLine" `
  newLine += `style="color:${payload?.sender === 'knet' ? 'green' : 'red'}">`
  newLine += `${body}</li>`

  state.chatText += newLine
  ui.chatBox.innerHTML += newLine
  ui.chatBox.scrollTop = chatBox.scrollHeight   // sets scrollTop to max value
}

export function addChatFromClient(body) {
  let newBody = `(${new Date().toLocaleTimeString(
        'en-US', 
        { timeZoneName: 'short' }
      )}) `
  newBody += `<strong>[cli]:</strong> `

  // TODO escape html entities ehre
  newBody += `<pre class="chatLineBody">${body}</pre>`
  
  addChat({
    body: newBody,
    id: `${Date.now()}-cli-${state.chatCounter}`,
    payload: {
      sender: 'cli'
    }
  })
  state.chatCounter++;
}

export function addChatFromServer(action) {
  let body = `(${new Date(action.payload.time).toLocaleTimeString(
        'en-US', 
        { timeZoneName: 'short' }
      )}) `
  body += `<strong>[${action.payload.sender}]:</strong> `

  // TODO escape html entities ehre
  body += `<pre class="chatLineBody">${action.payload.body}</pre>`

  let id = `${new Date(action.payload.time).getTime()}-`
  id += `${action.payload.sender}-`
  id += `${action.payload.chatCounter}`

  addChat({
    body,
    id,
    payload: action.payload,
  })
}