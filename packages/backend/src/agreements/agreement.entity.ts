import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, OneToMany, JoinColumn,
} from 'typeorm';
import { AgreementStatus } from '@trustnest/shared';
import { User } from '../users/user.entity';

@Entity('agreements')
export class Agreement {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'tenantId' })
  tenant!: User;

  @Column()
  tenantId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'ownerId' })
  owner!: User;

  @Column()
  ownerId!: string;

  @Column({ type: 'enum', enum: AgreementStatus, default: AgreementStatus.DRAFT })
  status!: AgreementStatus;

  @Column({ length: 300 })
  propertyAddress!: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  monthlyRentINR!: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  depositINR!: string;

  @Column({ type: 'date' })
  startDate!: string;

  @Column({ type: 'date' })
  endDate!: string;

  @Column({ nullable: true, length: 100, type: 'varchar' })
  pdfIpfsHash!: string | null;

  @Column({ nullable: true, length: 66, type: 'varchar' })
  onChainAgreementId!: string | null;

  @Column({ nullable: true, type: 'bigint' })
  nftTokenIdTenant!: string | null;

  @Column({ nullable: true, type: 'bigint' })
  nftTokenIdOwner!: string | null;

  @Column({ default: false })
  tenantConfirmed!: boolean;

  @Column({ default: false })
  ownerConfirmed!: boolean;

  @Column({ nullable: true, type: 'text' })
  disputeReason!: string | null;

  @Column({ nullable: true, length: 100, type: 'varchar' })
  disputeEvidenceIpfsHash!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToMany('PaymentEvent', 'agreement')
  payments!: unknown[];

  @OneToMany('BlockchainJob', 'agreement')
  jobs!: unknown[];
}
