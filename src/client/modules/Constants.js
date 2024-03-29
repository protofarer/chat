export default {
  client: {
    ASK_LOGIN: {
      word: 'ASK_LOGIN',
    },
    ASK_LOGOUT: {
      word: 'ASK_LOGOUT',
    },
    TOGGLE_TIMESTAMPS: {
      word: 'TOGGLE_TIMESTAMPS',
    },
    FAIL_LOGOUT_WHILE_CONNECTED: {
      word: 'FAIL_LOGOUT_WHILE_CONNECTED',
      text: 'You must disconnect from chat before logging out from site. <auto-disconnect will be enable in future release>'
    },
    FAIL_CONNECT_WHILE_LOGGEDOUT: {
      word: 'FAIL_CONNECT_WHILE_LOGGEDOUT',
      text: `You must login before connecting to chat`
    },
    FAIL_SEND_WHILE_DISCONNECTED: {
      word: 'SEND_FAIL_WHILE_DISCONNECTED',
      text: `Cannot send message, you are disconnected`
    },
    SEND_CHAT: {
      word: 'SEND_CHAT',
    },
    ASK_WS_OPEN: {
      word: 'ASK_WS_OPEN',
    },
    ASK_WS_CLOSE: {
      word: 'ASK_WS_CLOSE',
      text: `====== You left the chat. Bye! ======`
    },
    PING: {
      word: 'PING'
    },
    ERROR: {
      word: 'ERROR',
      text: `Unhandled error, sorry!`
    },
  },
  server: {
    LOGGEDIN: {
      word: 'LOGGEDIN',
    },
    LOGGEDOUT: {
      word: 'LOGGEDOUT',
    },
    UNICAST_WELCOME: {
      word: 'UNICAST_WELCOME',
      text(_, handle) {
        return `====== Hi <em>${handle}</em>, welcome to kenny.net general chat ======`
      }
    },
    BROADCAST_CHAT: { 
      word: 'BROADCAST_CHAT',
    },
    BROADCAST_ENTRY: {
      word: 'BROADCAST_ENTRY',
      text(_, handle) {
        return `====== <em>${handle}</em> entered the chat. ======`
      }
    },
    BROADCAST_LEAVE: { 
      word: 'BROADCAST_LEAVE',
      text(_, handle) {
        return `====== <em>${handle}</em> left the chat. ======`
      }
    },
    PONG: {
      word: 'PONG'
    },
    HANDLE_POOL: [
      'ryu',
      'vanhalen',
      'schopenhauer',
      'kaztheminotaurofdoom',
      'raistlyn',
      // 'miketyson',
      // 'pikachu',
      // 'eddie',
      // 'guile',
      // 'bulbasaur',
      // 'woolymammoth',
      // 'barney',
      // 'lylading',
      // 'scarface',
      // 'donatello',
      // 'mastersplinter',
    ],
    DEFAULT_ROOMS: [
      "general",
      "fireside",
    ],
  },
  ws: {
    OPEN: {
      word: 'OPEN',
    },
    CLOSE: {
      word: 'CLOSE',
      text: `====== The server closed your connect. Adios! ======`
    },
    FAIL_LOGOUT_WHILE_WS_CONNECTED: {
      word: 'FAIL_LOGOUT_WHILE_WS_CONNECTED',
      text: `There is no ws connection to close while logged out`
    },
    HEARTBEAT_INTERVAL: {
      value: 2000
    },
    HEARTBEAT_LATENCYBUFFER: {
      value: 1000
    }
  }
}