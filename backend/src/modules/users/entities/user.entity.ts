import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  BeforeUpdate,
  Index,
  OneToMany,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import * as bcrypt from 'bcryptjs';
import { Exclude } from 'class-transformer';

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

@Entity('users')
export class User {
  @ApiProperty({ description: 'User unique identifier' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'User first name', maxLength: 50 })
  @Column({ type: 'varchar', length: 50 })
  firstName: string;

  @ApiProperty({ description: 'User last name', maxLength: 50 })
  @Column({ type: 'varchar', length: 50 })
  lastName: string;

  @ApiProperty({ description: 'User email address', uniqueItems: true })
  @Column({ type: 'varchar', length: 100, unique: true })
  @Index('IDX_USER_EMAIL')
  email: string;

  @Exclude()
  @Column({ type: 'varchar' })
  password: string;

  @ApiProperty({
    description: 'User role',
    enum: UserRole,
    default: UserRole.USER,
  })
  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @ApiProperty({ description: 'User profile avatar URL', required: false })
  @Column({ type: 'varchar', nullable: true })
  avatar?: string;

  @ApiProperty({ description: 'User bio/description', required: false })
  @Column({ type: 'text', nullable: true })
  bio?: string;

  @ApiProperty({ description: 'Account verification status' })
  @Column({ type: 'boolean', default: false })
  isEmailVerified: boolean;

  @ApiProperty({ description: 'Account active status' })
  @Column({ type: 'boolean', default: true })
  @Index('IDX_USER_ACTIVE')
  isActive: boolean;

  @ApiProperty({ description: 'Last login timestamp', required: false })
  @Column({ type: 'timestamp', nullable: true })
  lastLoginAt?: Date;

  @ApiProperty({ description: 'Account creation timestamp' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'Account last update timestamp' })
  @UpdateDateColumn()
  updatedAt: Date;

  // Relationships - will be properly typed when entities are imported
  emailVerifications?: any[];
  passwordResets?: any[];

  // Virtual field for full name
  @ApiProperty({ description: 'User full name' })
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  // Hash password before saving
  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.password && !this.password.startsWith('$2b$')) {
      // Only hash if password is not already hashed (bcrypt hashes start with $2b$)
      const saltRounds = 12;
      this.password = await bcrypt.hash(this.password, saltRounds);
    }
  }

  // Method to validate password
  async validatePassword(plainPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, this.password);
  }

  // Method to check if user is admin
  isAdmin(): boolean {
    return this.role === UserRole.ADMIN;
  }

  // Method to update last login
  updateLastLogin(): void {
    this.lastLoginAt = new Date();
  }
}
