const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const tagSchema = new Schema({
  text: {
      type: String,
      required: true
  },
  post: [{
    // type: mongoose.SchemaTypes.ObjectId,
    type: String,
    required: true,
    default: () => [],
    ref: "Post"
  }],
  count: {
    // type: mongoose.SchemaTypes.ObjectId,
    type: Number,
    default: () => Math.floor(Math.random() * 100) + 1,
  },
}, { timestamps : true });

module.exports = mongoose.model('Tag', tagSchema);