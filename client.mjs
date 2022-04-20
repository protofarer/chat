import WebSocket from 'ws';

const url = `ws://localhost:8888`;

const ws = new WebSocket(url)

const now = () => {
  return `[${Date.now()}]:`;
}

ws.on('open', () => {
  console.log(`${now()} connected`);
  ws.send(`Hello from clientland`);
})

ws.on('message', (data) => {
  console.log(`Received a transmission from the other side`);
  const msg = JSON.parse(data);
  console.log(`[${msg.time}] ${msg.name}: ${msg.body}`);
})

ws.on('error', (error) => {
  console.error('Error:', error[Object.getOwnPropertySymbols(error)[3]]);
})

ws.on('close', () => {
  ws.send(`Goodbye mr robot`)
})
