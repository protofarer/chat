import Client from './modules/Client.js'
import handler from './modules/handler.js'

export const ENV = new (function() {
  this.SERVER_PORT =  import.meta.env 
    ? import.meta.env.VITE_SERVER_PORT 
    : 3000
  this.SERVER_HOST = import.meta.env 
    ? `${import.meta.env.VITE_SERVER_HOST}`
    : `0.0.0.0`
  this.URL = `https://${this.SERVER_HOST}:${this.SERVER_PORT}`
})()

export const client = new Client(handler)

// TODO Use session if exists upon document load
// get handle from session
// dispatch action: client to logged in state

// Non-UI actions upon user loading page
document.onload = handleLoad()

async function handleLoad() {
  await handler({ type: 'ASK_LOGIN' })
  await handler({ type: 'ASK_WS_OPEN' })
}
