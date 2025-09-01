const { Client } = require('pg');

// Database configuration
const dbConfig = {
  host: 'localhost',
  port: 5432,
  database: 'recipe_app',
  user: 'postgres',
  password: 'TAM1234',
};

async function fixRatingStats() {
  const client = new Client(dbConfig);
  
  try {
    await client.connect();
    console.log('Connected to database');

    // Get all recipes that have ratings
    const recipesWithRatings = await client.query(`
      SELECT DISTINCT r."recipeId", rec.title
      FROM ratings r
      JOIN recipes rec ON r."recipeId" = rec.id
      WHERE r."isActive" = true
    `);

    console.log(`Found ${recipesWithRatings.rows.length} recipes with ratings`);

    for (const recipe of recipesWithRatings.rows) {
      const recipeId = recipe.recipeId;
      const title = recipe.title;

      // Calculate rating statistics
      const stats = await client.query(`
        SELECT 
          AVG(rating)::numeric(3,2) as average_rating,
          COUNT(id) as ratings_count
        FROM ratings 
        WHERE "recipeId" = $1 AND "isActive" = true
      `, [recipeId]);

      const averageRating = parseFloat(stats.rows[0].average_rating) || 0;
      const ratingsCount = parseInt(stats.rows[0].ratings_count) || 0;

      console.log(`Recipe "${title}": ${ratingsCount} ratings, average: ${averageRating}`);

      // Update the recipe with calculated stats
      await client.query(`
        UPDATE recipes 
        SET "averageRating" = $1, "ratingsCount" = $2
        WHERE id = $3
      `, [averageRating, ratingsCount, recipeId]);

      console.log(`Updated recipe ${title}`);
    }

    console.log('Rating stats fix completed successfully!');
  } catch (error) {
    console.error('Error fixing rating stats:', error);
  } finally {
    await client.end();
  }
}

// Run the fix
fixRatingStats();