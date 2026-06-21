const Todo = require("./../modles/todoModel");

exports.getAllTodos = async (req, res) => {
  try {
    const { userId } = req.query;
    const todo = await Todo.find({ userId: userId });

    res.status(200).json({
      status: "success",
      //   results: todo.length,
      data: {
        todo
      }
    });
  } catch (err) {
    res.status(404).json({
      status: "Fail",
      message: err
    });
  }
};

exports.getTodos = async (req, res) => {
  try {
    const todo = await Todo.findById(req.params.id);
    res.status(200).json({
      status: "success",
      results: todo.length,
      data: {
        todo
      }
    });
  } catch (err) {
    res.status(404).json({
      status: "Fail",
      message: err
    });
  }
};

exports.createTodos = async (req, res) => {
  try {
    const { text, userId } = req.body;
    const newTodo = await Todo.create({
      text,
      userId,
      completed: false
    });

    res.status(201).json({
      status: "success",
      data: {
        todo: newTodo
      }
    });
  } catch (err) {
    console.log(err.message);
    res.status(400).json({
      status: "fail",
      message: err.message
    });
  }
};

exports.updateTodos = async (req, res) => {
  try {
    const todo = await Todo.findOneAndUpdate({_id:req.params.id, userId: req.body.userId || req.query.userId }, 
      req.body, {
      new: true,
      runValidators: true
    });

    if (!todo) {
      return res.status(404).json({
        status: "fail",
        message: "No task found with that ID"
      })
    }

    res.status(200).json({
      status: "success",
      data: {
        todo: todo
      }
    });
  } catch (err)
  {
    res.status(400).json({
      status: "fail",
      message: err.message
    });
  }
};

exports.deleteTodos = async (req, res) => {
  try {
    await Todo.findOneAndDelete({ 
      _id: req.params.id, 
      userId: req.body.userId || req.query.userId 
    });

    if (!todo) {
      return res.status(404).json({
        status: "fail",
        message: "No task found or unauthorized"
      });
    }

    res.status(204).json({
      status: "success",
      data: null
    });
  } catch (err) {
    res.status(400).jsom({
      status: "fail",
      message: "error"
    });
  }
};

exports.deleteMany = async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({
        status: "fail",
        message: "User identity required"
      });
    }
    await Todo.deleteMany({userId: userId});

    res.status(204).json({
      status: "success",
      message: "Successfully  Completed",
      data: null
    });
  } catch (err) {
    res.status(400).json({
      status: "Fail",
      message: err.message
    });
  }
};
