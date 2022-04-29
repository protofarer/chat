export default class Message {

  static send(ws, message) {
    const rawMessage = JSON.stringify(message)
    // What does ws.send return? Is it async? try/catch?
    ws.send(rawMessage)
    return rawMessage
  }

  static parseEventData(event) {
    return JSON.parse(event.data)
  }

}

