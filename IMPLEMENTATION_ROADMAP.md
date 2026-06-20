# KYLO-AI Implementation Roadmap

**Objective:** Transform current MVP into production-ready SaaS platform  
**Timeline:** 14-16 weeks  
**Team Size:** 2-3 developers (1 senior, 1-2 mid-level)

---

## 🗂️ TABLE OF CONTENTS

1. [Phase 1: Foundation](#phase-1-foundation---weeks-1-4)
2. [Phase 2: Core Features](#phase-2-core-features---weeks-5-8)
3. [Phase 3: Advanced Features](#phase-3-advanced-features---weeks-9-12)
4. [Phase 4: Testing & Launch](#phase-4-testing--launch---weeks-13-16)
5. [Architecture Decisions](#architecture-decisions)
6. [Database Schema](#database-schema)
7. [API Contract](#api-contract)
8. [Deployment Strategy](#deployment-strategy)

---

## PHASE 1: FOUNDATION - Weeks 1-4

### Week 1: Project Setup & Architecture

**Deliverables:**
- [ ] Backend project scaffolded (NestJS)
- [ ] PostgreSQL database provisioned (local + cloud)
- [ ] Environment configuration system
- [ ] Docker setup for local development
- [ ] Git workflow established (main/develop/feature branches)

**Step-by-Step Actions:**

#### 1.1 Initialize Backend Project

```bash
# Create backend directory
mkdir kylo-ai-server
cd kylo-ai-server

# Use NestJS CLI
npm i -g @nestjs/cli
nest new . --package-manager npm

# Install essential dependencies
npm install \
  @nestjs/jwt \
  @nestjs/passport \
  passport \
  passport-jwt \
  @nestjs/typeorm \
  typeorm \
  pg \
  bcrypt \
  @nestjs/config \
  @nestjs/mapped-types \
  class-validator \
  class-transformer \
  @nestjs/swagger

npm install --save-dev \
  @types/bcrypt \
  @types/node \
  jest \
  @types/jest \
  ts-jest \
  @nestjs/testing
```

#### 1.2 Create Project Structure

```
kylo-ai-server/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   ├── app.controller.ts
│   ├── app.service.ts
│   ├── config/
│   │   ├── database.config.ts
│   │   ├── jwt.config.ts
│   │   └── app.config.ts
│   ├── common/
│   │   ├── guards/
│   │   │   ├── jwt.guard.ts
│   │   │   └── roles.guard.ts
│   │   ├── decorators/
│   │   │   ├── user.decorator.ts
│   │   │   └── roles.decorator.ts
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts
│   │   ├── interceptors/
│   │   │   ├── logging.interceptor.ts
│   │   │   └── transform.interceptor.ts
│   │   ├── middleware/
│   │   │   └── request-logging.middleware.ts
│   │   ├── pipes/
│   │   │   └── validation.pipe.ts
│   │   └── enums/
│   │       ├── user-role.enum.ts
│   │       └── subscription-status.enum.ts
│   ├── database/
│   │   ├── entities/
│   │   │   ├── user.entity.ts
│   │   │   ├── subscription.entity.ts
│   │   │   ├── lead.entity.ts
│   │   │   ├── conversation.entity.ts
│   │   │   ├── message.entity.ts
│   │   │   ├── qa-pair.entity.ts
│   │   │   ├── webhook.entity.ts
│   │   │   ├── webhook-log.entity.ts
│   │   │   ├── api-key.entity.ts
│   │   │   ├── embed-config.entity.ts
│   │   │   └── subscription-plan.entity.ts
│   │   ├── migrations/
│   │   │   ├── 001-initial-schema.ts
│   │   │   └── 002-add-webhooks.ts
│   │   └── seeders/
│   │       └── seed.ts
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── jwt.strategy.ts
│   │   │   ├── dto/
│   │   │   │   ├── login.dto.ts
│   │   │   │   ├── register.dto.ts
│   │   │   │   ├── refresh-token.dto.ts
│   │   │   │   └── reset-password.dto.ts
│   │   │   └── __tests__/
│   │   │       ├── auth.service.spec.ts
│   │   │       └── auth.controller.spec.ts
│   │   ├── users/
│   │   │   ├── users.module.ts
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   ├── dto/
│   │   │   │   ├── create-user.dto.ts
│   │   │   │   ├── update-user.dto.ts
│   │   │   │   └── user.dto.ts
│   │   │   └── __tests__/
│   │   ├── leads/
│   │   ├── conversations/
│   │   ├── analytics/
│   │   ├── payments/
│   │   ├── webhooks/
│   │   └── admin/
│   └── utils/
│       ├── logger.ts
│       ├── validators.ts
│       └── helpers.ts
├── test/
│   ├── app.e2e-spec.ts
│   └── setup.ts
├── docker-compose.yml
├── Dockerfile
├── .env.example
├── .dockerignore
├── jest.config.js
├── ormconfig.ts (or package.json datasource config)
└── tsconfig.json
```

#### 1.3 Environment Configuration

**File: `.env.example`**

```env
# Node
NODE_ENV=development
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=kyloai_dev
DB_SYNC=true

# JWT
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRATION=24h
JWT_REFRESH_SECRET=refresh-secret
JWT_REFRESH_EXPIRATION=7d

# Frontend
FRONTEND_URL=http://localhost:5173
FRONTEND_PROD_URL=https://kylo-ai.com

# Stripe (get from Stripe dashboard)
STRIPE_PUBLIC_KEY=pk_test_xxx
STRIPE_SECRET_KEY=sk_test_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# Email (SendGrid)
SENDGRID_API_KEY=
SENDGRID_FROM_EMAIL=noreply@kylo-ai.com

# AWS (for file uploads)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_BUCKET=kylo-ai-files
AWS_REGION=us-east-1

# Logging
LOG_LEVEL=debug
SENTRY_DSN=

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Feature Flags
ENABLE_WHATSAPP_INTEGRATION=true
ENABLE_EMAIL_VERIFICATION=true
ENABLE_STRIPE_PAYMENT=true
```

#### 1.4 Docker Setup

**File: `docker-compose.yml`**

```yaml
version: '3.9'

services:
  postgres:
    image: postgres:16-alpine
    container_name: kyloai_postgres
    environment:
      POSTGRES_USER: ${DB_USERNAME:-postgres}
      POSTGRES_PASSWORD: ${DB_PASSWORD:-postgres}
      POSTGRES_DB: ${DB_NAME:-kyloai_dev}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    container_name: kyloai_redis
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  api:
    build: .
    container_name: kyloai_api
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: development
      DATABASE_URL: postgresql://${DB_USERNAME}:${DB_PASSWORD}@postgres:5432/${DB_NAME}
      REDIS_URL: redis://redis:6379
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - .:/app
      - /app/node_modules
    command: npm run start:dev

volumes:
  postgres_data:
```

**File: `Dockerfile`**

```dockerfile
# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/main.js"]
```

#### 1.5 Initial App Module

**File: `src/app.module.ts`**

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, jwtConfig],
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => config.get('database'),
    }),
    AuthModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```

**Step 1 Completion Checklist:**
- [ ] Backend project created with NestJS
- [ ] All dependencies installed
- [ ] Project structure created
- [ ] Docker setup working (can run `docker-compose up`)
- [ ] Environment variables configured
- [ ] Database connection verified
- [ ] Git repository initialized

---

### Week 2: Database Design & Authentication

**Deliverables:**
- [ ] Database schema designed and migrated
- [ ] User authentication system (register, login, JWT)
- [ ] Password hashing and validation
- [ ] JWT token generation and refresh
- [ ] Protected routes guard

**Step-by-Step Actions:**

#### 2.1 Define Database Entities

**File: `src/database/entities/user.entity.ts`**

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { SubscriptionEntity } from './subscription.entity';
import { LeadEntity } from './lead.entity';
import { ConversationEntity } from './conversation.entity';
import { ApiKeyEntity } from './api-key.entity';
import { UserRoleEnum } from '../enums/user-role.enum';

@Entity('users')
@Index(['email'], { unique: true })
export class UserEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  firstName: string;

  @Column({ type: 'varchar', length: 255 })
  lastName: string;

  @Column({ type: 'varchar' })
  @Exclude()
  passwordHash: string;

  @Column({ type: 'varchar', nullable: true })
  @Exclude()
  passwordSalt: string;

  @Column({
    type: 'enum',
    enum: UserRoleEnum,
    default: UserRoleEnum.USER,
  })
  role: UserRoleEnum;

  @Column({ type: 'boolean', default: false })
  emailVerified: boolean;

  @Column({ type: 'timestamp', nullable: true })
  emailVerifiedAt: Date;

  @Column({ type: 'varchar', nullable: true })
  phoneNumber: string;

  @Column({ type: 'text', nullable: true })
  profileImageUrl: string;

  @Column({ type: 'jsonb', nullable: true, default: {} })
  metadata: Record<string, any>;

  @Column({ type: 'boolean', default: false })
  isActive: boolean;

  @Column({ type: 'timestamp', nullable: true })
  lastLoginAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn({ nullable: true })
  deletedAt: Date;

  // Relations
  @OneToMany(() => SubscriptionEntity, (sub) => sub.user)
  subscriptions: SubscriptionEntity[];

  @OneToMany(() => LeadEntity, (lead) => lead.user)
  leads: LeadEntity[];

  @OneToMany(() => ConversationEntity, (conv) => conv.user)
  conversations: ConversationEntity[];

  @OneToMany(() => ApiKeyEntity, (key) => key.user)
  apiKeys: ApiKeyEntity[];
}
```

**File: `src/database/entities/subscription.entity.ts`**

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  ForeignKey,
  Index,
} from 'typeorm';
import { UserEntity } from './user.entity';
import { SubscriptionStatusEnum } from '../enums/subscription-status.enum';

@Entity('subscriptions')
@Index(['userId', 'stripeSubscriptionId'])
export class SubscriptionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @ForeignKey(() => UserEntity)
  userId: string;

  @Column({ type: 'varchar' })
  planName: string; // 'Starter', 'Pro', 'Enterprise'

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  priceAED: number;

  @Column({ type: 'varchar', nullable: true })
  stripeCustomerId: string;

  @Column({ type: 'varchar', nullable: true })
  stripeSubscriptionId: string;

  @Column({
    type: 'enum',
    enum: SubscriptionStatusEnum,
    default: SubscriptionStatusEnum.ACTIVE,
  })
  status: SubscriptionStatusEnum;

  @Column({ type: 'timestamp' })
  currentPeriodStart: Date;

  @Column({ type: 'timestamp' })
  currentPeriodEnd: Date;

  @Column({ type: 'timestamp', nullable: true })
  canceledAt: Date;

  @Column({ type: 'jsonb', nullable: true })
  features: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => UserEntity, (user) => user.subscriptions)
  user: UserEntity;
}
```

**File: `src/database/entities/lead.entity.ts`**

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  ForeignKey,
  Index,
} from 'typeorm';
import { UserEntity } from './user.entity';

@Entity('leads')
@Index(['userId', 'createdAt'])
@Index(['email'])
export class LeadEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  @ForeignKey(() => UserEntity)
  userId: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  company: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  phoneNumber: string;

  @Column({ type: 'varchar', length: 50 })
  status: 'New' | 'Contacted' | 'Qualified' | 'Won' | 'Lost'; // Enum

  @Column({ type: 'varchar', length: 100, nullable: true })
  source: string; // 'Website Widget', 'WhatsApp', 'Landing Page', etc.

  @Column({ type: 'integer', default: 0 })
  score: number; // 0-100

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => UserEntity, (user) => user.leads, { onDelete: 'CASCADE' })
  user: UserEntity;
}
```

(Continue with other entities: ConversationEntity, MessageEntity, QAPairEntity, WebhookEntity, ApiKeyEntity, EmbedConfigEntity)

#### 2.2 Authentication Service

**File: `src/modules/auth/auth.service.ts`**

```typescript
import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { UserEntity } from '../../database/entities/user.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UserRoleEnum } from '../../common/enums/user-role.enum';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(registerDto: RegisterDto) {
    const { email, password, firstName, lastName } = registerDto;

    // Check if user already exists
    const existingUser = await this.usersRepository.findOne({
      where: { email },
    });
    if (existingUser) {
      throw new ConflictException('Email already in use');
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user
    const user = this.usersRepository.create({
      email,
      passwordHash,
      passwordSalt: salt,
      firstName,
      lastName,
      role: UserRoleEnum.USER,
      isActive: true,
    });

    const savedUser = await this.usersRepository.save(user);

    // Generate tokens
    return this.generateTokens(savedUser);
  }

  async login(loginDto: LoginDto) {
    const { email, password } = loginDto;

    const user = await this.usersRepository.findOne({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login
    user.lastLoginAt = new Date();
    await this.usersRepository.save(user);

    return this.generateTokens(user);
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('jwt.refreshSecret'),
      });

      const user = await this.usersRepository.findOne({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      return this.generateTokens(user);
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async validateUser(userId: string) {
    return await this.usersRepository.findOne({ where: { id: userId } });
  }

  private generateTokens(user: UserEntity) {
    const payload = { sub: user.id, email: user.email, role: user.role };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get('jwt.expirationTime'),
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: this.configService.get('jwt.refreshExpirationTime'),
      secret: this.configService.get('jwt.refreshSecret'),
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }
}
```

#### 2.3 Auth Controller

**File: `src/modules/auth/auth.controller.ts`**

```typescript
import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('Authentication')
@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user' })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login user' })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  async refresh(@Body('refreshToken') refreshToken: string) {
    return this.authService.refreshToken(refreshToken);
  }

  @Post('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user' })
  async getCurrentUser(@Request() req: any) {
    return req.user;
  }
}
```

#### 2.4 DTOs (Data Transfer Objects)

**File: `src/modules/auth/dto/register.dto.ts`**

```typescript
import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(8)
  @MaxLength(50)
  password: string;

  @ApiProperty({ example: 'John' })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  lastName: string;
}
```

**File: `src/modules/auth/dto/login.dto.ts`**

```typescript
import { IsEmail, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  password: string;
}
```

#### 2.5 JWT Guard & Strategy

**File: `src/modules/auth/jwt.strategy.ts`**

```typescript
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('jwt.secret'),
    });
  }

  async validate(payload: any) {
    return this.authService.validateUser(payload.sub);
  }
}
```

**File: `src/common/guards/jwt.guard.ts`**

```typescript
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
```

**Step 2 Completion Checklist:**
- [ ] Database entities created
- [ ] Migrations created and run
- [ ] Authentication service functional
- [ ] Auth controller working
- [ ] Can register new user via POST /api/auth/register
- [ ] Can login via POST /api/auth/login
- [ ] JWT tokens generated correctly
- [ ] Protected routes work with JwtAuthGuard
- [ ] Tests written for auth module

---

### Week 3: Core Services & Users Module

**Deliverables:**
- [ ] Users service with CRUD operations
- [ ] Subscription management
- [ ] Leads service
- [ ] Conversations service
- [ ] Analytics service (basic)

**Key Implementations:**

#### 3.1 Users Service

**File: `src/modules/users/users.service.ts`**

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '../../database/entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(UserEntity)
    private readonly usersRepository: Repository<UserEntity>,
  ) {}

  async findById(id: string): Promise<UserEntity> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['subscriptions'],
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findByEmail(email: string): Promise<UserEntity> {
    return await this.usersRepository.findOne({ where: { email } });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserEntity> {
    await this.usersRepository.update(id, updateUserDto);
    return this.findById(id);
  }

  async delete(id: string): Promise<void> {
    await this.usersRepository.softDelete(id);
  }

  async getAllUsers(skip = 0, take = 10): Promise<[UserEntity[], number]> {
    return await this.usersRepository.findAndCount({
      skip,
      take,
      order: { createdAt: 'DESC' },
    });
  }

  async getCurrentSubscription(userId: string) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['subscriptions'],
    });
    
    // Return active subscription or null
    return user.subscriptions?.find(sub => sub.status === 'active') || null;
  }
}
```

#### 3.2 Leads Service

**File: `src/modules/leads/leads.service.ts`**

```typescript
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LeadEntity } from '../../database/entities/lead.entity';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';

@Injectable()
export class LeadsService {
  constructor(
    @InjectRepository(LeadEntity)
    private readonly leadsRepository: Repository<LeadEntity>,
  ) {}

  async create(userId: string, createLeadDto: CreateLeadDto): Promise<LeadEntity> {
    const lead = this.leadsRepository.create({
      ...createLeadDto,
      userId,
    });
    return await this.leadsRepository.save(lead);
  }

  async findAll(
    userId: string,
    skip = 0,
    take = 20,
    filters?: { status?: string; source?: string }
  ): Promise<[LeadEntity[], number]> {
    const query = this.leadsRepository.createQueryBuilder('lead')
      .where('lead.userId = :userId', { userId });

    if (filters?.status) {
      query.andWhere('lead.status = :status', { status: filters.status });
    }

    if (filters?.source) {
      query.andWhere('lead.source = :source', { source: filters.source });
    }

    return await query
      .orderBy('lead.createdAt', 'DESC')
      .skip(skip)
      .take(take)
      .getManyAndCount();
  }

  async findById(leadId: string, userId: string): Promise<LeadEntity> {
    const lead = await this.leadsRepository.findOne({
      where: { id: leadId, userId },
    });
    if (!lead) {
      throw new NotFoundException('Lead not found');
    }
    return lead;
  }

  async update(
    leadId: string,
    userId: string,
    updateLeadDto: UpdateLeadDto,
  ): Promise<LeadEntity> {
    const lead = await this.findById(leadId, userId);
    Object.assign(lead, updateLeadDto);
    return await this.leadsRepository.save(lead);
  }

  async delete(leadId: string, userId: string): Promise<void> {
    const lead = await this.findById(leadId, userId);
    await this.leadsRepository.remove(lead);
  }

  async getLeadStats(userId: string) {
    const query = this.leadsRepository.createQueryBuilder('lead')
      .where('lead.userId = :userId', { userId });

    const [leads] = await query.getManyAndCount();

    return {
      total: leads.length,
      byStatus: {
        new: leads.filter(l => l.status === 'New').length,
        contacted: leads.filter(l => l.status === 'Contacted').length,
        qualified: leads.filter(l => l.status === 'Qualified').length,
        won: leads.filter(l => l.status === 'Won').length,
        lost: leads.filter(l => l.status === 'Lost').length,
      },
      bySource: leads.reduce((acc, lead) => {
        acc[lead.source] = (acc[lead.source] || 0) + 1;
        return acc;
      }, {}),
    };
  }
}
```

#### 3.3 Analytics Service (Basic)

**File: `src/modules/analytics/analytics.service.ts`**

```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConversationEntity } from '../../database/entities/conversation.entity';
import { LeadEntity } from '../../database/entities/lead.entity';
import { MOCK_CHART_DATA } from './mock-analytics-data'; // Temporary

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectRepository(ConversationEntity)
    private readonly conversationsRepository: Repository<ConversationEntity>,
    @InjectRepository(LeadEntity)
    private readonly leadsRepository: Repository<LeadEntity>,
  ) {}

  async getOverview(userId: string) {
    const conversationCount = await this.conversationsRepository.count({
      where: { userId },
    });

    const leadCount = await this.leadsRepository.count({
      where: { userId },
    });

    const qualifiedLeads = await this.leadsRepository.count({
      where: { userId, status: 'Qualified' },
    });

    return {
      totalVisitors: conversationCount * 3, // Estimate: 3 visitors per conversation
      conversations: conversationCount,
      leadsCaptur: leadCount,
      qualifiedLeads,
      avgResponseTime: 1.2, // Placeholder
    };
  }

  async getEngagementChart(userId: string, days = 7) {
    // TODO: Implement real data aggregation from conversation events
    // For now, return mock data
    return MOCK_CHART_DATA;
  }

  async getConversionMetrics(userId: string) {
    const totalLeads = await this.leadsRepository.count({
      where: { userId },
    });

    const wonLeads = await this.leadsRepository.count({
      where: { userId, status: 'Won' },
    });

    return {
      total: totalLeads,
      converted: wonLeads,
      conversionRate: totalLeads > 0 ? ((wonLeads / totalLeads) * 100).toFixed(2) : 0,
    };
  }
}
```

#### 3.4 Controllers

**File: `src/modules/leads/leads.controller.ts`**

```typescript
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  Query,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { LeadsService } from './leads.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';

@ApiTags('Leads')
@Controller('api/leads')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new lead' })
  async create(@Body() createLeadDto: CreateLeadDto, @Request() req: any) {
    return this.leadsService.create(req.user.id, createLeadDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all leads' })
  async findAll(
    @Query('skip') skip = 0,
    @Query('take') take = 20,
    @Query('status') status?: string,
    @Query('source') source?: string,
    @Request() req: any
  ) {
    return this.leadsService.findAll(req.user.id, skip, take, { status, source });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get lead by ID' })
  async findById(@Param('id') id: string, @Request() req: any) {
    return this.leadsService.findById(id, req.user.id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a lead' })
  async update(
    @Param('id') id: string,
    @Body() updateLeadDto: UpdateLeadDto,
    @Request() req: any
  ) {
    return this.leadsService.update(id, req.user.id, updateLeadDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a lead' })
  async delete(@Param('id') id: string, @Request() req: any) {
    return this.leadsService.delete(id, req.user.id);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Get lead statistics' })
  async getStats(@Request() req: any) {
    return this.leadsService.getLeadStats(req.user.id);
  }
}
```

**Step 3 Completion Checklist:**
- [ ] Users service functional
- [ ] Leads service functional
- [ ] Conversations service functional
- [ ] Analytics service functional (basic)
- [ ] All controllers working
- [ ] API endpoints tested with Postman/Insomnia
- [ ] Pagination working
- [ ] Filtering working
- [ ] User isolation verified (users can only see their own data)

---

### Week 4: API Refinement & Frontend Integration Prep

**Deliverables:**
- [ ] Complete Leads, Conversations, Analytics APIs
- [ ] Error handling & validation complete
- [ ] CORS configuration
- [ ] Rate limiting implemented
- [ ] API documentation (Swagger)
- [ ] Integration guide for frontend

**Key Tasks:**

#### 4.1 Global Error Handling

**File: `src/common/filters/http-exception.filter.ts`**

```typescript
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let error = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      message =
        typeof exceptionResponse === 'object'
          ? (exceptionResponse as any).message
          : exceptionResponse;
      error = (exceptionResponse as any).error;
    } else if (exception instanceof Error) {
      message = exception.message;
      this.logger.error(exception);
    }

    response.status(status).json({
      statusCode: status,
      message,
      error,
      timestamp: new Date().toISOString(),
    });
  }
}
```

#### 4.2 CORS & Rate Limiting Setup

**File: `src/main.ts`**

```typescript
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import * as cors from 'cors';
import * as rateLimit from 'express-rate-limit';
import * as helmet from 'helmet';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Security
  app.use(helmet());
  
  // CORS
  app.enableCors({
    origin: configService.get('app.frontendUrl'),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Rate limiting
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // limit each IP to 100 requests per windowMs
      message: 'Too many requests from this IP',
      standardHeaders: true,
      legacyHeaders: false,
    })
  );

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Exception filters
  app.useGlobalFilters(new HttpExceptionFilter());

  // Swagger documentation
  const config = new DocumentBuilder()
    .setTitle('KYLO-AI API')
    .setDescription('AI Chatbot Platform API Documentation')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = configService.get('app.port') || 3000;
  await app.listen(port);
  console.log(`Application running on port ${port}`);
  console.log(`API docs available at http://localhost:${port}/api/docs`);
}

bootstrap();
```

#### 4.3 Integration Guide for Frontend

**File: `BACKEND_INTEGRATION_GUIDE.md`**

```markdown
# Backend Integration Guide

## API Base URL
- Development: `http://localhost:3000/api`
- Production: `https://api.kylo-ai.com/api`

## Authentication

### Register
```
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123",
  "firstName": "John",
  "lastName": "Doe"
}

Response:
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "role": "user"
  }
}
```

### Login
```
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securepassword123"
}

Response: Same as register
```

### Refresh Token
```
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGc..."
}
```

## Protected Endpoints
All endpoints except `/auth/register` and `/auth/login` require Bearer token:
```
Authorization: Bearer <access_token>
```

## API Endpoints

### Leads
- `GET /leads` - List leads (paginated)
- `POST /leads` - Create lead
- `GET /leads/:id` - Get lead detail
- `PUT /leads/:id` - Update lead
- `DELETE /leads/:id` - Delete lead
- `GET /leads/stats` - Get lead statistics

### Conversations
- `GET /conversations` - List conversations
- `GET /conversations/:id` - Get conversation detail
- `POST /conversations/:id/message` - Send message

### Analytics
- `GET /analytics/overview` - Get KPI metrics
- `GET /analytics/engagement` - Get chart data
- `GET /analytics/conversion` - Get conversion metrics

### Users
- `GET /users/me` - Get current user
- `PUT /users/me` - Update profile
- `POST /users/me/api-keys` - Generate API key

## Error Handling

All errors follow this format:
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

Common status codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `500` - Internal Server Error

## Frontend Implementation Example

```typescript
// api/client.ts
import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const refreshToken = localStorage.getItem('refreshToken');
      try {
        const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, {
          refreshToken,
        });
        localStorage.setItem('accessToken', data.accessToken);
        return apiClient(error.config);
      } catch (err) {
        // Redirect to login
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default apiClient;
```

## Deployment Notes

- All API calls must use HTTPS in production
- CORS is configured to accept requests from `FRONTEND_URL`
- Rate limiting: 100 requests per 15 minutes per IP
- JWT tokens expire after 24 hours
- Refresh tokens expire after 7 days
```

**Step 4 Completion Checklist:**
- [ ] Global error handling working
- [ ] CORS properly configured
- [ ] Rate limiting active
- [ ] Swagger documentation accessible at /api/docs
- [ ] All endpoints documented
- [ ] Frontend integration guide created
- [ ] Backend fully tested
- [ ] Ready for frontend integration
- [ ] Database migration scripts work
- [ ] Seeding script created for testing

---

**[Continued in PHASE 2...]**

This document is too long. See the next section for Phase 2-4 implementation details.

---

## ARCHITECTURE DECISIONS

### Why NestJS?
- ✅ Type-safe (TypeScript-first)
- ✅ Full-featured framework (validation, guards, interceptors)
- ✅ Built-in dependency injection
- ✅ Large ecosystem
- ✅ Good for microservices (future-proof)

### Why PostgreSQL?
- ✅ Relational data model (users, subscriptions, leads)
- ✅ ACID transactions
- ✅ JSON support (for metadata)
- ✅ Excellent for SaaS applications
- ✅ Good scaling options

### Why JWT for Auth?
- ✅ Stateless (good for distributed systems)
- ✅ Works well with SPAs (React)
- ✅ Easy token refresh mechanism
- ✅ Industry standard

### Frontend Integration Pattern
```typescript
// hooks/useApi.ts
export function useApi<T>(
  queryFn: () => Promise<T>,
  options?: UseQueryOptions
) {
  return useQuery({
    queryFn,
    ...options,
  });
}

// usage in components
function LeadsPage() {
  const { data: leads, isLoading, error } = useApi(
    () => apiClient.get('/leads'),
    { queryKey: ['leads'] }
  );
  
  return (
    // render leads
  );
}
```

---

## NEXT STEPS

Once Phase 1 is complete:

1. **Start Phase 2** (Leads, Conversations APIs)
2. **In parallel:** Begin frontend refactoring (replace mock data)
3. **Weeks 5-8:** Integrate frontend with backend APIs
4. **Weeks 9-12:** Implement payments, webhooks, embeds
5. **Weeks 13-16:** Testing, security audit, deployment

---

**This is a comprehensive blueprint. Adjust timeline based on team size and experience level.**
