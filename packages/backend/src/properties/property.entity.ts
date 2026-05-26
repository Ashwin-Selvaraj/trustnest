import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn,
  ManyToOne, OneToMany, JoinColumn, Index,
} from 'typeorm';
import { BhkType, FurnishingStatus, PropertyStatus, TenantPreference } from '@trustnest/shared';
import { User } from '../users/user.entity';

@Entity('properties')
export class Property {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  ownerId!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'ownerId' })
  owner!: User;

  @Column({ length: 200 })
  title!: string;

  @Column({ length: 300 })
  address!: string;

  @Index()
  @Column({ length: 100 })
  city!: string;

  @Index()
  @Column({ length: 100 })
  locality!: string;

  @Column({ type: 'enum', enum: BhkType })
  bhkType!: BhkType;

  @Column({ type: 'enum', enum: FurnishingStatus })
  furnishingStatus!: FurnishingStatus;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  monthlyRentINR!: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  depositINR!: string;

  @Column({ type: 'int', nullable: true })
  areaSqft!: number | null;

  @Column({ type: 'int', nullable: true })
  floorNumber!: number | null;

  @Column({ type: 'int', nullable: true })
  totalFloors!: number | null;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @Column({ type: 'simple-json', default: '[]' })
  amenities!: string[];

  @Column({ type: 'simple-json', default: '[]' })
  preferredTenants!: TenantPreference[];

  @Column({ type: 'date' })
  availableFrom!: string;

  @Column({ type: 'enum', enum: PropertyStatus, default: PropertyStatus.DRAFT })
  status!: PropertyStatus;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @OneToMany('PropertyImage', 'property', { cascade: true })
  images!: unknown[];

  @OneToMany('PropertyInterest', 'property')
  interests!: unknown[];
}
