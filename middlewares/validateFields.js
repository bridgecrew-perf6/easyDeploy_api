const { validationResult } = require('express-validator');

const validateFields = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) {
    next();
  }

  res.status(404).json(errors);
};

module.exports = validateFields;
