-- Reset Database Script for Recipe App
-- This script will clean and recreate all tables

-- Drop existing tables and types if they exist
DROP TABLE IF EXISTS "users" CASCADE;
DROP TYPE IF EXISTS "public"."users_role_enum" CASCADE;

-- Create UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create the enum type for user roles
CREATE TYPE "public"."users_role_enum" AS ENUM('user', 'admin');

-- Create the users table
CREATE TABLE "users" (
    "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
    "firstName" character varying(50) NOT NULL,
    "lastName" character varying(50) NOT NULL,
    "email" character varying(100) NOT NULL,
    "password" character varying NOT NULL,
    "role" "public"."users_role_enum" NOT NULL DEFAULT 'user',
    "avatar" character varying,
    "bio" text,
    "isEmailVerified" boolean NOT NULL DEFAULT false,
    "isActive" boolean NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP,
    "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
    CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"),
    CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id")
);

-- Verify table creation
SELECT 'Users table created successfully' as status;
SELECT COUNT(*) as user_count FROM users; 