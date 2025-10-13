const userModel = require('./../models/user');
const banUserModel = require('./../models/banUser');
const { default: mongoose } = require('mongoose');
const crypto = require("crypto");
const bcrypt = require('bcrypt');

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

    console.log(req.user);
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
        user.emailVerificationSentAt = undefined;
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
        user.phoneVerificationSentAt = undefined;
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
}

exports.changePassword = async (req, res) => {
    const mainUser = await userModel.findById(req.user._id);
    if (!mainUser) {
        return res.status(404).json({ message: "کاربر یافت نشد" });
    }

    const { oldPassword, password, confirmPassword } = req.body;

    if (!oldPassword || !password || !confirmPassword) {
        return res.status(400).json({ message: "تمام فیلدها الزامی هستند" });
    }

    if (password !== confirmPassword) {
        return res.status(400).json({ message: "رمز جدید و تکرار آن یکسان نیستند" });
    }

    const strongPasswordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-={}[\]|:;"'<>,.?/]).{8,}$/;
    if (!strongPasswordRegex.test(password)) {
        return res.status(400).json({
            message: "رمز عبور باید حداقل شامل یک حرف بزرگ، یک عدد و یک کاراکتر خاص باشد (حداقل ۸ کاراکتر)"
        });
    }

    const isOldPasswordValid = await bcrypt.compare(oldPassword, mainUser.password);
    if (!isOldPasswordValid) {
        return res.status(401).json({ message: "رمز فعلی اشتباه است" });
    }

    const isChangePassword = oldPassword == password;

    if (isChangePassword) {
        return res.status(409).json({ message: "رمز عبور قبلی با رمز عبور جدید یکسان است" })
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    mainUser.password = hashedPassword;
    await mainUser.save();

    return res.status(200).json({ message: "رمز عبور با موفقیت تغییر یافت" });
}

exports.requestEmailChange = async (req, res) => {
    try {
        const user = await userModel.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: "کاربر یافت نشد" });
        }

        const { newEmail } = req.body;
        if (!newEmail) {
            return res.status(400).json({ message: "ایمیل جدید الزامی است" });
        }

        const email = newEmail.trim().toLowerCase();

        // ✅ چک کردن پترن ایمیل
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ message: "فرمت ایمیل وارد شده معتبر نیست" });
        }

        if (user.email === email) {
            return res.status(409).json({ message: "ایمیل جدید نباید با ایمیل فعلی یکسان باشد" });
        }

        const existing = await userModel.findOne({ email });
        if (existing) {
            return res.status(409).json({ message: "این ایمیل قبلاً ثبت شده است" });
        }

        // محدودیت ۵ دقیقه بین درخواست‌ها
        if (user.emailChangeLastRequest && Date.now() - user.emailChangeLastRequest.getTime() < 5 * 60 * 1000) {
            const remaining = Math.ceil((5 * 60 * 1000 - (Date.now() - user.emailChangeLastRequest.getTime())) / 1000);
            return res.status(429).json({ message: `لطفاً ${remaining} ثانیه دیگر دوباره تلاش کنید.` });
        }

        // ساخت کد تأیید ۶ رقمی
        const code = crypto.randomInt(100000, 999999).toString();

        user.pendingEmail = email;
        user.emailChangeCode = code;
        user.emailChangeCodeExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // اعتبار ۱۰ دقیقه
        user.emailChangeLastRequest = new Date();
        await user.save();

        // 📧 ارسال ایمیل (فعلاً شبیه‌سازی شده)
        // await sendEmail(user.email, `کد تایید تغییر ایمیل شما: ${code}`);

        return res.status(200).json({
            message: "کد تأیید به ایمیل فعلی شما ارسال شد. لطفاً برای ادامه تغییر، کد را وارد کنید."
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "خطا در ارسال کد تأیید ایمیل" });
    }
}

exports.verifyCurrentEmail = async (req, res) => {
    try {
      const { code } = req.body;
      const user = await userModel.findById(req.user._id);
  
      if (!user) return res.status(404).json({ message: "کاربر یافت نشد" });
      if (!code) return res.status(400).json({ message: "کد تایید الزامی است" });
  
      // وجود pendingEmail و کد مرحله اول لازم است
      if (!user.pendingEmail || !user.emailChangeCode || !user.emailChangeCodeExpiresAt) {
        return res.status(400).json({ message: "درخواستی برای تغییر ایمیل فعال نیست." });
      }
  
      if (user.emailChangeCodeExpiresAt < Date.now()) {
        // پاکسازی ساده‌ی فیلدهای مربوطه
        user.emailChangeCode = undefined;
        user.emailChangeCodeExpiresAt = undefined;
        await user.save();
        return res.status(410).json({ message: "کد ارسال شده به ایمیل فعلی منقضی شده است. دوباره درخواست دهید." });
      }
  
      if (String(user.emailChangeCode) !== String(code)) {
        return res.status(400).json({ message: "کد وارد شده معتبر نیست." });
      }
  
      // مرحلهٔ اول با موفقیت انجام شد: حالا برای ایمیل جدید کد بساز و ارسال کن
      const newCode = crypto.randomInt(100000, 999999).toString();
  
      user.emailChangeCode = newCode;
      user.emailChangeCodeExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // اعتبار ۱۰ دقیقه

      // زمان آخرین ارسال را به روز کن (اگر لازم است برای rate-limit مرحله بعد)
      user.emailChangeLastRequest = new Date();
      await user.save();
  
      // ارسال کد به ایمیل جدید (pendingEmail)
    //   await sendEmail(
    //     user.pendingEmail,
    //     "کد تایید ایمیل جدید شما",
    //     `<p>کد تایید شما برای فعال‌سازی ایمیل جدید: <b>${newCode}</b></p><p>اعتبار کد: 10 دقیقه</p>`
    //   );
  
      return res.status(200).json({
        message: "کد ایمیل فعلی تایید شد. کد جدیدی به ایمیل جدید شما ارسال شد. آن را وارد کنید تا ایمیل تغییر کند."
      });
  
    } catch (err) {
      console.error('verifyCurrentEmail error:', err);
      return res.status(500).json({ message: "خطا در بررسی کد ایمیل فعلی" });
    }
}
  
exports.verifyNewEmail = async (req, res) => {
    try {
      const { code } = req.body;
      const user = await userModel.findById(req.user._id);
  
      if (!user) return res.status(404).json({ message: "کاربر یافت نشد" });
      if (!code) return res.status(400).json({ message: "کد تایید الزامی است" });
  
      // باید pendingEmail و کد جدید وجود داشته باشد
      if (!user.pendingEmail || !user.emailChangeCode || !user.emailChangeCodeExpiresAt) {
        return res.status(400).json({ message: "درخواستی برای تغییر ایمیل فعال نیست یا مرحله قبل تکمیل نشده." });
      }
  
      if (user.emailChangeCodeExpiresAt < Date.now()) {
        // پاکسازی فیلدهای pending
        user.emailChangeCode = undefined;
        user.emailChangeCodeExpiresAt = undefined;
        user.pendingEmail = undefined;
        await user.save();
        return res.status(410).json({ message: "کد ارسال شده به ایمیل جدید منقضی شده است. دوباره درخواست دهید." });
      }
  
      if (String(user.emailChangeCode) !== String(code)) {
        return res.status(400).json({ message: "کد وارد شده معتبر نیست." });
      }
  
      // قبل از نهایی‌سازی، دوباره مطمئن شو ایمیل جدید توسط کسی دیگر ثبت نشده (race-check)
      const conflict = await userModel.findOne({
        $or: [{ email: user.pendingEmail }],
        _id: { $ne: user._id }
      });
      if (conflict) {
        // پاکسازی و ارور
        user.emailChangeCode = undefined;
        user.emailChangeCodeExpiresAt = undefined;
        user.pendingEmail = undefined;
        await user.save();
        return res.status(409).json({ message: "ایمیل جدید هم‌اکنون توسط کاربر دیگری ثبت شده است." });
      }
  
      // نهایی‌سازی تغییر
      user.email = user.pendingEmail;
      user.pendingEmail = undefined;
      user.emailChangeCode = undefined;
      user.emailChangeCodeExpiresAt = undefined;
      user.emailChangeLastRequest = undefined;
      // ایمیل جدید را تأیید شده علامت بزن (یا طبق سیاست‌تون ممکنه بخوای false بذاری)
      user.isEmailVerified = true;
      user.lastEmailChangeAt = new Date();
  
      await user.save();
  
      // (اختیاری) invalidate session/token های قدیمی یا ارسال نوتیف به ایمیل قدیم
      // await sendEmail(oldEmail, "ایمیل شما تغییر کرد", `...`);

      return res.status(200).json({ message: "ایمیل با موفقیت تغییر یافت و تأیید شد." });
  
    } catch (err) {
      console.error('verifyNewEmail error:', err);
      return res.status(500).json({ message: "خطا در تایید ایمیل جدید" });
    }
}
  