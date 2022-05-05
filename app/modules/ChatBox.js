import { ui, state } from '../app.js'

export function addChat({body, id, payload=null}) {
  // TODO concatenates to existing state.chat
  // chatBox.innerHTML updated to state.chat every time this
  // fn invoked.
  const newLine = `<li id="${id}" class="chatLine" style="color:${payload?.sender === 'knet' ? 'green' : 'red'}">${body}</li>`
  state.chatText += newLine
  ui.chatBox.innerHTML += newLine
  ui.chatBox.scrollTop = chatBox.scrollHeight   // sets scrollTop to max value
}

export function addChatFromClient(body) {
  addChat({
    body:`\
      (${new Date().toLocaleTimeString(
        'en-US', 
        { timeZoneName: 'short' }
      )}) \
      <strong>[cli]</strong> \
      ${body}\
    `,
    id: `${Date.now()}-cli-${state.chatCounter}`
  })
  state.chatCounter++;
}

export function addChatFromServer(action) {
  addChat({
    body: `\
      (${new Date(action.payload.time).toLocaleTimeString(
        'en-US', 
        { timeZoneName: 'short' }
      )}) \
      <strong>[${action.payload.sender}]</strong>: \
      ${action.payload.body}\
    `,
    id: `${new Date(action.payload.time).getTime()}-${action.payload.sender}-${action.payload.chatCounter}`,
    payload: action.payload,
  })
}