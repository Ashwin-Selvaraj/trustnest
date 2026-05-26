import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, JoinColumn,
} from 'typeorm';
import { InterestStatus } from '@trustnest/shared';
import { Property } from '../properties/property.entity';
import { User } from '../users/user.entity';

@Entity('property_interests')
export class PropertyInterest {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  propertyId!: string;

  @ManyToOne(() => Property)
  @JoinColumn({ name: 'propertyId' })
  property!: Property;

  @Column()
  tenantId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'tenantId' })
  tenant!: User;

  @Column({ type: 'enum', enum: InterestStatus, default: InterestStatus.PENDING })
  status!: InterestStatus;

  @Column({ type: 'text', nullable: true })
  message!: string | null;

  @Column({ nullable: true, type: 'varchar' })
  agreementId!: string | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
