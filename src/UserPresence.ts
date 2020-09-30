import * as Redis from 'ioredis'
import { IUserPresence } from './interfaces'

export default class UserPresence implements IUserPresence {
  private static _instance: UserPresence
  private static redis: Redis.Redis

  public upsertPresence(uuid: string, socketId: string): Promise<string> {
    if (!UserPresence._instance) throw new Error('Use only with singelton class instance')
    return UserPresence.redis.hmset(
      'presence',
      uuid,
      socketId,
    )
  }

  public getUserSocketId(uuid: string): Promise<string | null> {
    if (!UserPresence._instance) throw new Error('Use  only with singelton class instance')
    return UserPresence.redis.hget(
      'presence',
      uuid
    )
  }

  public deletePresence(uuid: string): Promise<number> {
    if (!UserPresence._instance) throw new Error('User only with singelton class instance')
    return UserPresence.redis.hdel(
      'presence',
      uuid
    )
  }

  public static getInstance (host: string, port: number): UserPresence {
    if (!UserPresence._instance) {
      UserPresence._instance = new UserPresence()
      UserPresence.redis = new Redis({ host, port })
    }

    return UserPresence._instance
  }
}