import { addChat } from "./chat.js"

export default class Message {

  static send(ws, message) {
    const rawMessage = JSON.stringify(message)
    // What does ws.send return? Is it async? try/catch?
    ws.send(rawMessage)
    return rawMessage
  }

  static parse(data) {
    // console.log('data',data)
    const message = JSON.parse(data)   // TODO JSON.parse replacer for time property
    message.payload.time = new Date(message.payload.time).toLocaleTimeString(
      'en-US', 
      { timeZoneName: 'short' }
    )
    return message
  }

  static parseEventData(event) {
    return Message.parse(event.data)
  }

  static handle(data) {
  // Formats and acts on messages from server

  // OPT check and handle event typeof (server message passing)
  // OPT check and handle object typeof (local message passing, making use of this data model)
  
    // const data = JSON.stringify(event)
    // const { type, sender, time, body } = Message.parse(event)

    const { sender, time, body } = data.payload

    switch (data.type) {
      case 'system':
        // TODO setup style around here
        addChat(`(${time}) <strong>[${sender}]</strong>: ${body}`)
        break
      case 'userSendChat':
        // TODO setup style around here
        break
      default:
        console.log('Unhandled message.type:', message.type)
        break
    }
  }
}

