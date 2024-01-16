const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// username: {
//     type: String,
//     required: true
// },
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
      type: mongoose.SchemaTypes.ObjectId,
      default: () => [],
      ref: "Post"
    }],
});

module.exports = mongoose.model('User', userSchema);