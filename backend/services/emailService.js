const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = this.createTransporter();
  }

  // Create email transporter with better error handling
  createTransporter() {
    try {
      return nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT || 587,
        secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS
        },
        // Additional options for better reliability
        pool: true, // use pooled connection
        maxConnections: 5, // limit connections
        maxMessages: 100, // limit messages per connection
        rateLimit: 10 // limit to 10 messages per second
      });
    } catch (error) {
      console.error('❌ Failed to create email transporter:', error);
      throw new Error('Email configuration failed');
    }
  }

  // Enhanced account creation email with better formatting
  async sendAccountCreated(studentEmail, studentName, password, mentorName, mentorEmail) {
    try {
      console.log(`📧 Sending account creation email to: ${studentEmail}`);
      
      const mailOptions = {
        from: `"InternTrack System" <${process.env.EMAIL_USER}>`,
        to: studentEmail,
        subject: 'Welcome to InternTrack - Your Account Has Been Created',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%); padding: 30px 20px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">Welcome to InternTrack!</h1>
              <p style="color: #e0e7ff; margin: 10px 0 0 0; font-size: 16px;">Your academic journey starts here</p>
            </div>
            
            <!-- Main Content -->
            <div style="padding: 30px 20px; background-color: white;">
              <h2 style="color: #1f2937; margin-bottom: 20px;">Hello ${studentName},</h2>
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                Your student account has been successfully created in the InternTrack system. You can now log in to manage your internship or project submissions.
              </p>
              
              <!-- Login Credentials Box -->
              <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border: 2px solid #0ea5e9; border-radius: 12px; padding: 25px; margin: 30px 0;">
                <h3 style="color: #0c4a6e; margin: 0 0 20px 0; text-align: center; font-size: 20px;">🔑 Your Login Credentials</h3>
                <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <span style="font-weight: bold; color: #374151;">Email:</span>
                    <span style="color: #1f2937; background: #f3f4f6; padding: 5px 10px; border-radius: 4px; font-family: monospace;">${studentEmail}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <span style="font-weight: bold; color: #374151;">Password:</span>
                    <span style="color: #1f2937; background: #fef3c7; padding: 5px 10px; border-radius: 4px; font-family: monospace; font-size: 18px; font-weight: bold;">${password}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; align-items: center;">
                    <span style="font-weight: bold; color: #374151;">Login URL:</span>
                    <a href="${process.env.FRONTEND_URL}/login" style="color: #2563eb; text-decoration: none; background: #eff6ff; padding: 5px 10px; border-radius: 4px;">${process.env.FRONTEND_URL}/login</a>
                  </div>
                </div>
              </div>

              <!-- Security Notice -->
              <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                <h4 style="color: #dc2626; margin: 0 0 10px 0; font-size: 16px;">🔒 Important Security Notice</h4>
                <ul style="color: #7f1d1d; margin: 0; padding-left: 20px;">
                  <li>Please change your password after your first login</li>
                  <li>Keep your login credentials secure and don't share them</li>
                  <li>Log out when using shared computers</li>
                </ul>
              </div>

              <!-- Mentor Information -->
              <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h4 style="color: #166534; margin: 0 0 15px 0; font-size: 16px;">👨‍🏫 Your Assigned Mentor</h4>
                <div style="color: #15803d;">
                  <p style="margin: 5px 0;"><strong>Name:</strong> ${mentorName}</p>
                  <p style="margin: 5px 0;"><strong>Email:</strong> ${mentorEmail}</p>
                </div>
              </div>

              <!-- Next Steps -->
              <div style="margin: 30px 0;">
                <h3 style="color: #1f2937; margin-bottom: 15px;">📋 Next Steps</h3>
                <ol style="color: #4b5563; line-height: 1.8; padding-left: 20px;">
                  <li>Log in to your account using the credentials above</li>
                  <li>Change your password for security</li>
                  <li>Choose between internship or project submission</li>
                  <li>Submit your documents as required</li>
                  <li>Stay in touch with your mentor throughout the process</li>
                </ol>
              </div>

              <!-- Login Button -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.FRONTEND_URL}/login" style="display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(37, 99, 235, 0.3); transition: transform 0.2s;">
                  🚀 Login to InternTrack
                </a>
              </div>
            </div>

            <!-- Footer -->
            <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; margin: 0 0 10px 0; font-size: 14px;">
                <strong>Need Help?</strong> Contact your mentor or system administrator.
              </p>
              <p style="color: #9ca3af; margin: 0; font-size: 12px;">
                © ${new Date().getFullYear()} InternTrack System. All rights reserved.
              </p>
            </div>
          </div>
        `
      };

      const info = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Account creation email sent successfully to: ${studentEmail}`);
      console.log(`📧 Message ID: ${info.messageId}`);
      
      return true;
    } catch (error) {
      console.error(`❌ Failed to send account creation email to ${studentEmail}:`, error);
      throw new Error(`Failed to send account creation email: ${error.message}`);
    }
  }

  // Enhanced bulk upload completion email with email failure details
  async sendBulkUploadComplete(adminEmail, adminName, successCount, failureCount, totalCount, emailFailures = []) {
    try {
      const successRate = ((successCount / totalCount) * 100).toFixed(1);
      const emailFailureCount = emailFailures.length;
      
      let emailFailureSection = '';
      if (emailFailureCount > 0) {
        emailFailureSection = `
          <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; border-radius: 0 8px 8px 0;">
            <h4 style="color: #92400e; margin: 0 0 10px 0;">⚠️ Email Delivery Issues</h4>
            <p style="color: #78350f; margin: 0 0 10px 0;">
              ${emailFailureCount} students were created successfully but didn't receive their login credentials via email.
            </p>
            <details style="color: #78350f;">
              <summary style="cursor: pointer; font-weight: bold;">View Email Failures</summary>
              <ul style="margin: 10px 0; padding-left: 20px;">
                ${emailFailures.map(failure => 
                  `<li style="margin: 5px 0;">${failure.student} (${failure.email}) - ${failure.error}</li>`
                ).join('')}
              </ul>
            </details>
            <p style="color: #78350f; margin: 10px 0 0 0; font-size: 14px;">
              <strong>Action Required:</strong> Please manually share login credentials with these students.
            </p>
          </div>
        `;
      }
      
      const mailOptions = {
        from: `"InternTrack System" <${process.env.EMAIL_USER}>`,
        to: adminEmail,
        subject: `Bulk Upload Complete - ${successCount}/${totalCount} Students Processed`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 30px 20px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">📤 Bulk Upload Complete</h1>
              <p style="color: #d1fae5; margin: 10px 0 0 0; font-size: 16px;">Student processing summary</p>
            </div>
            
            <!-- Main Content -->
            <div style="padding: 30px 20px; background-color: white;">
              <h2 style="color: #1f2937; margin-bottom: 20px;">Hello ${adminName},</h2>
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 25px;">
                The bulk student upload process has been completed successfully. Here's a summary of the results:
              </p>

              <!-- Summary Stats -->
              <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin: 25px 0;">
                <div style="background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%); padding: 20px; border-radius: 12px; text-align: center; border: 1px solid #3b82f6;">
                  <h3 style="color: #1e40af; margin: 0 0 10px 0; font-size: 24px;">${totalCount}</h3>
                  <p style="color: #3730a3; margin: 0; font-weight: bold;">Total Records</p>
                </div>
                <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); padding: 20px; border-radius: 12px; text-align: center; border: 1px solid #22c55e;">
                  <h3 style="color: #16a34a; margin: 0 0 10px 0; font-size: 24px;">${successCount}</h3>
                  <p style="color: #15803d; margin: 0; font-weight: bold;">Successfully Created</p>
                </div>
                <div style="background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%); padding: 20px; border-radius: 12px; text-align: center; border: 1px solid #ef4444;">
                  <h3 style="color: #dc2626; margin: 0 0 10px 0; font-size: 24px;">${failureCount}</h3>
                  <p style="color: #b91c1c; margin: 0; font-weight: bold;">Failed</p>
                </div>
              </div>

              <!-- Success Rate -->
              <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
                <h3 style="color: #1f2937; margin: 0 0 10px 0;">Success Rate: ${successRate}%</h3>
                <div style="width: 100%; background-color: #e5e7eb; border-radius: 10px; height: 20px; overflow: hidden;">
                  <div style="width: ${successRate}%; background: linear-gradient(90deg, #059669, #10b981); height: 100%; border-radius: 10px; transition: width 0.3s ease;"></div>
                </div>
              </div>

              ${emailFailureSection}

              <!-- Next Steps -->
              <div style="background: #f0f9ff; border: 1px solid #3b82f6; border-radius: 8px; padding: 20px; margin: 25px 0;">
                <h4 style="color: #1e40af; margin: 0 0 15px 0;">📋 What Happens Next</h4>
                <ul style="color: #1e3a8a; margin: 0; padding-left: 20px;">
                  <li style="margin: 8px 0;">Students have been automatically assigned to their mentors</li>
                  <li style="margin: 8px 0;">Login credentials have been sent to student email addresses</li>
                  <li style="margin: 8px 0;">Students can now log in and start their submissions</li>
                  <li style="margin: 8px 0;">Monitor progress through the admin dashboard</li>
                </ul>
              </div>

              <!-- Action Button -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.FRONTEND_URL}/admin/dashboard" style="display: inline-block; background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px rgba(37, 99, 235, 0.3);">
                  📊 View Admin Dashboard
                </a>
              </div>
            </div>

            <!-- Footer -->
            <div style="background: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; margin: 0 0 10px 0; font-size: 14px;">
                Bulk upload completed at ${new Date().toLocaleString()}
              </p>
              <p style="color: #9ca3af; margin: 0; font-size: 12px;">
                © ${new Date().getFullYear()} InternTrack System. All rights reserved.
              </p>
            </div>
          </div>
        `
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`✅ Bulk upload completion email sent to: ${adminEmail}`);
    } catch (error) {
      console.error('❌ Error sending bulk upload completion email:', error);
      throw new Error('Failed to send bulk upload completion email');
    }
  }

  // Send email to student when account credentials need to be resent
  async resendLoginCredentials(studentEmail, studentName, password, mentorName, mentorEmail) {
    try {
      const mailOptions = {
        from: `"InternTrack System" <${process.env.EMAIL_USER}>`,
        to: studentEmail,
        subject: 'InternTrack - Your Login Credentials',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%); padding: 30px 20px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">🔑 Your Login Credentials</h1>
              <p style="color: #e9d5ff; margin: 10px 0 0 0; font-size: 16px;">Access your InternTrack account</p>
            </div>
            
            <!-- Main Content -->
            <div style="padding: 30px 20px; background-color: white;">
              <h2 style="color: #1f2937; margin-bottom: 20px;">Hello ${studentName},</h2>
              <p style="color: #4b5563; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
                Here are your login credentials for the InternTrack system:
              </p>
              
              <!-- Login Credentials Box -->
              <div style="background: linear-gradient(135deg, #faf5ff 0%, #f3e8ff 100%); border: 2px solid #8b5cf6; border-radius: 12px; padding: 25px; margin: 30px 0;">
                <div style="background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <span style="font-weight: bold; color: #374151;">Email:</span>
                    <span style="color: #1f2937; background: #f3f4f6; padding: 8px 12px; border-radius: 4px; font-family: monospace;">${studentEmail}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
                    <span style="font-weight: bold; color: #374151;">Password:</span>
                    <span style="color: #1f2937; background: #fef3c7; padding: 8px 12px; border-radius: 4px; font-family: monospace; font-size: 18px; font-weight: bold;">${password}</span>
                  </div>
                  <div style="text-align: center; margin-top: 20px;">
                    <a href="${process.env.FRONTEND_URL}/login" style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #8b5cf6 100%); color: white; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                      Login Now
                    </a>
                  </div>
                </div>
              </div>

              <!-- Mentor Info -->
              <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h4 style="color: #166534; margin: 0 0 10px 0;">👨‍🏫 Your Mentor: ${mentorName}</h4>
                <p style="color: #15803d; margin: 0;">Contact: ${mentorEmail}</p>
              </div>
            </div>

            <!-- Footer -->
            <div style="background: #f9fafb; padding: 20px; text-align: center;">
              <p style="color: #6b7280; margin: 0; font-size: 14px;">
                Keep your credentials secure and change your password after first login.
              </p>
            </div>
          </div>
        `
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`✅ Credentials resent to: ${studentEmail}`);
    } catch (error) {
      console.error('❌ Error resending credentials:', error);
      throw new Error('Failed to resend login credentials');
    }
  }

  // Send email to mentor when student submits for approval
  async sendSubmissionPending(mentorEmail, mentorName, studentName, submissionType) {
    try {
      const mailOptions = {
        from: `"InternTrack System" <${process.env.EMAIL_USER}>`,
        to: mentorEmail,
        subject: `New ${submissionType} Submission Pending Review`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc2626;">New Submission Pending Review</h2>
            <p>Hello ${mentorName},</p>
            <p>A new ${submissionType} submission has been received from <strong>${studentName}</strong> and requires your review.</p>
            <div style="background-color: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Student:</strong> ${studentName}</p>
              <p><strong>Submission Type:</strong> ${submissionType}</p>
              <p><strong>Status:</strong> Pending Approval</p>
            </div>
            <p>Please log in to your mentor dashboard to review and approve/reject this submission.</p>
            <p><a href="${process.env.FRONTEND_URL}/mentor/dashboard" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Review Submission</a></p>
            <p>Best regards,<br>InternTrack System</p>
          </div>
        `
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`✅ Submission pending email sent to mentor: ${mentorEmail}`);
    } catch (error) {
      console.error('Error sending submission pending email:', error);
      throw new Error('Failed to send submission pending email');
    }
  }

  // Send email to student when submission is approved
  async sendSubmissionApproved(studentEmail, studentName, submissionType, feedback = '') {
    try {
      const mailOptions = {
        from: `"InternTrack System" <${process.env.EMAIL_USER}>`,
        to: studentEmail,
        subject: `Your ${submissionType} Submission Has Been Approved`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #059669;">Submission Approved!</h2>
            <p>Hello ${studentName},</p>
            <p>Great news! Your ${submissionType} submission has been approved by your mentor.</p>
            <div style="background-color: #d1fae5; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Submission Type:</strong> ${submissionType}</p>
              <p><strong>Status:</strong> ✅ Approved</p>
              ${feedback ? `<p><strong>Mentor Feedback:</strong> ${feedback}</p>` : ''}
            </div>
            ${submissionType === 'internship' ? `
              <p><strong>Next Steps:</strong></p>
              <ul>
                <li>You will receive monthly follow-up forms during your internship period</li>
                <li>Please complete these forms on time to track your progress</li>
                <li>Update your placement status as required</li>
              </ul>
            ` : ''}
            <p>You can view your progress in the student dashboard.</p>
            <p><a href="${process.env.FRONTEND_URL}/student/dashboard" style="background-color: #059669; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Dashboard</a></p>
            <p>Best regards,<br>InternTrack Team</p>
          </div>
        `
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`✅ Submission approved email sent to: ${studentEmail}`);
    } catch (error) {
      console.error('Error sending submission approved email:', error);
      throw new Error('Failed to send submission approved email');
    }
  }

  // Send email to student when submission is rejected
  async sendSubmissionRejected(studentEmail, studentName, submissionType, feedback) {
    try {
      const mailOptions = {
        from: `"InternTrack System" <${process.env.EMAIL_USER}>`,
        to: studentEmail,
        subject: `Your ${submissionType} Submission Needs Revision`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc2626;">Submission Needs Revision</h2>
            <p>Hello ${studentName},</p>
            <p>Your ${submissionType} submission has been reviewed and needs some revisions before approval.</p>
            <div style="background-color: #fee2e2; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Submission Type:</strong> ${submissionType}</p>
              <p><strong>Status:</strong> ❌ Needs Revision</p>
              <p><strong>Mentor Feedback:</strong> ${feedback}</p>
            </div>
            <p><strong>Next Steps:</strong></p>
            <ul>
              <li>Review the mentor's feedback carefully</li>
              <li>Make the necessary corrections</li>
              <li>Resubmit your application with updated information/documents</li>
            </ul>
            <p><a href="${process.env.FRONTEND_URL}/student/dashboard" style="background-color: #dc2626; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Revise Submission</a></p>
            <p>Best regards,<br>InternTrack Team</p>
          </div>
        `
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`✅ Submission rejected email sent to: ${studentEmail}`);
    } catch (error) {
      console.error('Error sending submission rejected email:', error);
      throw new Error('Failed to send submission rejected email');
    }
  }

  // Test email configuration
  async testEmailConfig() {
    try {
      await this.transporter.verify();
      console.log('✅ Email configuration is valid');
      return true;
    } catch (error) {
      console.error('❌ Email configuration error:', error);
      return false;
    }
  }

  // Send test email
  async sendTestEmail(toEmail) {
    try {
      const mailOptions = {
        from: `"InternTrack System" <${process.env.EMAIL_USER}>`,
        to: toEmail,
        subject: 'InternTrack Email Configuration Test',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">✅ Email Configuration Test Successful</h2>
            <p>This is a test email from the InternTrack system.</p>
            <p>If you're receiving this email, your email configuration is working properly.</p>
            <p><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
            <p>Best regards,<br>InternTrack System</p>
          </div>
        `
      };

      await this.transporter.sendMail(mailOptions);
      console.log(`✅ Test email sent successfully to: ${toEmail}`);
      return true;
    } catch (error) {
      console.error(`❌ Failed to send test email to ${toEmail}:`, error);
      return false;
    }
  }
}

module.exports = new EmailService();