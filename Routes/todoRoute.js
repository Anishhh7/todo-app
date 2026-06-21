const express = require("express");
const todoController = require("./../controller/todoController");

const router = express.Router();

router
  .route("/")
  .get(todoController.getAllTodos)
  .post(todoController.createTodos)
  .delete(todoController.deleteMany);

router
  .route("/:id")
  .get(todoController.getTodos)
  .patch(todoController.updateTodos)
  .delete(todoController.deleteTodos);

module.exports = router;
