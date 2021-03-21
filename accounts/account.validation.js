const Joi = require("joi");

const submitToken = Joi.object()
  .keys({
    deviceId: Joi.string().required(),
    token: Joi.string().allow("").required(),
    deviceType: Joi.string().valid("ios", "android"),
  })
  .unknown(true);

module.exports = {
  submitToken,
};
