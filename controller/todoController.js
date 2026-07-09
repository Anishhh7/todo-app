const Todo = require("../models/todoModel");
const User = require("../models/userModel");
const APIFeatures = require("./../utils/apiFeatures");
const AppError = require("./../utils/appError");
const catchAsync = require("./../utils/catchAsync");

exports.getAllTodos = catchAsync(async (req, res, next) => {
  const features = new APIFeatures(Todo.find({ user: req.user.id }), req.query)
    .filter()
    .search()
    .sort()
    .paginate();

  const todo = await features.query;
  const total = await Todo.countDocuments({
    user: req.user.id,
    ...features.filterConditions,
  });

  const limit = req.query.limit * 1 || 100;
  const page = req.query.page * 1 || 1;
  const totalPages = Math.ceil(total / limit);

  res.status(200).json({
    status: "success",
    results: todo.length,
    total,
    page,
    totalPages,
    data: todo
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
    user: req.user.id
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
  await Todo.deleteMany({ user: req.user.id });

  res.status(204).json({
    status: "success",
    message: "Successfully  Completed",
    data: null
  });
});

exports.getStats = catchAsync(async (req, res, next) => {
  const userId = req.user.id;

  const [total, completed, pending, overdue] = await Promise.all([
    Todo.countDocuments({ user: userId }),
    Todo.countDocuments({ user: userId, completed:true }),
    Todo.countDocuments({ user: userId, completed:false}),
    Todo.countDocuments({
      user: userId,
      completed: false,
      dueDate:{$lt: new Date()}
    })
  ])

  res.status(200).json({
    status: 'success',
    data: {
      total, completed, pending, overdue
    }
  })
});
