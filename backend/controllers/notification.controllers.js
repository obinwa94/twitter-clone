const HTTPSTATUS = require('../config/http.config')
const Notification = require('../models/notification.model')

async function getNoteController(req, res) {
    const myId = req.user._id
    try {
        const notifications = await Notification.find({ to: myId })
            .populate({
                path: 'from',
                select: 'userName profileImg'
            })
        await Notification.updateMany({ to: myId }, { read: true })
        res.status(HTTPSTATUS.OK).json(notifications)
    } catch (error) {
        return res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Something went wrong😥',
            error: error.message
        })
    }
}

async function deleteNoteController(req, res) {
    const myId = req.user._id
    try {
        const notifications = await Notification.find({ to: myId })
        console.log(notifications);
        
        if(notifications.length === 0) return res.status(HTTPSTATUS.NOT_FOUND).json('No notifications available')
        await Notification.deleteMany({ to: myId })
        res.status(HTTPSTATUS.OK).json('Notifications deleted successfully')
    } catch (error) {
        return res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Something went wrong😥',
            error: error.message
        })
    }
}

module.exports = {
    getNoteController,
    deleteNoteController
}