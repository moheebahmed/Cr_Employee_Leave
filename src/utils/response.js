// Simple response helpers used across controllers
function successResponse(res, message = 'Success', data = {}, status = 200) {
  return res.status(status).json({
    success: true,
    message,
    data
  });
}

function errorResponse(res, message = 'Error', status = 400, error = null) {
  const payload = { success: false, message };
  if (error) payload.error = error;
  return res.status(status).json(payload);
}

module.exports = {
  successResponse,
  errorResponse
};
 
