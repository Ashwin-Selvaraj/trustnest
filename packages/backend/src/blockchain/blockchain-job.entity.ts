import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { JobType, JobStatus } from '@trustnest/shared';

@Entity('blockchain_jobs')
export class BlockchainJob {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne('Agreement', 'jobs', { nullable: true })
  @JoinColumn({ name: 'agreementId' })
  agreement!: unknown | null;

  @Column({ nullable: true, type: 'uuid' })
  agreementId!: string | null;

  @Column({ type: 'enum', enum: JobType })
  type!: JobType;

  @Column({ type: 'jsonb' })
  payload!: Record<string, unknown>;

  @Column({ type: 'enum', enum: JobStatus, default: JobStatus.PENDING })
  status!: JobStatus;

  @Column({ default: 0 })
  attempts!: number;

  @Column({ nullable: true, length: 66, type: 'varchar' })
  txHash!: string | null;

  @Column({ nullable: true, type: 'text' })
  lastError!: string | null;

  @Column({ nullable: true, type: 'timestamptz' })
  processAfter!: Date | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
