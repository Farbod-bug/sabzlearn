const userModel = require('./../models/user');
const banUserModel = require('./../models/banUser');
const { default: mongoose } = require('mongoose');

exports.banUser = async (req, res) => {
    const isValidUserId = mongoose.Types.ObjectId.isValid(req.params.id);

    if (!isValidUserId) {
        return res.status(409).json({ message: "آی دی کاربر معتبر نیست" });
    }

    const mainUser = await userModel.findOne({ _id: req.params.id }).lean();

    if (!mainUser) {
        return res.status(404).json({ message: "کاربر یافت نشد" });
    }

    const isUserAdmin = mainUser.role == "ADMIN";

    if (isUserAdmin) {
        return res.status(403).json({ message: "کاربر مورد نظر مدیر می باشد" });
    }

    const isUserBan = await banUserModel.findOne({ 
        $or: [{ email: mainUser.email }, { phone: mainUser.phone }],
     })

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

    if (!isValidUserId) {
        return res.status(409).json({ message: "آی دی کاربر معتبر نیست" });
    }

    const user = await userModel.findById({ _id: req.params.id });

    if (!user) {
        return res.status(404).json({ message: "کاربر یافت نشد" });
    }

    if (user.role == "ADMIN") {
        return res.status(409).json({ message: "کاربر مدیر است" });
    }

    await user.deleteOne();

    return res.json({ message: "کاربر با موفقیت حذف شد" });

}