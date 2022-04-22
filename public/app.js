(() => {
  const loginButton = document.querySelector('#login');
  const connectButton = document.querySelector('#connect');
  const chatBox = document.querySelector('#chatBox');
  const usersList = document.querySelector('#chatUsersList');
  const userTextInput = document.querySelector('#userTextInput');
  const sendButton = document.querySelector('#send');

  let ws;
  let state = {
    isLoggedIn: false,
    isChatConnected: false,
    room: '',
  };

  loginButton.addEventListener('click', async () => {
    if (!state.isLoggedIn) {
      try {
        const response = await fetch(
          '/login', 
          { method: 'POST', credentials: 'same-origin', }
        );
        
        if (response.ok) {
          const data = await response.json();
          const event = {};
          event.data = JSON.stringify(data);
          handleMessage(event);
          state.isLoggedIn = true;
          loginButton.innerText = 'LOGOUT';
        } else {
          throw new Error('Unexpected login response');
        }
      } catch (err) {
        console.log('Login Error:', err);
      }
    } else {
      try {
        const response = await fetch(
          '/logout',
          { method: 'POST', credentials: 'same-origin' }
        );
        if (response.ok) {
          const data = await response.json();
          const event = {};
          event.data = JSON.stringify(data);
          handleMessage(event);
          // addChat(data.message);
          state.isLoggedIn = false;
          loginButton.innerText = 'LOGIN';
        } else {
          throw new Error('Unexpected logout response');
        }
      } catch (err) {
        console.log('Logout error:', err.message);
      }
    }
  });

  connectButton.addEventListener('click', () => {
    // Is a toggle button, thus cannot attempt a disconnect when already disconnected
    // As a result this condition isn't handled in the event handler 
    if (ws) { 
      // TMP possible fix
      // Need this in order to trigger server to send the leave chat room message
      // notifyLeave();

      ws.onerror = ws.onopen = ws.onclose = null;
      // TMP fix wip
      // BUG? using removeEL's causes the client to not receive
      // an event.type close that triggers the "left chat" chatbox msg.
      // ws.removeEventListener('open', handleWSEvents);
      // ws.removeEventListener('message', handleWSEvents);
      // ws.removeEventListener('error', handleWSEvents);
      // ws.removeEventListener('close', handleWSEvents);
      ws.close();
    } else {
      ws = new WebSocket(`wss://${location.host}`);
      ws.addEventListener('open', handleWSEvents);
      ws.addEventListener('message', handleMessage);
      ws.addEventListener('error', handleWSEvents);
      ws.addEventListener('close', handleWSEvents);
    }
  });

  sendButton.addEventListener('click', sendChatMessage)
  // CSDR better way to do this without making it a form... \
  // or should it be a form? eg POST to route with userId and data?...
  // how does a form accomplish this?
  userTextInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendChatMessage(e);
  })
  

  function handleWSEvents(event) {
    // Dispatches websocket event actions
    console.log('cli rcv event.type', event.type)
    switch (event.type) {
      case 'error':
        console.log('WS Error code:', event.code);     
        break;
      case 'open':
        // Can only open if already logged in
        connectButton.innerText = 'Disconnect from chat';
        state.isChatConnected = true;
        state.room = 'general';
        break;
      case 'close':
        // WS sends a close event even when a new ws object fails to connect
        // Thus this case block must:
        if (!state.isLoggedIn) {              // handle close events when not logged in
          addChatFromClient(`You must login to site before connected to chat.`);
        } else if (state.isChatConnected) {   // handle close events when logged in
          const leaveMessage = {
            type: 'system',
            sender: 'cli',
            time: new Date(),
            body: `======== You left the chat. Bye! ========`
          }
          let event = {};
          event.data = JSON.stringify(leaveMessage)
          handleMessage(event);
          state.isChatConnected = false;
          state.room = '';
          connectButton.innerText = 'Connect to chat'
          ws = null;
        }
        break;
      default:
        console.log('Unhandled event.type:', event.type)
    }
  }
  
  function handleMessage(event) {
    // Formats and acts on messages from server

    // TODO check and handle event typeof (server message passing)
    // TODO check and handle object typeof (local message passing)
    const message = JSON.parse(event.data);
    // Dispatches messages from server
    let { type, sender, time, body } = message;
    time = new Date(time).toLocaleTimeString(
      'en-US', 
      { timeZoneName: 'short' }
    );
    switch (type) {
      case 'system':
        // TODO setup style around here
        addChat(`(${time}) <strong>[${sender}]</strong>: ${body}`);
        break;
      case 'userSendChat':
        // TODO setup style around here
        addChat(`(${time}) <strong>${sender}</strong>: ${body}`)
        break;
      // TMP fix wip
      // case 'userLeaveChat':
      //   addChat(`${time} ${sender}: ${body}`);
      //   break;
      default:
        console.log('Unhandled message.type');
        break;
    }
  }
  
  function addChat(body) {
    // TODO concatenates to existing state.chat
    // chatBox.innerHTML updated to state.chat every time this
    // fn invoked.
    chatBox.innerHTML += `${body}<br />`;
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

  function notifyLeave(e){
    // Notify WSServer connection is closing
    // so it can in turn notify the room.
    const message = {
      type: 'userLeaveChat',
      body: null,
      time: Date.now(),
      sender: null,
    };
    const rawMessage = JSON.stringify(message);
    ws.send(rawMessage);
  }
  
  function resetState() {
    state = {
      isLoggedIn: false,
      isChatConnected: false,
      room: '',
    }
  }
})()
