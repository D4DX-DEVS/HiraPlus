require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Role = require('../models/Roles');

const migrateRoles = async () => {
  try {
    console.log('🚀 Starting role migration...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Step 1: Create default roles
    console.log('📝 Creating default roles...');
    const defaultRoles = [
      { name: 'member' },
      { name: 'driver' },
      { name: 'accountant' },
      { name: 'leader' },
      { name: 'super leader' }
    ];

    const createdRoles = [];
    for (const roleData of defaultRoles) {
      let role = await Role.findOne({ name: roleData.name });
      if (!role) {
        role = new Role(roleData);
        await role.save();
        console.log(`✅ Created role: ${roleData.name}`);
      } else {
        console.log(`ℹ️  Role already exists: ${roleData.name}`);
      }
      createdRoles.push(role);
    }

    // Step 2: Get member role (default for all users)
    const memberRole = await Role.findOne({ name: 'member' });
    if (!memberRole) {
      throw new Error('Member role not found after creation');
    }
    console.log(`✅ Member role ID: ${memberRole._id}`);

    // Step 3: Get all users
    console.log('👥 Getting all users...');
    const users = await User.find({});
    console.log(`📊 Found ${users.length} users to migrate`);

    // Step 4: Update all users to member role
    console.log('🔄 Updating all users to member role...');
    let updatedCount = 0;
    let errorCount = 0;

    for (const user of users) {
      try {
        // Check if user already has ObjectId role (already migrated)
        if (typeof user.role === 'object' && user.role._id) {
          console.log(`ℹ️  User ${user.name} already has ObjectId role, skipping`);
          continue;
        }

        // Update user role to member role ObjectId
        user.role = memberRole._id;
        await user.save();
        updatedCount++;
        console.log(`✅ Updated user: ${user.name} (${user.phoneNumber})`);
      } catch (error) {
        errorCount++;
        console.error(`❌ Error updating user ${user.name}:`, error.message);
      }
    }

    // Step 5: Verification
    console.log('🔍 Verifying migration...');
    const usersWithStringRoles = await User.find({ 
      role: { $type: 'string' } 
    });
    
    const usersWithObjectIdRoles = await User.find({ 
      role: { $type: 'objectId' } 
    });

    console.log('\n📊 Migration Summary:');
    console.log(`✅ Users updated: ${updatedCount}`);
    console.log(`❌ Errors: ${errorCount}`);
    console.log(`📝 Users with string roles: ${usersWithStringRoles.length}`);
    console.log(`📝 Users with ObjectId roles: ${usersWithObjectIdRoles.length}`);

    if (usersWithStringRoles.length === 0) {
      console.log('🎉 Migration completed successfully!');
      console.log('✅ All users now have ObjectId role references');
    } else {
      console.log('⚠️  Migration incomplete - some users still have string roles');
    }

    // Step 6: Test role population
    console.log('🧪 Testing role population...');
    const testUser = await User.findOne().populate('role');
    if (testUser && testUser.role && testUser.role.name) {
      console.log(`✅ Role population test successful: ${testUser.name} has role "${testUser.role.name}"`);
    } else {
      console.log('❌ Role population test failed');
    }

  } catch (error) {
    console.error('💥 Migration failed:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

// Run migration if this file is executed directly
if (require.main === module) {
  migrateRoles()
    .then(() => {
      console.log('🎯 Migration script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration script failed:', error);
      process.exit(1);
    });
}

module.exports = migrateRoles;

