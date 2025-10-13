// middlewares/requireVerified.js
const userModel = require('../models/user');

/**
 * requireVerified(options)
 * options = { email: boolean, phone: boolean }
 * default => both true (هم ایمیل هم شماره باید تایید شده باشن)
 */
module.exports = function requireVerified(options = { email: true, phone: true }) {
  return async function (req, res, next) {
    try {
      // حتماً قبلش authMiddleware اجرا شده باشه و req.user.id داشته باشه
      // ولی اگر نداشتیم این middleware سعی میکنه از DB بخونه.
      let user = req.user;

      if (!user || (!user.isEmailVerified && typeof user.isEmailVerified === 'undefined')) {
        // اگر req.user کامل نیست، از دیتابیس بخون
        if (!req.user || !req.user.id) {
          return res.status(401).json({ message: "احراز هویت لازم است" });
        }
        user = await userModel.findById(req.user.id).lean();
        if (!user) return res.status(401).json({ message: "کاربر نامعتبر" });
        // توجه: چون از .lean() استفاده شد، user یک object ساده است
      }

      // بررسی‌ها
      if (options.email && !user.isEmailVerified) {
        return res.status(403).json({ message: "برای دسترسی، لطفاً ابتدا ایمیلتان را تأیید کنید." });
      }

      if (options.phone && !user.isPhoneVerified) {
        return res.status(403).json({ message: "برای دسترسی، لطفاً ابتدا شماره تلفنتان را تأیید کنید." });
      }

      // همه‌چیز اوکیه
      return next();
    } catch (err) {
      console.error('requireVerified middleware error:', err);
      return res.status(500).json({ message: "خطا در بررسی وضعیت تایید" });
    }
  };
};
