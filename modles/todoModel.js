const { default: mongoose } = require("mongoose");

const todoSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      require: true
    },
    completed: {
      type: Boolean,
      default: false
    },
    userId: {
      type: String,
      required: true
    },

    createdAt: {
      type: Date,
      default: Date.now()
    }
  },
  {
    // Add these options below your schema definition:
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

const todo = mongoose.model("todo", todoSchema);
todo.collection
  .dropIndex("id_1")
  .catch((err) => console.log("Index already cleared or doesn't exist"));
module.exports = todo;
