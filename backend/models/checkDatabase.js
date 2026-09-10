// checkDatabase.js - Run this to see what's in your database
const mongoose = require('mongoose');
const User = require('./models/User'); // Adjust path as needed
require('dotenv').config();

const checkDatabase = async () => {
  try {
    console.log('🔍 Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to database');
    
    // Check all users
    console.log('\n📊 All users in database:');
    const allUsers = await User.find({});
    
    if (allUsers.length === 0) {
      console.log('❌ No users found in database!');
    } else {
      allUsers.forEach(user => {
        console.log(`  - ID: ${user._id}`);
        console.log(`    Name: ${user.name}`);
        console.log(`    Email: ${user.email}`);
        console.log(`    Role: ${user.role}`);
        console.log(`    Active: ${user.isActive}`);
        console.log('  ---');
      });
    }
    
    // Check specifically for admin users
    console.log('\n👑 Admin users:');
    const adminUsers = await User.find({ role: 'admin' });
    
    if (adminUsers.length === 0) {
      console.log('❌ No admin users found!');
    } else {
      adminUsers.forEach(admin => {
        console.log(`  - ID: ${admin._id}`);
        console.log(`    Name: ${admin.name}`);
        console.log(`    Email: ${admin.email}`);
        console.log(`    Active: ${admin.isActive}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    mongoose.connection.close();
    console.log('\n💡 If no admin users found, run the createAdmin.js script');
  }
};

checkDatabase();