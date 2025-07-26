# Recipe App Backend - Setup Guide

## 📋 Table des matières
- [Prérequis](#prérequis)
- [Installation](#installation)
- [Configuration de la base de données](#configuration-de-la-base-de-données)
- [Variables d'environnement](#variables-denvironnement)
- [Démarrage de l'application](#démarrage-de-lapplication)
- [API Documentation](#api-documentation)
- [Architecture du projet](#architecture-du-projet)
- [Tests](#tests)

## 🔧 Prérequis

- **Node.js** >= 18.x
- **npm** >= 8.x
- **PostgreSQL** >= 13.x

## 📦 Installation

1. **Cloner le projet et naviguer dans le dossier backend :**
   ```bash
   cd backend
   ```

2. **Installer les dépendances :**
   ```bash
   npm install
   ```

## 🗄️ Configuration de la base de données

### Installation de PostgreSQL (Windows)

1. **Télécharger PostgreSQL :**
   - Aller sur https://www.postgresql.org/download/windows/
   - Télécharger et installer la version 15+

2. **Créer la base de données :**
   ```sql
   -- Se connecter à PostgreSQL avec psql ou pgAdmin
   CREATE DATABASE recipe_app;
   CREATE USER postgres WITH ENCRYPTED PASSWORD 'postgres';
   GRANT ALL PRIVILEGES ON DATABASE recipe_app TO postgres;
   ```

### Vérification de la connexion
```bash
# Tester la connexion PostgreSQL
psql -h localhost -U postgres -d recipe_app
```

## 🔐 Variables d'environnement

1. **Copier le fichier d'exemple :**
   ```bash
   copy .env.example .env
   ```

2. **Configurer les variables (fichier `.env`) :**
   ```env
   # Database Configuration
   DATABASE_HOST=localhost
   DATABASE_PORT=5432
   DATABASE_USERNAME=postgres
   DATABASE_PASSWORD=postgres
   DATABASE_NAME=recipe_app

   # JWT Configuration
   JWT_SECRET=recipe-app-super-secret-jwt-key-dev-only
   JWT_EXPIRATION=1d
   JWT_REFRESH_SECRET=recipe-app-super-secret-refresh-key-dev-only
   JWT_REFRESH_EXPIRATION=7d

   # Application Configuration
   PORT=3000
   NODE_ENV=development

   # Rate Limiting
   THROTTLE_TTL=60
   THROTTLE_LIMIT=10
   ```

## 🚀 Démarrage de l'application

### Mode développement
```bash
npm run start:dev
```

### Mode production
```bash
npm run build
npm run start:prod
```

### Mode debug
```bash
npm run start:debug
```

## 📚 API Documentation

Une fois l'application démarrée, la documentation Swagger est disponible à :
- **URL :** http://localhost:3000/api/docs
- **Format :** Interface interactive Swagger UI

### Endpoints principaux

#### Application
- `GET /api/v1/` - Health check
- `GET /api/v1/health` - Status détaillé

#### Utilisateurs
- `POST /api/v1/users` - Créer un utilisateur
- `GET /api/v1/users` - Liste paginée des utilisateurs
- `GET /api/v1/users/:id` - Détails d'un utilisateur
- `PATCH /api/v1/users/:id` - Mettre à jour un utilisateur
- `DELETE /api/v1/users/:id` - Supprimer un utilisateur
- `GET /api/v1/users/stats` - Statistiques des utilisateurs

## 🏗️ Architecture du projet

```
src/
├── config/                 # Configuration de l'application
│   ├── configuration.ts    # Variables d'environnement
│   ├── config.service.ts   # Service de configuration
│   ├── config.module.ts    # Module de configuration
│   └── database.config.ts  # Configuration TypeORM
├── common/                 # Composants partagés
│   ├── dto/               # DTOs communs (pagination, response)
│   ├── decorators/        # Décorateurs personnalisés
│   ├── filters/           # Filtres d'exception
│   ├── guards/            # Guards d'authentification
│   ├── interceptors/      # Intercepteurs
│   └── pipes/             # Pipes de validation
├── modules/               # Modules métier
│   ├── users/            # Module utilisateurs
│   │   ├── entities/     # Entités TypeORM
│   │   ├── dto/          # DTOs spécifiques
│   │   ├── users.service.ts
│   │   ├── users.controller.ts
│   │   └── users.module.ts
│   ├── auth/             # Module authentification (à venir)
│   ├── recipes/          # Module recettes (à venir)
│   └── ...               # Autres modules
├── app.module.ts          # Module principal
└── main.ts               # Point d'entrée
```

## 🧪 Tests

### Tests unitaires
```bash
npm run test
```

### Tests d'intégration
```bash
npm run test:e2e
```

### Coverage
```bash
npm run test:cov
```

## ⚡ Commandes utiles

```bash
# Générer un nouveau module
nest generate module modules/nom-module

# Générer un service
nest generate service modules/nom-module

# Générer un contrôleur
nest generate controller modules/nom-module

# Vérifier la syntaxe
npm run lint

# Formater le code
npm run format

# Build
npm run build
```

## 🔍 Troubleshooting

### Erreur de connexion PostgreSQL
```bash
# Vérifier que PostgreSQL fonctionne
pg_isready -h localhost -p 5432

# Vérifier les logs PostgreSQL
# Windows : Gestionnaire de services > PostgreSQL
```

### Port déjà utilisé
```bash
# Trouver le processus utilisant le port 3000
netstat -ano | findstr :3000

# Arrêter le processus (remplacer PID)
taskkill /PID <PID> /F
```

### Problèmes de permissions
```bash
# Réinstaller les node_modules
rm -rf node_modules package-lock.json
npm install
```

---

## 📝 Prochaines étapes

- [ ] Authentification JWT (Étape 3)
- [ ] Module Auth avec register/login
- [ ] Entités Recettes, Catégories, Ingrédients
- [ ] Tests unitaires et d'intégration
- [ ] Sécurisation avancée 