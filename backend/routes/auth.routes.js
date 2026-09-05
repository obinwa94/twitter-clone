const authRouter = require('express').Router()
const {
    loginController,
    logoutController,
    signupController,
    authLogin
} = require('../controllers/auth.controllers')

const verifyToken = require('../middleware/verifyToken')

//signup route
authRouter.post('/signup', signupController)

//login route
authRouter.post('/login', loginController)

//logout route
authRouter.post('/logout', logoutController)

//Login get

authRouter.get('/login', verifyToken, authLogin )

module.exports = authRouter;