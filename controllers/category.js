const categoryModel = require('./../models/category');

exports.create = async (req, res) => {
    try {
      const { title, href } = req.body;
  
      // 1️⃣ بررسی وجود فیلدها
      if (!title || !href) {
        return res.status(400).json({
          message: "هر دو فیلد 'title' و 'href' الزامی هستند.",
        });
      }
  
      // 2️⃣ تمیزسازی ورودی‌ها
      const cleanTitle = title.trim();
      const cleanHref = href.trim().toLowerCase();
  
      // 3️⃣ بررسی طول منطقی
      if (cleanTitle.length < 2 || cleanTitle.length > 100) {
        return res.status(400).json({
          message: "طول عنوان باید بین ۲ تا ۱۰۰ کاراکتر باشد.",
        });
      }
  
      if (cleanHref.length < 2 || cleanHref.length > 100) {
        return res.status(400).json({
          message: "طول href باید بین ۲ تا ۱۰۰ کاراکتر باشد.",
        });
      }
  
      // 4️⃣ بررسی ساختار href
      const hrefRegex = /^[a-z0-9-_]+$/;
      if (!hrefRegex.test(cleanHref)) {
        return res.status(400).json({
          message:
            "فرمت href معتبر نیست. فقط حروف کوچک، اعداد، خط تیره و زیرخط مجازند.",
        });
      }
  
      // 5️⃣ بررسی تکراری نبودن title یا href
      const existing = await categoryModel.findOne({
        $or: [{ title: cleanTitle }, { href: cleanHref }],
      });
  
      if (existing) {
        return res.status(409).json({
          message: "دسته‌ای با این عنوان یا href قبلاً ثبت شده است.",
        });
      }
  
      // 6️⃣ ایجاد در دیتابیس
      const category = await categoryModel.create({
        title: cleanTitle,
        href: cleanHref,
      });
  
      return res.status(201).json({
        message: "دسته‌بندی جدید با موفقیت ایجاد شد.",
        category,
      });
    } catch (err) {
      console.error("❌ خطا در ایجاد دسته:", err);
      return res.status(500).json({
        message: "خطای داخلی سرور.",
      });
    }
};
  
exports.getAll = async (req, res) => {
    const categories = await categoryModel.find({});

    return res.json(categories);
}

exports.remove = async (req, res) => {
    //...
}

exports.update = async (req, res) => {
    //...
}