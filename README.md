## node-rtm-socket
Node RTM Socket is a thin abstraction over Socket io and redis to use Sockets with multiple servers, processes and docker containers where Redis acts as a relay between them for message passing utilizing socket.io-redis. This client expose a simple API to subscribe event handlers without worrying too much about the implementation details. It works really well to achieve horizontal scalability.

**If you are using Load Balancer. Make sure you have a sticky session enabled**


### Installation
```bash
npm install node-rtm-socket
```

### Quick Setup
Since we use socket.io-redis, to support the message passing you need have Redis server up and running either locally or in the production setting

```js
const { NodeRTMSocket } = require('node-rtm-socket')
const server = http
  .createServer(routeHandler)
  .listen(8080, () => {
  })

const rtmSocket = new NodeRTMSocket(server, { host: 'localhost', port: 6379 }, { path: '/' })

rtmSocket.onEvent('connection', (instance) => {
  console.log('user connection ', instance.socketId)
})

rtmSocket.onEvent('authenticate', (instance, data) => {
  instance.userPresence(data.userId)
    .then(() => {
      instance.joinRoom('random-room-id')
      instance.notifySelf('conversation', 'random-room-id')
    })
})

rtmSocket.onEvent('newMessage', (instance) => {
  console.log('new message received ', instance.socketId)
})

rtmSocket.init()
```

For more detailed example and intergration with the UI look at example folder. By running
```bash
node example/server.js
```

Open the index.html in browser. Have multiple instances of browser windows and try plugging in unique different user names for conversation.


### API

#### Instance Creation
```ts
export interface INodeRtmSocketConstructor {
  new (server: http.Server, redisConf: redis.SocketIORedisOptions, socketOpts?: socketIo.ServerOptions): INodeRTMSocket
}

interface SocketIORedisOptions {
  key?: string
  host?: string
  port?: number
  auth_pass?: number | string
  pubClient?: any
  subClient?: any
}

interface ServerOptions extends engine.ServerAttachOptions {
  path?: string
  serveClient?: boolean
  adapter?: Adapter
  origins?: string | string[]
}
```

### Methods
```ts
export interface INodeRTMSocket {
  io: socketIo.Server


  onEvent(eventName: string, cb: IOnEventCallback): void
  init(): void
}
```

### Methods for received callbacks
This instance is based on per socket connection. On every successful socket connection an instance per user connection is created in the memory. On every callback received per event this class instance is returned
```ts
export interface IOnEventCallback {
  (socketInstance: IChatEventHandler<any>, data: any): void
}

export interface IChatEventHandler<T> {
  userIsPresent: boolean
  userInfo: T
  userId: string
  socketId: string

  // authenticate and upsert user presence
  userPresence(userId: string): void
  setUserInfo(userInfo: T): void

  // join conversation room methods
  joinRoom(roomId: string): void
  joinMultipleRooms(roomIds: string[]): void

  // emit events methods
  notifySelf(eventName: string, data: string): void
  notifyAllInRoom(conversationId: string, eventName: string, data: string): void
  notifyAllExceptSelfInRoom(conversationId: string, eventName: string, data: string): void
}
```
