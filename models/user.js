const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ["ADMIN", "USER", "OWNER"],
        default: "USER"
    },
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    isPhoneVerified: {
        type: Boolean,
        default: false
    },
    emailVerificationCode: {
        type: String
    },
    phoneVerificationCode: {
        type: String
    },
    emailVerificationSentAt: { 
        type: Date, 
        default: null 
    },
    phoneVerificationSentAt: { 
        type: Date, 
        default: null 
    },
}, { timestamps: true });

const User = mongoose.model('User', schema);

module.exports = User;
