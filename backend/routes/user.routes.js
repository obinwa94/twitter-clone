const userRouter = require('express').Router()
const verifyToken = require('../middleware/verifyToken')
const { getProfileController,
    followUnfollowController,
    suggestedUsersController,
    updateUserController
} = require('../controllers/user.controllers')


//get user profile
userRouter.get('/profile/:username', verifyToken, getProfileController)
//get suggested profile
userRouter.get('/suggested', verifyToken, suggestedUsersController)

//put followers/followings
userRouter.post('/follow/:id', verifyToken, followUnfollowController)

userRouter.put('/update', verifyToken, updateUserController)




module.exports = userRouter;