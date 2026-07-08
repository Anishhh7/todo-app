const crypto = require("crypto");
const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'A name is Mandatory']
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
      message: "Password didn't match"
    }
  },

  passwordChangedAt: Date,

  passwordResetToken: String,
  passwordResetExpires: Date
});

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  this.password = await bcrypt.hash(this.password, 12);

//   this.passwordConfirm = undefined;

  this.passwordChangedAt = Date.now() - 1000;
});

userSchema.methods.checkCorrectPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.checkPasswordChanged = function (JWTTimesstap) {
  if (this.passwordChangedAt) {
    const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
    return JWTTimesstap < changedTimestamp
  }
  return false;
}

userSchema.methods.resetPasswordToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');

  this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex')

  this.passwordResetExpires = Date.now() + 20 * 60 * 1000;
  return resetToken;
}
  

const User = mongoose.model("User", userSchema);

module.exports = User;
