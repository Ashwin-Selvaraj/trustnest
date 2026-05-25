import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  OneToOne, JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';

@Entity('wallets')
export class Wallet {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @OneToOne(() => User)
  @JoinColumn()
  user!: User;

  @Column()
  userId!: string;

  @Column({ unique: true, length: 42 })
  address!: string;

  @Column({ select: false })
  encryptedKey!: string;

  @Column({ select: false })
  keyIv!: string;

  @Column({ default: false })
  registeredOnChain!: boolean;

  @CreateDateColumn()
  createdAt!: Date;
}
