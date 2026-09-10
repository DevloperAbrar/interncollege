/**
 * IMPROVED GOOGLE DRIVE TOKEN GENERATOR
 * 
 * SETUP REQUIRED:
 * 1. Go to: https://console.cloud.google.com/apis/credentials
 * 2. Click your OAuth 2.0 Client ID (or create new one)
 * 3. Add this to "Authorized redirect URIs":
 *    http://localhost:5000/oauth2callback
 * 4. Click SAVE and wait 5 minutes for changes to propagate
 * 5. Run: node getTokenFixed.js
 */

const { google } = require('googleapis');
const http = require('http');
const url = require('url');

// Your credentials from .env
const CLIENT_ID = '506188167667-rdn6cs926rbt5hhkg0janiqumkauvmlq.apps.googleusercontent.com';
const CLIENT_SECRET = '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';
const REDIRECT_URI = 'http://localhost:5000/oauth2callback';

const SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.file',
];

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);

console.log('\n🔐 Google Drive Token Generator');
console.log('================================\n');

// Create server to receive the code
const server = http.createServer(async (req, res) => {
  try {
    if (req.url.indexOf('/oauth2callback') > -1) {
      const qs = new url.URL(req.url, 'http://localhost:5000').searchParams;
      const code = qs.get('code');
      const error = qs.get('error');

      if (error) {
        console.error('❌ Authentication error:', error);
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`
          <html>
            <body style="font-family: Arial; padding: 50px; text-align: center;">
              <h1>❌ Error</h1>
              <p>Authentication failed: ${error}</p>
              <p>Check the console for details.</p>
            </body>
          </html>
        `);
        server.close();
        return;
      }

      if (!code) {
        console.error('❌ No authorization code received');
        res.end('Error: No code received');
        server.close();
        return;
      }

      console.log('✅ Authorization code received!');
      console.log('🔄 Exchanging code for tokens...\n');

      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`
        <html>
          <body style="font-family: Arial; padding: 50px; text-align: center;">
            <h1>✅ Success!</h1>
            <p>Authentication successful!</p>
            <p style="color: green; font-weight: bold;">Check your terminal for the refresh token.</p>
            <p>You can close this window now.</p>
          </body>
        </html>
      `);

      // Get tokens
      const { tokens } = await oauth2Client.getToken(code);
      
      console.log('✅ SUCCESS! Tokens generated.\n');
      console.log('================================');
      console.log('📋 COPY THIS TO YOUR .env FILE:');
      console.log('================================\n');
      console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}`);
      console.log('\n================================');
      console.log('Additional Info (for reference):');
      console.log('================================\n');
      console.log('Access Token (expires in 1 hour):');
      console.log(tokens.access_token);
      console.log('\nExpiry:', new Date(tokens.expiry_date).toLocaleString());
      console.log('\n✅ Done! Press Ctrl+C to exit.\n');

      server.close();
    }
  } catch (e) {
    console.error('❌ Error getting tokens:', e.message);
    if (e.message.includes('invalid_grant')) {
      console.log('\n💡 TIP: The authorization code may have expired.');
      console.log('   Please run the script again and authorize quickly.\n');
    }
    res.end('Error: ' + e.message);
    server.close();
  }
});

server.listen(5000, () => {
  console.log('⚠️  IMPORTANT: Before proceeding, make sure you have:');
  console.log('   1. Added http://localhost:5000/oauth2callback');
  console.log('   2. to your OAuth 2.0 Client ID in Google Cloud Console');
  console.log('   3. Link: https://console.cloud.google.com/apis/credentials\n');
  console.log('================================\n');
  
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent'
  });

  console.log('📋 STEP 1: Copy this URL and open in your browser:\n');
  console.log(authUrl);
  console.log('\n📋 STEP 2: Sign in with your Google account');
  console.log('📋 STEP 3: Click "Allow" to grant permissions');
  console.log('📋 STEP 4: You\'ll be redirected back automatically\n');
  console.log('⏳ Server running on http://localhost:5000');
  console.log('⏳ Waiting for authorization...\n');
});

server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    console.error('❌ Port 5000 is already in use.');
    console.log('💡 Solution: Close any app using port 5000 or change the port.\n');
  } else {
    console.error('❌ Server error:', e.message);
  }
  process.exit(1);
});