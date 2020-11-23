const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    username: { type: String, unique: true, required: true },
    email: { type: String, unique: true, required: true },
    passwordHash: { type: String, required: true },
    title: { type: String },
    firstName: { type: String },
    lastName: { type: String },
    phoneNumber: { type: String },
    gender: { type: String, enum: ["male", "female"] },
    avatar: { type: String },
    cover: { type: String },
    userId: { type: String },
    userPassword: { type: String },
    background_image: { type: String },
    address: { type: String },
    working: { type: String },
    working_link: { type: String },
    about: { type: String },
    school: { type: String },
    birthday: { type: String },
    language: { type: String },
    acceptTerms: Boolean,
    role: { type: String, required: true },
    verificationToken: String,
    verified: Date,
    resetToken: {
        token: String,
        expires: Date
    },
    passwordReset: Date,
    token: String,
    deviceToken: String,
    createdAt: { type: Date, default: Date.now },
    updated: Date
});

schema.virtual('isVerified').get(function () {
    return !!(this.verified || this.passwordReset);
});

schema.set('toJSON', {
    virtuals: true,
    versionKey: false,
    transform: function (doc, ret) {
        // remove these props when object is serialized
        delete ret._id;
        delete ret.passwordHash;
        delete ret.userId;
        delete ret.userPassword;
    }
});

module.exports = mongoose.model('Account', schema);