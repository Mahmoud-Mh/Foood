# 🧪 **GUIDE COMPLET - TESTS MODULAIRES**

## 🎯 **COLLECTIONS CRÉÉES**

J'ai créé **3 collections Postman spécialisées** pour tester chaque module individuellement :

### 📂 **1. Categories-COMPLETE-Tests.postman_collection.json**
- ✅ **Tests CRUD complets** pour Categories
- ✅ **Fonctionnalités spéciales** : Slug, Active status, Stats
- ✅ **Gestion d'erreurs** et validation
- ✅ **15 tests** au total

### 🥕 **2. Ingredients-COMPLETE-Tests.postman_collection.json**
- ✅ **Tests CRUD complets** pour Ingredients
- ✅ **Fonctionnalités spéciales** : Search, Category filtering, Stats
- ✅ **Gestion d'erreurs** et validation
- ✅ **18 tests** au total

### 🍝 **3. Recipes-COMPLETE-Tests.postman_collection.json**
- ✅ **Tests CRUD complets** pour Recipes
- ✅ **Relations complètes** : Category, Ingredients, Steps
- ✅ **Fonctionnalités avancées** : Search, Featured, Status, Stats
- ✅ **25 tests** au total

---

## 🚀 **INSTRUCTIONS D'UTILISATION**

### **ÉTAPE 1 : Préparer l'environnement**
```bash
# 1. S'assurer que le serveur NestJS fonctionne
cd backend
npm run start:dev

# 2. Vérifier que la DB est propre (optionnel)
# Utiliser l'outil de reset si nécessaire
```

### **ÉTAPE 2 : Importer les collections dans Postman**

1. **Ouvrir Postman**
2. **Cliquer sur "Import"**
3. **Importer les 3 fichiers :**
   - `Categories-COMPLETE-Tests.postman_collection.json`
   - `Ingredients-COMPLETE-Tests.postman_collection.json`
   - `Recipes-COMPLETE-Tests.postman_collection.json`

### **ÉTAPE 3 : Exécuter les tests**

#### **Option A : Tests individuels (Recommandé)**
```
1. Categories Module ➜ Run Collection ➜ Vérifier 100%
2. Ingredients Module ➜ Run Collection ➜ Vérifier 100%  
3. Recipes Module ➜ Run Collection ➜ Vérifier 100%
```

#### **Option B : Tests manuels (Debug)**
- Exécuter test par test pour voir les détails
- Vérifier les logs dans la Console Postman
- Analyser les réponses API

---

## 📊 **DÉTAIL DES TESTS PAR MODULE**

### **📂 CATEGORIES MODULE**

| Test | Endpoint | Méthode | Validation |
|------|----------|---------|-----------|
| **Setup** | `/auth/register` | POST | Admin user creation |
| **Setup** | `/users/promote-to-admin` | PATCH | Admin promotion |
| **Create** | `/categories` | POST | Category creation |
| **Read All** | `/categories` | GET | Pagination, list |
| **Read by ID** | `/categories/:id` | GET | Single category |
| **Read by Slug** | `/categories/slug/:slug` | GET | Slug lookup |
| **Update** | `/categories/:id` | PATCH | Category modification |
| **Active List** | `/categories/active` | GET | Active filtering |
| **Stats** | `/categories/stats` | GET | Admin statistics |
| **Toggle Status** | `/categories/:id/toggle-active` | PATCH | Active/Inactive |
| **Additional** | Multiple tests | Various | Pagination, errors |
| **Cleanup** | `/categories/:id` | DELETE | Test cleanup |

### **🥕 INGREDIENTS MODULE**

| Test | Endpoint | Méthode | Validation |
|------|----------|---------|-----------|
| **Setup** | `/auth/register` | POST | Admin user creation |
| **Setup** | `/users/promote-to-admin` | PATCH | Admin promotion |
| **Create** | `/ingredients` | POST | Ingredient creation |
| **Read All** | `/ingredients` | GET | Pagination, list |
| **Read by ID** | `/ingredients/:id` | GET | Single ingredient |
| **Update** | `/ingredients/:id` | PATCH | Ingredient modification |
| **Active List** | `/ingredients/active` | GET | Active filtering |
| **Search** | `/ingredients/search` | GET | Text search |
| **By Category** | `/ingredients/category/:cat` | GET | Category filtering |
| **Stats** | `/ingredients/stats` | GET | Admin statistics |
| **Toggle Status** | `/ingredients/:id/toggle-active` | PATCH | Active/Inactive |
| **Most Used** | `/ingredients/most-used` | GET | Usage statistics |
| **Multiple Create** | `/ingredients` | POST | Batch creation |
| **Cleanup** | `/ingredients/:id` | DELETE | Test cleanup |

### **🍝 RECIPES MODULE (Le plus complexe)**

| Test | Endpoint | Méthode | Validation |
|------|----------|---------|-----------|
| **Setup** | Multiple | Various | Admin + Category + Ingredient |
| **Create with Relations** | `/recipes` | POST | Recipe + Ingredients + Steps |
| **Read All** | `/recipes` | GET | Admin view with pagination |
| **Read by ID** | `/recipes/:id` | GET | Full recipe with relations |
| **Update** | `/recipes/:id` | PATCH | Recipe modification |
| **Published List** | `/recipes/published` | GET | Public recipes |
| **Change Status** | `/recipes/:id/status` | PATCH | Draft ➜ Published |
| **My Recipes** | `/recipes/my/recipes` | GET | User's recipes |
| **Search** | `/recipes/search` | GET | Text search |
| **By Category** | `/recipes/category/:id` | GET | Category filtering |
| **By Difficulty** | `/recipes/difficulty/:level` | GET | Difficulty filtering |
| **Toggle Featured** | `/recipes/:id/toggle-featured` | PATCH | Featured status |
| **Featured List** | `/recipes/featured` | GET | Featured recipes |
| **Admin Stats** | `/recipes/admin/stats` | GET | Complete statistics |
| **Advanced Search** | `/recipes/search` | GET | Complex filters |
| **Error Handling** | Various | Various | 404, validation |
| **Cleanup** | `/recipes/:id` | DELETE | Test cleanup |

---

## ✅ **RÉSULTATS ATTENDUS**

### **🎯 Succès complet :**
```
Categories: 15/15 tests ✅ (100%)
Ingredients: 18/18 tests ✅ (100%)  
Recipes: 25/25 tests ✅ (100%)

TOTAL: 58/58 tests ✅ (100%)
```

### **📈 Validation complète :**
- ✅ **CRUD Operations** : Create, Read, Update, Delete
- ✅ **Relations** : Category ↔ Recipe ↔ Ingredients ↔ Steps
- ✅ **Search & Filtering** : Text search, category, difficulty
- ✅ **Status Management** : Active/Inactive, Published/Draft, Featured
- ✅ **Statistics** : Admin dashboards, counts, analytics
- ✅ **Authentication** : JWT protection, role-based access
- ✅ **Pagination** : Correct meta information
- ✅ **Error Handling** : 404, validation errors

---

## 🔧 **TROUBLESHOOTING**

### **❌ Si des tests échouent :**

1. **Vérifier le serveur** :
   ```bash
   curl http://localhost:3000/api/v1/health
   ```

2. **Nettoyer la base de données** :
   ```sql
   TRUNCATE TABLE users, categories, ingredients, recipes, recipe_ingredients, recipe_steps CASCADE;
   ```

3. **Vérifier les logs serveur** :
   - Rechercher les erreurs SQL
   - Vérifier les constraints de validation

4. **Tests individuels** :
   - Exécuter manuellement test par test
   - Vérifier les variables Postman
   - Analyser les réponses d'erreur

### **⚡ Optimisations :**

- **Ordre d'exécution** : Categories → Ingredients → Recipes
- **Variables automatiques** : Les IDs sont stockés automatiquement
- **Cleanup automatique** : Chaque collection nettoie ses données
- **Logs détaillés** : Console Postman pour debugging

---

## 🎉 **CONCLUSION**

Ces **3 collections spécialisées** vont **valider complètement** tous vos modules backend :

✅ **Categories** : Gestion des catégories de recettes  
✅ **Ingredients** : Gestion des ingrédients avec recherche  
✅ **Recipes** : Gestion complète des recettes avec relations  

**Une fois ces tests réussis à 100%, votre API sera entièrement validée !** 🚀 