import { state } from "../index.js"

const colors = ['red', 'orange', 'yellow', 'green', 'blue', 'purple', 'cyan']

export default {
  buildHTML() {
    return state.usersList.reduce((html, userHandle, i) => {
     return html + `<li id=${i} style="color: ${colors[Math.floor(Math.random() * colors.length)]}">${userHandle === state.userHandle ? '<strong>(you) ' + userHandle + '</strong>' : userHandle}</li>`
    }, "")
  }
}