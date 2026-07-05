const Todo = require("../models/todoModel");
const AppError = require("./../utils/appError");
const catchAsync = require("./../utils/catchAsync");

exports.getAllTodos = catchAsync(async (req, res, next) => {
  const todo = await Todo.find();
  res.status(200).json({
    status: "success",
    results: todo.length,
    data: {
      todo
    }
  });
});

exports.getTodos = catchAsync(async (req, res, next) => {
  const todo = await Todo.findById(req.params.id);

  res.status(200).json({
    status: "success",
    data: {
      todo
    }
  });
});

exports.createTodos = catchAsync(async (req, res, next) => {
  const newTodo = await Todo.create(req.body);

  res.status(201).json({
    status: "success",
    data: {
      todo: newTodo
    },
    message: "task added"
  });
});

exports.updateTodos = catchAsync(async (req, res, next) => {
  const todo = await Todo.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    status: "success",
    message: "Edited",
    data: {
      todo: todo
    }
  });
});

exports.deleteTodos = catchAsync(async (req, res, next) => {
  await Todo.findByIdAndDelete(req.params.id);

  res.status(204).json({
    status: "success",
    message: "delete successfuly",
    data: null
  });
});

exports.deleteMany = catchAsync(async (req, res, next) => {
  await Todo.deleteMany({});

  res.status(204).json({
    status: "success",
    message: "Successfully  Completed",
    data: null
  });
});


