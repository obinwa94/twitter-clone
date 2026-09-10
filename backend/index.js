const express = require('express')
const cors = require('cors')
const authRouter = require('./routes/auth.routes')
const userRouter = require('./routes/user.routes')
const postRouter = require('./routes/post.routes')
const notificationRouter = require('./routes/notification.routes')
const connectDB = require('./config/connectDB')
const cookieParser = require('cookie-parser')
const cloudinary = require('cloudinary').v2


require('dotenv').config()
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
})
PORT = process.env.PORT || 5000

const app = express ()

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cors())
app.use(cookieParser())

app.use('/api/auth', authRouter)
app.use('/api/users', userRouter)
app.use('/api/posts', postRouter)
app.use('/api/notifications', notificationRouter)

app.listen(PORT, async () => {
    console.log(`Server listening on ${PORT}`);
    await connectDB();
});