const {Schema, model} = require("mongoose");
const {registerSchema, loginSchema} = require("../schemas/users")

const {handleMongooseError} = require("../helpers");

const emailRegexp = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
const subscriptionList = ["starter", "pro", "business"];

const userSchema = new Schema ({
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      match: emailRegexp,
      unique: true,
      required: [true, 'Email is required'],
    },
    password: {
      type: String,
      minlength: 6,
      required: [true, 'Set password for user'],
    },
    subscription: {
      type: String,
      enum: subscriptionList,
      default: "starter",
    },
    token: {
      type: String,
      default: ""
    },
    avatar: {
      type: String,
      required: true,
    },
    verify: {
      type: Boolean,
      default: false,
    },
    verificationToken: {
      type: String,
      // required: [true, 'Verify token is required'],
    },
}, {versionKey: false, timestamps: true});

userSchema.post("save", handleMongooseError);

const schemas = {
  registerSchema,
    loginSchema,
}

const User = model("user", userSchema)

module.exports = {
    User,
    schemas,
  };