const { google } = require('googleapis');

// Validate environment variables
const validateEnvironment = () => {
  const requiredVars = [
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'GOOGLE_REFRESH_TOKEN',
    'GOOGLE_DRIVE_FOLDER_ID'
  ];

  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  console.log('✅ All Google Drive environment variables are present');
  
  // Log variable lengths for debugging (without exposing actual values)
  requiredVars.forEach(varName => {
    const value = process.env[varName];
    console.log(`🔍 ${varName}: ${value.length} characters`);
  });
};

// Create and configure OAuth2 client
const createAuth = () => {
  try {
    validateEnvironment();

    const auth = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      'https://developers.google.com/oauthplayground' // Redirect URI
    );

    // Set credentials
    auth.setCredentials({
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN
    });

    console.log('✅ Google OAuth2 client configured successfully');
    return auth;
    
  } catch (error) {
    console.error('❌ Failed to create Google Auth:', error.message);
    throw error;
  }
};

// Create Drive API instance
const createDriveInstance = (auth) => {
  try {
    const drive = google.drive({ 
      version: 'v3', 
      auth,
      timeout: 60000 // 60 second timeout
    });

    console.log('✅ Google Drive API instance created');
    return drive;
    
  } catch (error) {
    console.error('❌ Failed to create Drive instance:', error.message);
    throw error;
  }
};

// Test the configuration
const testConfiguration = async (drive) => {
  try {
    console.log('🧪 Testing Google Drive configuration...');
    
    // Test 1: Basic API access
    const about = await drive.about.get({ fields: 'user' });
    console.log('✅ API Access Test: Connected as', about.data.user.emailAddress);
    
    // Test 2: Main folder access
    const folder = await drive.files.get({
      fileId: process.env.GOOGLE_DRIVE_FOLDER_ID,
      fields: 'id, name, owners'
    });
    console.log('✅ Folder Access Test: Can access', folder.data.name);
    
    // Test 3: List permissions
    try {
      const permissions = await drive.permissions.list({
        fileId: process.env.GOOGLE_DRIVE_FOLDER_ID,
        fields: 'permissions(id, role, type)'
      });
      console.log('✅ Permissions Test: Found', permissions.data.permissions.length, 'permissions');
    } catch (permError) {
      console.warn('⚠️ Permissions test failed (may be normal):', permError.message);
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ Configuration test failed:', error.message);
    console.error('Error details:', {
      code: error.code,
      status: error.status,
      message: error.message
    });
    throw error;
  }
};

// Initialize Google Drive
const initializeGoogleDrive = async () => {
  try {
    console.log('🚀 Initializing Google Drive service...');
    
    const auth = createAuth();
    const drive = createDriveInstance(auth);
    
    // Test configuration on initialization
    await testConfiguration(drive);
    
    console.log('🎉 Google Drive service initialized successfully!');
    return { auth, drive };
    
  } catch (error) {
    console.error('💥 Google Drive initialization failed:', error.message);
    
    // Provide helpful error messages
    if (error.message.includes('invalid_grant')) {
      console.error('🔑 Refresh token may be expired. Please regenerate it.');
    } else if (error.message.includes('access_denied')) {
      console.error('🚫 Access denied. Check folder permissions and sharing settings.');
    } else if (error.message.includes('Not Found')) {
      console.error('📁 Folder not found. Check GOOGLE_DRIVE_FOLDER_ID.');
    }
    
    throw error;
  }
};

// Create the instances
let auth, drive;

try {
  // Initialize synchronously for now, but we'll test async later
  auth = createAuth();
  drive = createDriveInstance(auth);
  
  // Test configuration asynchronously (don't block startup)
  setImmediate(async () => {
    try {
      await testConfiguration(drive);
      console.log('🎯 Google Drive is ready for use!');
    } catch (testError) {
      console.error('⚠️ Google Drive configuration test failed:', testError.message);
      console.error('📝 Note: File uploads may fail. Please check your configuration.');
    }
  });
  
} catch (error) {
  console.error('💥 Critical: Google Drive initialization failed:', error.message);
  console.error('📝 File upload functionality will be unavailable.');
  
  // Don't crash the server, but create null instances
  auth = null;
  drive = null;
}

// Export with additional helper functions
module.exports = {
  auth,
  drive,
  
  // Helper functions
  isConfigured: () => !!(auth && drive),
  
  getConnectionStatus: async () => {
    if (!drive) return { connected: false, error: 'Drive not initialized' };
    
    try {
      const about = await drive.about.get({ fields: 'user' });
      return { 
        connected: true, 
        user: about.data.user.emailAddress,
        folderId: process.env.GOOGLE_DRIVE_FOLDER_ID
      };
    } catch (error) {
      return { connected: false, error: error.message };
    }
  },
  
  reinitialize: async () => {
    try {
      const result = await initializeGoogleDrive();
      auth = result.auth;
      drive = result.drive;
      return true;
    } catch (error) {
      console.error('Reinitialization failed:', error.message);
      return false;
    }
  }
};