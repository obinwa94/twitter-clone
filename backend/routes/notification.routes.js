const verifyToken = require('../middleware/verifyToken')
const{
    getNoteController,
    deleteNoteController
}= require('../controllers/notification.controllers')

const notificationRouter = require('express').Router()


notificationRouter.get('/', verifyToken, getNoteController)
notificationRouter.delete('/delete', verifyToken, deleteNoteController)

module.exports = notificationRouter