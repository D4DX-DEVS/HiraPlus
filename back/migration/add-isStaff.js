
// Try loading .env from backend; if not present, also try project root
try {
  require('dotenv').config();
} catch (_) {}
try {
  if (!process.env.MONGO_URI) {
    require('dotenv').config({ path: require('path').resolve(__dirname, '..', '.env') });
  }
} catch (_) {}

const mongoose = require('mongoose');
const User = require('../models/User');

(async () => {
  try {
    // Allow passing URI via CLI: node migration/add-isStaff.js "mongodb://..."
    const uriFromCli = process.argv[2];
    const mongoUri = uriFromCli || process.env.MONGODB_URI;

    if (!mongoUri || typeof mongoUri !== 'string') {
      console.error('❌ Migration error: MONGO_URI is not set.');
      console.error('➡️  Set MONGO_URI in your .env or pass it as an argument:');
      console.error('   node migration/add-isStaff.js "mongodb://localhost:27017/hira_plus"');
      process.exit(1);
    }

    console.log('🔄 Connecting to MongoDB...');
    await mongoose.connect(mongoUri, {});
    console.log('✅ Connected to MongoDB');
    
    console.log('🔄 Updating users with missing isStaff field...');
    const result = await User.updateMany(
      { isStaff: { $exists: false } },
      { $set: { isStaff: true } }
    );
    
    if (typeof result.modifiedCount === 'number') {
      console.log(`✅ Updated ${result.modifiedCount} users to set isStaff=true`);
      if (typeof result.matchedCount === 'number') {
        console.log(`📊 Total matched: ${result.matchedCount}`);
      }
    } else {
      console.log('✅ Migration completed. (modifiedCount not available on this Mongo driver version)');
    }
    
  } catch (error) {
    console.error('❌ Migration error:', error);
    process.exit(1);
  } finally {
    try {
      await mongoose.disconnect();
      console.log('👋 Disconnected from MongoDB');
    } catch (_) {}
    process.exit(0);
  }
})();

