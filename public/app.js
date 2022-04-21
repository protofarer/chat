(() => {
  const loginButton = document.querySelector('#login');
  const connectButton = document.querySelector('#connectChat');
  const logoutButton = document.querySelector('#logout');
  const chatBox = document.querySelector('#chatBox');
  const usersList = document.querySelector('#chatUsersList');
  const userTextInput = document.querySelector('#userTextInput');
  const sendButton = document.querySelector('#send');

  const updateChat = (msg) => {
    // TODO add time and user
    chatBox.textContent += `\n${msg}`;

    // What's this do?
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  loginButton.addEventListener('click', async () => {
    let response;
    let data;
    try {
      response = await fetch(
        '/login', 
        { method: 'POST', credentials: 'same-origin', }
      );

      if (response.ok) {
        data = await response.json();
        // msg = data;
        // msg = JSON.stringify(data, null, 2);
      } else {
        throw new Error('Unexpected login json response');
      }

      updateChat(data.message);
    } catch (err) {
      console.log('Login Error:', err.message);
    }
  })

  logoutButton.addEventListener('click', async () => {
    let response;
    try {
      response = await fetch(
        '/logout',
        { method: 'POST', credentials: 'same-origin' }
      );
    } catch (err) {
      console.log('logout fetchError:', err.message);
      throw new Error('Unexpected response');
    }
    connectButton.innerText = 'Connect to chat';
    
    let msg;
    if (response.ok) {
      const data = await response.json();
      msg = JSON.stringify(data, null, 2);
    } else {
      console.log('logout responseError:', response);
      throw new Error('Unexpected response');
    }

    updateChat(JSON.parse(msg).message);
  })

  let ws;

  connectButton.addEventListener('click', () => {
    if (ws) {
      connectButton.innerText = 'Connect to chat'
      ws.onerror = ws.onopen = ws.onclose = null;
      ws.close();
    } else {
      ws = new WebSocket(`wss://${location.host}`);
      connectButton.innerText = 'Disconnect from chat'
  
      ws.addEventListener('open', () => updateChat('You have entered the chat.'));
      ws.addEventListener('message', (event) => {
        // TODO
        // discern between the res.send() and ws.send() messages

        console.log(typeof event)
        console.dir(event)
        // if event is a response object then parse
        // if event is a ws message, proceed 
        // const parsedMessage = JSON.parse(message.data);
        // switch (parsedMessage.type) {
        //   case 'system':
        //     console.log('switch case system')
        //     updateChat(parsedMessage.body);
        //     break;
        //   default:
        //     console.log('switch case default')
        //     updateChat(message);
        // }
        // updateChat((message))
      });
      ws.addEventListener('error', () => updateChat('WebSocket error'));
      ws.addEventListener('close', () => {
        updateChat('You have left the chat.')
        ws = null;
      })
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
      updateChat('Cannot send message, you are disconnected');
      return;
    }
    const msg = userTextInput.value;
    ws.send(msg);
    updateChat(msg)
    userTextInput.value = '';
  }
})()