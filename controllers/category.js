const categoryModel = require('./../models/category');
const mongoose = require('mongoose');

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
  const isValidCategoryId = mongoose.Types.ObjectId.isValid(req.params.id);

  if (!isValidCategoryId) {
      return res.status(409).json({ message: "آی دی عنوان معتبر نیست" });
  }

  const category = await categoryModel.findById(req.params.id);

  if (!category) {
    return res.status(404).json({ message: "عنوان وجود ندارد" });
  }

  await category.deleteOne();

  return res.json({ message: "عنوان با موفقیت حذف شد" });
}

exports.update = async (req, res) => {
  try {
    const isValidCategoryId = mongoose.Types.ObjectId.isValid(req.params.id);
    if (!isValidCategoryId) {
      return res.status(409).json({ message: "آی‌دی عنوان معتبر نیست." });
    }

    const category = await categoryModel.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: "عنوان وجود ندارد." });
    }

    const { title, href } = req.body;

    if (typeof title === "undefined" && typeof href === "undefined") {
      return res.status(400).json({
        message: "حداقل یکی از فیلدهای 'title' یا 'href' باید ارسال شود.",
      });
    }

    // فیلدهای تمیز شده
    let newTitle = category.title;
    let newHref = category.href;

    if (typeof title !== "undefined") {
      const cleanTitle = String(title).trim();
      if (cleanTitle.length < 2 || cleanTitle.length > 100) {
        return res.status(400).json({
          message: "طول عنوان باید بین ۲ تا ۱۰۰ کاراکتر باشد.",
        });
      }
      newTitle = cleanTitle;
    }

    if (typeof href !== "undefined") {
      const cleanHref = String(href).trim().toLowerCase();
      if (cleanHref.length < 2 || cleanHref.length > 100) {
        return res.status(400).json({
          message: "طول href باید بین ۲ تا ۱۰۰ کاراکتر باشد.",
        });
      }
      const hrefRegex = /^[a-z0-9-_]+$/;
      if (!hrefRegex.test(cleanHref)) {
        return res.status(400).json({
          message:
            "فرمت href معتبر نیست. فقط حروف کوچک، اعداد، خط تیره و زیرخط مجازند.",
        });
      }
      newHref = cleanHref;
    }

    // 🚫 بررسی اینکه هیچ تغییری نکرده باشه
    if (newTitle === category.title && newHref === category.href) {
      return res.status(400).json({
        message: "هیچ تغییری در مقادیر عنوان و href ایجاد نشده است.",
      });
    }

    // بررسی تکراری نبودن با نادیده‌گرفتن خود رکورد فعلی
    const existing = await categoryModel.findOne({
      $or: [{ title: newTitle }, { href: newHref }],
      _id: { $ne: category._id },
    });

    if (existing) {
      if (existing.title === newTitle && existing.href === newHref) {
        return res.status(409).json({
          message: "عنوان و href مورد نظر قبلاً توسط دسته‌ای دیگر ثبت شده‌اند.",
        });
      } else if (existing.title === newTitle) {
        return res.status(409).json({ message: "عنوان مورد نظر قبلاً ثبت شده است." });
      } else {
        return res.status(409).json({ message: "href مورد نظر قبلاً ثبت شده است." });
      }
    }

    // ✅ حالا فقط اگر تغییر واقعی وجود داشته باشه، ذخیره کن
    category.title = newTitle;
    category.href = newHref;
    await category.save();

    return res.status(200).json({
      message: "عنوان با موفقیت ویرایش شد.",
      category,
    });
  } catch (err) {
    console.error("Error updating category:", err);
    if (err.code && err.code === 11000) {
      return res.status(409).json({ message: "عنوان یا href تکراری است." });
    }
    return res.status(500).json({ message: "خطای داخلی سرور." });
  }
};

