const Todo = require("./../modles/todoModel");

exports.getAllTodos = async (req, res) => {
  try {
    const todo = await Todo.find();

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
    const newTodo = await Todo.create(req.body)

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
    const todo = await Todo.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
      new: true,
      runValidators: true
    });

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
    await Todo.findByIdAndDelete(req.params.id);

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
    await Todo.deleteMany({});

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
