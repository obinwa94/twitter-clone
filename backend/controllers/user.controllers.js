const User = require('../models/user.model')
const Notification = require('../models/notification.model')
const HTTPSTATUS = require('../config/http.config')
const bcrypt = require('bcrypt')
const cloudinary = require('cloudinary').v2
require('dotenv').config()


async function getProfileController(req, res) {
    const username = req.params.username;
    try {
        const user = await User.findOne({ userName: username }).select('-password')
        if (!user) return res.status(HTTPSTATUS.NOT_FOUND).json({
            message: 'User does not exist'
        })
        res.status(HTTPSTATUS.OK).json(user)
    } catch (error) {
        res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            message: 'Something went wrong',
            error: error.message
        })
    }
}

async function followUnfollowController(req, res) {
    const { id } = req.params;
    try {
        if (id === req.user._id.toString()) {
            return res.status(HTTPSTATUS.FORBIDDEN).json({
                message: 'You cannot follow/unfollow yourself'
            })
        }

        const otherUser = await User.findById(id)
        const thisUser = await User.findById(req.user._id)

        if (!thisUser || !otherUser) return res.status(HTTPSTATUS.NOT_FOUND).json({
            message: 'User not found'
        })

        const isFollowing = thisUser.followings.includes(id)

        if (isFollowing) {
            //unfollow
            await User.findByIdAndUpdate(id, { $pull: { followers: req.user._id } })
            await User.findByIdAndUpdate(req.user._id, { $pull: { followings: id } })
            res.status(HTTPSTATUS.OK).json({success: true, message: 'Unfollowed successfully'})
        } else {
            //follow
            await User.findByIdAndUpdate(id, { $push: { followers: req.user._id } })
            await User.findByIdAndUpdate(req.user._id, { $push: { followings: id } })
            const notification = new Notification({
                from: req.user._id,
                to: id,
                type: 'follow'
            })
            await notification.save()
            res.status(HTTPSTATUS.OK).json({success: true, message: 'Followed successfully'})

        }
    } catch (error) {
        res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            message: 'Something went wrong',
            error: error.message
        })
    }
}

// async function suggestedUsersController(req, res) {
//     try {
//         const userId = req.user._id;

//         const usersFollowedByMe = await User.findById(userId).select('followings')


//         const users = await User.aggregate([
//             {
//                 $match: {
//                     _id: { $ne: userId }
//                 }
//             },
//             {
//                 $sample: { size: 10 }
//             },
//             {
//                 $project: { password: 0 }
//             }
//         ])
//         console.log('users:', users)
//         const filteredUsers = users.filter(user => !usersFollowedByMe.followings.includes(user._id))
//         const suggestedUsers = filteredUsers.slice(0, 4)
//         // console.log('usersFollowedByMe', userId);

//         res.status(HTTPSTATUS.OK).json(suggestedUsers)
//     } catch (error) {
//         res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
//             message: 'Something went wrong',
//             error: error.message
//         })
//     }
// }

async function suggestedUsersController(req, res) {
    try {
        const userId = req.user._id

        const usersFollowedByMe = await User
            .findById(userId)
            .select('followings')

        if (!usersFollowedByMe) {
            return res.status(HTTPSTATUS.NOT_FOUND).json({
                message: 'User not found'
            })
        }

        const users = await User.aggregate([
            {
                $match: {
                    _id: { $ne: userId }
                }
            },
            {
                $sample: {
                    size: 10
                }
            }
        ])

        const filteredUsers = users.filter(
            user => !usersFollowedByMe.followings.some(
                followingId =>
                    followingId.toString() === user._id.toString()
            )
        )

        const suggestedUsers = filteredUsers.slice(0, 4)

        return res.status(HTTPSTATUS.OK).json(suggestedUsers)

    } catch (error) {
        return res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            message: 'Something went wrong',
            error: error.message
        })
    }
}

async function updateUserController(req, res) {
    const { userName, email, fullName, currentPassword, newPassword, link, bio } = req.body;
    let { profileImg, coverImg } = req.body;

    try {
        const user = await User.findById(req.user._id)
        if (!user) return res.status(HTTPSTATUS.NOT_FOUND).json('User not found')

        if ((!currentPassword && newPassword) || (currentPassword && !newPassword)) {
            res.status(HTTPSTATUS.BAD_REQUEST).json('Please provide current password and new password')
        }

        if (currentPassword && newPassword) {
            if (newPassword.length < 6) return res.status(HTTPSTATUS.BAD_REQUEST).json('New password must not be less that 6 characters')
            const isMatch = await bcrypt.compare(currentPassword, user.password)
            if (!isMatch) return res.status(HTTPSTATUS.BAD_REQUEST).json('Current password is incorrect')
            user.password = await bcrypt.hash(newPassword, 10);
        }



        if (profileImg) {
            if (user.profileImg) {
                await cloudinary.uploader.destroy(user.profileImg.split('/').pop().split('.')[0])
            }
            const uploaded = await cloudinary.uploader.upload(profileImg)
            profileImg = uploaded.secure_url
        }
        if (coverImg) {
            if (user.coverImg) {
                await cloudinary.uploader.destroy(user.coverImg.split('/').pop().split('.')[0])
            }
            const uploaded = await cloudinary.uploader.upload(coverImg)
            coverImg = uploaded.secure_url
        }

        user.userName = userName || user.userName
        // user.password = hashed || user.password
        user.fullName = fullName || user.fullName
        user.email = email || user.email
        user.link = link || user.link
        user.bio = bio || user.bio
        user.profileImg = profileImg || user.profileImg
        user.coverImg = coverImg || user.coverImg


        await user.save()
        user.password = null

        res.status(HTTPSTATUS.OK).json({
            success: true,
            message: 'User successfully updated',
            data: user
        })
    } catch (error) {
        res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Something went wrong',
            error: error.message
        })
    }
}

module.exports = {
    getProfileController,
    followUnfollowController,
    suggestedUsersController,
    updateUserController
}