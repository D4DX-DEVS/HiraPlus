const mongoose = require('mongoose');
require('dotenv').config();

async function updateTest3() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/hiraplus');
    console.log('Connected to MongoDB');

    const User = require('./models/User');
    console.log('Looking for Test 3...');
    
    const user = await User.findOne({name: 'Test 3'});
    if (user) {
      console.log('Found Test 3:', {
        name: user.name, 
        isIntern: user.isIntern, 
        designation: user.designation
      });
      
      console.log('Updating isIntern to true...');
      await User.updateOne({name: 'Test 3'}, {isIntern: true});
      
      const updatedUser = await User.findOne({name: 'Test 3'});
      console.log('✅ Test 3 updated successfully:', {
        name: updatedUser.name,
        isIntern: updatedUser.isIntern,
        designation: updatedUser.designation
      });
    } else {
      console.log('❌ Test 3 not found');
    }
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Error:', err.message);
    process.exit(1);
  }
}

updateTest3(); 