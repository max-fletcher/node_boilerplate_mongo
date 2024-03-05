const formattedResponse = (res, code = 200, message, data = null) => {
  res.status(code).json(
    {
      code,
      message,
      data
    }
  );
};

module.exports = { formattedResponse };