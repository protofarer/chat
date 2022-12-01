import Client from './modules/Client.js'

const root = document.querySelector('#root')
const client = new Client(root)
client.connect()