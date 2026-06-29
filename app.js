const express = require("express");
const morgan = require("morgan");
const cors = require("cors");

const todoRouter = require("./Routes/todoRoute");

const app = express();
app.set("query parser", "extended");

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.use(express.json());

app.use((req, res, next) => {
  console.log("Middleware connnected !!");
  next();
});

app.use((req, res, next) => {
  next();
});

app.use("/api/v1/todo", todoRouter);
app.use(cors({
  origin: 'https://todo-app-ashy-sigma-60.vercel.app' 
}));

module.exports = app;
