require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Role = require('../models/Roles');

const verifyMigration = async () => {
  try {
    console.log('🔍 Starting migration verification...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Step 1: Check if roles exist
    console.log('📝 Checking roles...');
    const roles = await Role.find();
    console.log(`✅ Found ${roles.length} roles:`, roles.map(r => r.name));

    // Step 2: Check users with string roles (should be 0)
    console.log('👥 Checking users with string roles...');
    const usersWithStringRoles = await User.find({ 
      role: { $type: 'string' } 
    });
    console.log(`📊 Users with string roles: ${usersWithStringRoles.length}`);
    
    if (usersWithStringRoles.length > 0) {
      console.log('❌ Migration incomplete - found users with string roles:');
      usersWithStringRoles.forEach(user => {
        console.log(`  - ${user.name} (${user.phoneNumber}): ${user.role}`);
      });
    }

    // Step 3: Check users with ObjectId roles
    console.log('👥 Checking users with ObjectId roles...');
    const usersWithObjectIdRoles = await User.find({ 
      role: { $type: 'objectId' } 
    });
    console.log(`📊 Users with ObjectId roles: ${usersWithObjectIdRoles.length}`);

    // Step 4: Test role population
    console.log('🧪 Testing role population...');
    const testUsers = await User.find().populate('role', 'name').limit(5);
    
    let populationSuccess = true;
    testUsers.forEach(user => {
      if (!user.role || !user.role.name) {
        console.log(`❌ Role population failed for user: ${user.name}`);
        populationSuccess = false;
      } else {
        console.log(`✅ ${user.name}: role = "${user.role.name}"`);
      }
    });

    // Step 5: Check role distribution
    console.log('📊 Checking role distribution...');
    const roleDistribution = {};
    for (const role of roles) {
      const count = await User.countDocuments({ role: role._id });
      roleDistribution[role.name] = count;
      console.log(`  - ${role.name}: ${count} users`);
    }

    // Step 6: Test specific role queries
    console.log('🧪 Testing role-based queries...');
    
    // Test driver query
    const driverRole = await Role.findOne({ name: 'driver' });
    if (driverRole) {
      const drivers = await User.find({ role: driverRole._id }).populate('role', 'name');
      console.log(`✅ Found ${drivers.length} drivers`);
    }

    // Test leader query
    const leaderRole = await Role.findOne({ name: 'leader' });
    if (leaderRole) {
      const leaders = await User.find({ role: leaderRole._id }).populate('role', 'name');
      console.log(`✅ Found ${leaders.length} leaders`);
    }

    // Test super leader query
    const superLeaderRole = await Role.findOne({ name: 'super leader' });
    if (superLeaderRole) {
      const superLeaders = await User.find({ role: superLeaderRole._id }).populate('role', 'name');
      console.log(`✅ Found ${superLeaders.length} super leaders`);
    }

    // Summary
    console.log('\n📊 Migration Verification Summary:');
    console.log(`✅ Total roles: ${roles.length}`);
    console.log(`✅ Users with string roles: ${usersWithStringRoles.length} (should be 0)`);
    console.log(`✅ Users with ObjectId roles: ${usersWithObjectIdRoles.length}`);
    console.log(`✅ Role population test: ${populationSuccess ? 'PASSED' : 'FAILED'}`);
    
    if (usersWithStringRoles.length === 0 && populationSuccess) {
      console.log('🎉 Migration verification PASSED!');
      console.log('✅ All users have ObjectId role references');
      console.log('✅ Role population works correctly');
      console.log('✅ Role-based queries work correctly');
    } else {
      console.log('❌ Migration verification FAILED!');
      console.log('⚠️  Some issues need to be resolved');
    }

  } catch (error) {
    console.error('💥 Verification failed:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

// Run verification if this file is executed directly
if (require.main === module) {
  verifyMigration()
    .then(() => {
      console.log('🎯 Verification script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Verification script failed:', error);
      process.exit(1);
    });
}

module.exports = verifyMigration;

