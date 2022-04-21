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
  };
  function resetState() {
    state = {
      isLoggedIn: false,
      isChatConnected: false,
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
    if (ws) {
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
  
  function sendChatMessage(e) {
    if (!ws) {
      addChatFromClient(`Cannot send message, you are disconnected`);
      return;
    }
    const message = {
      type: 'userSendChat',
      body: userTextInput.value,
      time: Date.now(),
      sender: userId,
    }
    const rawMessage = JSON.stringify(message);
    ws.send(rawMessage);
    userTextInput.value = '';
  }

  function handleEvent(event) {
    console.log('cli rcv event.type', event.type)
    switch (event.type) {
      case 'error':
        console.log('Error setting up websocket:', event);     
        break;
      case 'open':
        connectButton.innerText = 'Disconnect from chat'
        state.isChatConnected = true;
        break;
      case 'close':
        connectButton.innerText = 'Connect to chat'
        if (!state.isChatConnected) {
          addChatFromClient(`You must login to site before connected to chat.`);
        } else {
          ws = null;
          console.log(event)
          handleMessage(JSON.parse(event.data));
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
        userId = message.userId;
        addChat(`${time} ${sender}: ${body}`);
        break;
      case 'userSendChat':
        // TODO setup style here
        addChat(`${time} ${sender}: ${body}`)
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
})()
