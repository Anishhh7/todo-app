const User = require('./../models/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');


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

// exports.createUsers = (req, res, next) => {
// }

