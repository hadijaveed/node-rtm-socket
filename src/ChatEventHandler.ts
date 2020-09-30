import * as socketIo from 'socket.io'
import * as invariant from 'invariant'
import { RedisAdapter } from 'socket.io-redis'
import { IUserPresence, IChatEventHandler } from './interfaces'


export default class ChatEventHandler<UserInfo> implements IChatEventHandler<UserInfo> {
  private socket: socketIo.Socket
  private io: socketIo.Server
  private presenceInstance: IUserPresence
  
  public userIsPresent: boolean
  public userInfo: UserInfo
  public userId: string
  public socketId: string

  constructor(sock: socketIo.Socket, io: socketIo.Server, UserPresence: IUserPresence) {
    this.socket = sock
    this.socketId = sock.id
    this.io = io
    this.presenceInstance = UserPresence
    this.userIsPresent = false
    this.socket.on('disconnect', this.onDisconnect.bind(this))
  }

  private validateUserPresence() {
    invariant(
      this.userIsPresent === true,
      `NodeRtmChat: for this method make sure user userPresence method with unique userId is called.
        we recommend calling it after authenticating a user. or just call it with unique userId
      `
    )
  }

  private onDisconnect(): void {
    this.presenceInstance
      .deletePresence(this.userId)
      .then(() => {
      })
      .catch((err: any) => {
        console.log('something went wrong while disconnecting ', this.userId, err)
      })
  }

  public async userPresence(userId: string): Promise<void> {
    this.userId = userId
    try {
      await this.presenceInstance.upsertPresence(userId, this.socket.id)
      this.userIsPresent = true
    } catch (e) {
      console.error(e)
      this.userIsPresent = false
    }
  }

  public setUserInfo(userInfo: UserInfo) {
    this.userInfo = userInfo
  }

  public joinRoom(roomId: string): void {
    this.validateUserPresence()
    const adapter: RedisAdapter = this.io.of('/').adapter as RedisAdapter
    try {
      adapter.remoteJoin(
        this.socket.id,
        roomId.toString(), // make sure it always is a string
        (err: any) => {
          if (err) console.log(err)
        }
      )
    } catch (e) {
      console.log(e)
    }
  }

  public joinMultipleRooms(roomIds: string[]): void {
    roomIds.forEach(r => this.joinRoom(r))
  }

  public notifySelf(eventName: string, data: string): void {
    this.validateUserPresence()
    this.socket.emit(eventName, data)
  }

  public notifyAllExceptSelfInRoom(conversationId: string, eventName: string, data: string): void {
    this.validateUserPresence()
    this.socket
      .to(conversationId.toString())
      .broadcast.emit(eventName, data)
  }

  public notifyAllInRoom(conversationId: string, eventName: string, data: string): void {
    this.validateUserPresence()
    this.socket.nsp
      .to(conversationId.toString())
      .emit(eventName, data)
  }
}