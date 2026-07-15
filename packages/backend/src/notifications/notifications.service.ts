import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from './notification.entity';
import { NotificationType } from '@trustnest/shared';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification) private readonly repo: Repository<Notification>,
  ) {}

  /**
   * Fire-and-forget notification creation. Called from other domain services
   * (interests, agreements, payments) at the point an event happens — this is
   * the single choke point where a future push/email channel would hook in
   * alongside the DB write, without touching call sites.
   */
  async create(
    userId: string,
    type: NotificationType,
    title: string,
    body: string,
    data: Record<string, string> = {},
  ): Promise<Notification> {
    const notification = this.repo.create({ userId, type, title, body, data });
    return this.repo.save(notification);
  }

  async findForUser(userId: string, page = 1, limit = 30): Promise<{ data: Notification[]; total: number; unreadCount: number }> {
    const [data, total] = await this.repo.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    const unreadCount = await this.repo.count({ where: { userId, read: false } });
    return { data, total, unreadCount };
  }

  async markRead(id: string, userId: string): Promise<{ ok: boolean }> {
    const notification = await this.repo.findOne({ where: { id } });
    if (!notification) throw new NotFoundException('Notification not found');
    if (notification.userId !== userId) throw new ForbiddenException('Not your notification');

    await this.repo.update(id, { read: true });
    return { ok: true };
  }

  async markAllRead(userId: string): Promise<{ ok: boolean }> {
    await this.repo.update({ userId, read: false }, { read: true });
    return { ok: true };
  }
}
