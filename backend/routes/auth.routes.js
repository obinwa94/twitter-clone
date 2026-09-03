const authRouter = require('express').Router()
const { loginController, logoutController } = require('../controllers/auth.controllers')

//login route
authRouter.post('/login', loginController)


//logout route
authRouter.post('/logout', logoutController)

module.exports = authRouter;