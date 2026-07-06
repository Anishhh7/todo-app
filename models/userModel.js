const crypto = require("crypto");
const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  name: {
    type: String
    // required: [true, 'A name is Mandatory']
  },

  email: {
    type: String,
    required: [true, "Please enter a email id"],
    unique: true,
    lowerCase: true,
    validate: [validator.isEmail, "please enter a valid email id"]
  },

  role: {
    type: String,
    enum: {
      values: ["user", "admin", "validator"]
    },

    default: "user"
  },

  password: {
    type: String,
    minLength: [8, "password must have 8 Character."],
    required: [true, "please enter your password"],
    select: false
  },

  passwordConfirm: {
    type: String,
    require: [true, "please confirm your password"],
    validate: {
      validator: function (el) {
        return el === this.password;
      },
      message: "Password didnt match"
    }
  },

  passwordChangedAt: Date,

  passwordResetToken: String,
  passwordResetExpires: Date
});

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  this.password = await bcrypt.hash(this.password, 12);

  this.passwordConfirm = undefined;

  this.passwordChangedAt = Date.now() - 1000;
});

userSchema.methods.checkCorrectPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

const User = mongoose.model("User", userSchema);

module.exports = User;
