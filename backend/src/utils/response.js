function success(res, data = null, message = "OK", statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

function paginated(res, data, pagination, message = "OK", statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    pagination,
  });
}

module.exports = {
  success,
  paginated,
};
