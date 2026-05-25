import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { UserRole } from '@trustnest/shared';
import { User } from '../users/user.entity';
import { Agreement } from '../agreements/agreement.entity';

@Entity('reputation_tokens')
export class ReputationToken {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column()
  userId!: string;

  @ManyToOne(() => Agreement)
  @JoinColumn({ name: 'agreementId' })
  agreement!: Agreement;

  @Column()
  agreementId!: string;

  @Column({ type: 'enum', enum: UserRole })
  role!: UserRole;

  @Column({ type: 'smallint' })
  score!: number;

  @Column({ nullable: true, type: 'text' })
  review!: string | null;

  @Column({ nullable: true, type: 'int' })
  sbtTokenId!: number | null;

  @CreateDateColumn()
  mintedAt!: Date;
}
