const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const todoRouter = require("./Routes/todoRoute");
const userRouter = require('./Routes/userRoutes');

const app = express();
app.set("query parser", "extended");

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.use(express.json());

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

app.use((req, res, next) => {
  next();
});


app.use("/api/v1/todo", todoRouter);
app.use("/api/v1/user", userRouter);

app.use(cors({
  origin: 'https://todo-app-ashy-sigma-60.vercel.app' 
}));

// app.all('/{*path}', (req, res, next) => {
//   next(new AppError(`can't find ${req.orginalUrl} on this server`, 404))
// })

// app.use(globalErrorHandler);
module.exports = app;
