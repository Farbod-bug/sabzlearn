module.exports = async (req, res, next) => {
    const isAdmin = req.user.role == "ADMIN" || "OWNER";

    if (isAdmin) {
        return next();
    }

    return res.status(403).json({ message: "این مسیر برای مدیران مجاز است" });
}