const express = require("express");
const userController = require("./../controller/userController");
const { model } = require("mongoose");
const authController = require("./../controller/authController");

const router = express.Router();

router.post("/signup", authController.signUp);
router.post("/login", authController.logIn);

router.patch("/me", authController.protect, userController.updateMe);

module.exports = router;
