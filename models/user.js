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
    pendingEmail: { 
        type: String 
    },
    pendingPhone: { 
        type: String 
    },
    emailChangeCode: { 
        type: String 
    },
    phoneChangeCode: { 
        type: String 
    },
    emailChangeCodeExpiresAt: { 
        type: Date 
    },
    phoneChangeCodeExpiresAt: { 
        type: Date 
    },
    emailChangeLastRequest: { 
        type: Date 
    },
    phoneChangeLastRequest: { 
        type: Date 
    },
    lastEmailChangeAt: { 
        type: Date 
    },
    lastPhoneChangeAt: { 
        type: Date 
    },

}, { timestamps: true });

const User = mongoose.model('User', schema);

module.exports = User;
