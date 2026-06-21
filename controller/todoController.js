const Todo = require("./../modles/todoModel"); // Double-check this matches your actual path to the Model

// 1. GET ALL TODOS (Isolated per user)
exports.getAllTodos = async (req, res) => {
  try {
    // Grab the unique visitor ID from the URL query parameter (?userId=...)
    const { userId } = req.query;

    // If a userId is passed, filter the MongoDB search. Otherwise, fallback to empty array.
    const queryObj = userId ? { userId } : {};
    const todos = await Todo.find(queryObj);

    res.status(200).json({
      status: "success",
      results: todos.length,
      data: {
        todo: todos
      }
    });
  } catch (err) {
    res.status(404).json({
      status: "fail",
      message: err.message
    });
  }
};

// 2. CREATE A NEW TODO
exports.createTodos = async (req, res) => {
  try {
    // req.body contains { text, userId } sent by the frontend setup
    const newTodo = await Todo.create(req.body);

    res.status(201).json({
      status: "success",
      data: {
        todo: newTodo
      }
    });
  } catch (err) {
    res.status(400).json({
      status: "fail",
      message: err.message
    });
  }
};

// 3. UPDATE A TODO (Toggle completion status or edit text)
exports.updateTodos = async (req, res) => {
  try {
    const todo = await Todo.findByIdAndUpdate(req.params.id, req.body, {
      new: true, // Returns the freshly updated document
      runValidators: true // Ensures schema constraints stay active
    });

    if (!todo) {
      return res.status(404).json({ status: "fail", message: "No task found with that ID" });
    }

    res.status(200).json({
      status: "success",
      data: {
        todo
      }
    });
  } catch (err) {
    res.status(404).json({
      status: "fail",
      message: err.message
    });
  }
};

// 4. DELETE A SINGLE TODO
exports.deleteTodos = async (req, res) => {
  try {
    const todo = await Todo.findByIdAndDelete(req.params.id);

    if (!todo) {
      return res.status(404).json({ status: "fail", message: "No task found with that ID" });
    }

    res.status(204).json({
      status: "success",
      data: null
    });
  } catch (err) {
    res.status(404).json({
      status: "fail",
      message: err.message
    });
  }
};
exports.deleteMany= async (req, res) => {
  try {
    // Look for the user identity parameter passed in the query string
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ status: "fail", message: "Missing visitor verification identifier" });
    }

    // Explicitly delete ONLY documents matching this specific user identity
    await Todo.deleteMany({ userId });

    res.status(204).json({
      status: "success",
      data: null
    });
  } catch (err) {
    res.status(400).json({ status: "fail", message: err.message });
  }
};