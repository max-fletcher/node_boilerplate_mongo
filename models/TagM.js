const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const tag_MSchema = new Schema({
  text: {
      type: String,
      required: true
  },
  post_id: {
    // type: mongoose.SchemaTypes.ObjectId,
    type: String,
    required: true,
    ref: "PostTag"
  },
}, { timestamps : true });

module.exports = mongoose.model('Tag', tag_MSchema);