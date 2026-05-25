import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { PaymentType, PaymentStatus } from '@trustnest/shared';
import { Agreement } from '../agreements/agreement.entity';

@Entity('payment_events')
export class PaymentEvent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Agreement)
  @JoinColumn({ name: 'agreementId' })
  agreement!: Agreement;

  @Column()
  agreementId!: string;

  @Column({ type: 'enum', enum: PaymentType })
  type!: PaymentType;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amountINR!: string;

  @Column({ type: 'varchar', nullable: true })
  usdcWei!: string | null;

  @Column({ nullable: true, length: 18, type: 'varchar' })
  forexRate!: string | null;

  @Column({ nullable: true, length: 100, type: 'varchar' })
  gatewayOrderId!: string | null;

  @Column({ nullable: true, length: 100, type: 'varchar' })
  gatewayPaymentId!: string | null;

  @Column({ nullable: true, length: 66, type: 'varchar' })
  txHash!: string | null;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  status!: PaymentStatus;

  @Column({ nullable: true, type: 'int' })
  retryCount!: number | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
