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

@Entity('email_verifications')
@Index('IDX_EMAIL_VERIFICATION_TOKEN', ['token'])
@Index('IDX_EMAIL_VERIFICATION_USER_USED', ['userId', 'isUsed'])
@Index('IDX_EMAIL_VERIFICATION_EXPIRES_AT', ['expiresAt'])
export class EmailVerification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @Index('IDX_EMAIL_VERIFICATION_USER_ID')
  userId: string;

  @Column({ unique: true })
  token: string;

  @Column({ type: 'timestamp', nullable: false })
  expiresAt: Date;

  @Column({ default: false })
  isUsed: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.emailVerifications, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user: User;

  constructor() {
    // Set expiration to 24 hours from creation
    this.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  }

  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  isValid(): boolean {
    return !this.isUsed && !this.isExpired();
  }
}
