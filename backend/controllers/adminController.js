const User = require('../models/User');
const Submission = require('../models/Submission');
const BulkUpload = require('../models/BulkUpload');
const csvService = require('../services/csvService');
const excelService = require('../services/excelService');
const { successResponse, errorResponse, getPaginationData } = require('../utils/responseHelper');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose'); // ADD THIS LINE - This was missing!
const Department = require('../models/Department');

// @desc    Get admin dashboard statistics
// @route   GET /api/admin/dashboard
// @access  Private (Admin only)
const getDashboardStats = async (req, res) => {
  try {
    console.log('📊 Getting dashboard stats for user:', req.user?._id);
    
    // Verify admin access
    if (!req.user || req.user.role !== 'admin') {
      return errorResponse(res, 'Access denied. Admin privileges required.', 403);
    }

    // Get counts
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalMentors = await User.countDocuments({ role: 'mentor' });
    const totalSubmissions = await Submission.countDocuments();
    const pendingSubmissions = await Submission.countDocuments({ status: 'pending' });
    const approvedSubmissions = await Submission.countDocuments({ status: 'approved' });
    const rejectedSubmissions = await Submission.countDocuments({ status: 'rejected' });
    
    // Get submission type breakdown
    const internshipSubmissions = await Submission.countDocuments({ type: 'internship' });
    const projectSubmissions = await Submission.countDocuments({ type: 'project' });

    // Get recent submissions
    const recentSubmissions = await Submission.find()
      .populate('student', 'name enrollmentNo email')
      .populate('mentor', 'name')
      .sort({ createdAt: -1 })
      .limit(10);

    // Get mentor utilization
    const mentors = await User.find({ role: 'mentor' }).select('name currentStudentCount maxStudents');

    // Get placement statistics (from monthly submissions)
    const placedStudents = await Submission.aggregate([
      { $match: { type: 'internship', status: 'approved' } },
      { $unwind: '$monthlySubmissions' },
      { $match: { 'monthlySubmissions.placementStatus': 'yes' } },
      { $group: { _id: '$student', count: { $sum: 1 } } }
    ]);

    const stats = {
      overview: {
        totalStudents,
        totalMentors,
        totalSubmissions,
        placedStudents: placedStudents.length
      },
      submissions: {
        total: totalSubmissions,
        pending: pendingSubmissions,
        approved: approvedSubmissions,
        rejected: rejectedSubmissions,
        internships: internshipSubmissions,
        projects: projectSubmissions
      },
      mentorUtilization: mentors.map(mentor => ({
        name: mentor.name,
        currentStudents: mentor.currentStudentCount,
        maxStudents: mentor.maxStudents,
        utilizationPercent: Math.round((mentor.currentStudentCount / mentor.maxStudents) * 100)
      })),
      recentSubmissions: recentSubmissions.map(sub => ({
        id: sub._id,
        studentName: sub.student?.name,
        enrollmentNo: sub.student?.enrollmentNo,
        type: sub.type,
        status: sub.status,
        mentorName: sub.mentor?.name,
        submittedAt: sub.createdAt
      }))
    };

    console.log('✅ Dashboard stats retrieved successfully');
    successResponse(res, stats, 'Dashboard statistics retrieved successfully');
  } catch (error) {
    console.error('❌ Get dashboard stats error:', error);
    errorResponse(res, 'Failed to get dashboard statistics', 500);
  }
};

// @desc    Create new mentor
// @route   POST /api/admin/mentors
const createMentor = async (req, res) => {
  try {
    console.log('\n🆕 ========== CREATE MENTOR STARTED ==========');
    console.log('🔍 Request body:', JSON.stringify(req.body, null, 2));
    console.log('🔍 Request user:', {
      id: req.user._id,
      name: req.user.name,
      role: req.user.role
    });
    
    // Verify admin access first
    if (!req.user || req.user.role !== 'admin') {
      console.log('❌ Access denied for user:', req.user);
      return errorResponse(res, 'Access denied. Admin privileges required.', 403);
    }

    const { name, email, password, maxStudents } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      console.log('❌ Missing required fields - Name:', !!name, 'Email:', !!email, 'Password:', !!password);
      return errorResponse(res, 'Name, email, and password are required', 400);
    }

    // Validate password strength
    if (password.length < 6) {
      console.log('❌ Password too short:', password.length);
      return errorResponse(res, 'Password must be at least 6 characters long', 400);
    }

    // Process and validate email
    const processedEmail = email.toLowerCase().trim();
    console.log('🔍 Original email:', email);
    console.log('🔍 Processed email:', processedEmail);

    // Check if mentor already exists with enhanced debugging
    console.log('🔍 Checking for existing user with email:', processedEmail);
    
    const existingUser = await User.findOne({ email: processedEmail });
    console.log('🔍 Database query completed');
    console.log('🔍 Existing user found:', !!existingUser);
    
    if (existingUser) {
      console.log('❌ User already exists:', {
        id: existingUser._id,
        name: existingUser.name,
        email: existingUser.email,
        role: existingUser.role
      });
      
      return errorResponse(res, 'A user with this email already exists', 400);
    }
    
    console.log('✅ No existing user found, proceeding with creation');

    // Create mentor data
    const mentorData = {
      name: name.trim(),
      email: processedEmail,
      password: password.trim(), // Use the provided password
      role: 'mentor',
      maxStudents: maxStudents || 20,
      currentStudentCount: 0,
      isActive: true
    };
    
    console.log('🔍 Mentor data to be saved:', {
      ...mentorData,
      password: '[HIDDEN]'
    });

    const mentor = new User(mentorData);
    console.log('🔍 Mentor model created');

    await mentor.save();
    console.log('✅ Mentor saved to database with ID:', mentor._id);

    const response = {
      mentor: mentor.toJSON(),
      // Don't return the password in response for security
    };
    
    console.log('✅ Response data prepared:', {
      mentorId: response.mentor._id,
      mentorName: response.mentor.name,
      mentorEmail: response.mentor.email
    });

    console.log('🆕 ========== CREATE MENTOR COMPLETED ==========\n');
    return successResponse(res, response, 'Mentor created successfully');

  } catch (error) {
    console.error('❌ ========== CREATE MENTOR ERROR ==========');
    console.error('❌ Error name:', error.name);
    console.error('❌ Error message:', error.message);
    console.error('❌ Error code:', error.code);
    console.error('❌ Error stack:', error.stack);
    
    // Handle specific MongoDB errors
    if (error.code === 11000) {
      console.error('❌ Duplicate key error:', error.keyPattern);
      console.error('❌ Duplicate value:', error.keyValue);
      return errorResponse(res, 'A user with this email already exists', 400);
    }
    
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(e => e.message);
      console.error('❌ Validation errors:', validationErrors);
      return errorResponse(res, validationErrors.join(', '), 400);
    }
    
    console.error('❌ ==========================================\n');
    return errorResponse(res, 'Failed to create mentor', 500);
  }
};

// @desc    Get all mentors
// @route   GET /api/admin/mentors
// @access  Private (Admin only)
const getAllMentors = async (req, res) => {
  try {
    console.log('📋 Getting all mentors. User:', req.user?._id, 'Role:', req.user?.role);
    
    // Verify admin access
    if (!req.user || req.user.role !== 'admin') {
      console.log('❌ Access denied for user:', req.user);
      return errorResponse(res, 'Access denied. Admin privileges required.', 403);
    }

    const { page = 1, limit = 10, search = '' } = req.query;

    const query = { role: 'mentor' };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const totalCount = await User.countDocuments(query);
    const pagination = getPaginationData(page, limit, totalCount);
    
    const mentors = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(pagination.skip)
      .limit(pagination.itemsPerPage);

    // Get assigned student count for each mentor
    const mentorsWithStudentCount = await Promise.all(
      mentors.map(async (mentor) => {
        const studentCount = await User.countDocuments({ 
          role: 'student', 
          assignedMentor: mentor._id 
        });
        return {
          ...mentor.toJSON(),
          actualStudentCount: studentCount
        };
      })
    );

    console.log('✅ Mentors retrieved successfully. Count:', mentorsWithStudentCount.length);

    successResponse(res, {
      mentors: mentorsWithStudentCount,
      pagination
    }, 'Mentors retrieved successfully');

  } catch (error) {
    console.error('❌ Get all mentors error:', error);
    errorResponse(res, 'Failed to get mentors', 500);
  }
};

// @desc    Update mentor
// @route   PUT /api/admin/mentors/:id
// @access  Private (Admin only)
const updateMentor = async (req, res) => {
  try {
    console.log('✏️ Updating mentor. User:', req.user?._id, 'Role:', req.user?.role);
    
    // Verify admin access
    if (!req.user || req.user.role !== 'admin') {
      return errorResponse(res, 'Access denied. Admin privileges required.', 403);
    }

    const { id } = req.params;
    const { name, email, password, maxStudents, isActive } = req.body;

    const mentor = await User.findOne({ _id: id, role: 'mentor' });
    if (!mentor) {
      return errorResponse(res, 'Mentor not found', 404);
    }

    // Check if email is being changed and already exists
    if (email && email.toLowerCase() !== mentor.email) {
      const existingUser = await User.findOne({ 
        email: email.toLowerCase(),
        _id: { $ne: id }
      });
      if (existingUser) {
        return errorResponse(res, 'Email already exists', 400);
      }
      mentor.email = email.toLowerCase();
    }

    // Update fields if provided
    if (name) mentor.name = name.trim();
    if (maxStudents) mentor.maxStudents = maxStudents;
    if (typeof isActive === 'boolean') mentor.isActive = isActive;

    // Update password if provided
    if (password && password.trim()) {
      if (password.length < 6) {
        return errorResponse(res, 'Password must be at least 6 characters long', 400);
      }
      mentor.password = password.trim();
      console.log('🔑 Password updated for mentor:', mentor.email);
    }

    await mentor.save();
    console.log('✅ Mentor updated successfully:', mentor._id);

    successResponse(res, mentor.toJSON(), 'Mentor updated successfully');

  } catch (error) {
    console.error('❌ Update mentor error:', error);
    errorResponse(res, 'Failed to update mentor', 500);
  }
};

// @desc    Delete mentor
// @route   DELETE /api/admin/mentors/:id
// @access  Private (Admin only)
const deleteMentor = async (req, res) => {
  try {
    console.log('🗑️ Deleting mentor. User:', req.user?._id, 'Role:', req.user?.role);
    
    // Verify admin access
    if (!req.user || req.user.role !== 'admin') {
      return errorResponse(res, 'Access denied. Admin privileges required.', 403);
    }

    const { id } = req.params;
    const { reassignTo } = req.body || {}; // Optional: ID of mentor to reassign students to

    const mentor = await User.findOne({ _id: id, role: 'mentor' });
    if (!mentor) {
      return errorResponse(res, 'Mentor not found', 404);
    }

    // Get all students assigned to this mentor
    const assignedStudents = await User.find({ 
      role: 'student', 
      assignedMentor: id 
    });

    console.log(`📊 Found ${assignedStudents.length} students assigned to mentor ${mentor.name}`);

    if (assignedStudents.length > 0) {
      if (reassignTo) {
        // Option 1: Reassign students to another mentor
        const newMentor = await User.findOne({ _id: reassignTo, role: 'mentor' });
        if (!newMentor) {
          return errorResponse(res, 'Target mentor for reassignment not found', 404);
        }

        // Check if new mentor has capacity
        const newMentorCurrentCount = await User.countDocuments({ 
          role: 'student', 
          assignedMentor: reassignTo 
        });

        if (newMentorCurrentCount + assignedStudents.length > newMentor.maxStudents) {
          return errorResponse(res, 
            `Cannot reassign ${assignedStudents.length} students. Target mentor capacity exceeded. ` +
            `Available slots: ${newMentor.maxStudents - newMentorCurrentCount}`, 
            400
          );
        }

        // Reassign all students to new mentor
        await User.updateMany(
          { role: 'student', assignedMentor: id },
          { $set: { assignedMentor: reassignTo } }
        );

        // Update mentor student counts
        await User.findByIdAndUpdate(reassignTo, {
          $inc: { currentStudentCount: assignedStudents.length }
        });

        console.log(`✅ Reassigned ${assignedStudents.length} students to mentor ${newMentor.name}`);
      } else {
        // Option 2: Remove mentor assignment (set to null)
        await User.updateMany(
          { role: 'student', assignedMentor: id },
          { $unset: { assignedMentor: 1 } }
        );

        console.log(`✅ Removed mentor assignment from ${assignedStudents.length} students`);
      }
    }

    // Update any submissions that reference this mentor
    const submissionsCount = await Submission.countDocuments({ mentor: id });
    if (submissionsCount > 0) {
      if (reassignTo) {
        // Reassign submissions to new mentor
        await Submission.updateMany(
          { mentor: id },
          { $set: { mentor: reassignTo } }
        );
        console.log(`✅ Reassigned ${submissionsCount} submissions to new mentor`);
      } else {
        // Remove mentor reference from submissions (keep submissions but unassign mentor)
        await Submission.updateMany(
          { mentor: id },
          { $unset: { mentor: 1 } }
        );
        console.log(`✅ Removed mentor reference from ${submissionsCount} submissions`);
      }
    }

    // Delete the mentor from database
    const deletedMentor = await User.findByIdAndDelete(id);
    
    if (!deletedMentor) {
      console.log('❌ Failed to delete mentor from database:', id);
      return errorResponse(res, 'Failed to delete mentor from database', 500);
    }
    
    console.log('✅ Mentor permanently deleted from database:', {
      id: deletedMentor._id,
      email: deletedMentor.email,
      name: deletedMentor.name
    });

    // Double-check that mentor is actually deleted
    const verifyDeleted = await User.findById(id);
    if (verifyDeleted) {
      console.error('❌ CRITICAL ERROR: Mentor still exists after deletion!', {
        id: verifyDeleted._id,
        email: verifyDeleted.email
      });
      return errorResponse(res, 'Failed to completely delete mentor from database', 500);
    }
    
    console.log('✅ Deletion verified - mentor no longer exists in database');

    const responseMessage = assignedStudents.length > 0 
      ? reassignTo 
        ? `Mentor deleted successfully. ${assignedStudents.length} students and ${submissionsCount} submissions reassigned to new mentor.`
        : `Mentor deleted successfully. ${assignedStudents.length} students unassigned and ${submissionsCount} submissions updated.`
      : 'Mentor deleted successfully.';

    successResponse(res, {
      deletedMentorId: id,
      affectedStudents: assignedStudents.length,
      affectedSubmissions: submissionsCount,
      reassignedTo: reassignTo || null
    }, responseMessage);

  } catch (error) {
    console.error('❌ Delete mentor error:', {
      message: error.message,
      stack: error.stack,
      mentorId: req.params.id
    });
    
    // If we get here, something went wrong - check if mentor still exists
    try {
      const stillExists = await User.findById(req.params.id);
      if (stillExists) {
        console.error('❌ CRITICAL: Mentor still exists in database after deletion attempt:', {
          id: stillExists._id,
          email: stillExists.email
        });
      }
    } catch (checkError) {
      console.error('❌ Error checking mentor existence:', checkError.message);
    }
    
    errorResponse(res, 'Failed to delete mentor: ' + error.message, 500);
  }
};

const bulkUploadStudents = async (req, res) => {
  try {
    console.log('\n📤 ========== BULK UPLOAD STARTED ==========');
    console.log('👤 Request user:', {
      id: req.user?._id,
      role: req.user?.role,
      type: typeof req.user?._id
    });
    
    // Verify admin access
    if (!req.user || req.user.role !== 'admin') {
      console.log('❌ Access denied for user:', req.user);
      return errorResponse(res, 'Access denied. Admin privileges required.', 403);
    }

    if (!req.file) {
      console.log('❌ No file uploaded');
      return errorResponse(res, 'Please upload a CSV or Excel file', 400);
    }

    const filePath = req.file.path;
    const fileName = req.file.originalname;

    console.log('📁 File details:', {
      path: filePath,
      name: fileName,
      size: req.file.size
    });

    // Process admin ID properly - more defensive approach
    let adminId;

    console.log('🔍 Processing admin ID from req.user._id:', req.user._id);
    console.log('🔍 req.user._id type:', typeof req.user._id);

    try {
      // Check if we have a valid _id
      if (!req.user._id) {
        console.log('❌ req.user._id is null/undefined');
        return errorResponse(res, 'Invalid admin user - missing ID', 400);
      }

      // Convert to string first for consistent handling
      const adminIdStr = req.user._id.toString();
      console.log('🔍 Admin ID string:', adminIdStr);

      // Handle different cases
      if (adminIdStr === 'admin_id') {
        // For legacy hardcoded admin, use environment ID or fixed ObjectId
        const envAdminId = process.env.ADMIN_ID;
        
        if (envAdminId && envAdminId !== 'admin_id' && mongoose.Types.ObjectId.isValid(envAdminId)) {
          // Use the actual ObjectId from environment
          adminId = new mongoose.Types.ObjectId(envAdminId);
          console.log('🔧 Using admin ObjectId from environment:', adminId);
        } else {
          // Use fixed ObjectId for compatibility
          adminId = new mongoose.Types.ObjectId('507f1f77bcf86cd799439011');
          console.log('🔧 Using fixed admin ObjectId for legacy admin:', adminId);
        }
      } else {
        // For regular database users, validate the ObjectId
        if (mongoose.Types.ObjectId.isValid(adminIdStr)) {
          adminId = new mongoose.Types.ObjectId(adminIdStr);
          console.log('✅ Using regular user ObjectId:', adminId);
        } else {
          console.log('❌ Invalid ObjectId format:', adminIdStr);
          throw new Error('Invalid admin ID format');
        }
      }
    } catch (error) {
      console.error('❌ Error processing admin ID:', error);
      return errorResponse(res, 'Invalid admin user ID: ' + error.message, 400);
    }

    if (!adminId) {
      console.log('❌ Failed to determine admin ID');
      return errorResponse(res, 'Could not determine admin user ID', 400);
    }

    console.log('✅ Admin ID processed successfully:', adminId.toString());

    // Process bulk upload asynchronously
    csvService.processBulkUpload(filePath, fileName, adminId)
      .then((results) => {
        console.log('✅ Bulk upload completed:', results);
        // Clean up the uploaded file
        fs.unlink(filePath, (err) => {
          if (err) console.error('Error deleting uploaded file:', err);
        });
      })
      .catch((error) => {
        console.error('❌ Bulk upload failed:', error);
        // Clean up the uploaded file
        fs.unlink(filePath, (err) => {
          if (err) console.error('Error deleting uploaded file:', err);
        });
      });

    console.log('📤 ========== BULK UPLOAD RESPONSE SENT ==========\n');
    successResponse(res, {
      fileName,
      message: 'File uploaded successfully. Processing in background.'
    }, 'Bulk upload initiated');

  } catch (error) {
    console.error('❌ ========== BULK UPLOAD ERROR ==========');
    console.error('❌ Error:', error);
    console.error('❌ Stack:', error.stack);
    console.error('❌ ==========================================\n');
    errorResponse(res, 'Failed to process bulk upload: ' + error.message, 500);
  }
};

// @desc    Add a single student manually
// @route   POST /api/admin/students/add-single
// @access  Private (Admin only)
const addSingleStudent = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return errorResponse(res, 'Access denied. Admin privileges required.', 403);
    }

    const { enrollmentNo, email } = req.body;

    if (!enrollmentNo || !email) {
      return errorResponse(res, 'Enrollment number and email are required', 400);
    }

    // Same admin-ID resolution used by bulkUploadStudents
    let adminId;
    try {
      if (!req.user._id) {
        return errorResponse(res, 'Invalid admin user - missing ID', 400);
      }
      const adminIdStr = req.user._id.toString();

      if (adminIdStr === 'admin_id') {
        const envAdminId = process.env.ADMIN_ID;
        if (envAdminId && envAdminId !== 'admin_id' && mongoose.Types.ObjectId.isValid(envAdminId)) {
          adminId = new mongoose.Types.ObjectId(envAdminId);
        } else {
          adminId = new mongoose.Types.ObjectId('507f1f77bcf86cd799439011');
        }
      } else {
        if (mongoose.Types.ObjectId.isValid(adminIdStr)) {
          adminId = new mongoose.Types.ObjectId(adminIdStr);
        } else {
          throw new Error('Invalid admin ID format');
        }
      }
    } catch (error) {
      return errorResponse(res, 'Invalid admin user ID: ' + error.message, 400);
    }

    const result = await csvService.processSingleStudent({ enrollmentNo, email }, adminId);

    if (!result.success) {
      return errorResponse(res, result.error || 'Failed to add student', 400);
    }

    successResponse(res, result.student, 'Student added successfully');

  } catch (error) {
    console.error('❌ Add single student error:', error);
    errorResponse(res, 'Failed to add student: ' + error.message, 500);
  }
};


// @desc    Get bulk upload history
// @route   GET /api/admin/bulk-upload-history
// @access  Private (Admin only)
const getBulkUploadHistory = async (req, res) => {
  try {
    console.log('📋 Getting bulk upload history');
    console.log('👤 Request user:', {
      id: req.user?._id,
      role: req.user?.role,
      type: typeof req.user?._id
    });
    
    // Verify admin access
    if (!req.user || req.user.role !== 'admin') {
      return errorResponse(res, 'Access denied. Admin privileges required.', 403);
    }

    const { page = 1, limit = 10 } = req.query;
    
    // Process admin ID the same way as in bulkUploadStudents
    let adminId;
    
    console.log('🔍 Processing admin ID for history from req.user._id:', req.user._id);
    
    try {
      // Check if we have a valid _id
      if (!req.user._id) {
        console.log('❌ req.user._id is null/undefined for history');
        return errorResponse(res, 'Invalid admin user - missing ID', 400);
      }

      // Convert to string first for consistent handling
      const adminIdStr = req.user._id.toString();
      console.log('🔍 Admin ID string for history:', adminIdStr);

      // Handle different cases
      if (adminIdStr === 'admin_id') {
        // For legacy hardcoded admin, use environment ID or fixed ObjectId
        const envAdminId = process.env.ADMIN_ID;
        
        if (envAdminId && envAdminId !== 'admin_id' && mongoose.Types.ObjectId.isValid(envAdminId)) {
          // Use the actual ObjectId from environment
          adminId = new mongoose.Types.ObjectId(envAdminId);
          console.log('🔧 Using admin ObjectId from environment for history:', adminId);
        } else {
          // Use the same fixed ObjectId as in upload
          adminId = new mongoose.Types.ObjectId('507f1f77bcf86cd799439011');
          console.log('🔧 Using fixed admin ObjectId for history:', adminId);
        }
      } else {
        // For regular database users
        if (mongoose.Types.ObjectId.isValid(adminIdStr)) {
          adminId = new mongoose.Types.ObjectId(adminIdStr);
          console.log('✅ Using regular user ObjectId for history:', adminId);
        } else {
          console.log('❌ Invalid ObjectId format for history:', adminIdStr);
          throw new Error('Invalid admin ID format');
        }
      }
    } catch (error) {
      console.error('❌ Error processing admin ID for history:', error);
      return errorResponse(res, 'Invalid admin user ID: ' + error.message, 400);
    }

    if (!adminId) {
      console.log('❌ Failed to determine admin ID for history');
      return errorResponse(res, 'Could not determine admin user ID', 400);
    }

    console.log('🔍 Admin ID for query:', adminId.toString());
    
    // Add try-catch around the csvService call
    let result;
    try {
      result = await csvService.getBulkUploadHistory(adminId, parseInt(page), parseInt(limit));
      console.log('✅ CSV Service returned:', {
        uploadsCount: result?.uploads?.length || 0,
        total: result?.total || 0
      });
    } catch (serviceError) {
      console.error('❌ CSV Service error:', serviceError);
      throw serviceError;
    }

    console.log('✅ Bulk upload history retrieved successfully');
    successResponse(res, result, 'Bulk upload history retrieved successfully');

  } catch (error) {
    console.error('❌ Get bulk upload history error:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    errorResponse(res, error.message || 'Failed to get bulk upload history', 500);
  }
};
// @desc    Get all students
// @route   GET /api/admin/students
// @access  Private (Admin only)
// Enhanced getAllStudents function for your adminController.js
const getAllStudents = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return errorResponse(res, 'Access denied. Admin privileges required.', 403);
    }
 
    const {
      page = 1,
      limit = 10,
      search = '',
      branch = '',
      mentor = '',
      status = '',
      type = '',
      department = ''   // ← NEW: read department from query
    } = req.query;
 
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
 
    // Build base student query
    let studentQuery = { role: 'student' };
 
    if (search) {
      studentQuery.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { enrollmentNo: { $regex: search, $options: 'i' } }
      ];
    }
 
    if (branch) {
      studentQuery.branch = branch;
    }
 
    if (mentor) {
      studentQuery.assignedMentor = mentor;
    }
 
    if (status) {
      studentQuery.isActive = status === 'active';
    }
 
    // ── NEW: Department filter ──────────────────────────────────────────────
    // department lives on the Mentor model, not on Student.
    // So: find mentors with that department → get their IDs → filter students
    if (department) {
      const mentorsInDept = await User.find(
        { role: 'mentor', department: department },
        '_id'
      );
      const mentorIds = mentorsInDept.map(m => m._id);
 
      if (mentorIds.length === 0) {
        // No mentors in this department → no students
        return successResponse(res, {
          students: [],
          pagination: {
            currentPage: pageNum,
            totalPages: 0,
            totalStudents: 0,
            hasNext: false,
            hasPrev: false
          }
        }, 'Students retrieved successfully');
      }
 
      // Filter students whose assignedMentor is in those mentor IDs
      // If studentQuery already has assignedMentor (mentor filter), intersect them
      if (studentQuery.assignedMentor) {
        // Keep only if the already-filtered mentor is also in this department
        const alreadyFiltered = studentQuery.assignedMentor.toString();
        const inDept = mentorIds.map(id => id.toString()).includes(alreadyFiltered);
        if (!inDept) {
          return successResponse(res, {
            students: [],
            pagination: {
              currentPage: pageNum,
              totalPages: 0,
              totalStudents: 0,
              hasNext: false,
              hasPrev: false
            }
          }, 'Students retrieved successfully');
        }
        // else keep studentQuery.assignedMentor as-is (it's valid & in department)
      } else {
        studentQuery.assignedMentor = { $in: mentorIds };
      }
    }
    // ── END department filter ───────────────────────────────────────────────
 
    // Submission type filter
    if (type) {
      const submissions = await Submission.find({ semesterType: type }).select('student');
      const studentIds = submissions.map(sub => sub.student);
 
      if (studentIds.length === 0) {
        return successResponse(res, {
          students: [],
          pagination: {
            currentPage: pageNum,
            totalPages: 0,
            totalStudents: 0,
            hasNext: false,
            hasPrev: false
          }
        }, 'Students retrieved successfully');
      }
 
      // Intersect with any existing _id filter
      if (studentQuery._id) {
        const existing = studentQuery._id.$in.map(id => id.toString());
        const newIds = studentIds.map(id => id.toString());
        const intersected = existing.filter(id => newIds.includes(id));
        studentQuery._id = { $in: intersected };
      } else {
        studentQuery._id = { $in: studentIds };
      }
    }
 
    const totalStudents = await User.countDocuments(studentQuery);
 
    const students = await User.find(studentQuery)
    .populate('assignedMentor', 'name email currentStudentCount maxStudents department')
    .populate('branch', 'name')        // ← ADD THIS LINE
    .select('-password')
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum)
 
    const studentsWithStatus = await Promise.all(
      students.map(async (student) => {
        const submission = await Submission.findOne({ student: student._id })
          .select('semesterType currentStep registrationReview.status');
 
        return {
          ...student.toObject(),
          submissionStatus: submission ? {
            type: submission.semesterType,
            status: submission.registrationReview?.status || submission.currentStep
          } : null
        };
      })
    );
 
    const pagination = {
      currentPage: pageNum,
      totalPages: Math.ceil(totalStudents / limitNum),
      totalStudents,
      hasNext: pageNum < Math.ceil(totalStudents / limitNum),
      hasPrev: pageNum > 1
    };
 
    successResponse(res, {
      students: studentsWithStatus,
      pagination
    }, 'Students retrieved successfully');
 
  } catch (error) {
    console.error('Get all students error:', error);
    errorResponse(res, 'Failed to retrieve students', 500);
  }
};

// @desc    Get all submissions
// @route   GET /api/admin/submissions
// @access  Private (Admin only)
const getAllSubmissions = async (req, res) => {
  try {
    // Verify admin access
    if (!req.user || req.user.role !== 'admin') {
      return errorResponse(res, 'Access denied. Admin privileges required.', 403);
    }

    const { page = 1, limit = 10, type = '', status = '', mentor = '' } = req.query;

    const query = {};
    
    if (type) query.type = type;
    if (status) query.status = status;
    if (mentor) query.mentor = mentor;

    const pagination = getPaginationData(page, limit, await Submission.countDocuments(query));
    
    const submissions = await Submission.find(query)
      .populate('student', 'name enrollmentNo email branch')
      .populate('mentor', 'name email')
      .sort({ createdAt: -1 })
      .skip(pagination.skip)
      .limit(pagination.itemsPerPage);

    successResponse(res, {
      submissions,
      pagination
    }, 'Submissions retrieved successfully');

  } catch (error) {
    console.error('Get all submissions error:', error);
    errorResponse(res, 'Failed to get submissions', 500);
  }
};

// @desc    Export all student data
// @route   GET /api/admin/export/students
// @access  Private (Admin only)
const exportAllStudentData = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return errorResponse(res, 'Access denied. Admin privileges required.', 403);
    }

    const { branch = '' } = req.query;

    const exportData = await excelService.exportAllStudentDataByBranch(branch);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${exportData.filename}"`);
    res.send(exportData.buffer);

  } catch (error) {
    console.error('Export all student data error:', error);
    errorResponse(res, 'Failed to export student data', 500);
  }
};

// @desc    Export submissions summary
// @route   GET /api/admin/export/submissions
// @access  Private (Admin only)
const exportSubmissions = async (req, res) => {
  try {
    // Verify admin access
    if (!req.user || req.user.role !== 'admin') {
      return errorResponse(res, 'Access denied. Admin privileges required.', 403);
    }

    const exportData = await excelService.exportSubmissionsSummary();

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${exportData.filename}"`);
    
    res.send(exportData.buffer);

  } catch (error) {
    console.error('Export submissions error:', error);
    errorResponse(res, 'Failed to export submissions', 500);
  }
};

const exportMPRDetails = async (req, res) => {
  try {
    // Verify admin access
    if (!req.user || req.user.role !== 'admin') {
      return errorResponse(res, 'Access denied. Admin privileges required.', 403);
    }

    const exportData = await excelService.exportMPRDetails();

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${exportData.filename}"`);
    
    res.send(exportData.buffer);

  } catch (error) {
    console.error('Export MPR details error:', error);
    errorResponse(res, 'Failed to export MPR details', 500);
  }
};


// @desc    Export placement statistics
// @route   GET /api/admin/export/placements
// @access  Private (Admin only)
const exportPlacementStats = async (req, res) => {
  try {
    // Verify admin access
    if (!req.user || req.user.role !== 'admin') {
      return errorResponse(res, 'Access denied. Admin privileges required.', 403);
    }

    const exportData = await excelService.exportPlacementStats();

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${exportData.filename}"`);
    
    res.send(exportData.buffer);

  } catch (error) {
    console.error('Export placement stats error:', error);
    errorResponse(res, 'Failed to export placement statistics', 500);
  }
};

// @desc    Update student details
// @route   PUT /api/admin/students/:id
// @access  Private (Admin only)
const updateStudent = async (req, res) => {
  try {
    // Verify admin access
    if (!req.user || req.user.role !== 'admin') {
      return errorResponse(res, 'Access denied. Admin privileges required.', 403);
    }

    const { id } = req.params;
    const { name, email, branch, assignedMentor, isActive } = req.body;

    const student = await User.findOne({ _id: id, role: 'student' });
    if (!student) {
      return errorResponse(res, 'Student not found', 404);
    }

    // Check if email is being changed and already exists
    if (email && email.toLowerCase() !== student.email) {
      const existingUser = await User.findOne({ 
        email: email.toLowerCase(),
        _id: { $ne: id }
      });
      if (existingUser) {
        return errorResponse(res, 'Email already exists', 400);
      }
      student.email = email.toLowerCase();
    }

    // Handle mentor assignment change
    if (assignedMentor && assignedMentor !== student.assignedMentor?.toString()) {
      // Decrease current mentor's count
      if (student.assignedMentor) {
        await User.findByIdAndUpdate(student.assignedMentor, {
          $inc: { currentStudentCount: -1 }
        });
      }

      // Increase new mentor's count
      const newMentor = await User.findById(assignedMentor);
      if (!newMentor || newMentor.role !== 'mentor') {
        return errorResponse(res, 'Invalid mentor selected', 400);
      }

      if (newMentor.currentStudentCount >= newMentor.maxStudents) {
        return errorResponse(res, 'Selected mentor has reached maximum capacity', 400);
      }

      await User.findByIdAndUpdate(assignedMentor, {
        $inc: { currentStudentCount: 1 }
      });

      student.assignedMentor = assignedMentor;
    }

    if (name) student.name = name;
    if (branch) student.branch = branch;
    if (typeof isActive === 'boolean') student.isActive = isActive;

    await student.save();

    const updatedStudent = await User.findById(id)
      .populate('assignedMentor', 'name email')
      .select('-password');

    successResponse(res, updatedStudent, 'Student updated successfully');

  } catch (error) {
    console.error('Update student error:', error);
    errorResponse(res, 'Failed to update student', 500);
  }
};

// @desc    Delete student
// @route   DELETE /api/admin/students/:id
// @access  Private (Admin only)
const deleteStudent = async (req, res) => {
  try {
    // Verify admin access
    if (!req.user || req.user.role !== 'admin') {
      return errorResponse(res, 'Access denied. Admin privileges required.', 403);
    }

    const { id } = req.params;

    const student = await User.findOne({ _id: id, role: 'student' });
    if (!student) {
      return errorResponse(res, 'Student not found', 404);
    }

    // Decrease mentor's student count
    if (student.assignedMentor) {
      await User.findByIdAndUpdate(student.assignedMentor, {
        $inc: { currentStudentCount: -1 }
      });
    }

    // Delete associated submissions
    await Submission.deleteMany({ student: id });

    // Delete student
    await User.findByIdAndDelete(id);

    successResponse(res, null, 'Student deleted successfully');

  } catch (error) {
    console.error('Delete student error:', error);
    errorResponse(res, 'Failed to delete student', 500);
  }
};


const deleteAllStudents = async (req, res) => {
  try {
    // Verify admin access
    if (!req.user || req.user.role !== 'admin') {
      return errorResponse(res, 'Access denied. Admin privileges required.', 403);
    }

    // Get all students to update mentor counts
    const students = await User.find({ role: 'student' });
    
    // Update mentor counts for all assigned mentors
    const mentorUpdates = {};
    students.forEach(student => {
      if (student.assignedMentor) {
        mentorUpdates[student.assignedMentor] = (mentorUpdates[student.assignedMentor] || 0) + 1;
      }
    });

    // Decrease mentor student counts
    for (const [mentorId, count] of Object.entries(mentorUpdates)) {
      await User.findByIdAndUpdate(mentorId, {
        $inc: { currentStudentCount: -count }
      });
    }

    // Delete all submissions first
    await Submission.deleteMany({ student: { $in: students.map(s => s._id) } });

    // Delete all students
    const deleteResult = await User.deleteMany({ role: 'student' });

    successResponse(res, { 
      deletedCount: deleteResult.deletedCount,
      message: 'All students deleted successfully'
    }, 'All students deleted successfully');

  } catch (error) {
    console.error('Delete all students error:', error);
    errorResponse(res, 'Failed to delete all students', 500);
  }
};

// @desc    Delete selected students
// @route   DELETE /api/admin/students/bulk/selected
// @access  Private (Admin only)
const deleteSelectedStudents = async (req, res) => {
  try {
    // Verify admin access
    if (!req.user || req.user.role !== 'admin') {
      return errorResponse(res, 'Access denied. Admin privileges required.', 403);
    }

    const { studentIds } = req.body;

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return errorResponse(res, 'No student IDs provided', 400);
    }

    // Get selected students to update mentor counts
    const students = await User.find({ _id: { $in: studentIds }, role: 'student' });
    
    if (students.length === 0) {
      return errorResponse(res, 'No valid students found', 404);
    }

    // Update mentor counts
    const mentorUpdates = {};
    students.forEach(student => {
      if (student.assignedMentor) {
        mentorUpdates[student.assignedMentor] = (mentorUpdates[student.assignedMentor] || 0) + 1;
      }
    });

    // Decrease mentor student counts
    for (const [mentorId, count] of Object.entries(mentorUpdates)) {
      await User.findByIdAndUpdate(mentorId, {
        $inc: { currentStudentCount: -count }
      });
    }

    // Delete associated submissions
    await Submission.deleteMany({ student: { $in: studentIds } });

    // Delete selected students
    const deleteResult = await User.deleteMany({ _id: { $in: studentIds }, role: 'student' });

    successResponse(res, { 
      deletedCount: deleteResult.deletedCount,
      message: `${deleteResult.deletedCount} students deleted successfully`
    }, `${deleteResult.deletedCount} students deleted successfully`);

  } catch (error) {
    console.error('Delete selected students error:', error);
    errorResponse(res, 'Failed to delete selected students', 500);
  }
};

// @desc    Delete students by submission type
// @route   DELETE /api/admin/students/bulk/type/:type
// @access  Private (Admin only)
const deleteStudentsByType = async (req, res) => {
  try {
    // Verify admin access
    if (!req.user || req.user.role !== 'admin') {
      return errorResponse(res, 'Access denied. Admin privileges required.', 403);
    }

    const { type } = req.params;

    // Validate submission type
    const validTypes = ['6th_internship', '7th_internship', '8th_internship', '8th_project', 'any_internship'];
    if (!validTypes.includes(type)) {
      return errorResponse(res, 'Invalid submission type', 400);
    }

    // Find submissions of the specified type
    const submissions = await Submission.find({ semesterType: type }).populate('student');
    
    if (submissions.length === 0) {
      return successResponse(res, { 
        deletedCount: 0,
        message: `No students found with ${type} submissions`
      }, `No students found with ${type} submissions`);
    }

    // Get student IDs from submissions
    const studentIds = submissions.map(sub => sub.student._id);
    
    // Get students to update mentor counts
    const students = await User.find({ _id: { $in: studentIds }, role: 'student' });

    // Update mentor counts
    const mentorUpdates = {};
    students.forEach(student => {
      if (student.assignedMentor) {
        mentorUpdates[student.assignedMentor] = (mentorUpdates[student.assignedMentor] || 0) + 1;
      }
    });

    // Decrease mentor student counts
    for (const [mentorId, count] of Object.entries(mentorUpdates)) {
      await User.findByIdAndUpdate(mentorId, {
        $inc: { currentStudentCount: -count }
      });
    }

    // Delete submissions first
    await Submission.deleteMany({ semesterType: type });

    // Delete students
    const deleteResult = await User.deleteMany({ _id: { $in: studentIds }, role: 'student' });

    const typeDisplayNames = {
      '6th_internship': '6th Semester Internship',
      '7th_internship': '7th Semester Internship', 
      '8th_internship': '8th Semester Internship',
      '8th_project': '8th Semester Project',
      'any_internship': 'Any Other Internship'
    };

    successResponse(res, { 
      deletedCount: deleteResult.deletedCount,
      submissionType: type,
      message: `${deleteResult.deletedCount} students with ${typeDisplayNames[type]} deleted successfully`
    }, `${deleteResult.deletedCount} students with ${typeDisplayNames[type]} deleted successfully`);

  } catch (error) {
    console.error('Delete students by type error:', error);
    errorResponse(res, 'Failed to delete students by type', 500);
  }
};

const createDeptAdmin = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return errorResponse(res, 'Access denied', 403);
    }
    const { email, departmentId, program } = req.body;
    if (!email || !departmentId) {
      return errorResponse(res, 'Email and department are required', 400);
    }

    const department = await Department.findById(departmentId);
    if (!department) return errorResponse(res, 'Department not found', 400);

    const processedEmail = email.toLowerCase().trim();
    const existing = await User.findOne({ email: processedEmail });
    if (existing) return errorResponse(res, 'A user with this email already exists', 400);

    // Name fetched from Google on first login — use email prefix as placeholder
    const deptAdmin = await User.create({
      name: processedEmail.split('@')[0],
      email: processedEmail,
      role: 'dept_admin',
      department: departmentId,
      program: program || '',
      isActive: true
      // No password — uses Google OAuth
    });

    const populated = await User.findById(deptAdmin._id)
      .populate('department', 'name programs')
      .select('-password');

    successResponse(res, populated, 'Department admin created successfully');
  } catch (error) {
    console.error('Create dept admin error:', error);
    if (error.code === 11000) return errorResponse(res, 'Email already exists', 400);
    errorResponse(res, 'Failed to create department admin', 500);
  }
};

const getAllDeptAdmins = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') return errorResponse(res, 'Access denied', 403);
    const { page = 1, limit = 10, search = '' } = req.query;
    const query = { role: 'dept_admin' };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    const total = await User.countDocuments(query);
    const pagination = getPaginationData(page, limit, total);
    const admins = await User.find(query)
      .populate('department', 'name')
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(pagination.skip)
      .limit(pagination.itemsPerPage);

    successResponse(res, { admins, pagination }, 'Department admins retrieved');
  } catch (error) {
    errorResponse(res, 'Failed to get department admins', 500);
  }
};

const deleteDeptAdmin = async (req, res) => {
  try {
    if (!req.user || req.user.role !== 'admin') return errorResponse(res, 'Access denied', 403);
    const admin = await User.findOneAndDelete({ _id: req.params.id, role: 'dept_admin' });
    if (!admin) return errorResponse(res, 'Department admin not found', 404);
    successResponse(res, null, 'Department admin deleted successfully');
  } catch (error) {
    errorResponse(res, 'Failed to delete department admin', 500);
  }
};


module.exports = {
  getDashboardStats,
  deleteDeptAdmin,
  getAllDeptAdmins,
  createMentor,
  createDeptAdmin,
  getAllMentors,
  updateMentor,
  deleteMentor,
  bulkUploadStudents,
  getBulkUploadHistory,
  getAllStudents,
  getAllSubmissions,
  deleteAllStudents,
  deleteSelectedStudents,
  deleteStudentsByType,
  exportMPRDetails,
  exportAllStudentData,
  exportSubmissions,
  exportPlacementStats,
  updateStudent,
  deleteStudent,
  addSingleStudent
};