const express = require("express");
const todoController = require("./../controller/todoController");
const authController = require('./../controller/authController');
const router = express.Router();



router
  .route("/")
  .get( authController.protect, todoController.getAllTodos)
  .post(todoController.createTodos)
  .delete(todoController.deleteMany);



router
  .route("/:id")
  .get(authController.logIn, todoController.getTodos)
  .patch(todoController.updateTodos)
  .delete(todoController.deleteTodos);

module.exports = router;
