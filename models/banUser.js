const mongoose = require('mongoose');

const schema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    phone: {
        type: String,
        required: true
    },
}, { timestamps: true });

const User = mongoose.model('BanUser', schema);

module.exports = User;
