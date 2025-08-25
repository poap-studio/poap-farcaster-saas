const { Client } = require('pg');
require('dotenv').config();

async function applyMigration() {
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.error('DATABASE_URL not found in environment variables');
    process.exit(1);
  }

  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Check if column already exists
    const checkQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'InstagramMessage' 
      AND column_name = 'senderUsername';
    `;
    
    const checkResult = await client.query(checkQuery);
    
    if (checkResult.rows.length > 0) {
      console.log('Column senderUsername already exists in InstagramMessage table');
      return;
    }

    // Apply migration
    console.log('Applying migration: Adding senderUsername column to InstagramMessage table...');
    
    await client.query('BEGIN');
    
    // Add column
    await client.query('ALTER TABLE "InstagramMessage" ADD COLUMN "senderUsername" TEXT');
    console.log('✓ Added senderUsername column');
    
    // Create index
    await client.query('CREATE INDEX "InstagramMessage_senderUsername_idx" ON "InstagramMessage"("senderUsername")');
    console.log('✓ Created index on senderUsername');
    
    await client.query('COMMIT');
    console.log('✓ Migration completed successfully');

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error applying migration:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Run migration
applyMigration()
  .then(() => {
    console.log('Migration script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });