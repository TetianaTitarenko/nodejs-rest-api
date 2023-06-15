const Joi = require("joi")
const subscriptionList = ["starter", "pro", "business"];

const registerSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).pattern(/^[a-zA-Z0-9]{6,30}$/).required(),
  subscription: Joi.string().valid(...subscriptionList),
})

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).pattern(/^[a-zA-Z0-9]{6,30}$/).required(),
})

const emailSchema = Joi.object({
  email: Joi.string().email().required(),
})

module.exports = {
  registerSchema,
  loginSchema,
  emailSchema,
};