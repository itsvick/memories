const mongoose = require('mongoose');

const schema = mongoose.Schema;

const memorySchema = new schema({
    title: String,
    description: String,
    images: [],
    _creator: {
        type: schema.Types.ObjectId,
        required: true
    }
}, { timestamps: true });

const Memory = mongoose.model('Memory', memorySchema);
module.exports = Memory;