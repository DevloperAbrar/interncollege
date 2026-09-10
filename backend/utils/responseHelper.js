// Success response helper
const successResponse = (res, data, message = 'Success', statusCode = 200) => {
    return res.status(statusCode).json({
      success: true,
      message,
      data
    });
  };
  
  // Error response helper
  const errorResponse = (res, message = 'Something went wrong', statusCode = 500, errors = null) => {
    return res.status(statusCode).json({
      success: false,
      message,
      ...(errors && { errors })
    });
  };
  
  // Validation error response helper
  const validationErrorResponse = (res, errors) => {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
  };
  
  // Pagination helper
  const getPaginationData = (page, limit, total) => {
    const currentPage = parseInt(page) || 1;
    const itemsPerPage = parseInt(limit) || 10;
    const totalPages = Math.ceil(total / itemsPerPage);
    const skip = (currentPage - 1) * itemsPerPage;
  
    return {
      currentPage,
      itemsPerPage,
      totalPages,
      totalItems: total,
      skip,
      hasNextPage: currentPage < totalPages,
      hasPrevPage: currentPage > 1
    };
  };
  
  module.exports = {
    successResponse,
    errorResponse,
    validationErrorResponse,
    getPaginationData
  };