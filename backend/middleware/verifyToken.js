const HTTPSTATUS = require('../config/http.config')
const jwt = require('jsonwebtoken')
const User = require('../models/user.model')

const verifyToken = async (req, res, next) => {
    try {
        const token = req.cookies.jwt        
        if (!token) {
            res.status(HTTPSTATUS.UNAUTHORIZED).json({
                message: 'Unauthorized: No token available'
            })
        }

        const decode = jwt.verify(token, process.env.JWT_SECRET)
        if (!decode) {
            res.status(HTTPSTATUS.UNAUTHORIZED).json({
                message: 'Unauthorized: Invalid token'
            })
        }

        const user = await User.findById(decode.userId).select('-password')

        if (!user) {
            res.status(HTTPSTATUS.NOT_FOUND).json({
                message: 'User not found'
            })
        }
        req.user = user
        next()
    } catch (error) {
        res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            message: 'Somethinghs went wrong',
            error: error.message
        })
    }

}
module.exports = verifyToken;