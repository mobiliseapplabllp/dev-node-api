const bcrypt = require('bcrypt');
const { promisePool } = require('../config/db');

async function migratePasswords() {
  try {
    console.log('🔄 Starting password migration...');
    console.log('📊 Database:', process.env.DB_NAME);
    console.log('');
    
    const [users] = await promisePool.execute('SELECT userid, username, password FROM user');
    
    console.log(`📊 Found ${users.length} users to check`);
    console.log('');
    
    let migratedCount = 0;
    let skippedCount = 0;
    let errorCount = 0;
    
    for (const user of users) {
      try {
        // Skip if already hashed
        if (user.password && user.password.startsWith('$2b$')) {
          console.log(`⏭️  User ${user.userid} (${user.username}) already has hashed password, skipping...`);
          skippedCount++;
          continue;
        }
        
        // Skip if password is null or empty
        if (!user.password || user.password.trim() === '') {
          console.log(`⚠️  User ${user.userid} (${user.username}) has empty password, skipping...`);
          skippedCount++;
          continue;
        }
        
        console.log(`🔄 Migrating user ${user.userid} (${user.username})...`);
        console.log(`   Current password (first 10 chars): ${user.password.substring(0, 10)}...`);
        
        // Hash the password
        const hashedPassword = await bcrypt.hash(user.password, 10);
        
        // Update in database
        await promisePool.execute('UPDATE user SET password = ? WHERE userid = ?', [hashedPassword, user.userid]);
        
        console.log(`✅ Migrated password for user ${user.userid} (${user.username})`);
        migratedCount++;
        console.log('');
        
      } catch (userError) {
        console.error(`❌ Error migrating user ${user.userid} (${user.username}):`, userError.message);
        errorCount++;
        console.log('');
      }
    }
    
    console.log('═══════════════════════════════════════════════════');
    console.log('🎉 Password migration completed!');
    console.log(`   ✅ Migrated: ${migratedCount} users`);
    console.log(`   ⏭️  Skipped: ${skippedCount} users`);
    console.log(`   ❌ Errors: ${errorCount} users`);
    console.log('═══════════════════════════════════════════════════');
    
    if (migratedCount > 0) {
      console.log('');
      console.log('⚠️  IMPORTANT: After migration, users must login with their ORIGINAL passwords.');
      console.log('   The passwords are now securely hashed.');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration error:', error);
    console.error('Error details:', error.message);
    console.error('Error code:', error.code);
    process.exit(1);
  }
}

migratePasswords();