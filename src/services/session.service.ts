// src/services/session.service.ts
import { AppDataSource } from "../data-source";
import { Repository } from "typeorm";
import { Session } from "../entities/Session";
import { randomBytes } from "crypto";

export class SessionService {
  private sessionRepo: Repository<Session>;

  constructor() {
    this.sessionRepo = AppDataSource.getRepository(Session);
  }

  async createSession(): Promise<Session> {
    const sessionId = randomBytes(32).toString("hex");

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 180);

  
    const session = this.sessionRepo.create({
      sessionId,
      expiresAt,
      
    });

    return await this.sessionRepo.save(session);
  }
  async getSession(sessionId: string): Promise<Session | null> {
    const session = await this.sessionRepo.findOne({
        where: {sessionId},
        relations: ['orders', 'orders.orderItems', 'orders.orderItems.product', 'orders.assignedTo']
    });

    if( session && session.expiresAt < new Date()){
        await this.sessionRepo.remove(session);
        return null;
    }
    return session;
  }

  async extendSession(sessionId: string): Promise<void> {
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 180);
    await this.sessionRepo.update({ sessionId }, { expiresAt });

  }

}
