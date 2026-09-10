const mongoose = require('mongoose')
const User = require('./user.model')

const notificationSchema = new mongoose.Schema({
    from: {
        type: mongoose.Types.ObjectId,
        required: true,
        ref: User,
    },
    to: {
        type: mongoose.Types.ObjectId,
        required: true,
        ref: User,
    },
    type: {
        type: String,
        required: true,
        enum: ["follow", "like"],
    },
    read: {
        type: Boolean,
        default: false,
    },
    
}, {timestamps: true})

const Notification = mongoose.model("Notification", notificationSchema)
module.exports = Notification;