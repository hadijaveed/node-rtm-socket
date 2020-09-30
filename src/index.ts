import * as http from 'http'
import * as socketIo from 'socket.io'
import * as redis from 'socket.io-redis'
import UserPresence from './UserPresence'
import ChatEventHandler from './ChatEventHandler'
import { ChatEvents } from './constants'
import { IOnEventCallback, INodeRTMSocket } from './interfaces'

export class NodeRTMSocket implements INodeRTMSocket {
  public readonly io: socketIo.Server
  private _subscribers: Map<string, IOnEventCallback>
  private userPresence: UserPresence

  constructor (server: http.Server, redisConf: redis.SocketIORedisOptions, socketOpts?: socketIo.ServerOptions) {
    this.io = socketIo(server, socketOpts)
    this.io.adapter(redis(redisConf))
    // allowed origins to socket
    this.userPresence = UserPresence.getInstance(redisConf.host || 'localhost', redisConf.port || 6379)
    this._subscribers = new Map()
  }

  public onEvent(eventName: string, cb: IOnEventCallback) {
    this._subscribers.set(eventName, cb)
  }

  public init () {
    this.io.on(ChatEvents.CONNECT, (socket: socketIo.Socket) => {
      const chatEventHandler = new ChatEventHandler(socket, this.io, this.userPresence)
      if (this._subscribers.has(ChatEvents.CONNECT)) {
        const connectSubs = this._subscribers.get(ChatEvents.CONNECT) as IOnEventCallback
        connectSubs(chatEventHandler, true)
      }

      // bind all the subscriptions
      for (const [event, subscriber] of this._subscribers.entries()) {
        socket.on(event, (data: any) => {
          subscriber(chatEventHandler, data)
        })
      }
    })
  }
}

// export all interfaces that can be used
export * from './interfaces'