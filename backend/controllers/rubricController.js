const RubricTemplate = require('../models/RubricTemplate');
const rubricService = require('../services/rubricService');
const { successResponse, errorResponse } = require('../utils/responseHelper');

const ownDepartment = (req) => req.user?.department?._id || req.user?.department || null;

const conflict = () =>
  Object.assign(new Error('The rubric was changed by someone else. Reload the page and try again.'), { status: 409 });

// Saves stages with optimistic locking on `version`
const persist = async (departmentId, stages, userId, expectedVersion) => {
  const current = await RubricTemplate.findOne({ department: departmentId }).select('version').lean();
  const currentVersion = current ? current.version : 0;

  if (expectedVersion !== undefined && expectedVersion !== null && Number(expectedVersion) !== currentVersion) {
    throw conflict();
  }

  if (!current) {
    try {
      await RubricTemplate.create({ department: departmentId, version: 1, stages, updatedBy: userId });
    } catch (e) {
      if (e.code === 11000) throw conflict();
      throw e;
    }
  } else {
    const updated = await RubricTemplate.findOneAndUpdate(
      { department: departmentId, version: currentVersion },
      { $set: { stages, updatedBy: userId }, $inc: { version: 1 } },
      { new: true, runValidators: true }
    );
    if (!updated) throw conflict();
  }

  return rubricService.getDepartmentRubric(departmentId);
};

// GET /api/rubric/mine   (mentor + dept_admin) — rubric of the user's own department
const getMyRubric = async (req, res) => {
  try {
    const rubric = await rubricService.getDepartmentRubric(ownDepartment(req));
    successResponse(res, rubric, 'Rubric retrieved');
  } catch (error) {
    console.error('Get rubric error:', error);
    errorResponse(res, 'Failed to get rubric', 500);
  }
};

// PUT /api/rubric/mine   (dept_admin)
const updateMyRubric = async (req, res) => {
  try {
    const departmentId = ownDepartment(req);
    if (!departmentId) return errorResponse(res, 'Your account is not linked to a department', 400);

    const stages = rubricService.validateStages(req.body?.stages);
    const saved = await persist(departmentId, stages, req.user._id, req.body?.expectedVersion);
    successResponse(res, saved, 'Rubric saved successfully');
  } catch (error) {
    if (error.status) return errorResponse(res, error.message, error.status);
    console.error('Update rubric error:', error);
    errorResponse(res, 'Failed to save rubric', 500);
  }
};

// POST /api/rubric/mine/reset   (dept_admin) — back to the default rubric
const resetMyRubric = async (req, res) => {
  try {
    const departmentId = ownDepartment(req);
    if (!departmentId) return errorResponse(res, 'Your account is not linked to a department', 400);

    const saved = await persist(departmentId, rubricService.getDefaultStages(), req.user._id);
    successResponse(res, saved, 'Rubric reset to default');
  } catch (error) {
    if (error.status) return errorResponse(res, error.message, error.status);
    console.error('Reset rubric error:', error);
    errorResponse(res, 'Failed to reset rubric', 500);
  }
};

module.exports = { getMyRubric, updateMyRubric, resetMyRubric };