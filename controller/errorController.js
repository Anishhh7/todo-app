const AppError = require("./../utils/appError");

const handleCastError = (err) => {
  const message = `Invalid ${err.path}: ${err.value}.`;
  return new AppError(message, 400);
};

const handleDublicateFieldDB = (err) => {
  let actualValue = 'unknown';
  if (err.keyValue) {
    actualValue = Object.values(err.keyValue)[0];
  } else if (
    err.errResponse && err.errResponse.keyValue
  ) {
    actualValue = Object.values(err.errResponse.keyValue)[0];
  }

  console.log('Dublicate value detected in terminal')
  actualValue
};

const message = `Dublicate Field Value: "${actualValue}". Please use another value !!!`;
return new AppError(message, 400);


const handleValidatorErrorDB = (err) => {
    const errors = Object.values(err.errors).map((el) => el.message)
    
    const message = `Invalid input data. ${error.join('. ')}`;
    return new AppErrord(message, 400)
}

const handleJWTError = () => {
    return new AppError('Invalid token..Please try again', 401);
}
const handleJWTExpireEror = () => {
     return new AppError('your password token has been eexpired. please try again after login again', 401)
 }
// if (process.env.NODE_ENV === 'development') {
//     sendErrorDev(err, res);
// }else if 
// const errorName = 