const { Client } = require('pg');

const dbConfig = {
  host: 'localhost',
  port: 5432,
  database: 'recipe_app',
  user: 'postgres',
  password: 'TAM1234',
};

async function debugRatingStats() {
  const client = new Client(dbConfig);
  
  try {
    await client.connect();
    console.log('Connected to database');

    const recipeId = 'e8986fb1-d7c2-4fee-81f4-bd6fc563dd8e';
    
    // Test the exact query from the service
    console.log('\n1. Testing the exact stats query:');
    const statsQuery = `
      SELECT 
        AVG(rating.rating)::numeric(3,2) as averageRating,
        COUNT(rating.id) as ratingsCount
      FROM ratings rating 
      WHERE rating."recipeId" = $1 AND rating."isActive" = $2
    `;
    
    const statsResult = await client.query(statsQuery, [recipeId, true]);
    console.log('Stats result:', statsResult.rows[0]);
    console.log('Type of averageRating:', typeof statsResult.rows[0].averagerating);
    console.log('Type of ratingsCount:', typeof statsResult.rows[0].ratingscount);
    
    // Test without casting
    console.log('\n2. Testing without numeric casting:');
    const statsQuery2 = `
      SELECT 
        AVG(rating.rating) as averageRating,
        COUNT(rating.id) as ratingsCount
      FROM ratings rating 
      WHERE rating."recipeId" = $1 AND rating."isActive" = $2
    `;
    
    const statsResult2 = await client.query(statsQuery2, [recipeId, true]);
    console.log('Stats result 2:', statsResult2.rows[0]);
    console.log('Type of averageRating:', typeof statsResult2.rows[0].averagerating);
    console.log('Type of ratingsCount:', typeof statsResult2.rows[0].ratingscount);

    // Test distribution query
    console.log('\n3. Testing distribution query:');
    const distQuery = `
      SELECT 
        rating.rating as rating_value,
        COUNT(rating.id) as count
      FROM ratings rating 
      WHERE rating."recipeId" = $1 AND rating."isActive" = $2
      GROUP BY rating.rating
      ORDER BY rating.rating ASC
    `;
    
    const distResult = await client.query(distQuery, [recipeId, true]);
    console.log('Distribution result:', distResult.rows);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

debugRatingStats();