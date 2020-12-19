const Joi = require("joi");
/**
 *
 * @param {"body" | "query" | "params"} reqField
 * @param {Joi.ObjectSchema<any>} validateSchema
 */
const validate = (reqField, validateSchema) => (req, res, next) => {
  const { error, value, errors } = validateSchema.validate(req[reqField], {
    abortEarly: false,
    allowUnknown: false,
  });

  if (error) {
    const { errors, message } = getJoiError(error);
    return res.status(302).json({errors, message})
  }
  req.validation = value;
  return next();
};

/**
 *
 * @param {import('joi').ValidationError} error
 */
const getJoiError = (error) => {
  console.log("error detail", error.details);
  const errors = {};
  const message = {};
  const errorDetails = error.details;
  errorDetails.forEach((err) => {
    errors[err.context.label] = err.type;
    if (err.context.limit) {
      errors[err.context.label] = err.type + "." + err.context.limit;
    }
    message[err.context.label] = err.message;
  });
  return { errors, message };
};

module.exports = {
  validate,
};
