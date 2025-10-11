const userModel = require('./../models/user');
const banUserModel = require('./../models/banUser');

exports.banUser = async (req, res) => {
    const mainUser = await userModel.findOne({ _id: req.params.id }).lean();

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