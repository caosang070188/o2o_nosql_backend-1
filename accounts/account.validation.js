const Joi = require("joi");

const submitToken = Joi.object()
  .keys({
    deviceId: Joi.string().required(),
    token: Joi.string().allow("").required(),
  })
  .unknown(true);

module.exports = {
  submitToken,
};
