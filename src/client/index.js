import Client from './modules/Client.js'

export const ENV = new (function() {
  this.SERVER_PORT =  import.meta.env 
    ? import.meta.env.VITE_SERVER_PORT 
    : 3000
  this.SERVER_HOST = import.meta.env 
    ? `${import.meta.env.VITE_SERVER_HOST}`
    : `0.0.0.0`
  this.URL = `https://${this.SERVER_HOST}:${this.SERVER_PORT}`
})()

const root = document.querySelector('#root')
const client = new Client(root)
client.connect()

// TODO Use session if exists upon document load
// get handle from session
// dispatch action: client to logged in state


  console.log(`dont change nodement`, )