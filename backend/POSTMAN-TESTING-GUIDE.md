# 🚀 Guide de Test Postman - Recipe App API

## 📥 **Import de la Collection**

1. **Télécharger** le fichier `Recipe-App-Complete-Tests.postman_collection.json`
2. **Ouvrir Postman** 
3. **Cliquer "Import"** → Sélectionner le fichier
4. **Importer** la collection

## 🔧 **Configuration Automatique**

La collection inclut des **variables automatiques** :
- `baseUrl` : `http://localhost:3000/api/v1`
- `userAccessToken` : Token utilisateur (géré automatiquement)
- `userRefreshToken` : Refresh token utilisateur
- `adminAccessToken` : Token admin (géré automatiquement)  
- `adminRefreshToken` : Refresh token admin

## 👥 **Nouveaux Utilisateurs de Test**

### **👤 Utilisateur Standard : Alice Smith**
- **Email :** `alice.smith@recipeapp.com`
- **Mot de passe :** `AlicePass123!`
- **Rôle :** User
- **Bio :** "Home chef passionate about Italian cuisine"

### **👑 Administrateur : Bob Wilson**
- **Email :** `bob.wilson@recipeapp.com`  
- **Mot de passe :** `BobAdmin123!`
- **Rôle :** Admin (après promotion SQL)
- **Bio :** "Restaurant manager and food critic"

### **👤 Utilisateur Créé par Admin : Charlie Brown**
- **Email :** `charlie.brown@recipeapp.com`
- **Mot de passe :** `CharliePass123!`
- **Rôle :** User
- **Bio :** "Beginner cook learning basics"

---

## 🧪 **Plan de Test Complet**

### **📋 Étape 1 : Health & Status Checks**
```
🏥 1. Health & Status Checks
├── Health Status ✅
└── Basic Hello ✅
```

### **📋 Étape 2 : Flux Utilisateur Complet**
```
🔐 2. User Authentication Flow
├── Register New User (Alice Smith) ✅
├── Login User (Alice) ✅  
├── Get User Profile ✅
├── Update User Profile ✅
├── Refresh User Token ✅
├── Change User Password ✅
└── User Logout ✅
```

### **📋 Étape 3 : Tests de Sécurité**
```
🚫 3. Authorization Tests (Should Fail)
├── Try Access Admin Route (Should Fail - 403) ❌
└── Try Access Without Token (Should Fail - 401) ❌
```

### **📋 Étape 4 : Flux Administrateur**
```
👑 4. Admin User Flow
├── Register Admin User (Bob Wilson) ✅
├── 📝 PROMOTE USER TO ADMIN (Manual SQL) ⚠️
└── Login Admin (Bob) - After SQL Promotion ✅
```

### **📋 Étape 5 : Opérations Admin**
```
🛡️ 5. Admin Operations
├── Get All Users (Admin) ✅
├── Get User Statistics (Admin) ✅
├── Create New User (Admin) ✅
└── Get Active Users (Admin) ✅
```

### **📋 Étape 6 : Gestion d'Erreurs**
```
🧪 6. Edge Cases & Error Handling
├── Register Duplicate Email (Should Fail - 409) ❌
├── Login Wrong Password (Should Fail - 401) ❌
├── Invalid Refresh Token (Should Fail - 401) ❌
└── Weak Password Registration (Should Fail - 400) ❌
```

---

## 🔄 **Instructions d'Exécution**

### **🚀 Méthode 1 : Test Automatique Complet**

1. **Cliquer** sur "Recipe App API - Complete Tests" dans Postman
2. **Cliquer** "Run Collection" (▶️)
3. **Configurer** :
   - Delay: 1000ms entre les requêtes
   - Iterations: 1
4. **Lancer** les tests
5. **Voir** les résultats en temps réel

### **⚠️ IMPORTANT : Promotion Admin**

Après l'étape **"Register Admin User (Bob Wilson)"**, **STOP** et exécutez cette commande SQL :

```sql
-- Méthode 1: PowerShell
& "C:\Program Files\PostgreSQL\17\bin\psql.exe" -h localhost -U postgres -d recipe_app -c "UPDATE users SET role = 'admin' WHERE email = 'bob.wilson@recipeapp.com';"

-- Méthode 2: Client SQL direct
UPDATE users SET role = 'admin' WHERE email = 'bob.wilson@recipeapp.com';
```

Puis continuez avec **"Login Admin (Bob) - After SQL Promotion"**.

### **🎯 Méthode 2 : Test Manuel Étape par Étape**

Exécutez chaque dossier dans l'ordre :
1. 🏥 Health Checks
2. 🔐 User Authentication  
3. 🚫 Authorization Tests
4. 👑 Admin Flow (avec pause pour SQL)
5. 🛡️ Admin Operations
6. 🧪 Edge Cases

---

## ✅ **Validation des Résultats**

### **🟢 Tests de Succès (Status 200)**
- Inscription Alice ✅
- Connexion utilisateurs ✅
- Accès profils ✅
- Opérations admin ✅
- Refresh tokens ✅

### **🔴 Tests d'Échec Attendus**
- 403 Forbidden (accès admin sans droits)
- 401 Unauthorized (pas de token)
- 409 Conflict (email dupliqué)
- 400 Bad Request (mot de passe faible)

### **📊 Scripts de Test Automatiques**

Chaque requête inclut des **tests automatiques** :

```javascript
// Exemple de test automatique
pm.test('Registration successful', function () {
    pm.response.to.have.status(200);
});

pm.test('User data and tokens received', function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData.success).to.eql(true);
    pm.expect(jsonData.data.tokens).to.be.an('object');
});
```

---

## 📈 **Rapports et Logs**

### **Console Logs**
Les scripts affichent des messages dans la console Postman :
- ✅ "User tokens saved: Alice Smith"
- ✅ "Admin logged in with admin role" 
- ⚠️ "Remember to promote this user to admin role in database!"

### **Test Results**
Postman génère un rapport détaillé avec :
- Nombre de tests passés/échoués
- Temps de réponse de chaque requête
- Codes de statut HTTP
- Messages d'erreur détaillés

---

## 🛠️ **Troubleshooting**

### **❌ Erreur : Base de données vide**
```bash
# Solution : Redémarrer l'application
cd backend
npm run start:dev
```

### **❌ Erreur : Variables non définies**
1. Vérifier que la collection est bien importée
2. Exécuter d'abord "Register New User"
3. Les tokens sont sauvegardés automatiquement

### **❌ Erreur : Admin tests échouent**
1. Vérifier que Bob Wilson est promu admin en SQL
2. Re-login Bob après promotion
3. Utiliser le bon token admin

### **❌ Erreur : Port 3000 inaccessible**
1. Vérifier que l'app NestJS fonctionne
2. Tester `http://localhost:3000/api/v1/health`
3. Modifier `baseUrl` si nécessaire

---

## 📝 **Résumé des Tests**

**Total :** 15+ requêtes organisées en 6 catégories

**✅ Fonctionnalités validées :**
- Inscription/Connexion
- Authentification JWT  
- Autorisation par rôles
- Gestion des profils
- Operations admin
- Gestion d'erreurs
- Refresh tokens
- Sécurité des routes

**🎯 Prêt pour l'Étape 4 :** Création des entités Recettes, Catégories, Ingrédients !

---

## 🚀 **Commandes Rapides**

```bash
# Démarrer l'application
cd backend && npm run start:dev

# Promouvoir Bob en admin
& "C:\Program Files\PostgreSQL\17\bin\psql.exe" -h localhost -U postgres -d recipe_app -c "UPDATE users SET role = 'admin' WHERE email = 'bob.wilson@recipeapp.com';"

# Vider la base (si besoin)
& "C:\Program Files\PostgreSQL\17\bin\psql.exe" -h localhost -U postgres -c "DROP DATABASE IF EXISTS recipe_app; CREATE DATABASE recipe_app;"
```

**Happy Testing! 🧪✨** 