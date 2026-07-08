const express = require("express");
const todoController = require("./../controller/todoController");
const authController = require('./../controller/authController');
const router = express.Router();



router
  .route("/")
  .get( authController.protect, todoController.getAllTodos)
  .post(authController.protect, todoController.createTodos)
  .delete(authController.protect, todoController.deleteMany);



router
  .route("/:id")
  .get(authController.protect, todoController.getTodo)
  .patch(authController.protect, todoController.updateTodos)
  .delete(authController.protect, todoController.deleteTodos);

module.exports = router;
