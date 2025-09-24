const { validateExamData } = require('../utils/validators');

const validate = (type) => {
  return (req, res, next) => {
    if (type === 'exam') {
      const errors = validateExamData(req.body);
      if (errors.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors
        });
      }
    }
    next();
  };
};

module.exports = validate;