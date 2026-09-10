// const roleCheck = (allowedRoles) => {
//     return (req, res, next) => {
//       try {
//         if (!req.user) {
//           return res.status(401).json({
//             success: false,
//             message: 'Authentication required'
//           });
//         }
  
//         if (!allowedRoles.includes(req.user.role)) {
//           return res.status(403).json({
//             success: false,
//             message: `Access denied. Required role(s): ${allowedRoles.join(', ')}`
//           });
//         }
  
//         next();
//       } catch (error) {
//         console.error('Role check error:', error);
//         res.status(500).json({
//           success: false,
//           message: 'Authorization error'
//         });
//       }
//     };
//   };
  
//   // Predefined role checkers
//   const adminOnly = roleCheck(['admin']);
//   const mentorOnly = roleCheck(['mentor']);
//   const studentOnly = roleCheck(['student']);
//   const adminAndMentor = roleCheck(['admin', 'mentor']);
//   const allRoles = roleCheck(['admin', 'mentor', 'student']);
  
//   module.exports = {
//     roleCheck,
//     adminOnly,
//     mentorOnly,
//     studentOnly,
//     adminAndMentor,
//     allRoles
//   };


const roleCheck = (allowedRoles) => {
  return (req, res, next) => {
    try {
      if (!req.user) return res.status(401).json({ success: false, message: 'Authentication required' });
      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ success: false, message: `Access denied. Required role(s): ${allowedRoles.join(', ')}` });
      }
      next();
    } catch (error) {
      res.status(500).json({ success: false, message: 'Authorization error' });
    }
  };
};

const adminOnly = roleCheck(['admin']);
const deptAdminOnly = roleCheck(['dept_admin']);
const mentorOnly = roleCheck(['mentor']);
const studentOnly = roleCheck(['student']);
const adminAndMentor = roleCheck(['admin', 'mentor']);
const adminAndDeptAdmin = roleCheck(['admin', 'dept_admin']);
const allRoles = roleCheck(['admin', 'dept_admin', 'mentor', 'student']);

module.exports = { roleCheck, adminOnly, deptAdminOnly, mentorOnly, studentOnly, adminAndMentor, adminAndDeptAdmin, allRoles };