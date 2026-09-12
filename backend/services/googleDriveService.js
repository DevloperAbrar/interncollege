const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

class GoogleDriveService {
  constructor() {
    this.oauth2Client = null;
    this.drive = null;
    this.isInitialized = false;
  }

  initialize() {
    if (this.isInitialized) return;

    try {
      this.oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        'urn:ietf:wg:oauth:2.0:oob'
      );

      // Set credentials with refresh token
      this.oauth2Client.setCredentials({
        refresh_token: process.env.GOOGLE_REFRESH_TOKEN
      });

      this.drive = google.drive({ version: 'v3', auth: this.oauth2Client });
      this.isInitialized = true;
      
      console.log('🔧 Google Drive service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Google Drive service:', error.message);
      throw error;
    }
  }

  async refreshAccessToken() {
    try {
      if (!this.oauth2Client) this.initialize();
      
      const { credentials } = await this.oauth2Client.refreshAccessToken();
      this.oauth2Client.setCredentials(credentials);
      console.log('🔄 Access token refreshed successfully');
      return credentials;
    } catch (error) {
      console.error('❌ Failed to refresh access token:', error.message);
      if (error.code === 401 || error.message.includes('unauthorized_client')) {
        throw new Error('OAuth credentials are invalid. Please regenerate your refresh token using generateTokens.js');
      }
      throw error;
    }
  }

  async testConnection() {
    try {
      if (!this.oauth2Client) this.initialize();
      
      console.log('🧪 Testing Google Drive connection...');
      
      // First try to refresh the token
      await this.refreshAccessToken();
      
      // Test the connection
      const response = await this.drive.about.get({
        fields: 'user(displayName,emailAddress),storageQuota'
      });
      
      console.log('✅ Google Drive connected successfully');
      console.log(`👤 Connected as: ${response.data.user.displayName} (${response.data.user.emailAddress})`);
      
      return {
        success: true,
        user: response.data.user,
        storageQuota: response.data.storageQuota
      };
    } catch (error) {
      console.error('❌ Google Drive connection failed:', error.message);
      
      if (error.code === 401 || error.message.includes('unauthorized_client')) {
        throw new Error('Authentication failed. Please regenerate your refresh token using generateTokens.js');
      }
      
      throw error;
    }
  }

  async validateConfiguration() {
    console.log('🔧 Validating Google Drive configuration...');
    
    // Check if required environment variables exist
    const requiredEnvVars = [
      'GOOGLE_CLIENT_ID',
      'GOOGLE_CLIENT_SECRET', 
      'GOOGLE_REFRESH_TOKEN',
      'GOOGLE_DRIVE_FOLDER_ID'
    ];
    
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      throw new Error(`Missing environment variables: ${missingVars.join(', ')}`);
    }
    
    try {
      // Test connection
      const connectionResult = await this.testConnection();
      
      // Test folder access
      const folderInfo = await this.getFolderInfo(process.env.GOOGLE_DRIVE_FOLDER_ID);
      console.log(`📁 Target folder: ${folderInfo.name}`);
      
      console.log('✅ Google Drive configuration validated successfully');
      return true;
    } catch (error) {
      console.error('❌ Google Drive configuration validation failed:', error.message);
      throw new Error(`Google Drive configuration error: ${error.message}`);
    }
  }

  // Extract folder ID from a pasted Google Drive folder link
extractFolderId(link) {
  if (!link) return null;
  // Handles: https://drive.google.com/drive/folders/<id>?usp=sharing
  //          https://drive.google.com/drive/u/0/folders/<id>
  //          plain folder ID pasted directly
  const match = link.match(/folders\/([a-zA-Z0-9_-]+)/);
  if (match) return match[1];
  // If it's already just an ID (no slashes/URL parts)
  if (/^[a-zA-Z0-9_-]{15,}$/.test(link.trim())) return link.trim();
  return null;
}

// Verify the service account actually has Editor access to this folder
async verifyFolderAccess(folderId) {
  try {
    if (!this.drive) this.initialize();
    const info = await this.getFolderInfo(folderId); // throws if not found/no access
    return { success: true, folderName: info.name };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

  async getFolderInfo(folderId) {
    try {
      if (!this.drive) this.initialize();
      
      const response = await this.drive.files.get({
        fileId: folderId,
        fields: 'id,name,mimeType,parents,createdTime'
      });
      
      if (response.data.mimeType !== 'application/vnd.google-apps.folder') {
        throw new Error('The specified ID is not a folder');
      }
      
      console.log(`📁 Folder info: ${response.data.name} (${response.data.id})`);
      return response.data;
    } catch (error) {
      if (error.code === 404) {
        throw new Error(`Folder not found or you don't have access: ${folderId}`);
      }
      if (error.code === 403) {
        throw new Error(`Access denied to folder: ${folderId}`);
      }
      console.error('❌ Error getting folder info:', error.message);
      throw error;
    }
  }

  async uploadFile(filePath, fileName, parentFolderId = null) {
    try {
      if (!this.drive) this.initialize();
      
      const targetFolderId = parentFolderId || process.env.GOOGLE_DRIVE_FOLDER_ID;
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }

      const fileMetadata = {
        name: fileName,
        parents: [targetFolderId]
      };

      // Get file stats for better mime type detection
      const stats = fs.statSync(filePath);
      const fileExtension = path.extname(fileName).toLowerCase();
      
      let mimeType = 'application/octet-stream';
      if (fileExtension === '.pdf') mimeType = 'application/pdf';
      else if (fileExtension === '.doc') mimeType = 'application/msword';
      else if (fileExtension === '.docx') mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      else if (fileExtension === '.ppt') mimeType = 'application/vnd.ms-powerpoint';
      else if (fileExtension === '.pptx') mimeType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
      else if (fileExtension === '.jpg' || fileExtension === '.jpeg') mimeType = 'image/jpeg';
      else if (fileExtension === '.png') mimeType = 'image/png';
      else if (fileExtension === '.txt') mimeType = 'text/plain';
      else if (fileExtension === '.zip') mimeType = 'application/zip';

      const media = {
        mimeType: mimeType,
        body: fs.createReadStream(filePath)
      };

      console.log(`📤 Uploading file: ${fileName} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);

      const response = await this.drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id,name,webViewLink,webContentLink,size'
      });

      console.log(`✅ File uploaded successfully: ${response.data.name}`);
      
      // Make file viewable by anyone with link (optional)
      try {
        await this.drive.permissions.create({
          fileId: response.data.id,
          resource: {
            role: 'reader',
            type: 'anyone'
          }
        });
        console.log('🔗 File made publicly viewable');
      } catch (permError) {
        console.log('⚠️ Could not make file public:', permError.message);
      }

      return {
        fileId: response.data.id,
        fileName: response.data.name,
        webViewLink: response.data.webViewLink,
        webContentLink: response.data.webContentLink,
        size: response.data.size
      };
    } catch (error) {
      console.error('❌ File upload failed:', error.message);
      throw error;
    }
  }

  async createFolder(folderName, parentFolderId = null) {
    try {
      if (!this.drive) this.initialize();
      
      const targetFolderId = parentFolderId || process.env.GOOGLE_DRIVE_FOLDER_ID;
      
      const fileMetadata = {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [targetFolderId]
      };

      const response = await this.drive.files.create({
        resource: fileMetadata,
        fields: 'id,name,webViewLink'
      });

      console.log(`✅ Folder created: ${response.data.name}`);
      return response.data;
    } catch (error) {
      console.error('❌ Folder creation failed:', error.message);
      throw error;
    }
  }

  async deleteFile(fileId) {
    try {
      if (!this.drive) this.initialize();
      
      await this.drive.files.delete({
        fileId: fileId
      });
      console.log(`✅ File deleted successfully: ${fileId}`);
      return true;
    } catch (error) {
      console.error('❌ File deletion failed:', error.message);
      throw error;
    }
  }

  async listFiles(parentFolderId = null, query = null) {
    try {
      if (!this.drive) this.initialize();
      
      const targetFolderId = parentFolderId || process.env.GOOGLE_DRIVE_FOLDER_ID;
      
      let searchQuery = `'${targetFolderId}' in parents and trashed=false`;
      
      if (query) {
        searchQuery += ` and ${query}`;
      }
      
      const response = await this.drive.files.list({
        q: searchQuery,
        fields: 'files(id,name,mimeType,createdTime,modifiedTime,size,webViewLink)',
        orderBy: 'createdTime desc',
        pageSize: 100
      });

      return response.data.files || [];
    } catch (error) {
      console.error('❌ Failed to list files:', error.message);
      throw error;
    }
  }

  // Method to create student-specific folder
// CHANGE: createStudentFolder now accepts parentFolderId
async createStudentFolder(studentId, studentName, parentFolderId = null) {
  try {
    const sanitizedName = studentName ? studentName.replace(/[^a-zA-Z0-9\s]/g, '_').replace(/\s+/g, '_') : 'Unknown';
    const folderName = `${studentId}_${sanitizedName}`;
    const folder = await this.createFolder(folderName, parentFolderId); // createFolder already supports parentFolderId
    console.log(`📁 Student folder created: ${folderName}`);
    return folder;
  } catch (error) {
    console.error('❌ Failed to create student folder:', error.message);
    throw error;
  }
}

  // Method to get shareable link for a file
  async getShareableLink(fileId) {
    try {
      if (!this.drive) this.initialize();
      
      const response = await this.drive.files.get({
        fileId: fileId,
        fields: 'webViewLink,webContentLink'
      });

      return {
        viewLink: response.data.webViewLink,
        downloadLink: response.data.webContentLink
      };
    } catch (error) {
      console.error('❌ Failed to get shareable link:', error.message);
      throw error;
    }
  }
// Updated uploadStudentDocuments method in googleDriveService.js

async uploadStudentDocuments(studentData, files, parentFolderId = null, cachedStudentFolderId = null, onFolderCreated = null) {
  try {
    console.log('📁 Starting student documents upload process...');
    if (!this.drive) this.initialize();

    if (!studentData || !studentData.studentId || !studentData.fullName) {
      throw new Error('Invalid student data. studentId and fullName are required.');
    }

    // If no parentFolderId given, fall back to global folder (old behavior)
    const targetParent = parentFolderId || process.env.GOOGLE_DRIVE_FOLDER_ID;

    let studentFolder;

    // ✅ Fast path: use the cached folder ID directly, no Drive lookup at all
    if (cachedStudentFolderId) {
      studentFolder = { id: cachedStudentFolderId };
      console.log('📁 Using cached student folder ID:', cachedStudentFolderId);
    } else {
      const sanitizedName = studentData.fullName.replace(/[^a-zA-Z0-9\s]/g, '_').replace(/\s+/g, '_');
      const folderName = `${studentData.studentId}_${sanitizedName}`;

      try {
        studentFolder = await this.findFolderByName(folderName, targetParent);
        if (!studentFolder) {
          studentFolder = await this.createStudentFolder(studentData.studentId, studentData.fullName, targetParent);
          console.log('📁 Created new folder:', folderName);
        } else {
          console.log('📁 Using existing folder:', folderName);
        }

        // ✅ Let the caller persist this ID so next time we hit the fast path above
        if (onFolderCreated) {
          await onFolderCreated(studentFolder.id);
        }
      } catch (folderError) {
        console.error('❌ Folder creation/retrieval failed:', folderError);
        throw new Error(`Failed to create/access student folder: ${folderError.message}`);
      }
    }

    const uploadResults = {
      folderId: studentFolder.id,
      folderLink: studentFolder.webViewLink,
      uploadedFiles: [],
      errors: []
    };

    // Define expected file field mappings
    const fieldMappings = {
      'offerLetter': 'Offer_Letter',
      'noc': 'NOC_Document',
      'nocLetter': 'NOC_Document',
      'stipendProof': 'Stipend_Proof',
      'projectReport': 'Project_Report',
      'document': 'MPR_Document'
    };

    console.log('📤 Processing files for upload...');

    // Upload each file to the student's folder
    for (const [fieldName, fileArray] of Object.entries(files)) {
      const file = Array.isArray(fileArray) ? fileArray[0] : fileArray;

      console.log(`🔍 Processing field: ${fieldName}`, {
        hasFile: !!file,
        filePath: file?.path,
        originalName: file?.originalname,
        fileExists: file?.path ? fs.existsSync(file.path) : false
      });

      if (file && file.path && fs.existsSync(file.path)) {
        try {
          console.log(`📤 Uploading ${fieldName}: ${file.originalname}`);

          // Create a meaningful filename with timestamp
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
          const fileExtension = path.extname(file.originalname);
          const baseFileName = fieldMappings[fieldName] || fieldName.replace(/([A-Z])/g, '_$1').toLowerCase();
          const fileName = `${studentData.studentId}_${baseFileName}_${timestamp}${fileExtension}`;

          console.log(`📝 Generated filename: ${fileName}`);

          const uploadResult = await this.uploadFile(
            file.path,
            fileName,
            studentFolder.id
          );

          // Store the result with proper URLs
          const fileResult = {
            fieldName,
            originalName: file.originalname,
            uploadedName: fileName,
            fileId: uploadResult.fileId,
            webViewLink: uploadResult.webViewLink,
            webContentLink: uploadResult.webContentLink,
            directViewUrl: `https://drive.google.com/file/d/${uploadResult.fileId}/view`,
            directDownloadUrl: `https://drive.google.com/uc?export=download&id=${uploadResult.fileId}`,
            embedUrl: `https://drive.google.com/file/d/${uploadResult.fileId}/preview`,
            size: uploadResult.size
          };

          uploadResults.uploadedFiles.push(fileResult);

          console.log(`✅ Successfully uploaded: ${fileName} (File ID: ${uploadResult.fileId})`);
          console.log(`🔗 View URL: ${fileResult.webViewLink}`);
          console.log(`📺 Preview URL: ${fileResult.embedUrl}`);

          // Clean up local file after successful upload
          try {
            fs.unlinkSync(file.path);
            console.log(`🗑️ Local file cleaned up: ${file.path}`);
          } catch (cleanupError) {
            console.warn('⚠️ Could not clean up local file:', cleanupError.message);
          }

        } catch (uploadError) {
          console.error(`❌ Failed to upload ${fieldName}:`, uploadError);
          uploadResults.errors.push({
            fieldName,
            fileName: file.originalname,
            error: uploadError.message
          });
        }
      } else {
        console.warn(`⚠️ File not found or invalid for field ${fieldName}`);
        if (file) {
          console.warn(`File details: path=${file.path}, exists=${file.path ? fs.existsSync(file.path) : false}`);
        }
        uploadResults.errors.push({
          fieldName,
          fileName: file?.originalname || 'unknown',
          error: 'File not found or path is invalid'
        });
      }
    }

    console.log(`✅ Upload process completed. ${uploadResults.uploadedFiles.length} files uploaded, ${uploadResults.errors.length} errors`);

    // If some files uploaded successfully, return the results
    if (uploadResults.uploadedFiles.length > 0) {
      console.log('📊 Upload summary:', {
        successful: uploadResults.uploadedFiles.map(f => f.fieldName),
        failed: uploadResults.errors.map(e => e.fieldName)
      });
      return uploadResults;
    }

    // If all uploads failed, throw an error
    if (uploadResults.errors.length > 0) {
      throw new Error(`All file uploads failed: ${uploadResults.errors.map(e => `${e.fieldName}: ${e.error}`).join(', ')}`);
    }

    throw new Error('No files were processed');

  } catch (error) {
    console.error('❌ Student documents upload failed:', error.message);
    console.error('Error details:', error);
    throw error;
  }
}

async makeFilePublic(fileId) {
  try {
    if (!this.drive) this.initialize();
    
    const response = await this.drive.permissions.create({
      fileId: fileId,
      resource: {
        role: 'reader',
        type: 'anyone'
      }
    });
    
    console.log(`🔓 File ${fileId} made publicly viewable`);
    return response.data;
  } catch (error) {
    console.error('❌ Failed to make file public:', error.message);
    // Don't throw error as this is not critical
    return null;
  }
}

  // Method to check if folder exists by name
  // Method to check if folder exists by name
  async findFolderByName(folderName, parentFolderId = null) {
    try {
      if (!this.drive) this.initialize();

      const targetFolderId = parentFolderId || process.env.GOOGLE_DRIVE_FOLDER_ID;
      
      const response = await this.drive.files.list({
        q: `'${targetFolderId}' in parents and name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
        fields: 'files(id,name,webViewLink)'
      });

      return response.data.files.length > 0 ? response.data.files[0] : null;
    } catch (error) {
      console.error('❌ Failed to find folder:', error.message);
      throw error;
    }
  }

  // Method to upload or update student documents (creates folder if doesn't exist)
  async uploadOrUpdateStudentDocuments(studentData, files) {
    try {
      console.log('📁 Starting upload or update process...');
      
      if (!studentData || !studentData.studentId || !studentData.fullName) {
        throw new Error('Invalid student data. studentId and fullName are required.');
      }
      
      const sanitizedName = studentData.fullName.replace(/[^a-zA-Z0-9\s]/g, '_').replace(/\s+/g, '_');
      const folderName = `${studentData.studentId}_${sanitizedName}`;
      
      // Check if student folder already exists
      let studentFolder = await this.findFolderByName(folderName);
      
      if (!studentFolder) {
        // Create new folder
        studentFolder = await this.createStudentFolder(studentData.studentId, studentData.fullName);
      } else {
        console.log(`📁 Using existing folder: ${folderName}`);
      }

      return await this.uploadStudentDocuments(studentData, files);
      
    } catch (error) {
      console.error('❌ Upload or update process failed:', error.message);
      throw error;
    }
  }
}

// Export a singleton instance
module.exports = new GoogleDriveService();



