const Validator = require('fastest-validator');
const v = new Validator();

const schema = {
    name: { 
        type: "string", 
        min: 3, 
        max: 255, 
        messages: {
            stringMin: "نام باید حداقل ۳ کاراکتر باشد.",
            stringMax: "نام نباید بیشتر از ۲۵۵ کاراکتر باشد."
        }
    },
    username: { 
        type: "string", 
        min: 3, 
        max: 100, 
        messages: {
            stringMin: "نام کاربری باید حداقل ۳ کاراکتر باشد.",
            stringMin: "نام کاربری نباید بیشتر از 100 کاراکتر باشد."
        }
    },
    email: { 
        type: "email", 
        min: 10, 
        max: 100, 
        messages: {
            email: "ایمیل معتبر نیست."
        }
    },
    password: { 
        type: "string", 
        min: 8, 
        pattern: /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-={}[\]|:;"'<>,.?/]).+$/,
        messages: {
            stringMin: "رمز عبور باید حداقل ۸ کاراکتر باشد.",
            stringPattern: "رمز عبور باید شامل حداقل یک حرف بزرگ، یک عدد و یک کاراکتر خاص باشد."
        }
    },
    confirmPassword: { 
        type: "equal", 
        field: "password", 
        messages: {
            equalField: "تأیید رمز عبور با رمز اصلی مطابقت ندارد."
        }
    },
    $$strict: true
};

const check = v.compile(schema);
module.exports = check;
