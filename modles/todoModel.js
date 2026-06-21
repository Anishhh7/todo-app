const { default: mongoose } = require("mongoose");

const todoSchema = new mongoose.Schema({
  text: {
    type: String,
    require: true
  },
  completed: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now()
  }
});

const todo = mongoose.model("todo", todoSchema);

module.exports = todo;
