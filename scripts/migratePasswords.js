const bcrypt = require('bcrypt');
const db = require('../config/db');
const { promisify } = require('util');

const query = promisify(db.query).bind(db);

async function migratePasswords() {
  try {
    console.log('🔄 Starting password migration...');
    
    const users = await query('SELECT userid, password FROM user');
    
    console.log(`📊 Found ${users.length} users to migrate`);
    
    for (const user of users) {
      if (user.password.startsWith('$2b$')) {
        console.log(`⏭️  User ${user.userid} already has hashed password, skipping...`);
        continue;
      }
      
      const hashedPassword = await bcrypt.hash(user.password, 10);
      await query('UPDATE user SET password = ? WHERE userid = ?', [hashedPassword, user.userid]);
      
      console.log(`✅ Migrated password for user ${user.userid}`);
    }
    
    console.log('🎉 Password migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  }
}

migratePasswords();