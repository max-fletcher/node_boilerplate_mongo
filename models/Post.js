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
  tags: [{
    // type: mongoose.SchemaTypes.ObjectId,
    type: String,
    default: () => [],
    ref: "Tag"
  }],
  images: [{
    // type: mongoose.SchemaTypes.ObjectId,
    type: String,
    default: () => [],
  }],
  count: {
    // type: mongoose.SchemaTypes.ObjectId,
    type: Number,
    default: () => Math.floor(Math.random() * 100) + 1,
  },
}, { timestamps : true });

module.exports = mongoose.model('Post', postSchema);