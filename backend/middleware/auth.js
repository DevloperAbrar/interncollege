const jwt = require('jsonwebtoken');
const User = require('../models/User');

const auth = async (req, res, next) => {
  console.log('\n🔐 ========== AUTH MIDDLEWARE STARTED ==========');
  console.log('🔍 Request URL:', req.method, req.originalUrl);
  console.log('🔍 Request headers:', JSON.stringify(req.headers, null, 2));
  
  try {
    // Get token from header
    const authHeader = req.header('Authorization');
    console.log('🔍 Raw Auth header:', authHeader);
    
    if (!authHeader) {
      console.log('❌ No Authorization header found');
      return res.status(401).json({
        success: false,
        message: 'No Authorization header provided',
        debug: 'AUTH_HEADER_MISSING'
      });
    }

    if (!authHeader.startsWith('Bearer ')) {
      console.log('❌ Invalid Authorization header format');
      return res.status(401).json({
        success: false,
        message: 'Invalid Authorization header format. Expected: Bearer <token>',
        debug: 'INVALID_AUTH_FORMAT'
      });
    }
    
    const token = authHeader.replace('Bearer ', '');
    console.log('🔍 Extracted token length:', token.length);
    console.log('🔍 Token (first/last 10 chars):', token.substring(0, 10) + '...' + token.substring(token.length - 10));
    
    // Check if JWT_SECRET exists
    if (!process.env.JWT_SECRET) {
      console.log('❌ JWT_SECRET not found in environment');
      return res.status(500).json({
        success: false,
        message: 'Server configuration error - JWT_SECRET missing',
        debug: 'JWT_SECRET_MISSING'
      });
    }
    
    console.log('✅ JWT_SECRET found, length:', process.env.JWT_SECRET.length);

    // Verify JWT token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
      console.log('✅ JWT verification successful');
      console.log('🔍 Decoded token payload:', JSON.stringify(decoded, null, 2));
    } catch (jwtError) {
      console.log('❌ JWT verification failed:', jwtError.name, jwtError.message);
      
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token has expired',
          debug: 'TOKEN_EXPIRED'
        });
      }
      if (jwtError.name === 'JsonWebTokenError') {
        return res.status(401).json({
          success: false,
          message: 'Invalid token',
          debug: 'INVALID_TOKEN'
        });
      }
      if (jwtError.name === 'NotBeforeError') {
        return res.status(401).json({
          success: false,
          message: 'Token not active yet',
          debug: 'TOKEN_NOT_ACTIVE'
        });
      }
      
      return res.status(401).json({
        success: false,
        message: 'Token verification failed: ' + jwtError.message,
        debug: 'JWT_VERIFICATION_FAILED'
      });
    }
    
    console.log('🔍 Looking for user with ID:', decoded.id);
    
    // Validate user ID format
    if (!decoded.id || typeof decoded.id !== 'string') {
      console.log('❌ Invalid user ID in token:', decoded.id);
      return res.status(401).json({
        success: false,
        message: 'Invalid token payload',
        debug: 'INVALID_USER_ID'
      });
    }
    
    // Handle legacy admin_id for backward compatibility
    if (decoded.id === 'admin_id') {
      console.log('👑 Legacy admin_id detected - checking for real admin user');
      
      // Try to find a real admin user in the database
      const realAdmin = await User.findOne({ 
        role: 'admin', 
        email: process.env.ADMIN_EMAIL || 'adminabrar@gmail.com',
        isActive: true 
      }).select('_id name email role isActive'); // Explicitly select _id
      
      if (realAdmin) {
        console.log('✅ Found real admin user in database:', {
          id: realAdmin._id, // This should now have the _id
          name: realAdmin.name,
          email: realAdmin.email,
          role: realAdmin.role
        });
        
        // Verify we have an _id
        if (!realAdmin._id) {
          console.error('❌ ERROR: Real admin found but no _id field!');
          return res.status(500).json({
            success: false,
            message: 'Database error - admin user missing ID',
            debug: 'ADMIN_MISSING_ID'
          });
        }
        
        req.user = realAdmin;
        console.log('🔐 ========== AUTH MIDDLEWARE COMPLETED (REAL ADMIN) ==========\n');
        return next();
      } else {
        console.log('⚠️ No real admin found, using fallback admin object');
        
        // Get the actual admin ID from environment if available
        const adminIdFromEnv = process.env.ADMIN_ID;
        let fallbackAdminId;
        
        if (adminIdFromEnv && adminIdFromEnv !== 'admin_id') {
          // Use the actual ObjectId from environment
          fallbackAdminId = adminIdFromEnv;
          console.log('🔧 Using admin ID from environment:', fallbackAdminId);
        } else {
          // Use a fixed ObjectId for compatibility
          fallbackAdminId = '507f1f77bcf86cd799439011';
          console.log('🔧 Using fixed ObjectId for fallback admin:', fallbackAdminId);
        }
        
        // Fallback for legacy compatibility
        const adminUser = {
          _id: fallbackAdminId,
          name: process.env.ADMIN_NAME || 'System Administrator',
          email: process.env.ADMIN_EMAIL || 'adminabrar@gmail.com',
          role: 'admin',
          isActive: true
        };
        
        console.log('✅ Fallback admin authentication successful:', {
          id: adminUser._id,
          name: adminUser.name,
          email: adminUser.email,
          role: adminUser.role
        });
        req.user = adminUser;
        console.log('🔐 ========== AUTH MIDDLEWARE COMPLETED (FALLBACK ADMIN) ==========\n');
        return next();
      }
    }
    
    // Find regular user in database
    let user;
    try {
// AFTER
// AFTER
user = await User.findById(decoded.id).select('_id name email role isActive department branch enrollmentNo branchCode');
      console.log('🔍 Database query completed');
      console.log('🔍 User found in DB:', !!user);
    } catch (dbError) {
      console.log('❌ Database error:', dbError.message);
      return res.status(500).json({
        success: false,
        message: 'Database error during authentication',
        debug: 'DATABASE_ERROR'
      });
    }
    
    if (!user) {
      console.log('❌ User not found in database for ID:', decoded.id);
      return res.status(401).json({
        success: false,
        message: 'Invalid token - user not found',
        debug: 'USER_NOT_FOUND'
      });
    }

    console.log('✅ User found:', {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive
    });

    if (!user.isActive) {
      console.log('❌ User account is deactivated');
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated',
        debug: 'ACCOUNT_DEACTIVATED'
      });
    }

    console.log('✅ Authentication successful for user:', user.name, 'Role:', user.role);
    req.user = user;
    console.log('🔐 ========== AUTH MIDDLEWARE COMPLETED ==========\n');
    next();
    
  } catch (error) {
    console.error('❌ ========== AUTH MIDDLEWARE ERROR ==========');
    console.error('❌ Error name:', error.name);
    console.error('❌ Error message:', error.message);
    console.error('❌ Error stack:', error.stack);
    console.error('❌ ============================================\n');
    
    res.status(500).json({
      success: false,
      message: 'Authentication error: ' + error.message,
      debug: 'MIDDLEWARE_EXCEPTION'
    });
  }
};

module.exports = auth;