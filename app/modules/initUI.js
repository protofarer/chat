import { state, ENV } from '../app.js'
import handler from './handler.js';
import { addChatFromClient } from './chat.js';
import Message from './Message.js';

export default class {
  constructor(handler) {
    this.loginButton = document.querySelector('#login');
    this.connectButton = document.querySelector('#connect');
    this.chatBox = document.querySelector('#chatBox');
    this.usersList = document.querySelector('#chatUsersList');
    this.userTextInput = document.querySelector('#userTextInput');
    this.sendButton = document.querySelector('#send');
    this.setupListeners()

    this.handler = handler;
  }

  setupListeners() {
    this.loginButton.addEventListener('click', handleLogin.bind(this));
    this.connectButton.addEventListener('click', handleConnect.bind(this))
    this.sendButton.addEventListener('click', handleSend.bind(this))
    this.userTextInput.addEventListener('keydown', handleTextInput.bind(this))

    function handleTextInput(e) {
      if (e.key === 'Enter') handleSend(e);
    }
    
    function handleSend() {
      if (!state.ws) {
        handler({ type: 'SEND_FAIL_WHILE_DISCONNECTED' })
        return;
      }
      console.log('IN sendChatMessage, ws:', state.ws)
      if (this.userTextInput.value.trim().length > 0) {
        handler({ type: 'SEND_CHAT' })
        this.userTextInput.value = '';
      }
    }

    async function handleLogin() {
      if (!state.isLoggedIn) {
        this.handler({type: 'LOGIN'})
      } else {
        if (state.isChatConnected) {
          // TYPE DENY_LOGOUT
          addChatFromClient('You must disconnect from chat before \
            logging out. <auto-disconnect will be enable in future \
            release>');
        } else {
          this.handler({type: 'LOGOUT'})
        }
      }
    }
    async function handleConnect() {
      // Is a toggle button, thus cannot attempt a disconnect when already disconnected
      // As a result this condition isn't handled in the event handler 
      if (state.ws) { 
        // TMP possible fix
        // Need this in order to trigger server to send the leave chat room message
        // notifyLeave();

        state.ws.onerror = state.ws.onopen = state.ws.onclose = null;
        // TMP fix wip
        // BUG? using removeEL's causes the client to not receive
        // an event.type close that triggers the "left chat" chatbox msg.
        // ws.removeEventListener('open', handleWSEvents);
        // ws.removeEventListener('message', handleWSEvents);
        // ws.removeEventListener('error', handleWSEvents);
        // ws.removeEventListener('close', handleWSEvents);
        state.ws.close(1000, 'user intentionally disconnected');
        // ws = null;
        state.room = '';
      } else {
          // ws = new WebSocket(`wss://${location.host}`);
        state.ws = new WebSocket(`${ENV.WSS_HOST}:${ENV.PORT}`);
        state.ws.addEventListener('open', handleWSEvents.bind(this));
        state.ws.addEventListener('message', handleWSEvents.bind(this));
        state.ws.addEventListener('error', handleWSEvents.bind(this));
        state.ws.addEventListener('close', handleWSEvents.bind(this));
      
        function handleWSEvents(event) {
          // Dispatches websocket event actions
          console.log('ws event.type', event.type)
          switch (event.type) {
            case 'error':
              console.log('WS Error code:', event.code);     
              break;
            case 'open':
              // Can only open if already logged in
              handler({ type: 'WS_OPEN' })
              break;
            case 'close':
              // WS sends a close event even when a new ws object fails to connect
              // Thus this case block must:
              if (!state.isLoggedIn) {              // handle close events when not logged in
                handler({ type: 'WS_CLOSE_WHILE_LOGGEDOUT'})
              } else if (state.isChatConnected) {   // handle close events when logged in
                handler({ type: 'WS_CLOSE_WHILE_LOGGEDIN' })
              }
              break;
            case 'message':
              console.log('raw message event from server', event)
              const message = Message.parseEventData(event);
              handler(message);
              break;
            default:
              console.log('Unhandled event.type:', event.type)
          }
        }
      }
    };
  }

  // Handler calls this as its last evaluation.
  update() {
    this.loginButton.innerText = state.isLoggedIn 
      ? 'LOGOUT'
      : 'LOGIN';
    this.userTextInput.value = state.textInput;  
    this.connectButton.innerText = state.isChatConnected
      ? 'DISCONNECT'
      : 'CONNECT'
  }

}