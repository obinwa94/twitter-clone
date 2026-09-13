const User = require('../models/user.model')
const HTTPSTATUS = require('../config/http.config')
const bcrypt = require('bcrypt')
const genTokenAndSet = require('../lib/utils/genToken')



async function signupController(req, res) {
    const { userName, fullName, email, password } = req.body
    const emailRegEx = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegEx.test(email)) {
        return res.status(HTTPSTATUS.BAD_REQUEST).json('Invalid Email address')
    }
    try {
        const emailExist = await User.findOne({ email })
        if (emailExist) {
            return res.status(HTTPSTATUS.CONFLICT).json({
                message: 'Email already exist'
            })
        }
        const usernameExist = await User.findOne({ userName })
        if (usernameExist) {
            return res.status(HTTPSTATUS.CONFLICT).json({
                message: 'Username already taken'
            })
        }
        if (password.length < 6) {
            return res.status(HTTPSTATUS.BAD_REQUEST).json({
                message: "Password must not be less than 6 characters"
            })
        }
        const hashedPassword = await bcrypt.hash(password, 10)
        const newUser = new User({
            userName,
            fullName,
            email,
            password: hashedPassword
        })

        if (newUser) {
            genTokenAndSet(newUser._id, res)
            await newUser.save()

            const response = {
                username: newUser.userName,
                fullName: newUser.fullName,
                email: newUser.email
            }
            res.status(HTTPSTATUS.CREATED).json({
                success: true,
                message: 'User signed up successfully',
                data: response
            })
        }


    } catch (error) {
        res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            message: "Something went wrong😥", error: error.message
        })
    }

}
async function loginController(req, res) {
    const { userName, password } = req.body

    try {
        if (password.length < 6) {
            return res.status(HTTPSTATUS.BAD_REQUEST).json({
                message: "Password must not be less than 6 characters"
            })
        }

        //check for user
        const userExist = await User.findOne({ userName })
        if (!userExist) {
            return res.status(HTTPSTATUS.NOT_FOUND).json({
                message: 'User does not exit. Please signup.'
            })
        }
        //If user exist, compare password
        const comparePassword = await bcrypt.compare(password, userExist.password)
        if (!comparePassword) {
            return res.status(HTTPSTATUS.NOT_FOUND).json({
                message: 'Incorrect password.'
            })
        }

        //Generate jwt token and set
        genTokenAndSet(userExist._id, res)
        const response = {
            username: userExist.userName,
            fullName: userExist.fullName,
            email: userExist.email
        }
        res.status(HTTPSTATUS.OK).json({
            success: true,
            message: 'User logged in successfully',
            data: response
        })


    } catch (error) {
        res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            message: "Something went wrong😥", error: error.message
        })
    }

}


async function logoutController(req, res) {
    try {
        res.cookie('jwt', "", { maxAge: 0 })
        res.status(HTTPSTATUS.OK).json({
            success: true,
            message: 'User logged out successfully',
        })
    } catch (error) {
        res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            message: "Something went wrong😥", error: error.message
        })
    }
}

async function authLogin(req, res) {
    try {
        const user = await User.findById(req.user._id).select('-password')
        res.status(HTTPSTATUS.OK).json(user)
    } catch (error) {
        res.status(HTTPSTATUS.INTERNAL_SERVER_ERROR).json({
            message: 'Something fucking went wrong.',
            error: error.message
        })
    }
}

module.exports = {
    loginController,
    logoutController,
    signupController,
    logoutController,
    authLogin
}