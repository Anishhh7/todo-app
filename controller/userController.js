const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');

const filterObj = (obj, ...allowFields) => {
    const newObj = {};
    Object.keys(obj).forEach((el) => {
    if (allowFields.includes(el)) newObj[el] = obj[el];
    })
    return newObj;
}
exports.getAllUsers = catchAsync(async (req, res, next) => {
    const users = await User.find();

    res.status(200).json({
        status: 'Success',
        results: users.length,
        data: {
            users: users
        }
    })
});

exports.getUser = catchAsync(async (req, res, next) => {
    const user = await user.findById(req.params.id);

    if (!user) {
        return next(new AppError('No  user is found', 404))
    };

    res.status(200).json({
        status: 'Success',
        data: {
            user
        }
    })
});

exports.updateMe = catchAsync(async (req, res, next) => {
    
    if (req.body.password || req.body.passwordConfirm) {
        return next(new AppError('you cannot change password from here', 400));
    }
    const filterBody = filterObj(req.body, 'name', 'email');
    const updateUser = await User.findByIdAndUpdate(
        req.user.id,
        filterBody,
        { returnDocument: 'after', runValidators: true }
    );
    res.status(200).json({
        status: 'Success',
        data: {
            user:updateUser
        }
    })


})