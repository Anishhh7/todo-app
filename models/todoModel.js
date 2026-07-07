const { default: mongoose } = require("mongoose");

const todoSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  title: {
    type: String,
  
  },

  category: {
    type: String,
    enum: [
      " work",
      "personal",
      "shopping",
      "health",
      "finance",
      "education",
      "other"
    ],
    default: "personal",
  },

  description: {
    type: String,
    maxLength: 5000,
    default:""
  },

  priority: {
    type: String,
    enum: ["low", "medium", "high"],
    default: "low"
  },

  completed: {
    type: Boolean,
    default: false
  },

  createdAt: {
    type: Date,
    default: Date.now
  },

  dueDate: {
    type: Date,
    default: null
  },

  updatedAt: {
    type: Date,
    default: Date.now
  }
});

const Todo = mongoose.model("Todo", todoSchema);
module.exports = Todo;
