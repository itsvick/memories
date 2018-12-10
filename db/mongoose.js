const mongoose = require('mongoose');

mongoose.Promise = global.Promise;

mongoose.connect('mongodb://localhost:27017/Memories')
    .then((res) => {
        console.log("MongoDB database connected!!!");
    }).catch((error) => {
        console.log("Unable to connect MongoDB database", error);
    });

module.exports = mongoose;