(() => {
  const loginButton = document.querySelector('#login');
  const connectButton = document.querySelector('#connectChat');
  const logoutButton = document.querySelector('#logout');
  const chatBox = document.querySelector('#chatBox');
  const usersList = document.querySelector('#chatUsersList');
  const userTextInput = document.querySelector('#userTextInput');
  const sendButton = document.querySelector('#send');


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
        ws.addEventListener('error', () => addChat('WebSocket error'));
        ws.addEventListener('close', () => {
          connectButton.innerText = 'Connect to chat'
          addChat('[client] You have left the chat.')
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
      addChat('[client] Cannot send message, you are disconnected');
      return;
    }
    const message = {
      type: 'userSendChat',
      body: userTextInput.value,
      time: Date.now(),
    }
    ws.send(message);
    userTextInput.value = '';
  }
  function addChat(body) {
    chatBox.textContent += `\n${body}`;
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  function handleEvent(event) {
    console.log('cli rcv event.type', event.type)
    switch (event.type) {
      case 'open':
        connectButton.innerText = 'Disconnect from chat'
        addChat('[client] You have entered the chat.');
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
    switch (message.type) {
      case 'system':
        // TODO setup style here
        addChat(`${message.time} [sys]: ${message.body}`);
        break;
      case 'userSendChat':
        // TODO setup style here
        addChat(`${message.time} ${message.userHandle}: ${message.body}`)
      default:
        console.log('unhandled message.type');
        break;
    }
  }
})()
