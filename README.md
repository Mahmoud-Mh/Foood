# 🍳 Recipe App - Application de Recettes de Cuisine

Une application complète de gestion de recettes de cuisine avec authentification, upload d'images et interface moderne.

## 📋 Table des Matières

- [🚀 Fonctionnalités](#-fonctionnalités)
- [🏗️ Architecture](#️-architecture)
- [📁 Structure du Projet](#-structure-du-projet)
- [🛠️ Technologies Utilisées](#️-technologies-utilisées)
- [⚙️ Installation et Configuration](#️-installation-et-configuration)
- [🔧 Démarrage Rapide](#-démarrage-rapide)
- [📚 Documentation API](#-documentation-api)
- [🧪 Tests](#-tests)
- [📦 Déploiement](#-déploiement)
- [🤝 Contribution](#-contribution)

## 🚀 Fonctionnalités

### 👤 **Authentification & Utilisateurs**
- ✅ Inscription et connexion sécurisée
- ✅ Authentification JWT avec refresh tokens
- ✅ Rôles utilisateur (USER/ADMIN)
- ✅ Profils utilisateur avec avatars
- ✅ Gestion des sessions et sécurité

### 📖 **Gestion des Recettes**
- ✅ CRUD complet des recettes
- ✅ Système d'ingrédients avec quantités
- ✅ Étapes de préparation détaillées
- ✅ Catégorisation des recettes
- ✅ Niveaux de difficulté (EASY, MEDIUM, HARD, EXPERT)
- ✅ États des recettes (DRAFT, PUBLISHED, ARCHIVED)
- ✅ Informations nutritionnelles
- ✅ Système de tags et recherche

### 🥕 **Gestion des Ingrédients**
- ✅ Base de données d'ingrédients
- ✅ Catégorisation des ingrédients
- ✅ Informations nutritionnelles
- ✅ Recherche et filtrage

### 📂 **Catégorisation**
- ✅ Système de catégories hiérarchique
- ✅ Navigation par catégories
- ✅ Filtrage des recettes

### 🖼️ **Upload d'Images**
- ✅ Upload d'avatars utilisateur
- ✅ Images de recettes multiples
- ✅ Validation des fichiers (JPEG, PNG, GIF, WebP)
- ✅ Limitation de taille (5MB max)
- ✅ Stockage local sécurisé

### 🔍 **Recherche et Filtrage**
- ✅ Recherche par nom de recette
- ✅ Filtrage par catégorie
- ✅ Filtrage par niveau de difficulté
- ✅ Filtrage par temps de préparation
- ✅ Système de tags

### 👨‍💼 **Administration**
- ✅ Interface d'administration
- ✅ Gestion des utilisateurs
- ✅ Modération des recettes
- ✅ Statistiques et analytics

## 🏗️ Architecture

### **Backend (NestJS)**
```
backend/
├── src/
│   ├── config/           # Configuration et variables d'environnement
│   ├── modules/          # Modules fonctionnels
│   │   ├── auth/         # Authentification JWT
│   │   ├── users/        # Gestion des utilisateurs
│   │   ├── recipes/      # Gestion des recettes
│   │   ├── ingredients/  # Gestion des ingrédients
│   │   ├── categories/   # Catégorisation
│   │   └── uploads/      # Upload d'images
│   ├── common/           # Composants partagés
│   │   ├── guards/       # Protection des routes
│   │   ├── decorators/   # Décorateurs personnalisés
│   │   └── dto/          # Data Transfer Objects
│   └── main.ts           # Point d'entrée
├── uploads/              # Stockage des images
└── scripts/              # Scripts utilitaires
```

### **Frontend (Next.js)**
```
frontend/
├── src/
│   ├── app/              # Pages Next.js (App Router)
│   │   ├── auth/         # Pages d'authentification
│   │   ├── recipes/      # Pages des recettes
│   │   ├── admin/        # Interface d'administration
│   │   └── profile/      # Profil utilisateur
│   ├── components/       # Composants réutilisables
│   ├── services/         # Services API
│   ├── types/            # Types TypeScript
│   └── utils/            # Utilitaires
└── public/               # Assets statiques
```

## 📁 Structure du Projet

### **Backend - Modules Principaux**

#### 🔐 **Module Auth**
- **Authentification JWT** avec Passport
- **Stratégies** : Local (email/password) et JWT
- **Guards** : Protection des routes
- **Routes** : `/login`, `/register`, `/logout`

#### 👥 **Module Users**
- **Entité User** : Profils complets avec rôles
- **Sécurité** : Hashage bcrypt des mots de passe
- **Fonctionnalités** : Avatar, bio, vérification email
- **Rôles** : USER et ADMIN avec permissions

#### 📖 **Module Recipes**
- **Entité Recipe** : Recettes avec relations complexes
- **États** : DRAFT, PUBLISHED, ARCHIVED
- **Niveaux** : EASY, MEDIUM, HARD, EXPERT
- **Relations** : Ingredients, Steps, Categories, Author
- **Fonctionnalités** : Images multiples, tags, infos nutritionnelles

#### 🥕 **Module Ingredients**
- **Base de données** d'ingrédients
- **Catégorisation** et informations nutritionnelles
- **Recherche** et filtrage avancé

#### 📂 **Module Categories**
- **Hiérarchie** : Catégories parent/enfant
- **Navigation** et filtrage des recettes

#### 🖼️ **Module Uploads**
- **Upload sécurisé** d'images
- **Validation** : Types, taille, sécurité
- **Stockage local** avec URLs publiques

### **Frontend - Pages et Composants**

#### 🏠 **Pages Principales**
- **Dashboard** : Vue d'ensemble des recettes
- **Recettes** : Liste, détail, création, édition
- **Catégories** : Navigation par catégories
- **Profil** : Gestion du compte utilisateur

#### 👨‍💼 **Administration**
- **Gestion utilisateurs** : Liste, détails, modération
- **Gestion recettes** : Modération et validation
- **Gestion ingrédients** : CRUD des ingrédients
- **Gestion catégories** : Hiérarchie des catégories

#### 🔐 **Authentification**
- **Login** : Connexion sécurisée
- **Register** : Inscription avec validation
- **Profil** : Gestion du compte

## 🛠️ Technologies Utilisées

### **Backend**
- **NestJS** : Framework Node.js progressif
- **TypeORM** : ORM pour PostgreSQL
- **Passport** : Authentification flexible
- **JWT** : Tokens d'authentification
- **bcrypt** : Hashage sécurisé des mots de passe
- **Multer** : Upload de fichiers
- **Swagger** : Documentation API automatique
- **Helmet** : Sécurité HTTP
- **Throttler** : Protection DDoS

### **Frontend**
- **Next.js 14** : Framework React avec App Router
- **TypeScript** : Typage statique
- **Tailwind CSS** : Framework CSS utilitaire
- **React Hook Form** : Gestion des formulaires
- **Axios** : Client HTTP
- **NextAuth.js** : Authentification côté client

### **Base de Données**
- **PostgreSQL** : Base de données relationnelle
- **TypeORM** : Mapping objet-relationnel

## ⚙️ Installation et Configuration

### **Prérequis**
- Node.js 18+ 
- PostgreSQL 12+
- npm ou yarn

### **Variables d'Environnement**

#### **Backend (.env)**
```env
# Application
NODE_ENV=development
PORT=3001

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_DATABASE=recipe_app

# JWT
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRATION_TIME=24h

# Throttling
THROTTLE_TTL=60
THROTTLE_LIMIT=100
```

#### **Frontend (.env.local)**
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000
```

## 🔧 Démarrage Rapide

### **1. Cloner le projet**
```bash
git clone <repository-url>
cd recipe-app
```

### **2. Configuration de la base de données**
```bash
# Créer la base de données PostgreSQL
createdb recipe_app

# Ou utiliser Docker
docker run --name postgres-recipe -e POSTGRES_PASSWORD=password -e POSTGRES_DB=recipe_app -p 5432:5432 -d postgres
```

### **3. Installation des dépendances**
```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### **4. Configuration des variables d'environnement**
```bash
# Copier les fichiers d'exemple
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local

# Éditer les variables selon votre configuration
```

### **5. Démarrage des services**
```bash
# Terminal 1 - Backend
cd backend
npm run start:dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

### **6. Accès à l'application**
- **Frontend** : http://localhost:3000
- **Backend API** : http://localhost:3001/api/v1
- **Documentation API** : http://localhost:3001/api/docs

## 📚 Documentation API

### **Endpoints Principaux**

#### **🔐 Authentification**
```http
POST /api/v1/auth/register    # Inscription
POST /api/v1/auth/login       # Connexion
POST /api/v1/auth/logout      # Déconnexion
```

#### **👥 Utilisateurs**
```http
GET    /api/v1/users          # Liste des utilisateurs
GET    /api/v1/users/:id      # Détails utilisateur
PUT    /api/v1/users/:id      # Mise à jour profil
DELETE /api/v1/users/:id      # Suppression utilisateur
```

#### **📖 Recettes**
```http
GET    /api/v1/recipes        # Liste des recettes
POST   /api/v1/recipes        # Créer une recette
GET    /api/v1/recipes/:id    # Détails recette
PUT    /api/v1/recipes/:id    # Modifier recette
DELETE /api/v1/recipes/:id    # Supprimer recette
```

#### **🥕 Ingrédients**
```http
GET    /api/v1/ingredients    # Liste des ingrédients
POST   /api/v1/ingredients    # Créer ingrédient
GET    /api/v1/ingredients/:id # Détails ingrédient
PUT    /api/v1/ingredients/:id # Modifier ingrédient
DELETE /api/v1/ingredients/:id # Supprimer ingrédient
```

#### **📂 Catégories**
```http
GET    /api/v1/categories     # Liste des catégories
POST   /api/v1/categories     # Créer catégorie
GET    /api/v1/categories/:id # Détails catégorie
PUT    /api/v1/categories/:id # Modifier catégorie
DELETE /api/v1/categories/:id # Supprimer catégorie
```

#### **🖼️ Uploads**
```http
POST   /api/v1/uploads/avatar # Upload avatar
POST   /api/v1/uploads/recipe # Upload image recette
```

### **Authentification**
Tous les endpoints protégés nécessitent un header d'autorisation :
```http
Authorization: Bearer <jwt_token>
```

## 🧪 Tests

### **Backend**
```bash
# Tests unitaires
npm run test

# Tests e2e
npm run test:e2e

# Couverture de code
npm run test:cov
```

### **Frontend**
```bash
# Tests
npm run test

# Tests avec couverture
npm run test:coverage
```

## 📦 Déploiement

### **Backend (Production)**
```bash
# Build de production
npm run build

# Démarrage en production
npm run start:prod
```

### **Frontend (Production)**
```bash
# Build de production
npm run build

# Démarrage en production
npm run start
```

### **Docker**
```bash
# Build des images
docker-compose build

# Démarrage des services
docker-compose up -d
```


### **Standards de Code**
- **TypeScript** : Typage strict
- **ESLint** : Linting automatique
- **Prettier** : Formatage du code
- **Conventional Commits** : Messages de commit standardisés

