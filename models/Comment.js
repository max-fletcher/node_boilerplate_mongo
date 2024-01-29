const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const commentSchema = new Schema({
  text: {
      type: String,
      required: true
  },
  post: {
    // type: mongoose.SchemaTypes.ObjectId,
    type: String,
    required: true,
    default: () => [],
    ref: "Post"
  },
}, { timestamps : true });

module.exports = mongoose.model('Comment', commentSchema);