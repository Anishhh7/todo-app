const Todo = require("../models/todoModel");
const User = require("../models/userModel");
const APIFeatures= require('./../utils/apiFeatures')
const AppError = require("./../utils/appError");
const catchAsync = require("./../utils/catchAsync");

exports.getAllTodos = catchAsync(async (req, res, next) => {
  const features = new APIFeatures
    (Todo.find({ user: req.user.id }), req.query)
    .filter()
    .search();
  
  const todo = await features.query;


  res.status(200).json({
    status: "success",
    results: todo.length,
    data: {
      todo
    }
  });
});

exports.getTodo = catchAsync(async (req, res, next) => {
  const todo = await Todo.findById(req.params.id);

  res.status(200).json({
    status: "success",
    data: {
      todo
    }
  });
});

exports.createTodos = catchAsync(async (req, res, next) => {
const newTodo = await Todo.create({
    ...req.body,
    user: req.user._id
  });

  res.status(201).json({
    status: "success",
    data: {
      todo: newTodo
    },
    message: "todo added"
  });
});

exports.updateTodos = catchAsync(async (req, res, next) => {
  const todo = await Todo.findByIdAndUpdate(req.params.id, req.body ,{
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
  const todo = await Todo.findByIdAndDelete({ _id: req.params.id });
  
    if (!todo) {
    return next(new AppError("Todo not found", 404));
  }

  res.status(204).json({
    status: "success",
    message: "delete successfuly",
    data: null
  });
});

exports.deleteMany = catchAsync(async (req, res, next) => {
  await Todo.deleteMany({user: req.user.id});

  res.status(204).json({
    status: "success",
    message: "Successfully  Completed",
    data: null
  });
});

exports.dashboardStats = catchAsync(async (req, res, next) => {
  
})
