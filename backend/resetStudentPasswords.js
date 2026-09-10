// reset-student-passwords.js
const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

// Generate password function
const generatePassword = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
  let password = '';
  for (let i = 0; i < 8; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

async function resetStudentPasswords() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Find all students with potential password issues
    const students = await User.find({ 
      role: 'student',
      isActive: true
    }).select('+password');

    console.log(`📋 Found ${students.length} students to check`);

    for (const student of students) {
      const newPassword = generatePassword();
      
      try {
        // Hash the password manually
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        
        // Update the student's password directly
        await User.findByIdAndUpdate(student._id, {
          password: hashedPassword
        });

        console.log(`✅ Reset password for ${student.name} (${student.email}): ${newPassword}`);
        
        // Optionally send email with new password
        // await emailService.resendLoginCredentials(
        //   student.email,
        //   student.name,
        //   newPassword,
        //   // mentor info...
        // );
        
      } catch (error) {
        console.error(`❌ Failed to reset password for ${student.name}:`, error);
      }
    }

    console.log('✅ Password reset completed');
  } catch (error) {
    console.error('❌ Script error:', error);
  } finally {
    await mongoose.disconnect();
  }
}

// Run the script
resetStudentPasswords();