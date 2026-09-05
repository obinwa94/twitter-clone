const express = require('express')
const cors = require('cors')
const authRouter = require('./routes/auth.routes')
const connectDB = require('./config/connectDB')
const cookieParser = require('cookie-parser')


require('dotenv').config()
PORT = process.env.PORT || 5000

const app = express ()

app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(cors())
app.use(cookieParser())

app.use('/api/user', authRouter)

app.listen(PORT, async () => {
    console.log(`Server listening on ${PORT}`);
    await connectDB();
});