(() => {
  const loginButton = document.querySelector('#login');
  const connectButton = document.querySelector('#connectChat');
  const logoutButton = document.querySelector('#logout');
  const chatBox = document.querySelector('#chatBox');
  const usersList = document.querySelector('#chatUsersList');
  const userTextInput = document.querySelector('#userTextInput');
  const sendButton = document.querySelector('#send');

  let userId;

  loginButton.addEventListener('click', async () => {
    try {
      const response = await fetch(
        '/login', 
        { method: 'POST', credentials: 'same-origin', }
      );

      if (response.ok) {
        const data = await response.json();
        addChat(data.message);
      } else {
        throw new Error('Unexpected login response');
      }

    } catch (err) {
      console.log('Login Error:', err.message);
    }
  })

  logoutButton.addEventListener('click', async () => {
    try {
      const response = await fetch(
        '/logout',
        { method: 'POST', credentials: 'same-origin' }
      );
      if (response.ok) {
        const data = await response.json();
        addChat(data.message);
      } else {
        throw new Error('Unexpected logout response');
      }
    } catch (err) {
      console.log('Logout error:', err.message);
    }
  })

  let ws;

  connectButton.addEventListener('click', () => {
    if (ws) {
      ws.onerror = ws.onopen = ws.onclose = null;
      ws.close();
    } else {
      try {
        ws = new WebSocket(`wss://${location.host}`);
        
        ws.addEventListener('open', handleEvent);
        ws.addEventListener('message', handleEvent);
        ws.addEventListener('error', () => addChatFromClient(`WebSocket error`));
        ws.addEventListener('close', () => {
          connectButton.innerText = 'Connect to chat'
          addChatFromClient(`You have left the chat.`);
          ws = null;
        })
      } catch (err) {
        console.log('Error setting up websocket:', err);
      }
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
      case 'open':
        connectButton.innerText = 'Disconnect from chat'
        addChatFromClient(`You have entered the chat`);
        // addChat(`${Date.now()} [cli] You have entered the chat.`);
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
