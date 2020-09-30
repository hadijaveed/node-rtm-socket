import * as socketIo from 'socket.io'
import * as http from 'http'
import * as redis from 'socket.io-redis'

export interface IUserPresence {
  upsertPresence(uuid: string, socketId: string): Promise<string>
  getUserSocketId(uuid: string): Promise<string | null>
  deletePresence(uuid: string): Promise<number>
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

export interface IOnEventCallback {
  (socketInstance: IChatEventHandler<any>, data: any): void
}

export interface INodeRTMSocket {
  io: socketIo.Server


  onEvent(eventName: string, cb: IOnEventCallback): void
  init(): void
}

export interface INodeRtmSocketConstructor {
  new (server: http.Server, redisConf: redis.SocketIORedisOptions, socketOpts?: socketIo.ServerOptions): INodeRTMSocket
}

declare var INodeRtmChat: INodeRtmSocketConstructor
