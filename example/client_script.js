const socket = io('http://localhost:8080', { path: `/` });


const joinRoomBtn = document.getElementById("joinRoomBtn")
const userIdField = document.getElementById("userName")
const sendBtn = document.getElementById("sendMessage")
const chatMessage = document.getElementById("chatMessage")
const chatAppend = document.getElementById("chatAppend")
const messagesContainer = document.getElementById("messageContainer")

function initClientChat() {
  let roomId = null
  let userId = null
  const usersTyping = []
    
  joinRoomBtn.addEventListener('click', (e) => {
    if (!userIdField.value.length) {
      return alert("User Id cannot be blank to start convo")
    }
    userId = userIdField.value
    socket.emit("authenticate", {
      userId: userIdField.value,
      otherData: {} // pass in other authenticate params
    })
  })
  
  socket.on('conversation', (convoId) => {
    messagesContainer.insertAdjacentHTML("afterbegin", `Connected to room ${convoId}`)
    messagesContainer.hidden = false
    roomId = convoId
  })
  
  socket.on("newMessage", (message) => {
    chatAppend.insertAdjacentHTML("beforeend", createMessageUI(message))
  })
  
  sendBtn.addEventListener("click", (e) => {
    if (!roomId.length) {
      return
    }
    const data = {
      senderId: userId,
      roomId,
      body: e.target.previousElementSibling.value,
    }
    socket.emit("message", data);
    chatAppend.insertAdjacentHTML(
      "beforeend",
      createMessageUI(data)
    )
    e.target.previousElementSibling.value = ""
  })
  
  chatMessage.addEventListener("keypress", throttle(() => {
    socket.emit("typing", { roomId, userId })  
  }), 2000)
  
  chatMessage.addEventListener("keyup", throttle(() => {
    socket.emit("stop typing", { roomId, userId })
  }), 6000)
  
  socket.on("typing", (user) => {
    if (usersTyping.findIndex((e) => e == user) === -1) {
      usersTyping.push(user)
    }
    usersTypingUI(usersTyping)
  })
  
  socket.on("stop typing", (user) => {
    usersTyping.splice(usersTyping.findIndex((e) => e == user))
    usersTypingUI(usersTyping)
  })
}

initClientChat()

function createMessageUI(message) {
  return `
    <div>
      <p>${message.senderId}: ${message.body}</p>
    </div>
  `;
}

function usersTypingUI (usersTyping) {
  if (usersTyping.length < 1) {
    typingIndicator.innerHTML = ``;
  } else {
    typingIndicator.innerHTML = `<p>${usersTyping.join(", ")} typing ...</p>`;
  }
}

function throttle(func, wait = 100) {
  let timer = null
  return function (...args) {
    if (timer === null) {
      timer = setTimeout(() => {
        func.apply(this, args)
        timer = null
      }, wait)
    }
  }
}
