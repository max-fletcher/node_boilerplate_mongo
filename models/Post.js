const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const postSchema = new Schema({
  text: {
      type: String,
      required: true
  },
  user: {
    // type: mongoose.SchemaTypes.ObjectId,
    type: String,
    required: true,
    default: () => [],
    ref: "User"
  },
  comments: [{
    // type: mongoose.SchemaTypes.ObjectId,
    type: String,
    default: () => [],
    ref: "Comment"
  }],
}, { timestamps : true });

module.exports = mongoose.model('Post', postSchema);