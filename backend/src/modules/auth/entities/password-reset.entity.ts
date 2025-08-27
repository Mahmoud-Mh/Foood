import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('password_resets')
@Index('IDX_PASSWORD_RESET_TOKEN', ['token'])
@Index('IDX_PASSWORD_RESET_USER_USED', ['userId', 'isUsed'])
@Index('IDX_PASSWORD_RESET_EXPIRES_AT', ['expiresAt'])
export class PasswordReset {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index('IDX_PASSWORD_RESET_USER_ID')
  userId: string;

  @Column({ unique: true })
  token: string;

  @Column({ type: 'timestamp', nullable: false })
  expiresAt: Date;

  @Column({ default: false })
  isUsed: boolean;

  @Column({ type: 'timestamp', nullable: true })
  usedAt?: Date;

  @Column({ type: 'inet', nullable: true })
  ipAddress?: string;

  @Column({ type: 'text', nullable: true })
  userAgent?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.passwordResets, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: User;

  constructor() {
    // Set expiration to 1 hour from creation
    this.expiresAt = new Date(Date.now() + 60 * 60 * 1000);
  }

  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  isValid(): boolean {
    return !this.isUsed && !this.isExpired();
  }
}
