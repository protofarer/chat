import { ui } from '../app.js'

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