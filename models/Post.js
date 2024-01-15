const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const postSchema = new Schema({
  text: {
      type: String,
      required: true
  },
  createdAt: {
      type: Date,
      immutable: true,
      default: () => Date.now()
  },
  updatedAt: {
    type: Date,
    required: true,
    default: () => Date.now()
  },
  user: {
    type: mongoose.SchemaTypes.ObjectId,
    required: true,
    ref: "User"
  },
});

module.exports = mongoose.model('Post', postSchema);