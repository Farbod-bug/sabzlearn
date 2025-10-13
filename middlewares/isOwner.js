module.exports = async (req, res, next) => {
    const isOwner = req.user.role == "OWNER";

    if (isOwner) {
        return next();
    }

    return res.status(403).json({ message: "این مسیر برای مدیران ارشد مجاز است" });
}