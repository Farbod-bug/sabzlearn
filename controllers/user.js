const userModel = require('./../models/user');
const banUserModel = require('./../models/banUser');
const { default: mongoose } = require('mongoose');
const crypto = require("crypto");

exports.banUser = async (req, res) => {
    const isValidUserId = mongoose.Types.ObjectId.isValid(req.params.id);
    const isOwner = req.user.role == "OWNER";

    if (!isValidUserId) {
        return res.status(409).json({ message: "آی دی کاربر معتبر نیست" });
    }

    const mainUser = await userModel.findOne({ _id: req.params.id }).lean();

    if (!mainUser) {
        return res.status(404).json({ message: "کاربر یافت نشد" });
    }

    const isUserBan = await banUserModel.findOne({ 
        $or: [{ email: mainUser.email }, { phone: mainUser.phone }],
     })

    if (isOwner) {
        if (isUserBan) {
            return res.status(409).json({ message: "این حساب کاربری مسدود میباشد" })
        }
        else {
            const banUserResult = banUserModel.create({ email: mainUser.email, phone: mainUser.phone });

        if (banUserResult) {
            return res.status(200).json({ message: "حساب کاربر مسدود شد" });
        }

        return res.status(500).json({ message: "ارور سمت سرور" });
            }
    }

    const isUserAdmin = mainUser.role == "ADMIN" || "ONWER";

    if (isUserAdmin) {
        return res.status(403).json({ message: "کاربر مورد نظر مدیر می باشد" });
    }

    if (isUserBan) {
        return res.status(409).json({ message: "این حساب کاربری مسدود میباشد" })
    }

    const banUserResult = banUserModel.create({ email: mainUser.email, phone: mainUser.phone });

    if (banUserResult) {
        return res.status(200).json({ message: "حساب کاربر مسدود شد" });
    }

    return res.status(500).json({ message: "ارور سمت سرور" });

}

exports.getAll = async (req, res) => {
    const users = await userModel.find({}).select('-password'); 

    return res.json(users);
}

exports.removeUser = async (req, res) => {
    const isValidUserId = mongoose.Types.ObjectId.isValid(req.params.id);
    const isOwner = req.user.role == "OWNER";

    if (!isValidUserId) {
        return res.status(409).json({ message: "آی دی کاربر معتبر نیست" });
    }

    const user = await userModel.findById({ _id: req.params.id });

    if (!user) {
        return res.status(404).json({ message: "کاربر یافت نشد" });
    }

    if (isOwner) {
        await user.deleteOne();

        return res.json({ message: "کاربر با موفقیت حذف شد" });
    }

    if (user.role == "ADMIN") {
        return res.status(409).json({ message: "کاربر مدیر است" });
    }

    await user.deleteOne();

    return res.json({ message: "کاربر با موفقیت حذف شد" });

}

exports.changeRole = async (req, res) => {
    const isValidUserId = mongoose.Types.ObjectId.isValid(req.params.id);

    if (!isValidUserId) {
        return res.status(409).json({ message: "آی دی کاربر معتبر نیست" });
    }

    const role = req.body?.role;

    if (!role) {
        return res.status(400).json({ message: "نقش باید ارسال شود" });
    }

    if (!["ADMIN", "USER"].includes(role)) {

        return res.status(400).json({ message: "نقش وارد شده معتبر نیست" });
    }

    const mainUser = await userModel.findById(req.params.id);

    if (!mainUser) {
        return res.status(404).json({ message: "کاربر یافت نشد" });
    }

    if (req.user.id === req.params.id) {
        return res.status(403).json({ message: "امکان تغییر نقش خود وجود ندارد" });
    }

    if (mainUser.role == "OWNER") {
        return res.status(403).json({ message: "کاربر مدیر ارشد است و قابل تغییر نیست" });
    }

    if (mainUser.role == "ADMIN" && role == "ADMIN") {
        return res.status(409).json({ message: "این کاربر از قبل مدیر است" });
    } 
    else if (mainUser.role == "USER" && role == "USER") {
        return res.status(409).json({ message: "این کاربر از قبل یوزر است" });
    }

    mainUser.role = role;
    await mainUser.save();

    return res.status(200).json({ message: "نقش کاربر با موفقیت تغییر یافت" });
}

exports.updateUser = async (req, res) => {
    
}

exports.verifyEmail = async (req, res) => {
    try {
        const userId = req.user._id;
        const { code } = req.body;

        if (!code) {
            return res.status(400).json({ message: "کد تایید الزامی است" });
        }

        const user = await userModel.findById(userId);

        if (!user) {
            console.log(userId);
            return res.status(404).json({ message: "کاربر یافت نشد" });
        }

        if (user.isEmailVerified) {
            return res.status(409).json({ message: "ایمیل از قبل تایید شده است" });
        }

        if (user.emailVerificationCode !== code) {
            return res.status(400).json({ message: "کد تایید اشتباه است" });
        }

        // در اینجا کد تایید درست است، تایید انجام شود
        user.isEmailVerified = true;
        user.emailVerificationCode = undefined; // حذف کد از دیتابیس
        await user.save();

        return res.status(200).json({ message: "ایمیل با موفقیت تایید شد" });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "خطا در فرآیند تایید ایمیل" });
    }
}

exports.resendEmailVerification = async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await userModel.findById(userId);

        if (!user) return res.status(404).json({ message: "کاربر یافت نشد" });
        if (user.isEmailVerified) return res.status(409).json({ message: "ایمیل از قبل تایید شده است" });

        const FIVE_MIN = 5 * 60 * 1000; // میلی‌ثانیه

        if (user.emailVerificationSentAt) {
            const elapsed = Date.now() - new Date(user.emailVerificationSentAt).getTime();
            if (elapsed < FIVE_MIN) {
                const waitSec = Math.ceil((FIVE_MIN - elapsed) / 1000);
                return res.status(429).json({
                    message: `لطفاً ${waitSec} ثانیه صبر کنید تا دوباره کد ارسال شود.`
                });
            }
        }

        const newCode = crypto.randomInt(100000, 999999).toString();
        user.emailVerificationCode = newCode;
        user.emailVerificationSentAt = new Date();
        await user.save();

        // ارسال ایمیل واقعی یا شبیه‌سازی
        // await sendEmail(user.email, `کد تأیید جدید شما: ${newCode}`);

        return res.status(200).json({ message: "کد تایید جدید ارسال شد" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "خطا در ارسال مجدد کد تایید" });
    }
}

exports.verifyPhone = async (req, res) => {
    try {
        const userId = req.user._id;
        const { code } = req.body;

        if (!code) {
            return res.status(400).json({ message: "کد تایید الزامی است" });
        }

        const user = await userModel.findById(userId);

        if (!user) {
            console.log(userId);
            return res.status(404).json({ message: "کاربر یافت نشد" });
        }

        if (user.isPhoneVerified) {
            return res.status(409).json({ message: "ایمیل از قبل تایید شده است" });
        }

        if (user.phoneVerificationCode !== code) {
            return res.status(400).json({ message: "کد تایید اشتباه است" });
        }

        // در اینجا کد تایید درست است، تایید انجام شود
        user.isPhoneVerified = true;
        user.phoneVerificationCode = undefined; // حذف کد از دیتابیس
        await user.save();

        return res.status(200).json({ message: "شماره تلفن با موفقیت تایید شد" });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "خطا در فرآیند تایید شماره تلفن" });
    }
}

exports.resendPhoneVerification = async (req, res) => {
    try {
        const userId = req.user._id;
        const user = await userModel.findById(userId);

        if (!user) return res.status(404).json({ message: "کاربر یافت نشد" });
        if (user.isPhoneVerified) return res.status(409).json({ message: "شماره تلفن از قبل تایید شده است" });

        const FIVE_MIN = 5 * 60 * 1000; // میلی‌ثانیه

        if (user.phoneVerificationSentAt) {
            const elapsed = Date.now() - new Date(user.phoneVerificationSentAt).getTime();
            if (elapsed < FIVE_MIN) {
                const waitSec = Math.ceil((FIVE_MIN - elapsed) / 1000);
                return res.status(429).json({
                    message: `لطفاً ${waitSec} ثانیه صبر کنید تا دوباره کد ارسال شود.`
                });
            }
        }

        const newCode = crypto.randomInt(100000, 999999).toString();
        user.phoneVerificationCode = newCode;
        user.phoneVerificationSentAt = new Date();
        await user.save();

        // ارسال ایمیل واقعی یا شبیه‌سازی
        // await sendEmail(user.email, `کد تأیید جدید شما: ${newCode}`);

        return res.status(200).json({ message: "کد تایید جدید ارسال شد" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "خطا در ارسال مجدد کد تایید" });
    }
};