# Recipe App - Système d'Authentification JWT

## 🔐 Vue d'ensemble

Le système d'authentification utilise **JWT (JSON Web Tokens)** avec refresh tokens pour une sécurité optimale. Il comprend :

- **Authentification** par email/mot de passe
- **Autorisation** basée sur les rôles (User/Admin)
- **Tokens JWT** avec refresh automatique
- **Protection** des routes sensibles
- **Validation** robuste des mots de passe

---

## 📚 Endpoints d'authentification

### Base URL : `http://localhost:3000/api/v1/auth`

| Méthode | Endpoint | Description | Auth | Rôle |
|---------|----------|-------------|------|------|
| `POST` | `/register` | Inscription | ❌ Public | - |
| `POST` | `/login` | Connexion | ❌ Public | - |
| `POST` | `/refresh` | Renouveler token | ❌ Public | - |
| `POST` | `/logout` | Déconnexion | ✅ JWT | User/Admin |
| `POST` | `/me` | Profil utilisateur | ✅ JWT | User/Admin |
| `PATCH` | `/change-password` | Changer mot de passe | ✅ JWT | User/Admin |

---

## 🚀 Utilisation des endpoints

### 1. **Inscription** 
```http
POST /api/v1/auth/register
Content-Type: application/json

{
  "firstName": "John",
  "lastName": "Doe", 
  "email": "john.doe@example.com",
  "password": "SecurePass123!",
  "confirmPassword": "SecurePass123!",
  "bio": "Passionate home cook"
}
```

**Réponse :**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid",
      "email": "john.doe@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "role": "user",
      "isActive": true,
      "isEmailVerified": false
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "tokenType": "Bearer",
      "expiresIn": 86400
    }
  }
}
```

### 2. **Connexion**
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "john.doe@example.com",
  "password": "SecurePass123!"
}
```

### 3. **Renouvellement du token**
```http
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### 4. **Accès aux routes protégées**
```http
GET /api/v1/auth/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 🛡️ Système de rôles

### **User (utilisateur standard)**
- ✅ Consulter son propre profil
- ✅ Modifier son profil  
- ✅ Changer son mot de passe
- ✅ Créer/modifier ses recettes (à venir)
- ❌ Accès administration

### **Admin (administrateur)**
- ✅ Toutes les permissions User
- ✅ Gérer tous les utilisateurs
- ✅ Voir les statistiques
- ✅ Modérer les recettes (à venir)
- ✅ Changer les rôles utilisateurs

---

## 🔧 Configuration JWT

### Variables d'environnement
```env
# JWT Configuration
JWT_SECRET=recipe-app-super-secret-jwt-key-dev-only
JWT_EXPIRATION=1d
JWT_REFRESH_SECRET=recipe-app-super-secret-refresh-key-dev-only  
JWT_REFRESH_EXPIRATION=7d
```

### Durées de vie
- **Access Token** : 1 jour (configurable)
- **Refresh Token** : 7 jours (configurable)

---

## 🛠️ Utilisation côté développeur

### **Décorateurs disponibles**

```typescript
import { 
  Public, 
  AdminOnly, 
  CurrentUser, 
  CurrentUserId,
  Roles 
} from './common/decorators/auth.decorators';

// Route publique (pas d'auth requise)
@Public()
@Get('public-info')
getPublicInfo() { ... }

// Accès admin seulement
@AdminOnly()
@Get('admin-stats')
getStats() { ... }

// Rôles spécifiques
@Roles(UserRole.USER, UserRole.ADMIN)
@Get('protected')
getProtected() { ... }

// Récupérer l'utilisateur actuel
@Get('profile')
getProfile(@CurrentUser() user: UserResponseDto) { ... }

// Récupérer l'ID utilisateur
@Patch('profile')
updateProfile(@CurrentUserId() userId: string) { ... }
```

### **Guards disponibles**

```typescript
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';

// Protection JWT + rôles au niveau contrôleur
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('protected')
export class ProtectedController { ... }

// Protection spécifique à une route
@UseGuards(JwtAuthGuard)
@Get('protected-route')
protectedRoute() { ... }
```

---

## 🧪 Tests avec Swagger

1. **Ouvrir Swagger** : http://localhost:3000/api/docs

2. **S'inscrire** via `/auth/register`

3. **Copier le token** retourné dans la réponse

4. **Cliquer "Authorize"** dans Swagger

5. **Saisir** : `Bearer {votre_token}`

6. **Tester** les routes protégées

---

## 🔒 Sécurité

### **Validation des mots de passe**
- Minimum 8 caractères
- Au moins 1 lettre
- Au moins 1 chiffre  
- Au moins 1 caractère spécial

### **Hashage sécurisé**
- Algorithme **bcrypt** avec salt rounds = 12
- Hash automatique avant sauvegarde

### **Protection des tokens**
- Secrets JWT forts et séparés
- Expiration automatique
- Refresh token distinct

### **Validation des entrées**
- DTOs avec class-validator
- Sanitization automatique
- Messages d'erreur sécurisés

---

## 📋 Routes Users avec authentification

| Endpoint | Méthode | Auth | Rôle | Description |
|----------|---------|------|------|-------------|
| `/users` | GET | ✅ | Admin | Liste tous les utilisateurs |
| `/users` | POST | ✅ | Admin | Créer un utilisateur |
| `/users/profile` | GET | ✅ | User/Admin | Mon profil |
| `/users/profile` | PATCH | ✅ | User/Admin | Modifier mon profil |
| `/users/:id` | GET | ✅ | User/Admin | Voir profil (admin ou soi-même) |
| `/users/:id` | PATCH | ✅ | Admin | Modifier utilisateur |
| `/users/:id` | DELETE | ✅ | Admin | Supprimer utilisateur |
| `/users/stats` | GET | ✅ | Admin | Statistiques |

---

## ⚡ Exemples complets

### **Flux d'inscription + utilisation**

```javascript
// 1. Inscription
const registerResponse = await fetch('/api/v1/auth/register', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    password: 'SecurePass123!',
    confirmPassword: 'SecurePass123!'
  })
});

const { data } = await registerResponse.json();
const token = data.tokens.accessToken;

// 2. Utilisation du token
const profileResponse = await fetch('/api/v1/auth/me', {
  headers: { 'Authorization': `Bearer ${token}` }
});

const profile = await profileResponse.json();
```

### **Gestion du refresh token**

```javascript
async function refreshAccessToken(refreshToken) {
  const response = await fetch('/api/v1/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken })
  });
  
  if (response.ok) {
    const { data } = await response.json();
    return data.accessToken;
  }
  
  // Token invalide, rediriger vers login
  window.location.href = '/login';
}
```

---

## 🐛 Troubleshooting

### **Token expiré**
```
401 Unauthorized: "Token expired"
```
**Solution** : Utiliser le refresh token pour obtenir un nouveau access token

### **Permissions insuffisantes**  
```
403 Forbidden: "Insufficient permissions"
```
**Solution** : Vérifier le rôle requis pour cette route

### **Token invalide**
```
401 Unauthorized: "Invalid token"
```
**Solution** : Vérifier le format `Bearer {token}` et la validité du token

### **Mot de passe faible**
```
400 Bad Request: "Password must contain at least one letter, one number and one special character"
```
**Solution** : Respecter les critères de validation du mot de passe

---

## 🎯 Prochaines étapes

- [ ] ✅ **Étape 3 complétée** : Authentification JWT
- [ ] **Étape 4** : Entités principales (Recettes, Catégories, etc.)
- [ ] **Étape 5** : Routes CRUD complètes  
- [ ] **Étape 6** : Tests unitaires et d'intégration
- [ ] **Étape 7** : Sécurisation avancée

Le système d'authentification est maintenant opérationnel ! 🚀 