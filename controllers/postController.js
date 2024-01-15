const Post = require('../models/Post');
var mongoose = require('mongoose');

const getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find();
    if (!posts) return res.status(204).json({ 'message': 'No posts found' });
    res.json(posts);
  }
  catch(error){
    console.error(error);
    res.status(400).json({ 'message' : 'Something went wrong!' });
  }
}

const getAllPostsWithUsers = async (req, res) => {
  try {
    const posts = await Post.find().select('text createdAt updatedAt').populate('user', 'username password'); // ONLY SELECT CERTAIN FIELDS FROM 'Post' AND 'User'
    if (!posts) return res.status(204).json({ 'message': 'No posts found' });
    res.json(posts);
  }
  catch(error){
    console.error(error);
    res.status(400).json({ 'message' : 'Something went wrong!' });
  }
}

const createNewPost = async (req, res) => {
  if (!req?.body?.text || !req?.body?.user_id) {
      return res.status(400).json({ 'message': 'Text and user id are required' });
  }

  try {
      const result = await Post.create({
          text : req.body.text,
          user: req.body.user_id
      });

      res.status(201).json(result);
  } catch (error) {
    console.error(error);
    res.status(400).json({ 'message' : 'Something went wrong!' });
  }
}

const getPost = async (req, res) => {
  if (!req?.params?.id) return res.status(400).json({ message: 'Post ID required' });
  if(!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({message:"Invalid post id!"});
  }

  try {
      const post = await Post.findById((req.params.id)).exec();
      if (!post) {
        return res.status(204).json({ message: `Post ID ${req.params.id} not found` });
      }
      res.json(post);
  } catch (error) {
    console.error(error);
    res.status(400).json({ 'message' : 'Something went wrong!' });
  }
}

const updatePost = async (req, res) => {
  if (!req?.params?.id) {
      return res.status(400).json({ 'message': 'ID parameter is required.' });
  }

  try {
    const post = await Post.findOne({ _id: req.params.id }).exec();
    if (!post) {
        return res.status(204).json({ "message": `No post matches ID ${req.params.id}.` });
    }
    if (req.body?.text) post.text = req.body.text;
    if (req.body?.user) post.user = req.body.user_id;
    const result = await post.save();
    res.json(result);
  }
  catch(error){
    console.error(error);
    res.status(400).json({ 'message' : 'Something went wrong!' });
  }
}

const deletePost = async (req, res) => {
  if (!req?.params?.id) return res.status(400).json({ "message": 'Post ID required' });

  try {
    const post = await Post.findOne({ _id: req.params.id }).exec();
    if (!post) {
        return res.status(204).json({ 'message': `Post ID ${req.params.id} not found` });
    }
    const result = await Post.deleteOne({ _id: req.params.id });
    res.json(result);
  }
  catch(error){
    console.error(error);
    res.status(400).json({ 'message' : 'Something went wrong!' });
  }
}

module.exports = {
  getAllPosts,
  getAllPostsWithUsers,
  createNewPost,
  getPost,
  updatePost,
  deletePost
}