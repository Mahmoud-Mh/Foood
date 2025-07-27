-- 🗑️ SCRIPT DE NETTOYAGE COMPLET DE LA BASE DE DONNÉES
-- Vide toutes les données tout en préservant la structure

-- Désactiver temporairement les contraintes de clés étrangères
SET session_replication_role = replica;

-- Vider les tables dans l'ordre des dépendances (enfants en premier)
TRUNCATE TABLE recipe_steps CASCADE;
TRUNCATE TABLE recipe_ingredients CASCADE;
TRUNCATE TABLE recipes CASCADE;
TRUNCATE TABLE ingredients CASCADE;
TRUNCATE TABLE categories CASCADE;
TRUNCATE TABLE users CASCADE;

-- Réactiver les contraintes de clés étrangères
SET session_replication_role = DEFAULT;

-- Optionnel : Reset des séquences pour les IDs auto-increment (si utilisées)
-- ALTER SEQUENCE users_id_seq RESTART WITH 1;
-- ALTER SEQUENCE categories_id_seq RESTART WITH 1;

-- Vérification : Compter les enregistrements restants
SELECT 
    'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 
    'categories' as table_name, COUNT(*) as count FROM categories
UNION ALL
SELECT 
    'ingredients' as table_name, COUNT(*) as count FROM ingredients
UNION ALL
SELECT 
    'recipes' as table_name, COUNT(*) as count FROM recipes
UNION ALL
SELECT 
    'recipe_ingredients' as table_name, COUNT(*) as count FROM recipe_ingredients
UNION ALL
SELECT 
    'recipe_steps' as table_name, COUNT(*) as count FROM recipe_steps;

-- Message de confirmation
SELECT 'Base de données nettoyée avec succès!' as status; 