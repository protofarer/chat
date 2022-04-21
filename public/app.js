(() => {
  const loginButton = document.querySelector('#login');
  const connectButton = document.querySelector('#connectChat');
  const logoutButton = document.querySelector('#logout');
  const chatBox = document.querySelector('#chatBox');
  const usersList = document.querySelector('#chatUsersList');
  const userTextInput = document.querySelector('#userTextInput');
  const sendButton = document.querySelector('#send');

  let userId;
  let state = {
    isLoggedIn: false,
    isChatConnected: false,
    room: '',
  };
  function resetState() {
    state = {
      isLoggedIn: false,
      isChatConnected: false,
      room: '',
    }
  }

  loginButton.addEventListener('click', async () => {
    if (!state.isLoggedIn) {
      try {
        const response = await fetch(
          '/login', 
          { method: 'POST', credentials: 'same-origin', }
        );
  
        if (response.ok) {
          const data = await response.json();
          addChat(data.message);
          state.isLoggedIn = true;
        } else {
          throw new Error('Unexpected login response');
        }
  
      } catch (err) {
        console.log('Login Error:', err.message);
      }
    } else {
      addChatFromClient(`You are already logged in!`);
    }
  })

  logoutButton.addEventListener('click', async () => {
    if (state.isLoggedIn) {
      try {
        const response = await fetch(
          '/logout',
          { method: 'POST', credentials: 'same-origin' }
        );
        if (response.ok) {
          const data = await response.json();
          addChat(data.message);
          state.isLoggedIn = false;
        } else {
          throw new Error('Unexpected logout response');
        }
      } catch (err) {
        console.log('Logout error:', err.message);
      }
    } else {
      addChatFromClient(`You are already logged out!`);
    }
  })

  let ws;

  connectButton.addEventListener('click', () => {
    // Is a toggle button, thus cannot attempt a disconnect when already disconnected
    // As a result this condition isn't handled in the event handler 
    if (ws) { 
      // Need this in order to trigger server to send the leave chat room message
      sendCloseMessage();
      
      ws.onerror = ws.onopen = ws.onclose = null;
      ws.close();
    } else {
      ws = new WebSocket(`wss://${location.host}`);
      ws.addEventListener('open', handleEvent);
      ws.addEventListener('message', handleEvent);
      ws.addEventListener('error', handleEvent);
      ws.addEventListener('close', handleEvent);
    }
  });

  sendButton.addEventListener('click', sendChatMessage)
  userTextInput.addEventListener('keydown', (e) => {
    // console.log('e.key', e.key)
    // console.log('e.keycode', e.keycode)
    if (e.key === 'Enter') sendChatMessage(e);
  })
  

  function handleEvent(event) {
    console.log('cli rcv event.type', event.type)
    switch (event.type) {
      case 'error':
        console.log('WS Error:', event);
        console.log('WS Error code:', event.code);     
        break;
      case 'open':
        // Can only open if already logged in
        connectButton.innerText = 'Disconnect from chat'
        state.isChatConnected = true;
        state.room = 'general';
        break;
      case 'close':
        // WS can send a close event on an attempted new ws
        // even if never connecting, thus the close event handler must address
        if (!state.isLoggedIn) {                  // close events when not logged in
          addChatFromClient(`You must login to site before connected to chat.`);
        } else if (state.isChatConnected) {       // close events when logged in
          connectButton.innerText = 'Connect to chat'
          addChatFromClient(`========== You have left the chat ========`);
          ws = null;
          state.isChatConnected = false;
          state.room = '';
        }
        break;
      case 'message':
        handleMessage(JSON.parse(event.data));
        break;
      default:
        console.log('Unhandled event.type')
    }
  }
  
  function handleMessage(message) {
    console.log(message)
    let { type, sender, time, body } = message;
    switch (type) {
      case 'system':
        // TODO setup style here
        console.log(`cli rcvd sys msg`)
        console.log(message);
        userId = message.userId;
        addChat(`${time} ${sender}: ${body}`);
        break;
      case 'userSendChat':
        // TODO setup style here
        addChat(`${time} ${sender}: ${body}`)
        break;
      case 'userLeaveChat':
        addChat(`${time} ${sender}: ${body}`);
        break;
      default:
        console.log('unhandled message.type');
        break;
      }
  }
  
  function addChat(body) {
    chatBox.textContent += `\n${body}`;
    chatBox.scrollTop = chatBox.scrollHeight;
  }
  
  function addChatFromClient(body) {
    addChat(`${Date.now()} [cli] ${body}`)
  }
  
  function sendChatMessage(e) {
    if (!ws) {
      addChatFromClient(`Cannot send message, you are disconnected`);
      return;
    }
    const message = {
      type: 'userSendChat',
      body: userTextInput.value,
      time: Date.now(),
    }
    const rawMessage = JSON.stringify(message);
    ws.send(rawMessage);
    userTextInput.value = '';
  }

  function sendCloseMessage(e) {
    const message = {
      type: 'userLeaveChat',
      body: null,
      time: Date.now(),
      sender: null,
    };
    const rawMessage = JSON.stringify(message);
    ws.send(rawMessage);
  }
  
})()
