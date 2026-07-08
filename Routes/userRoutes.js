const express = require("express");
const userController = require("./../controller/userController");
const { model } = require("mongoose");
const authController= require('./../controller/authController')

const router = express.Router();

router.post('/signup', authController.signUp);
router.post('/signin', authController.logIn);




router
    .route("/")
    .get(authController.protect, userController.getAllUsers)


module.exports = router;
