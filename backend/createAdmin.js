// fixCorruptedAdmin.js - Fix the corrupted admin document
const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const connectDB = require('./config/database');

async function fixCorruptedAdmin() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await connectDB();
    console.log('✅ Connected to MongoDB');

    const adminEmail = process.env.ADMIN_EMAIL || 'adminabrar@gmail.com';
    
    console.log('🔍 Looking for corrupted admin document...');
    
    // Use direct MongoDB operations to bypass Mongoose validation
    const db = mongoose.connection.db;
    const usersCollection = db.collection('users');
    
    // Find the corrupted admin document
    const corruptedAdmin = await usersCollection.findOne({
      email: adminEmail,
      role: 'admin'
    });
    
    if (!corruptedAdmin) {
      console.log('❌ No admin document found');
      return;
    }
    
    console.log('🔍 Found admin document:', {
      _id: corruptedAdmin._id,
      _idType: typeof corruptedAdmin._id,
      name: corruptedAdmin.name,
      email: corruptedAdmin.email,
      role: corruptedAdmin.role
    });
    
    // Check if _id is corrupted (string instead of ObjectId)
    if (typeof corruptedAdmin._id === 'string' && corruptedAdmin._id === 'admin_id') {
      console.log('🚨 Detected corrupted _id field! Fixing...');
      
      // Delete the corrupted document
      const deleteResult = await usersCollection.deleteOne({ _id: 'admin_id' });
      console.log('🗑️ Deleted corrupted document:', deleteResult.deletedCount);
      
      // Now create a new admin using Mongoose (which will generate a proper ObjectId)
      const User = require('./models/User');
      
      const adminData = {
        name: process.env.ADMIN_NAME || 'System Administrator',
        email: adminEmail,
        password: process.env.ADMIN_PASSWORD || 'admin123456',
        role: 'admin',
        isActive: true
      };

      console.log('🆕 Creating new admin with proper ObjectId...');
      const newAdmin = new User(adminData);
      const savedAdmin = await newAdmin.save();

      console.log('✅ New admin created successfully!');
      console.log('👤 New Admin Details:', {
        id: savedAdmin._id.toString(),
        name: savedAdmin.name,
        email: savedAdmin.email,
        role: savedAdmin.role,
        isActive: savedAdmin.isActive
      });

      console.log('\n🔐 IMPORTANT: Update your .env file with:');
      console.log(`ADMIN_ID=${savedAdmin._id.toString()}`);
      console.log(`ADMIN_EMAIL=${savedAdmin.email}`);
      console.log(`ADMIN_NAME=${savedAdmin.name}`);
      console.log('\n⚠️ Remember to change the default password after testing!');
      
    } else if (mongoose.Types.ObjectId.isValid(corruptedAdmin._id)) {
      console.log('✅ Admin _id is already valid:', corruptedAdmin._id.toString());
      console.log('\n🔐 Use this in your .env file:');
      console.log(`ADMIN_ID=${corruptedAdmin._id.toString()}`);
    } else {
      console.log('🚨 Unknown _id format, creating new admin...');
      
      // Delete the unknown format document
      const deleteResult = await usersCollection.deleteOne({ 
        email: adminEmail, 
        role: 'admin' 
      });
      console.log('🗑️ Deleted unknown format document:', deleteResult.deletedCount);
      
      // Create new admin
      const User = require('./models/User');
      
      const adminData = {
        name: process.env.ADMIN_NAME || 'System Administrator',
        email: adminEmail,
        password: process.env.ADMIN_PASSWORD || 'admin123456',
        role: 'admin',
        isActive: true
      };

      console.log('🆕 Creating new admin...');
      const newAdmin = new User(adminData);
      const savedAdmin = await newAdmin.save();

      console.log('✅ New admin created successfully!');
      console.log('👤 New Admin Details:', {
        id: savedAdmin._id.toString(),
        name: savedAdmin.name,
        email: savedAdmin.email,
        role: savedAdmin.role,
        isActive: savedAdmin.isActive
      });

      console.log('\n🔐 Update your .env file with:');
      console.log(`ADMIN_ID=${savedAdmin._id.toString()}`);
    }
    
  } catch (error) {
    console.error('❌ Error fixing corrupted admin:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Additional function to verify the fix
async function verifyFix() {
  try {
    console.log('🔍 Verifying admin fix...');
    await connectDB();
    
    const User = require('./models/User');
    const adminEmail = process.env.ADMIN_EMAIL || 'adminabrar@gmail.com';
    
    const admin = await User.findOne({ 
      email: adminEmail, 
      role: 'admin' 
    }).select('_id name email role isActive');
    
    if (!admin) {
      console.log('❌ No admin found after fix attempt');
      return;
    }
    
    console.log('✅ Admin verification successful after fix:');
    console.log('👤 Admin Details:', {
      id: admin._id ? admin._id.toString() : 'STILL MISSING!',
      idType: typeof admin._id,
      name: admin.name,
      email: admin.email,
      role: admin.role,
      isActive: admin.isActive
    });
    
    if (admin._id && mongoose.Types.ObjectId.isValid(admin._id)) {
      console.log('✅ Admin _id is now valid!');
      console.log('\n🔐 Use this in your .env file:');
      console.log(`ADMIN_ID=${admin._id.toString()}`);
    } else {
      console.error('❌ Admin _id is still invalid!');
    }
    
  } catch (error) {
    console.error('❌ Error verifying fix:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// Run based on command line argument
const action = process.argv[2];
if (action === 'verify') {
  verifyFix();
} else {
  fixCorruptedAdmin();
}