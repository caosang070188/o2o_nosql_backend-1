const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "Account" },
    title: String,
    body: String,
    url: String,
    sql: String,
    createdAt: { type: Date, default: Date.now() }
});

module.exports = mongoose.model('Notification', schema);