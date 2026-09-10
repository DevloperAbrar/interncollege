const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { deptAdminOnly } = require('../middleware/roleCheck');
const {
  getDashboard,
  getBranches, createBranch, updateBranch, deleteBranch,
  getMentors, createMentor, updateMentor, deleteMentor, getMentorStudents
} = require('../controllers/deptAdminController');

router.use(auth);
router.use(deptAdminOnly);

router.get('/dashboard', getDashboard);
router.get('/branches', getBranches);
router.put('/branches/:id', updateBranch);
router.post('/branches', createBranch);
router.delete('/branches/:id', deleteBranch);
router.get('/mentors', getMentors);
router.get('/mentors/:id/students', getMentorStudents);
router.post('/mentors', createMentor);
router.delete('/mentors/:id', deleteMentor);
router.put('/mentors/:id', updateMentor);

module.exports = router;