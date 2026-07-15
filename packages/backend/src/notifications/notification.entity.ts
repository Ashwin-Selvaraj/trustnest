import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { NotificationType } from '@trustnest/shared';
import { User } from '../users/user.entity';

@Entity('notifications')
@Index(['userId', 'read', 'createdAt'])
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  userId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column({ type: 'enum', enum: NotificationType })
  type!: NotificationType;

  @Column({ length: 200 })
  title!: string;

  @Column({ type: 'text' })
  body!: string;

  /** Arbitrary payload for client-side deep-linking, e.g. { propertyId, interestId } */
  @Column({ type: 'simple-json', default: '{}' })
  data!: Record<string, string>;

  @Column({ default: false })
  read!: boolean;

  @CreateDateColumn()
  createdAt!: Date;
}
