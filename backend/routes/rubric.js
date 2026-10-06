const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { roleCheck, deptAdminOnly } = require('../middleware/roleCheck');
const { getMyRubric, updateMyRubric, resetMyRubric } = require('../controllers/rubricController');

router.use(auth);

router.get('/mine', roleCheck(['mentor', 'dept_admin']), getMyRubric);
router.put('/mine', deptAdminOnly, updateMyRubric);
router.post('/mine/reset', deptAdminOnly, resetMyRubric);

module.exports = router;