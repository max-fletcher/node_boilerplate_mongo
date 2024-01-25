const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    email: {
        type: String,
        required: true
    },
    roles: {
        User: {
            type: Number,
            default: 2001
        },
        Editor: Number,
        Admin: Number
    },
    password: {
        type: String,
        required: true
    },
    refreshToken: [String],
    simpleJWTLoginToken: String,
    posts: [{
      // type: mongoose.SchemaTypes.ObjectId,
      type: String,
      default: () => [],
      ref: "Post"
    }],
}, { timestamps : true });

module.exports = mongoose.model('User', userSchema);