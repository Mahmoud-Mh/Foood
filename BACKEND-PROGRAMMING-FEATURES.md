# 🏗️ **Fonctionnalités de Programmation Backend - Guide Complet**

## 📋 **Table des Matières**

- [🔧 **Exports & Imports**](#-exports--imports)
- [🏗️ **Classes & Constructeurs**](#️-classes--constructeurs)
- [⚡ **Méthodes & Fonctions**](#-méthodes--fonctions)
- [🔗 **This & Context**](#-this--context)
- [📊 **Static & Instance**](#-static--instance)
- [🎯 **Interfaces & Types**](#-interfaces--types)
- [🔧 **Décorateurs**](#-décorateurs)
- [🛡️ **Guards & Guards**](#️-guards--guards)
- [📝 **DTOs & Validation**](#-dtos--validation)
- [🗄️ **Entités & Relations**](#️-entités--relations)
- [⚙️ **Configuration**](#-configuration)
- [🔐 **Authentification**](#-authentification)
- [📚 **Documentation**](#-documentation)

---

## 🔧 **Exports & Imports**

### **Export de Classes**
```typescript
// Export par défaut
export default class ConfigService {
  // ...
}

// Export nommé
export class UserService {
  // ...
}

// Export multiple
export { AuthService, UserService, RecipeService };
```

### **Import de Modules**
```typescript
// Import de NestJS
import { Controller, Get, Post, Injectable } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';

// Import de dépendances externes
import * as bcrypt from 'bcryptjs';
import { Observable } from 'rxjs';

// Import de fichiers locaux
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
```

### **Import/Export de Types**
```typescript
// Export d'interfaces
export interface DatabaseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
}

// Import de types
import { UserRole } from '../entities/user.entity';
import { RecipeStatus, DifficultyLevel } from '../entities/recipe.entity';
```

---

## 🏗️ **Classes & Constructeurs**

### **Classes de Base**
```typescript
// Classe de service
@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private configService: ConfigService
  ) {}
}

// Classe de contrôleur
@Controller('users')
export class UsersController {
  constructor(private userService: UserService) {}
}

// Classe d'entité
@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  firstName: string;
}
```

### **Constructeurs avec Injection**
```typescript
// Injection de dépendances
constructor(
  private userService: UserService,
  private authService: AuthService,
  private configService: ConfigService
) {}

// Injection de repository TypeORM
constructor(
  @InjectRepository(User)
  private userRepository: Repository<User>
) {}
```

### **Classes avec Héritage**
```typescript
// Héritage de AuthGuard
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }
}

// Implémentation d'interface
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}
}
```

---

## ⚡ **Méthodes & Fonctions**

### **Méthodes de Classe**
```typescript
// Méthode publique
public async findAll(): Promise<User[]> {
  return this.userRepository.find();
}

// Méthode privée
private async hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

// Méthode avec paramètres
public async findById(id: string): Promise<User | null> {
  return this.userRepository.findOne({ where: { id } });
}
```

### **Fonctions Async/Await**
```typescript
// Fonction async
async createUser(createUserDto: CreateUserDto): Promise<User> {
  const hashedPassword = await this.hashPassword(createUserDto.password);
  const user = this.userRepository.create({
    ...createUserDto,
    password: hashedPassword
  });
  return this.userRepository.save(user);
}

// Fonction avec try/catch
async updateUser(id: string, updateUserDto: UpdateUserDto): Promise<User> {
  try {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    Object.assign(user, updateUserDto);
    return this.userRepository.save(user);
  } catch (error) {
    throw new BadRequestException('Update failed');
  }
}
```

### **Fonctions de Validation**
```typescript
// Fonction de validation personnalisée
async validateEmail(email: string): Promise<boolean> {
  const existingUser = await this.userRepository.findOne({ 
    where: { email } 
  });
  return !existingUser;
}

// Fonction de transformation
transformUser(user: User): UserResponseDto {
  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
}
```

---

## 🔗 **This & Context**

### **This dans les Classes**
```typescript
// This pour accéder aux propriétés de classe
export class RecipeService {
  constructor(
    @InjectRepository(Recipe)
    private recipeRepository: Repository<Recipe>
  ) {}

  async findAll(): Promise<Recipe[]> {
    return this.recipeRepository.find(); // this.recipeRepository
  }

  async create(createRecipeDto: CreateRecipeDto): Promise<Recipe> {
    const recipe = this.recipeRepository.create(createRecipeDto); // this.recipeRepository
    return this.recipeRepository.save(recipe);
  }
}
```

### **This dans les Guards**
```typescript
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super(); // Appel du constructeur parent
  }

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);
    return super.canActivate(context); // this.super()
  }
}
```

### **This dans les Services**
```typescript
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userService.findByEmail(email); // this.userService
    if (user && await user.validatePassword(password)) {
      return user;
    }
    return null;
  }

  async login(user: User) {
    const payload = { email: user.email, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload), // this.jwtService
    };
  }
}
```

---

## 📊 **Static & Instance**

### **Méthodes Statiques**
```typescript
// Méthodes statiques dans les DTOs
export class ApiResponseDto<T = any> {
  static success<T>(message: string, data?: T): ApiResponseDto<T> {
    return new ApiResponseDto(true, message, data);
  }

  static error(message: string, error?: any): ApiResponseDto {
    return new ApiResponseDto(false, message, undefined, error);
  }
}

// Méthodes statiques dans les entités
export class User {
  static async validatePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }
}
```

### **Propriétés Statiques**
```typescript
// Énumérations (statiques par nature)
export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

export enum RecipeStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}
```

### **Méthodes d'Instance**
```typescript
// Méthodes d'instance dans les entités
export class User {
  async validatePassword(plainPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, this.password);
  }

  isAdmin(): boolean {
    return this.role === UserRole.ADMIN;
  }

  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}
```

---

## 🎯 **Interfaces & Types**

### **Interfaces de Configuration**
```typescript
export interface DatabaseConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  database: string;
}

export interface JwtConfig {
  secret: string;
  expirationTime: string;
  refreshSecret: string;
  refreshExpirationTime: string;
}

export interface AppConfig {
  port: number;
  nodeEnv: string;
}
```

### **Interfaces de Service**
```typescript
export interface IUserService {
  findAll(): Promise<User[]>;
  findById(id: string): Promise<User | null>;
  create(createUserDto: CreateUserDto): Promise<User>;
  update(id: string, updateUserDto: UpdateUserDto): Promise<User>;
  delete(id: string): Promise<void>;
}
```

### **Types Union & Intersection**
```typescript
// Types union
type UserRole = 'user' | 'admin';

// Types intersection
type AdminUser = User & { role: 'admin' };

// Types génériques
type ApiResponse<T> = {
  success: boolean;
  message: string;
  data?: T;
  error?: any;
};
```

---

## 🔧 **Décorateurs**

### **Décorateurs NestJS**
```typescript
// Décorateurs de classe
@Controller('users')
@Injectable()
@Entity('users')
@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [UsersController],
  providers: [UsersService],
})

// Décorateurs de méthode
@Get()
@Post()
@Put(':id')
@Delete(':id')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Public()
```

### **Décorateurs TypeORM**
```typescript
// Décorateurs d'entité
@Entity('users')
@PrimaryGeneratedColumn('uuid')
@Column()
@CreateDateColumn()
@UpdateDateColumn()

// Décorateurs de relation
@ManyToOne(() => User)
@OneToMany(() => Recipe, recipe => recipe.author)
@JoinColumn({ name: 'authorId' })
```

### **Décorateurs de Validation**
```typescript
// Décorateurs class-validator
@IsString()
@IsNotEmpty()
@IsOptional()
@IsEmail()
@IsNumber()
@Min(1)
@Max(100)
@IsEnum(UserRole)
@IsArray()
@ValidateNested({ each: true })
```

### **Décorateurs Swagger**
```typescript
// Décorateurs de documentation
@ApiTags('users')
@ApiOperation({ summary: 'Get all users' })
@ApiResponse({ status: 200, description: 'Users retrieved successfully' })
@ApiProperty({ description: 'User email' })
@ApiPropertyOptional({ description: 'User bio' })
```

---

## 🛡️ **Guards & Guards**

### **Guards Personnalisés**
```typescript
// Guard JWT
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>('isPublic', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }
}

// Guard de rôles
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user: UserResponseDto = request.user;

    if (!user) {
      throw new ForbiddenException('User information not available');
    }

    const hasRequiredRole = requiredRoles.includes(user.role);
    
    if (!hasRequiredRole) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}
```

### **Décorateurs de Guards**
```typescript
// Décorateurs pour les guards
export const Public = () => SetMetadata('isPublic', true);
export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles);
export const AdminOnly = () => Roles(UserRole.ADMIN);
export const UserOrAdmin = () => Roles(UserRole.USER, UserRole.ADMIN);
```

---

## 📝 **DTOs & Validation**

### **DTOs de Création**
```typescript
export class CreateUserDto {
  @ApiProperty({ description: 'User first name' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  firstName: string;

  @ApiProperty({ description: 'User email' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'User password' })
  @IsString()
  @MinLength(8)
  password: string;
}
```

### **DTOs de Réponse**
```typescript
export class UserResponseDto {
  @ApiProperty({ description: 'User unique identifier' })
  @Expose()
  id: string;

  @ApiProperty({ description: 'User first name' })
  @Expose()
  firstName: string;

  @ApiProperty({ description: 'User email' })
  @Expose()
  email: string;

  @ApiProperty({ description: 'User role' })
  @Expose()
  role: UserRole;

  // Password exclu de la réponse
  @Exclude()
  password: string;
}
```

### **DTOs de Pagination**
```typescript
export class PaginationDto {
  @ApiPropertyOptional({ description: 'Page number', minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsPositive()
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', minimum: 1, maximum: 100, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @Min(1)
  @Max(100)
  limit?: number = 10;
}

export class PaginatedResultDto<T> {
  @ApiPropertyOptional({ description: 'Array of items' })
  data: T[];

  @ApiPropertyOptional({ description: 'Total number of items' })
  total: number;

  @ApiPropertyOptional({ description: 'Current page number' })
  page: number;

  @ApiPropertyOptional({ description: 'Items per page' })
  limit: number;

  @ApiPropertyOptional({ description: 'Total number of pages' })
  totalPages: number;

  @ApiPropertyOptional({ description: 'Has next page' })
  hasNext: boolean;

  @ApiPropertyOptional({ description: 'Has previous page' })
  hasPrev: boolean;

  constructor(data: T[], total: number, page: number, limit: number) {
    this.data = data;
    this.total = total;
    this.page = page;
    this.limit = limit;
    this.totalPages = Math.ceil(total / limit);
    this.hasNext = page < this.totalPages;
    this.hasPrev = page > 1;
  }
}
```

---

## 🗄️ **Entités & Relations**

### **Entités de Base**
```typescript
@Entity('users')
export class User {
  @ApiProperty({ description: 'User unique identifier' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'User first name' })
  @Column({ type: 'varchar', length: 50 })
  firstName: string;

  @ApiProperty({ description: 'User last name' })
  @Column({ type: 'varchar', length: 50 })
  lastName: string;

  @ApiProperty({ description: 'User email address' })
  @Column({ type: 'varchar', length: 100, unique: true })
  email: string;

  @Exclude()
  @Column({ type: 'varchar' })
  password: string;

  @ApiProperty({ description: 'User role' })
  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @ApiProperty({ description: 'Account creation timestamp' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'Account last update timestamp' })
  @UpdateDateColumn()
  updatedAt: Date;

  // Méthodes d'instance
  async validatePassword(plainPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, this.password);
  }

  isAdmin(): boolean {
    return this.role === UserRole.ADMIN;
  }

  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}
```

### **Relations entre Entités**
```typescript
@Entity('recipes')
export class Recipe {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column('text')
  description: string;

  // Relation Many-to-One avec User
  @ApiProperty({ description: 'Recipe author ID' })
  @Column('uuid')
  authorId: string;

  @ManyToOne(() => User, { eager: false })
  @JoinColumn({ name: 'authorId' })
  author: User;

  // Relation Many-to-One avec Category
  @ApiProperty({ description: 'Recipe category ID' })
  @Column('uuid')
  categoryId: string;

  @ManyToOne(() => Category, { eager: false })
  @JoinColumn({ name: 'categoryId' })
  category: Category;

  // Relation One-to-Many avec RecipeIngredient
  @OneToMany(() => RecipeIngredient, recipeIngredient => recipeIngredient.recipe, { 
    cascade: true,
    eager: false 
  })
  recipeIngredients: RecipeIngredient[];

  // Relation One-to-Many avec RecipeStep
  @OneToMany(() => RecipeStep, recipeStep => recipeStep.recipe, { 
    cascade: true,
    eager: false 
  })
  steps: RecipeStep[];
}
```

---

## ⚙️ **Configuration**

### **Configuration Service**
```typescript
@Injectable()
export class ConfigService {
  constructor(private configService: NestConfigService) {}

  // Getters typés
  get database(): DatabaseConfig {
    return this.configService.get<DatabaseConfig>('database')!;
  }

  get jwt(): JwtConfig {
    return this.configService.get<JwtConfig>('jwt')!;
  }

  get app(): AppConfig {
    return this.configService.get<AppConfig>('app')!;
  }

  get throttle(): ThrottleConfig {
    return this.configService.get<ThrottleConfig>('throttle')!;
  }

  // Computed properties
  get isDevelopment(): boolean {
    return this.app.nodeEnv === 'development';
  }

  get isProduction(): boolean {
    return this.app.nodeEnv === 'production';
  }
}
```

### **Configuration Module**
```typescript
@Global()
@Module({
  imports: [
    NestConfigModule.forRoot({
      load: [configuration],
      isGlobal: true,
      envFilePath: '.env',
      cache: true,
    }),
  ],
  providers: [ConfigService],
  exports: [ConfigService],
})
export class ConfigModule {}
```

### **Configuration Factory**
```typescript
export const createTypeOrmOptions = (
  configService: ConfigService,
): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: configService.database.host,
  port: configService.database.port,
  username: configService.database.username,
  password: configService.database.password,
  database: configService.database.database,
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../migrations/*{.ts,.js}'],
  synchronize: configService.isDevelopment,
  logging: configService.isDevelopment,
  ssl: configService.isProduction ? { rejectUnauthorized: false } : false,
  autoLoadEntities: true,
});
```

---

## 🔐 **Authentification**

### **Stratégies Passport**
```typescript
@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super();
  }

  async validate(email: string, password: string): Promise<any> {
    const user = await this.authService.validateUser(email, password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return user;
  }
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.jwt.secret,
    });
  }

  async validate(payload: any) {
    return { userId: payload.sub, email: payload.email };
  }
}
```

### **Service d'Authentification**
```typescript
@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    private configService: ConfigService
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userService.findByEmail(email);
    if (user && await user.validatePassword(password)) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: User) {
    const payload = { email: user.email, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
      refresh_token: this.jwtService.sign(payload, {
        secret: this.configService.jwt.refreshSecret,
        expiresIn: this.configService.jwt.refreshExpirationTime,
      }),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.jwt.refreshSecret,
      });
      const user = await this.userService.findById(payload.sub);
      if (!user) {
        throw new UnauthorizedException('User not found');
      }
      return this.login(user);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }
}
```

---

## 📚 **Documentation**

### **Décorateurs Swagger**
```typescript
@Controller('recipes')
@ApiTags('recipes')
export class RecipesController {
  @Get()
  @ApiOperation({ summary: 'Get all recipes' })
  @ApiResponse({ 
    status: 200, 
    description: 'Recipes retrieved successfully',
    type: [RecipeResponseDto]
  })
  @ApiResponse({ 
    status: 401, 
    description: 'Unauthorized' 
  })
  async getRecipes(): Promise<ApiResponseDto<Recipe[]>> {
    // Implementation
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a new recipe' })
  @ApiResponse({ 
    status: 201, 
    description: 'Recipe created successfully',
    type: RecipeResponseDto
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad request' 
  })
  async createRecipe(
    @Body() createRecipeDto: CreateRecipeDto,
    @CurrentUser() user: UserResponseDto
  ): Promise<ApiResponseDto<Recipe>> {
    // Implementation
  }
}
```

### **Types de Documentation**
```typescript
export class RecipeResponseDto {
  @ApiProperty({ description: 'Recipe unique identifier' })
  id: string;

  @ApiProperty({ description: 'Recipe title' })
  title: string;

  @ApiProperty({ description: 'Recipe description' })
  description: string;

  @ApiProperty({ description: 'Preparation time in minutes' })
  prepTimeMinutes: number;

  @ApiProperty({ description: 'Cooking time in minutes' })
  cookTimeMinutes: number;

  @ApiProperty({ description: 'Number of servings' })
  servings: number;

  @ApiProperty({ 
    description: 'Recipe difficulty level',
    enum: DifficultyLevel
  })
  difficulty: DifficultyLevel;

  @ApiProperty({ 
    description: 'Recipe status',
    enum: RecipeStatus
  })
  status: RecipeStatus;

  @ApiPropertyOptional({ description: 'Recipe main image URL' })
  imageUrl?: string;

  @ApiProperty({ description: 'Recipe author' })
  author: UserResponseDto;

  @ApiProperty({ description: 'Recipe category' })
  category: CategoryResponseDto;

  @ApiProperty({ description: 'Recipe creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Recipe last update date' })
  updatedAt: Date;
}
```

---

## 🎯 **Résumé des Fonctionnalités**

### **🔧 Exports/Imports**
- `export class` : Export de classes
- `export interface` : Export d'interfaces
- `export default` : Export par défaut
- `import { }` : Import nommé
- `import * as` : Import de tout le module

### **🏗️ Classes & Constructeurs**
- `class` : Définition de classe
- `constructor()` : Constructeur
- `extends` : Héritage
- `implements` : Implémentation d'interface

### **⚡ Méthodes & Fonctions**
- `async/await` : Programmation asynchrone
- `public/private` : Visibilité des méthodes
- `static` : Méthodes statiques
- `get/set` : Accesseurs

### **🔗 This & Context**
- `this` : Référence à l'instance
- `super()` : Appel du constructeur parent
- `this.property` : Accès aux propriétés

### **📊 Static & Instance**
- `static method()` : Méthodes statiques
- `enum` : Énumérations
- `instance.method()` : Méthodes d'instance

### **🎯 Interfaces & Types**
- `interface` : Définition d'interface
- `type` : Types personnalisés
- `enum` : Énumérations
- `generic<T>` : Types génériques

### **🔧 Décorateurs**
- `@Controller()` : Décorateur de contrôleur
- `@Injectable()` : Décorateur de service
- `@Entity()` : Décorateur d'entité
- `@Get()` : Décorateur de route

### **🛡️ Guards & Validation**
- `@UseGuards()` : Application de guards
- `@IsString()` : Validation de chaîne
- `@IsNotEmpty()` : Validation de présence
- `@ApiProperty()` : Documentation Swagger

Cette liste couvre **toutes les fonctionnalités de programmation** utilisées dans le backend NestJS ! 🚀 