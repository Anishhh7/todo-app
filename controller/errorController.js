const AppError = require("./../utils/appError");

const handleCastError = (err) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

const handleDublicateFieldDB = (err) => {
  let actualValue = 'Unknown';
  if (err.keyValue) {
    actualValue = Object.values(err.keyValue)[0];
  } else if (
    err.errResponse && err.errResponse.keyValue
  ) {
    actualValue = Object.values(err.errResponse.keyValue)[0];
  }

  console.log('Dublicate value detected in terminal')
  actualValue


  const message = `Dublicate Field Value: '${actualValue}'. Please use another value !!!`;
  return new AppError(message, 400);
}

const handleValidatorErrorDB = (err) => {
    const errors = Object.values(err.errors).map((el) => el.message)
    
    const message = `Invalid input data. ${error.join('. ')}`;
    return new AppError(message, 400)
}

const handleJWTError = () => {
    return new AppError('Invalid token..Please try again', 401);
}
const handleJWTExpiredError = () => {
     return new AppError('your password token has been expired. please try again after login again', 401)
}
 
const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({

    status: err.status,
    error: err,
    message: err.message,
    stack:err.stack
  })
}

const sendErrorProd = (err, res) => {
  if (err.isOperational) {
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message
    })
  } else {
    console.error('ERRor', err);
    res.status(500).json({
      status: 'error',
      message:'Something went very wrong'
    })
  }
}

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  console.error('Error caught by GLOBAL HANDLER:', err);

  if (process.env.NODE_ENV === 'development') { 
    sendErrorDev(err, res)
  } else if (process.env.NODE_ENV === 'production') {
    let error = Object.assign(err);
    error.message = err.message;

    const errorName = err.name || err.constructor.name;

    if (errorName === 'CastError')
      error = handleCastError(error)
    
    if (error.code === 11000)
      error = handleDublicateFieldDB(error);

    if (error.name === 'ValidationError')
      error = handleValidatorErrorDB(error);

    if (error.name === 'JsonWebTokenError')
      error = handleJWTError();

    if (error.name === 'TokenExpiredError')
      error = handleJWTExpiredError();

    sendErrorProd(error, res);
  }

}

