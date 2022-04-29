// import state
import { 
  state,
  ENV,
  ui
} from '../app.js'
import { addChat, addChatFromClient } from './chat.js'
import Message from './Message.js';

export default async function handler(action) {
  console.log('action.type:', action.type)

  switch (action.type) {
    case 'LOGIN':
      const loginData = await login();
      Message.handle(loginData);
      state.isLoggedIn = true;
      break;

    case 'LOGOUT':
      const logoutData = await logout();
      Message.handle(logoutData);
      state.isLoggedIn = false;
      state.isChatConnected = false;
      break;
    case 'SEND_FAIL_WHILE_DISCONNECTED':
      addChatFromClient(`Cannot send message, you are disconnected`);
      break;
    case 'SEND_CHAT':
      const message = {
        type: 'userSendChat',
        payload: {
          body: ui.userTextInput.value,
          time: new Date(),
        }
      }
      Message.send(state.ws, message);
      break;

    // ***
    // * From server
    // ***
    case 'SERVER_WELCOME':
      state.userHandle = action.payload.userHandle;
      addChat(`(${action.payload.time}) <strong>[${state.userHandle}]</strong>: ${action.payload.body}`);
      break;
    case 'SERVER_BROADCAST_CHAT':
      addChat(`(${action.payload.time}) <strong>${state.userHandle}</strong>: ${action.payload.body}`)
      break;

    // ***
    // * WebSocket Clientside
    // ***
    case 'WS_OPEN':
      state.isChatConnected = true;
      state.room = 'general';
      break;

    case 'WS_CLOSE_WHILE_LOGGEDOUT':
      addChatFromClient(`You must login to site before connected to chat.`);
      break;

    case 'WS_CLOSE_WHILE_LOGGEDIN':
      const leaveMessage = {
        type: 'system',
        sender: 'cli',
        time: new Date(),
        body: `======== You left the chat. Bye! ========`
      }
      Message.handle({ data: JSON.stringify(leaveMessage)});
      state.isChatConnected = false;
      state.room = '';
      // ws.destroy();
      // ws = null;

      // ws.onerror = ws.onopen = ws.onclose = null;
      // ws.close();
      state.ws = null;
      break;

    default:
      console.log('unhandled action:', action)
  }
  ui.update();
}


async function login() {
  console.log(`POST ${ENV.URL}/login`)
  try {
    const response = await fetch(
      `${ENV.URL}/login`, 
      { 
        method: 'POST', 
        credentials: 'same-origin'
      }
    );
    
    return response.ok 
      ? await response.json()
      : new Error('Unexpected login response');
  } catch (err) {
    throw new Error(`Unhandled logout error: ${err.message}`)
  }
}

async function logout() {
  try {
    const response = await fetch(
      `${ENV.URL}/logout`,
      { method: 'POST', credentials: 'same-origin' }
    );
    return response.ok
      ? await response.json()
      : new Error('Unexpected logout response');
  } catch (err) {
    throw new Error(`Unhandled logout error: ${err.message}`)
  }
}