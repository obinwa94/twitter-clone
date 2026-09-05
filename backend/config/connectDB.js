const mongoose = require('mongoose')
require('dotenv').config()

 const connection = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            dbName: 'twitter-clone'
        })
        console.log('Database Connected');

    } catch (error) {
        console.error('Database connection error:', error.message);
    }
}
module.exports = connection