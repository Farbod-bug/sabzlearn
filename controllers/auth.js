const userModel = require('./../models/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const registerValidator = require('./../validators/register');

exports.register = async (req, res) => {
    const validationResult = registerValidator(req.body);

    if (validationResult != true) {
        return res.status(422).json(validationResult);
    }

    const { username, name, email, phone, password } = req.body;


    const isUserExists = await userModel.findOne({
        $or: [{ username }, { email }],
    })

    if (isUserExists) {
        return res.static(409).json({
            message: "ایمیل یا نام کاربری قبلا استفاده شده است"
        });
    }

    const countOfUser = await userModel.countDocuments();

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await userModel.create({
        email,
        username,
        phone,
        name,
        password: hashedPassword,
        role: countOfUser > 0 ? "USER" : "ADMIN"
    })

    const userObject = user.toObject();
    Reflect.deleteProperty(userObject, "password");

    const accessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: "30 day"
    });

    return res.status(201).json({ user: userObject, accessToken });
}

exports.login = async (req, res) => {}

exports.getMe = async (req, res) => {}
