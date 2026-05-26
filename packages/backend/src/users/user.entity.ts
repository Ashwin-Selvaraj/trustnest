import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  OneToOne, OneToMany,
} from 'typeorm';
import { UserRole, KycStatus, KycMethod } from '@trustnest/shared';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true, length: 15 })
  phone!: string;

  @Column({ nullable: true, length: 100, type: 'varchar' })
  name!: string | null;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.TENANT })
  role!: UserRole;

  @Column({ type: 'date', nullable: true })
  dob!: Date | null;

  @Column({ type: 'enum', enum: KycStatus, default: KycStatus.PENDING })
  kycStatus!: KycStatus;

  @Column({ nullable: true, length: 50, type: 'varchar' })
  kycJobId!: string | null;

  @Column({ type: 'enum', enum: KycMethod, nullable: true })
  kycMethod!: KycMethod | null;

  @Column({ nullable: true, length: 10, type: 'varchar' })
  maskedAadhaar!: string | null;

  @Column({ nullable: true, length: 15, type: 'varchar' })
  maskedPan!: string | null;

  @Column({ nullable: true, type: 'text' })
  kycRejectionReason!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  // Relations (lazy-loaded to avoid circular dep issues)
  @OneToOne('Wallet', 'user', { cascade: true, nullable: true })
  wallet!: unknown;

  @OneToMany('Agreement', 'tenant')
  tenantAgreements!: unknown[];

  @OneToMany('Agreement', 'owner')
  ownerAgreements!: unknown[];
}
