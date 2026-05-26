import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { PaymentDetailsStatus } from '@trustnest/shared';
import { User } from './user.entity';

@Entity('payment_details')
export class PaymentDetails {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column({ nullable: true, length: 100, type: 'varchar' })
  upiId!: string | null;

  /** AES-256-GCM encrypted bank account number */
  @Column({ nullable: true, type: 'text' })
  bankAccountNumber!: string | null;

  @Column({ nullable: true, length: 11, type: 'varchar' })
  bankIfsc!: string | null;

  @Column({ type: 'enum', enum: PaymentDetailsStatus, default: PaymentDetailsStatus.NONE })
  status!: PaymentDetailsStatus;

  @Column({ nullable: true, type: 'timestamptz' })
  verifiedAt!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;
}
