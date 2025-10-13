const userModel = require('./../models/user');
const banUserModel = require('./../models/banUser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
// const sendEmail = require('../utils/sendEmail'); // تابع فرضی برای ارسال ایمیل
// const sendSMS = require('../utils/sendSMS'); // تابع فرضی برای ارسال پیامک
const crypto = require('crypto');

const registerValidator = require('./../validators/register');

exports.register = async (req, res) => {
    try {
        const validationResult = registerValidator(req.body);
        if (validationResult !== true) {
            return res.status(422).json(validationResult);
        }

        const { username, name, email, phone, password } = req.body;

        // بررسی وجود قبلی
        const [isEmailExists, isUsernameExists, isPhoneExists] = await Promise.all([
            userModel.findOne({ email }),
            userModel.findOne({ username }),
            userModel.findOne({ phone })
        ]);

        if (isEmailExists) return res.status(409).json({ message: "ایمیل قبلا استفاده شده است" });
        if (isUsernameExists) return res.status(409).json({ message: "نام کاربری قبلا استفاده شده است" });
        if (isPhoneExists) return res.status(409).json({ message: "شماره تلفن قبلا استفاده شده است" });

        // بررسی بن بودن
        const [isEmailBan, isPhoneBan] = await Promise.all([
            banUserModel.find({ email }),
            banUserModel.find({ phone })
        ]);

        if (isEmailBan.length && isPhoneBan.length) {
            return res.status(409).json({ message: "ایمیل و شماره تلفن مورد نظر مسدود است" });
        } else if (isEmailBan.length) {
            return res.status(409).json({ message: "ایمیل  مورد نظر مسدود است" });
        } else if (isPhoneBan.length) {
            return res.status(409).json({ message: "شماره تلفن  مورد نظر مسدود است" });
        }

        // رمزنگاری پسورد
        const hashedPassword = await bcrypt.hash(password, 12);
        const countOfUser = await userModel.countDocuments();

        // تولید کد تایید
        const emailCode = crypto.randomInt(100000, 999999).toString();
        const phoneCode = crypto.randomInt(100000, 999999).toString();

        const user = await userModel.create({
            email,
            username,
            phone,
            name,
            password: hashedPassword,
            role: countOfUser > 0 ? "USER" : "OWNER",
            isEmailVerified: false,
            isPhoneVerified: false,
            emailVerificationCode: emailCode,
            phoneVerificationCode: phoneCode,
            emailVerificationSentAt: new Date(),
            phoneVerificationSentAt: new Date()
        });

        // ارسال ایمیل و پیامک (فعلاً شبیه‌سازی)
        // await sendEmail(email, `کد تایید ایمیل شما: ${emailCode}`);
        // await sendSMS(phone, `کد تایید شماره شما: ${phoneCode}`);

        const userObject = user.toObject();
        Reflect.deleteProperty(userObject, "password");

        const accessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: "30 day"
        });

        return res.status(201).json({ user: userObject, accessToken, message: "ثبت نام با موفقیت انجام شد. لطفاً ایمیل و شماره تلفن خود را تایید کنید."});

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "خطا در ثبت نام کاربر" });
    }
}

exports.login = async (req, res) => {
    try {
        const { identifier, password } = req.body;

        const user = await userModel.findOne({
            $or: [{ email: identifier }, { username: identifier }]
        });

        // ۱) کاربر وجود ندارد
        if (!user) {
            return res.status(401).json({
                message: "نام کاربری یا رمز عبور اشتباه است"
            });
        }

        // ۲) بررسی رمز عبور
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({
                message: "نام کاربری یا رمز عبور اشتباه است"
            });
        }

        // ۴) ساخت توکن و پاسخ موفق
        const accessToken = jwt.sign(
            { id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: "30 day" }
        );

        return res.status(200).json({
            message: "ورود با موفقیت انجام شد",
            accessToken
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "خطا در فرآیند ورود" });
    }
}

exports.getMe = async (req, res) => {}
