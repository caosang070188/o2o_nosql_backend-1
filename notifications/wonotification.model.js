const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const WoNotificationsSchema = new Schema({
    recipient_id: {
        type: Number,
        default: 0
    },
    notifier_id: {
        type: Number,
        default: 0
    },
    page_id: {
        type: Number,
        default: 0
    },
    group_id: {
        type: Number,
        default: 0
    },
    event_id: {
        type: Number,
        default: 0
    },
    thread_id: {
        type: Number,
        default: 0
    },
    story_id: {
        type: Number,
        default: 0
    },
    blog_id: {
        type: Number,
        default: 0
    },
    group_chat_id:{
        type: Number,
        default: 0
    },
    post_id: {
        type: Number,
        default: 0
    }, 
    comment_id: {
        type: Number,
        default: 0
    },
    reply_id: {
        type: Number,
        default: 0
    },
    type: {
        type: String
    },
    type2:{
        type: String
    },
    text: {
        type: String
    },
    url: {
        type: String
    },
    time: {
        type: String
    },
    seen_pop: {
        type: Number,
        default: 0
    },
    full_link: {
        type: String
    },
    seen:{
        type: Number,
        default: 0
    },
    sent_push:{
        type: Number,
        default: 0
    }
})

module.exports = mongoose.model('wo_notifications', WoNotificationsSchema)