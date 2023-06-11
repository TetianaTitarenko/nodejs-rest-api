const Joi = require("joi")
const subscriptionList = ["starter", "pro", "business"];

const registerSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).pattern(/^[a-zA-Z0-9]{6,30}$/).required(),
  subscription: Joi.string().valid(...subscriptionList).required(),
})

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).pattern(/^[a-zA-Z0-9]{6,30}$/).required(),
})

module.exports = {
  registerSchema,
  loginSchema,
};