/**
 * TEST GOOGLE DRIVE UPLOAD
 * Run this to verify your setup works
 */

require('dotenv').config();
const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const CREDENTIALS = {
  client_id: process.env.GOOGLE_CLIENT_ID,
  client_secret: process.env.GOOGLE_CLIENT_SECRET,
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
};

const FOLDER_ID = process.env.GOOGLE_DRIVE_FOLDER_ID;

async function testUpload() {
  console.log('\n🧪 Testing Google Drive Upload...\n');
  
  // Verify credentials
  console.log('📋 Checking credentials...');
  if (!CREDENTIALS.client_id) {
    console.error('❌ GOOGLE_CLIENT_ID is missing');
    return;
  }
  if (!CREDENTIALS.client_secret) {
    console.error('❌ GOOGLE_CLIENT_SECRET is missing');
    return;
  }
  if (!CREDENTIALS.refresh_token) {
    console.error('❌ GOOGLE_REFRESH_TOKEN is missing');
    return;
  }
  if (!FOLDER_ID) {
    console.error('❌ GOOGLE_DRIVE_FOLDER_ID is missing');
    return;
  }
  console.log('✅ All credentials present\n');

  try {
    // Create OAuth2 client
    console.log('🔐 Creating OAuth2 client...');
    const oauth2Client = new google.auth.OAuth2(
      CREDENTIALS.client_id,
      CREDENTIALS.client_secret,
      'http://localhost:5000/oauth2callback'
    );

    oauth2Client.setCredentials({
      refresh_token: CREDENTIALS.refresh_token,
    });
    console.log('✅ OAuth2 client created\n');

    // Get access token
    console.log('🔑 Getting access token...');
    const { credentials } = await oauth2Client.refreshAccessToken();
    console.log('✅ Access token obtained\n');

    // Create Drive instance
    const drive = google.drive({ version: 'v3', auth: oauth2Client });

    // Create a test file
    console.log('📝 Creating test file...');
    const testFilePath = path.join(__dirname, 'test-upload.txt');
    fs.writeFileSync(testFilePath, `Test upload at ${new Date().toISOString()}\nFrom: InternTrack System`);
    console.log('✅ Test file created\n');

    // Upload to Google Drive
    console.log('☁️  Uploading to Google Drive...');
    const fileMetadata = {
      name: `test-upload-${Date.now()}.txt`,
      parents: [FOLDER_ID],
    };

    const media = {
      mimeType: 'text/plain',
      body: fs.createReadStream(testFilePath),
    };

    const file = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, name, webViewLink',
    });

    console.log('✅ Upload successful!\n');
    console.log('================================');
    console.log('📄 File Details:');
    console.log('================================');
    console.log(`Name: ${file.data.name}`);
    console.log(`ID: ${file.data.id}`);
    console.log(`Link: ${file.data.webViewLink}`);
    console.log('================================\n');

    // Clean up local test file
    fs.unlinkSync(testFilePath);
    console.log('✅ Local test file cleaned up');
    
    console.log('\n🎉 SUCCESS! Your Google Drive upload is working perfectly!');
    console.log('💡 You can now use document upload in your application.\n');

  } catch (error) {
    console.error('\n❌ ERROR:', error.message);
    
    if (error.message.includes('invalid_grant')) {
      console.log('\n💡 The refresh token is invalid or expired.');
      console.log('   Run: node getToken.js');
      console.log('   And update GOOGLE_REFRESH_TOKEN in .env\n');
    } else if (error.message.includes('Invalid Credentials')) {
      console.log('\n💡 Check your GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET');
    } else if (error.message.includes('File not found')) {
      console.log('\n💡 Check your GOOGLE_DRIVE_FOLDER_ID');
      console.log('   Make sure the folder exists and is accessible\n');
    } else {
      console.log('\n💡 Full error details:');
      console.log(error);
    }
  }
}

// Run the test
testUpload();