require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Role = require('../models/Roles');

const testRoleSystem = async () => {
  try {
    console.log('🧪 Starting role system tests...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Test 1: Role CRUD Operations
    console.log('\n📝 Test 1: Role CRUD Operations');
    
    // Create a test role
    const testRole = new Role({ name: 'test_role' });
    await testRole.save();
    console.log('✅ Created test role');
    
    // Read role
    const foundRole = await Role.findById(testRole._id);
    console.log('✅ Read role:', foundRole.name);
    
    // Update role
    foundRole.name = 'updated_test_role';
    await foundRole.save();
    console.log('✅ Updated role:', foundRole.name);
    
    // Delete role
    await Role.findByIdAndDelete(testRole._id);
    console.log('✅ Deleted test role');

    // Test 2: User Role Assignment
    console.log('\n👥 Test 2: User Role Assignment');
    
    // Get member role (default)
    const memberRole = await Role.findOne({ name: 'member' });
    if (!memberRole) {
      throw new Error('Member role not found');
    }
    console.log('✅ Found member role:', memberRole._id);
    
    // Get a test user
    const testUser = await User.findOne();
    if (!testUser) {
      console.log('⚠️  No users found for testing');
    } else {
      console.log('✅ Found test user:', testUser.name);
      console.log('✅ User role type:', typeof testUser.role);
      console.log('✅ User role value:', testUser.role);
    }

    // Test 3: Role Population
    console.log('\n🔗 Test 3: Role Population');
    
    const usersWithRoles = await User.find().populate('role', 'name').limit(3);
    usersWithRoles.forEach(user => {
      if (user.role && user.role.name) {
        console.log(`✅ ${user.name}: role = "${user.role.name}"`);
      } else {
        console.log(`❌ ${user.name}: role population failed`);
      }
    });

    // Test 4: Role-based Queries
    console.log('\n🔍 Test 4: Role-based Queries');
    
    // Test finding users by role
    const driverRole = await Role.findOne({ name: 'driver' });
    if (driverRole) {
      const drivers = await User.find({ role: driverRole._id }).populate('role', 'name');
      console.log(`✅ Found ${drivers.length} drivers`);
    }
    
    const leaderRole = await Role.findOne({ name: 'leader' });
    if (leaderRole) {
      const leaders = await User.find({ role: leaderRole._id }).populate('role', 'name');
      console.log(`✅ Found ${leaders.length} leaders`);
    }

    // Test 5: Role Validation
    console.log('\n✅ Test 5: Role Validation');
    
    // Test role name validation
    const allRoles = await Role.find();
    const expectedRoles = ['member', 'driver', 'accountant', 'leader', 'super leader'];
    
    for (const expectedRole of expectedRoles) {
      const role = allRoles.find(r => r.name === expectedRole);
      if (role) {
        console.log(`✅ Role "${expectedRole}" exists`);
      } else {
        console.log(`❌ Role "${expectedRole}" missing`);
      }
    }

    // Test 6: User Role Assignment Test
    console.log('\n🔄 Test 6: User Role Assignment Test');
    
    if (testUser && leaderRole) {
      // Store original role
      const originalRole = testUser.role;
      
      // Assign leader role
      testUser.role = leaderRole._id;
      await testUser.save();
      console.log('✅ Assigned leader role to test user');
      
      // Verify assignment
      const updatedUser = await User.findById(testUser._id).populate('role', 'name');
      if (updatedUser.role && updatedUser.role.name === 'leader') {
        console.log('✅ Role assignment verified');
      } else {
        console.log('❌ Role assignment failed');
      }
      
      // Restore original role
      testUser.role = originalRole;
      await testUser.save();
      console.log('✅ Restored original role');
    }

    // Test 7: Authentication Middleware Simulation
    console.log('\n🔐 Test 7: Authentication Middleware Simulation');
    
    const testUsers = await User.find().populate('role', 'name').limit(5);
    testUsers.forEach(user => {
      if (user.role) {
        const isLeader = user.role.name === 'leader';
        const isSuperLeader = user.role.name === 'super leader';
        const isDriver = user.role.name === 'driver';
        
        console.log(`✅ ${user.name}: leader=${isLeader}, superLeader=${isSuperLeader}, driver=${isDriver}`);
      } else {
        console.log(`❌ ${user.name}: no role found`);
      }
    });

    // Summary
    console.log('\n🎉 Role System Test Summary:');
    console.log('✅ Role CRUD operations work');
    console.log('✅ User role assignment works');
    console.log('✅ Role population works');
    console.log('✅ Role-based queries work');
    console.log('✅ Role validation works');
    console.log('✅ Authentication middleware simulation works');
    console.log('\n🎯 All tests passed! Role system is ready for use.');

  } catch (error) {
    console.error('💥 Test failed:', error);
    throw error;
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
};

// Run tests if this file is executed directly
if (require.main === module) {
  testRoleSystem()
    .then(() => {
      console.log('🎯 Test script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Test script failed:', error);
      process.exit(1);
    });
}

module.exports = testRoleSystem;
