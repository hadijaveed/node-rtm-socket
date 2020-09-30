const sockets = require('socket.io')
const http = require('http')
const staticRoomId = 'open_discussion'

const { NodeRTMSocket } = require('../dist/index.js')

const server = http
  .createServer(routeHandler)
  .listen(8080, () => {
    console.log('server is up and running ')
  })

const rtmSocket = new NodeRTMSocket(server, { host: 'localhost', port: 6379 }, { path: '/' })

rtmSocket.onEvent('connection', (instance) => {
  console.log('user connection ', instance.socketId)
})

rtmSocket.onEvent('authenticate', (instance, data) => {
  instance.userPresence(data.userId)
    .then(() => {
      instance.joinRoom(staticRoomId)
      instance.notifySelf('conversation', staticRoomId)
    })
})

rtmSocket.onEvent('message', (instance, data) => {
  instance.notifyAllExceptSelfInRoom(
    data.roomId,
    'newMessage',
    data
  )
})

rtmSocket.onEvent('typing', (instance, data) => {
  instance.notifyAllExceptSelfInRoom(
    data.roomId,
    'typing',
    data.userId
  )
})

rtmSocket.onEvent('stop typing', (instance, data) => {
  instance.notifyAllExceptSelfInRoom(
    data.roomId,
    'stop typing',
    data.userId
  )
})

rtmSocket.onEvent('disconnect', (instance) => {
  console.log('user disconnected', instance.userId)
})


rtmSocket.init()

function routeHandler(req, res) {
  if (req.method === 'GET' && req.url === `/health`) {
    res.end(`{"success": "${http.STATUS_CODES[200]}"}`)
  } else {
    res.end(`{"error": "${http.STATUS_CODES[404]}"}`)
  }
}