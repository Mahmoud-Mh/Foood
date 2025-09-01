const { Client } = require('pg');

const dbConfig = {
  host: 'localhost',
  port: 5432,
  database: 'recipe_app',
  user: 'postgres',
  password: 'TAM1234',
};

async function debugRatings() {
  const client = new Client(dbConfig);
  
  try {
    await client.connect();
    console.log('Connected to database');

    const recipeId = 'e8986fb1-d7c2-4fee-81f4-bd6fc563dd8e';
    
    // Check recipe data
    const recipe = await client.query(`
      SELECT id, title, "averageRating", "ratingsCount"
      FROM recipes 
      WHERE id = $1
    `, [recipeId]);
    
    console.log('Recipe data:', recipe.rows[0]);

    // Check ratings for this recipe
    const ratings = await client.query(`
      SELECT id, rating, "isActive", "recipeId", "createdAt"
      FROM ratings 
      WHERE "recipeId" = $1
      ORDER BY "createdAt" DESC
    `, [recipeId]);
    
    console.log('Ratings for this recipe:', ratings.rows);

    // Calculate stats manually
    const stats = await client.query(`
      SELECT 
        AVG(rating)::numeric(3,2) as average_rating,
        COUNT(id) as ratings_count
      FROM ratings 
      WHERE "recipeId" = $1 AND "isActive" = true
    `, [recipeId]);
    
    console.log('Calculated stats:', stats.rows[0]);

    // Check distribution
    const distribution = await client.query(`
      SELECT 
        rating as rating_value,
        COUNT(id) as count
      FROM ratings 
      WHERE "recipeId" = $1 AND "isActive" = true
      GROUP BY rating
      ORDER BY rating ASC
    `, [recipeId]);
    
    console.log('Rating distribution:', distribution.rows);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

debugRatings();