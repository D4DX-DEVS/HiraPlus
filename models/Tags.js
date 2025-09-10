const mongoose = require('mongoose');

const tagSchema = new mongoose.Schema({
    tagName: {
        type: String,
    }
},{
    timestamps: true,
    versionKey: false
});

module.exports = mongoose.model('Tag', tagSchema);