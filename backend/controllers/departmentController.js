const Department = require('../models/Department');
const { successResponse, errorResponse } = require('../utils/responseHelper');

// GET /api/departments — public list (used by dept admin dropdown etc.)
const getAllDepartments = async (req, res) => {
  try {
    const departments = await Department.find({ isActive: true }).sort({ name: 1 });
    successResponse(res, departments, 'Departments retrieved successfully');
  } catch (error) {
    errorResponse(res, 'Failed to get departments', 500);
  }
};

// POST /api/admin/departments — super admin creates department
const createDepartment = async (req, res) => {
  try {
    const { name, programs } = req.body;
    if (!name || !programs || !Array.isArray(programs) || programs.length === 0) {
      return errorResponse(res, 'Department name and at least one program are required', 400);
    }
    for (const p of programs) {
      if (!p.name || !p.totalSemesters) {
        return errorResponse(res, 'Each program must have a name and totalSemesters', 400);
      }
    }
    const existing = await Department.findOne({ name: name.trim() });
    if (existing) return errorResponse(res, 'Department with this name already exists', 400);

    const department = await Department.create({
      name: name.trim(),
      programs,
      createdBy: req.user._id
    });
    successResponse(res, department, 'Department created successfully');
  } catch (error) {
    console.error('Create department error:', error);
    errorResponse(res, 'Failed to create department', 500);
  }
};

// PUT /api/admin/departments/:id
const updateDepartment = async (req, res) => {
  try {
    const { name, programs } = req.body;
    const department = await Department.findById(req.params.id);
    if (!department) return errorResponse(res, 'Department not found', 404);

    if (name) department.name = name.trim();
    if (programs) department.programs = programs;
    await department.save();
    successResponse(res, department, 'Department updated successfully');
  } catch (error) {
    errorResponse(res, 'Failed to update department', 500);
  }
};

// DELETE /api/admin/departments/:id
const deleteDepartment = async (req, res) => {
  try {
    const department = await Department.findByIdAndDelete(req.params.id);
    if (!department) return errorResponse(res, 'Department not found', 404);
    successResponse(res, null, 'Department deleted successfully');
  } catch (error) {
    errorResponse(res, 'Failed to delete department', 500);
  }
};

module.exports = { getAllDepartments, createDepartment, updateDepartment, deleteDepartment };