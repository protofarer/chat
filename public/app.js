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

  sendButton.addEventListener('click', sendMsg)
  userTextInput.addEventListener('keydown', (e) => {
    // console.log('e.key', e.key)
    // console.log('e.keycode', e.keycode)
    if (e.key === 'Enter') sendMsg();
  })
  
  function sendMsg() {
    if (!ws) {
      addChat('[client] Cannot send message, you are disconnected');
      return;
    }
    const msg = userTextInput.value;
    ws.send(msg);
    addChat(msg)
    userTextInput.value = '';
  }
  function addChat(body) {
    // TODO add time and user
    // TODO format color based on type
    // sys = blue, user = yellowgreen
    chatBox.textContent += `\n${body}`;

    // What's this do?
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  function handleEvent(event) {
    console.log('cli rcv event.type', event.type)
    console.log('event.data', event.data)
    // const data = JSON.parse(event.data);
    switch (event.type) {
      case 'open':
        connectButton.innerText = 'Disconnect from chat'
        addChat('[client] You have entered the chat.');
        break;
      case 'message':
          const message = event.data;
          if (message.type === 'system') {
            addChat(`${message.time} [sys]: ${message.body}`);
          }  //
          // if event is a response object then parse
          // if event is a ws message, proceed 
          // const parsedMessage = JSON.parse(message.data);
          // switch (parsedMessage.type) {
          //   case 'system':
          //     console.log('switch case system')
          //     addChat(parsedMessage.body);
          //     break;
          //   default:
          //     console.log('switch case default')
          //     addChat(message);
          // }
          // addChat((message))


    }

  }
  function handleMessage(message) {

  }
})()
